const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const split = require('split')
const {execFile} = require('child_process')
const async = require('async')
var pngparse = require("pngparse")
import MyCode from './client/scripts/mycode'

// TODO delete all this
// NOW JUST RUN THIS:
//   node server.js server /Users/jupdike/Dropbox/jfu-54-hd /Users/jupdike/Dropbox/Public/gallery
/*if (process.argv.length < 5) {
  console.log("Expected\n\t"+process.argv[0]+" "+process.argv[1]+" cmd src dst");
  process.exit();
}
cmd = process.argv[2];
basesrc = process.argv[3];
baseout = process.argv[4];
*/

const exiv2 = "/Users/jupdike/exiv2" // TODO need a way to package this in Electron bundle and reference it
//const convert = "/bin/echo" // just for hack / testing
const convert = "/usr/local/bin/convert" // ditto

const gravD = {'c':'Center', 'n':'North',
               's':'South', 'e':'East', 'w':'West'}

const XMP_DC_TITLE = 'Xmp.dc.title'
const XMP_DC_DESC  = 'Xmp.dc.description'

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
    var grav = MyCode.getField(desc, 'g', 'c');
    var f = this.baseout + '/sq' + grav + "." + fname + '.png';
    this.get4x4Pixels(f, (result) => {
      //console.log(f +': '+ result);
      ob.hex4x4 = result;
    });
  }

  readOneJpegExif(fname, ob, done) {
    const args = ['-P','X','pr',this.basesrc+'/'+fname];
    const child = execFile(exiv2, args, (error, stdout, stderr) => {
      //console.log("returned from exiv2 "+fname);
      stdout.split('\n').forEach( (val, index, array) => {
        var k = null;
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
          cb(err);
        });
      },
      // done
      (err) => {
        if (err) {
          console.error(err.message);
        }
        fs.writeSync(2, "\nDONE READING METADATA\n");
        // done now, call the server side callback thing, saying we are done reading all metadata
        callback();
     });
    fs.writeSync(2, "Just called async.eachOfLimit on "+files.length+" files\n");
  }

  // constructor / init

  state = { list: [], bykey: {}, index: 0, key: 0 }
  sapp = express();

  constructor(public cmd: string, public basesrc: string, public baseout: string) {
    try {
      fs.mkdirSync(baseout); // it's ok if it exists
    }
      catch (e) {
    }
    this.init();
    //this.readMetadata(null);
  }

  init() {
    this.sapp.set('port', (process.env.PORT || 3000));
    console.log('serving on port: ' + (process.env.PORT || 3000));

    //this.sapp.use('/', express.static(path.join(__dirname, 'public')));

    this.sapp.use('/thumbs/', express.static(this.baseout));

    this.sapp.use(bodyParser.json());
    this.sapp.use(bodyParser.urlencoded({extended: true}));

    // Additional middleware which will set headers that we need on each request.
    this.sapp.use((req, res, next) => {
      // Set permissive CORS header - this allows this server to be used only as
      // an API server in conjunction with something like webpack-dev-server.
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Disable caching so we'll always get the latest comments.
      res.setHeader('Cache-Control', 'no-cache');
      next();
    });

    this.sapp.get('/api/pics', (req, res) => {
      res.json(this.state);   //JSON.parse(data));
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

    //if (this.cmd === 'server') {
      this.sapp.listen(this.sapp.get('port'), () => {
        console.log('Server started: http://localhost:' + this.sapp.get('port') + '/');
      });
    //}

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
    pub = pub + '';
    const out1 = pub+"/160."+e;
    // note no space between pre+e+"[160x90]" -- add a space on pain of death!
    work.push({fout:out1, args: pre+e+"[160x90] -auto-orient -thumbnail 160x90 -background #404044 -sharpen 1 -gravity Center -extent 160x90 "+out1});
    const out2 = pub+"/1920."+e;
    work.push({fout:out2, args: "-auto-orient -quality 83 -resize 1920x1080> -background #404044 -gravity Center -sharpen 1 -extent 1920x1080 "+pre+e+" "+out2});
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
    //console.log(work);

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
          cb(err);
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