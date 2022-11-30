const fs = require('fs')
const path = require('path')
const express = require('express')
const ws = require('ws')
const bodyParser = require('body-parser')
const split = require('split')
const {execFile} = require('child_process')
const async = require('async')
var pngparse = require("pngparse")
import Shared from './client/scripts/Shared'
import NitpicSettings from './NitpicSettings'
import * as readline from 'readline';

const termtest = "/Users/jupdike/Documents/dev/nitpic/term-test.py"
//const s3pub = "/Users/jupdike/bin/s3pub"
const s3cmd = "/usr/local/bin/s3cmd"
const exiv2 = "/Users/jupdike/exiv2" // TODO need a way to package this in Electron bundle and reference it
//const convert = "/bin/echo" // just for hack / testing
const convert = "/usr/local/bin/convert" // ditto

const gravD = {'c':'Center', 'n':'North',
               's':'South', 'e':'East', 'w':'West'}

const XMP_DC_TITLE = 'Xmp.dc.title'
const XMP_DC_DESC  = 'Xmp.dc.description'
const EXIF_DATETIME = 'Exif.Image.DateTime'

export default class Server {

  // read metadata

  get4x4Pixels(fname, succ) {
    pngparse.parseFile(fname, (err, data) => {
      if (err) {
        throw err;
      }
      var ch = data.channels;
      var w = data.width;
      var h = data.height;
      if (ch != 3 && ch != 1) {
        throw "Expected 3 channels (RGB), or 1 channel (grayscale), got "+ch;
      }
      if (ch == 3) {
        var ret = [];
        for (var i = 0; i < w * h * ch; i++) {
          var hexy = data.data[i].toString(16); // hex encode it
          if (hexy.length == 1) {
            hexy = '0' + hexy;
          }
          ret.push(hexy);
        }
        // make a 96 character string that represents the 48 bytes of the 4x4 image, with 24 bit color
        succ(ret.join(''));
      }
      // found a gray scale PNG in the wild
      else if (ch == 1) {
        var ret = [];
        for (var i = 0; i < w * h; i++) {
          var hexy = data.data[i].toString(16); // hex encode it
          if (hexy.length == 1) {
            hexy = '0' + hexy;
          }
          ret.push(hexy);
          ret.push(hexy);
          ret.push(hexy);
        }
        // make a 96 character string that represents the 48 bytes of the 4x4 image, with 24 bit color
        succ(ret.join(''));
      }
    });
  }

  set4x4PixelString(ob) {
    var fname = ob.fname;
    var desc = ob.desc || "g=c";
    var grav = Shared.getField(desc, 'g', 'c');
    var f = this.baseout + '/sq' + grav + "." + fname + '.png';
    this.get4x4Pixels(f, (result) => {
      //console.log(f +': '+ result);
      ob.hex4x4 = result;
    });
  }

  readOneJpegExif(fname, ob, done) {
    const args = ['-P','EX','pr',this.basesrc+'/'+fname];
    const child = execFile(exiv2, args, (error, stdout, stderr) => {
      //console.log("returned from exiv2 "+fname);
      stdout.split('\n').forEach( (val, index, array) => {
        //console.log(fname, '**', val);

        var k = null;
        if (val.indexOf(EXIF_DATETIME) >= 0) {
          k = 'datetime';
          var i = val.indexOf('Ascii');
          val = val.slice(i+5).trim();
          // trim everything before the first space
          i = val.indexOf(' ');
          if (i >= 0) {
            val = val.slice(i);
          }
          val = val.trim();
          //console.error('datetime|'+val+'|');
          //let dt = Date.parse(val);
          //console.error('dt', dt);
          ob[k] = val;
          return;
        }
        if (val.indexOf(XMP_DC_TITLE) >= 0) {
          k = 'title';
        }
        else if (val.indexOf(XMP_DC_DESC) >= 0) {
          k = 'desc';
        }
        if (!k) return;
        var ix = val.indexOf('lang="');
        if (ix > -1) {
          val = val.slice(ix + 6);   // width of 'lang="'
          ix = val.indexOf('" ');
          if (ix > -1) {
            val = val.slice(ix + 2);   // width of '" '
          }
          // ob.title = val   or   ov.desc = val
          ob[k] = val;
        }
      });
      this.set4x4PixelString(ob);
      //console.log("GOT> fname: " + fname + "  desc: " + ob.desc + "  title: "+ob.title);
      done(null); // no error... what to do in case of error?
    });
  }

  readMetadata(callback) {
    console.log("READING METADATA");

    // read the stuff from JPEG files into JSON objects!
    var files = fs.readdirSync(this.basesrc);
    var dots = 0;
    var count = 0;
    async.forEachOfLimit(files, 32,
      // call this function once for each file
      (val, index, cb) => {
        if (! (val.toLowerCase().endsWith('.jpg') || val.toLowerCase().endsWith('.jpeg')) ) {
          cb(null); // skipped a file; must track this!
          return;
        }
        var ob = { fname: val, index: count }; // index != correct count since we skip .DS_STORE, etc. (frown)
        count++;
        this.state.list.push(ob);
        this.state.bykey[val] = ob;
        this.readOneJpegExif(val, ob, (err) => {
          if (err) {
            console.error(err.message);
          }
          var expectedDots = (index*100.0)/files.length;
          while (dots < expectedDots) {
            fs.writeSync(1, ".");
            dots++;
          }
          this.ipc_send("progress-update", {progress: expectedDots|0, message: "Reading Metadata"});
          process.nextTick(function() { cb(err); });
        });
      },
      // done
      (err) => {
        if (err) {
          console.error(err.message);
        }
        // sort by datetime to get things mostly into the order things were shot!
        this.state.list.sort((a, b) => {
          if (a.datetime > b.datetime) {
            return 1;
          } else if (a.datetime < b.datetime) {
            return -1;
          } else {
            return 0;
          }
        });
        var ix = 0;
        this.state.list.forEach( elem => {
          elem.index = ix;
          ix += 1;
        });

        fs.writeSync(2, "\nDONE READING METADATA\n");
        // done now, call the server side callback thing, saying we are done reading all metadata
        callback();
     });
    fs.writeSync(2, "Just called async.eachOfLimit on "+files.length+" files\n");
  }

  // constructor / init

  state: any
  sapp = express();
  sockets = [];

  baseout: string;
  basesrc: string;
  constructor(public ipc_send: any, public settings: NitpicSettings) {
    this.openFolder();
    this.init();
  }

  copyFile(from, two) {
    fs.createReadStream(from).pipe(fs.createWriteStream(two));
  }

  // Pre-Preview: gets the static files ready for serving: either on localhost, or on some remote server somewhere
  writeoutMetadataJsonEtc(hostRoot, jsonFname) {
    var fout = path.join(this.baseout, jsonFname);
    var json = JSON.stringify(this.state, null, 2);
    fs.writeFileSync(fout, json);

    try {
      fs.mkdirSync(path.join(this.baseout, "nitpic")); // it's ok if it exists
    }
    catch (e) {
    }
    this.copyFile(path.join(__dirname, "client", "bundle.js"), path.join(this.baseout, "nitpic", "bundle.js"));
    this.copyFile(path.join(__dirname, "client", "bundle.js.map"), path.join(this.baseout, "nitpic", "bundle.js.map"));
    this.copyFile(path.join(__dirname, "client", "css", "base.css"), path.join(this.baseout, "nitpic", "base.css"));
    this.copyFile(path.join(__dirname, "client", "third-party", "jquery.js"), path.join(this.baseout, "nitpic", "jquery.js"));
    this.copyFile(path.join(__dirname, "client", "third-party", "react.js"), path.join(this.baseout, "nitpic", "react.js"));
    this.copyFile(path.join(__dirname, "client", "third-party", "react-dom.js"), path.join(this.baseout, "nitpic", "react-dom.js"));

    var f2 = path.join(this.baseout, "index.html");
    var html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Gallery Preview - Nitpic</title>
    <link rel="stylesheet" href="./nitpic/base.css" />
  </head>
  <body style="background-color: #404044">
    <div id="content" class="contents"></div>

    <!-- Dependencies, the web way -->
    <script src="./nitpic/react.js"></script>
    <script src="./nitpic/react-dom.js"></script>
    <script src="./nitpic/jquery.js"></script>
    <script src="./nitpic/bundle.js"></script>

    <script>
      // TODO put this back for Github version
      RenderSide.RenderClass.RenderGalleryAlbum('${hostRoot}', '${jsonFname}', 'content');
      //RenderSide.RenderClass.RenderGalleryAlbum('http://cerebrum.local:3000/static/', '${jsonFname}', 'content');
    </script>

  </body>
</html>`;
    fs.writeFileSync(f2, html);
  }

  public noPub = false
  openFolder() {
    this.basesrc = path.join(this.settings.inputRootDir(), this.settings.albumName());
    this.baseout = path.join(this.settings.outputRootDir(), this.settings.albumName());
    if (this.baseout == this.basesrc) {
      throw "Expected different input images folder and output images folder";
    }
    try {
      fs.mkdirSync(this.baseout); // it's ok if it exists
    }
      catch (e) {
    }
    var combined = path.join(this.basesrc, "_no_pub");
    console.log('Does', combined, 'exist?');
    this.noPub = this.fileExists(combined);
    console.log('noPub:', this.noPub);

    this.state = { list: [], bykey: {}, index: 0, key: 0 };
  }

  sendToAllSockets(line) {
    this.sockets.forEach(s => s.send(line));
  }

  init() {
    
    this.sapp.set('port', (process.env.PORT || 3000));
    console.log('serving on port: ' + (process.env.PORT || 3000));

    this.sapp.use(bodyParser.json());
    this.sapp.use(bodyParser.urlencoded({extended: true}));

    // Additional middleware which will set headers that we need on each request.
    this.sapp.use((req, res, next) => {
      // Set permissive CORS header - this allows this server to be used only as
      // an API server in conjunction with something like webpack-dev-server.
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Disable caching so we'll always get the latest data.
      res.setHeader('Cache-Control', 'no-cache');
      next();
    });

    this.sapp.get('/api/pics', (req, res) => {
      res.json(this.state);   //JSON.parse(data));
    });

    this.sapp.get('/api/publish-summary', (req, res) => {
      let publishFolderPieces = this.baseout.replace(/\\/g,'/').split('/');
      let publishFolder = publishFolderPieces[publishFolderPieces.length-2];
      let idName = 'gal-' + this.settings.albumName().toLowerCase().replace(/ /g, '-')
      let cmdStr = `(cd ${this.settings.outputRootDir()} && s3cmd --acl-public sync ${this.settings.albumName()} s3://${this.settings.s3bucketname()}/${publishFolder}/)`
      let htmlSnip = `<div id="${idName}" class="contents"></div>\n<script>\n  RenderSide.RenderClass.RenderGalleryAlbum(\n  'https://${this.settings.s3bucketname()}.s3-us-west-2.amazonaws.com/${publishFolder}/${this.settings.albumName()}/',\n  'index.json',\n  '${idName}');\n</script>\n<br/>`
      let preHtmlChunk = htmlSnip.replace(/\</g,'&lt;').replace(/\>/g,'&gt;');
      res.send('<pre>'+preHtmlChunk+'</pre><br/><hr/><h2>Command to Execute</h2><br/><pre id="cmd">'+cmdStr+'</pre>');

      let serv = this;
      let resultProcess = execFile(s3cmd, [
        "--acl-public",
        "sync",
        this.settings.albumName(),
        `s3://${this.settings.s3bucketname()}/${publishFolder}/`,
      ], {
        //"encoding": "buffer",
        "cwd": this.settings.outputRootDir(),
      }, (error, stdout, stderr) => {
        if(!error) {
          serv.sendToAllSockets("Done.");
        }
      });
      const rl1 = readline.createInterface(resultProcess.stdout);
      const rl2 = readline.createInterface(resultProcess.stderr);
      rl1.on('line', (line) => {
        //console.log(`stdout: ${line}`);
        serv.sendToAllSockets(line);
      });
      rl2.on('line', (line) => {
        //console.log(`stderr: ${line}`);
        serv.sendToAllSockets(line);
      });

    });

    this.sapp.post('/api/pics', (req, res) => {
      var data = req.body;
      console.log('POST>');
      console.log(data);
      // TODO use this data object to update file .fname to description .desc and title .title

      var desc = data.desc;
      var title = data.title;
      var fname = data.fname;
      var fnamepath = this.basesrc + '/' + fname;

      var cnts =  'set   ' + XMP_DC_DESC + '   ' + desc;
      cnts += '\n';
      cnts += 'set   ' + XMP_DC_TITLE + '         ' + title;
      cnts += '\n';
      let cmdfile = '/tmp/cmdfile.txt'; // TODO there could be a bug here, with multiple files needing to read and write this

      fs.writeFile(cmdfile, cnts, (err) => {
        if (err) throw err;

        console.log('wrote: cmdfile: '+cmdfile)
        // console.log('---');
        // console.log(cnts);
        // console.log('---');

        const args = ['-m',cmdfile,'mo',fnamepath];
        const child = execFile(exiv2, args, (error, stdout, stderr) => {
          if (error) {
            throw error;
          }
          //console.log(stdout);
          console.log("called " + exiv2 + " " + args);

          // update global state so GET requests return up to date data (no serer restart necessary for page reload)
          this.state.bykey[fname].desc = desc;
          this.state.bykey[fname].title = title;
          this.set4x4PixelString(this.state.bykey[fname]);

          console.log("BACK TO CLIENT>");
          //data['desc'] = 'g=e'; // for testing if client is updating with this info. YES. IT IS.
          console.log(this.state.bykey[fname]);

          res.json(this.state.bykey[fname]);

        });

      });

    });

    // hack to test out static file server version, outside of Electron!
    this.sapp.get('/static/nitpic/:filename', (req, res) => {
      const fname = req.params.filename;
      const full = path.join(this.baseout, 'nitpic', fname);
      //console.log('requested '+full);
      res.sendFile(full);
    });

    // get thumbnails and index.json from Publishing/FOLDERNAME/*.jpg location
    this.sapp.get('/static/:filename', (req, res) => {
      const fname = req.params.filename;
      const full = path.join(this.baseout, fname);
      //console.log('requested '+full);
      res.sendFile(full);
    });

    const wsServer = new ws.Server({ noServer: true });
    wsServer.on('connection', socket => {
      this.sockets.push(socket);

      console.log("*** Got a connection from the browser, over a socket!");

      //this.sendToAllSockets("test1234321");

      // client sends something to the server over a socket
      socket.on('message', message => console.log(message));
    });

    let server = this.sapp.listen(this.sapp.get('port'), () => {
      console.log('Server started: http://localhost:' + this.sapp.get('port') + '/');
    });
    server.on('upgrade', (request, socket, head) => {
      wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
      });
    });

  }

  // make thumbnails

  fileExists(path) {
    var stats = null;
    try {
      stats = fs.statSync(path);
    }
    catch (e) {
      return false;
    }
    if (stats && stats.isFile()) {
      return true;
    }
  }

  convertOne(fout, args, done) {
    if (this.fileExists(fout)) {
      //console.log('SKIP> convert '+args);
      done(null);
      return;
    }
    const child = execFile(convert, args.split(' '), (error, stdout, stderr) => {
      if (error) {
        console.error(error);
      }
      //console.log('DONE> convert '+args);
      //stdout.split('\n').forEach( (val, index, array) => {
        // TODOx
      //}
      done(null);
    });
  }

    // each item is { args: '...', fout: '...' }  where fout is full path to output image
    addWork(e, work) {
      var pre = this.basesrc;
      if (pre.charAt(pre.length - 1) == '/') {
        console.log('Expected not to have a trailing slash! '+pre);
        process.exit(1);
      }
      pre = pre + '/';
      var pub = this.baseout;
      if (pub.charAt(pre.length - 1) == '/') {
        console.log('Expected not to have a trailing slash! '+pub);
        process.exit(1);
      }
      let watermark = this.settings.pathToWatermark();
      // TODO deal with case of no watermark or file not found...
      const watermarkCmd = watermark ? " -gravity South "+watermark+" -compose Over -composite " : " ";
      pub = pub + '';
  
      // const out1 = pub+"/160."+e;
      // // note no space between pre+e+"[160x90]" -- add a space on pain of death!
      // work.push({fout:out1, args: pre+e+"[160x90] -auto-orient -thumbnail 160x90 -background #404044 -sharpen 1 -gravity Center -extent 160x90 "+out1});
      // const out2 = pub+"/1920."+e;
      // work.push({fout:out2, args: "-auto-orient -quality 83 -resize 1920x1080> -background #404044 -gravity Center -sharpen 1 -extent 1920x1080 " + pre+e + watermarkCmd + out2});
  
      // for reference:
      //1920/12 = 160
      //1080/12 = 90
      //
      // out3 @ 130x100
      // 1560/12 = 130
      // 1200/12 = 100
      const out3 = pub+"/130."+e;
      // note no space between pre+e+"[100x130]" -- add a space on pain of death!
      work.push({fout:out3, args: pre+e+"[130x130] -auto-orient -thumbnail 130x130 -sharpen 1 -gravity Center "+out3});
      // out4 @ 1200x1560
      // 1560/1200 = 1.3 or 13x10
      const out4 = pub+"/1560."+e;
      work.push({fout:out4, args: "-auto-orient -quality 83 -resize 1560x1560> -gravity Center -sharpen 1 " + pre+e + watermarkCmd + out4});
  
      for (const grav of 'c n s e w'.split(' ')) {
        const out3 = pub+"/sq"+grav+"."+e;
        work.push({fout:out3, args: pre + e + ' -auto-orient -resize 256x256^ -sharpen 1 -gravity '+gravD[grav]+' -crop 256x256+0+0 '+out3});
        const out4 = pub+"/sq"+grav+"."+e+'.png'
        work.push({fout:out4, args: pre + e + ' -auto-orient -resize 4x4^ -sharpen 1 -gravity '+gravD[grav]+' -crop 4x4+0+0 '+out4});
      }
    }

  public convertThumbnails(numcores, allDone) {
    var work = [];
    var files = fs.readdirSync(this.basesrc);
    files.forEach((file) => {
      if (! (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg')) ) {
        return; // only process thumbnails for JPG / JPEG / etc.
      }
      this.addWork(file, work);
    });

    var dots = 0;
    async.forEachOfLimit(work, numcores|0,
      // call this function once for each file
      (task, index, cb) => {
        this.convertOne(task.fout, task.args, (err) => {
          if (err) {
            console.error(err.message);
          }
          var expectedDots = (index*100.0)/work.length;
          while (dots < expectedDots) {
            fs.writeSync(1, ".");
            dots++;
          }
          this.ipc_send("progress-update", {progress: expectedDots|0, message: "Thumbnails"});
          process.nextTick(function() { cb(null); });
        });
      },
      // done
      (err) => {
        if (err) {
          console.error(err.message);
        }
        fs.writeSync(2, "\nDONE MAKING THUMBNAILS\n");
        // done now, call the server side callback thing, saying we are done reading all metadata
        allDone();
     });
  }

}
