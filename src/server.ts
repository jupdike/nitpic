const fs = require('fs')
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const split = require('split')
const {execFile} = require('child_process')
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

const XMP_DC_TITLE = 'Xmp.dc.title'
const XMP_DC_DESC  = 'Xmp.dc.description'

export default class Server {
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

  readOneJpegExif(fname, ob) {
    const args = ['-P','X','pr',this.basesrc+'/'+fname];
    const child = execFile(exiv2, args, (error, stdout, stderr) => {
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
    });
  }

  state = { list: [], bykey: {}, index: 0, key: 0 }
  sapp = express();

  constructor(public cmd: string, public basesrc: string, public baseout: string) {
    try {
      fs.mkdirSync(baseout); // it's ok if it exists
    }
      catch (e) {
    }
    //this.init();
    //this.readMetadata(null);
  }

  init() {
    this.sapp.set('port', (process.env.PORT || 3000));

    this.sapp.use('/', express.static(path.join(__dirname, 'public')));

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
  }

  readMetadata(callback) {
    if (this.cmd === 'server') {
      this.sapp.listen(this.sapp.get('port'), () => {
        console.log('Server started: http://localhost:' + this.sapp.get('port') + '/');
      });
    }

    // read the stuff from JPEG files into JSON objects!
    var files = fs.readdirSync(this.basesrc);
    var dots = 0;
    var count = 0;
    /*files.sort(function(aa,bb) {
      var a = aa.toLowerCase();
      var b = bb.toLowerCase();
      if (a < b) {
        return 1;
      } else if (b > a) {
        return -1;
      }
      return 0;
    });*/

    //console.log(files);
    //console.log('---');
    files.reverse(); // proves that the problem is the number of files, and nothing to do with the files themseleves
    //console.log(files);

    files.forEach((val, index, array) => {
      if (val.toLowerCase().endsWith('.jpg') || val.toLowerCase().endsWith('.jpeg')) {
        var ob = { fname: val, index: count }; // index != correct count since we skip .DS_STORE, etc. (frown)
        count++;
        this.state.list.push(ob);
        this.state.bykey[val] = ob;
        var expectedDots = (index*100.0)/files.length;
        while (dots < expectedDots) {
          fs.writeSync(1, ".");
          dots++;
        }
        this.readOneJpegExif(val, ob);
      }
    });
    fs.writeSync(2, "\n");

    // done now, call callback
    callback();
    // TODO use cmd at some point, esp. if we do the image magick convert calls from Node.js instead of Python

  }

}
