var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var sapp = express();
var split = require('split');
var execFile = require('child_process').execFile;
var pngparse = require("pngparse");

// TODO this code is copy-pasted and should live in a shared spot, right?
function getField(desc, key, defaulty) {
  var ret = defaulty;
  // parse desc and grab g=c or g=n or g=e or g=w or g=s
  var ps = desc.split(":");
  if (ps && ps.length >= 1) {
    ps.forEach(function(ab) {
      var pair = ab.split("=");
      if (pair && pair.length == 2) {
        if (pair[0] === key) {
          ret = pair[1];
        }
      }
    })
  }
  return ret;
}

const XMP_DC_TITLE = 'Xmp.dc.title'
const XMP_DC_DESC  = 'Xmp.dc.description'

// NOW JUST RUN THIS:
//   node server.js server /Users/jupdike/Dropbox/jfu-54-hd /Users/jupdike/Dropbox/Public/gallery

if (process.argv.length < 5) {
  console.log("Expected\n\t"+process.argv[0]+" "+process.argv[1]+" cmd src dst");
  process.exit();
}
var cmd = process.argv[2];
var basesrc = process.argv[3];
var baseout = process.argv[4];


function get4x4Pixels(fname, succ) {
  pngparse.parseFile(fname, function(err, data) {
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

function set4x4PixelString(ob) {
  var fname = ob.fname;
  var desc = ob.desc || "g=c";
  var grav = getField(desc, 'g', 'c');
  var f = baseout + '/sq' + grav + "." + fname + '.png';
  get4x4Pixels(f, (result) => {
    //console.log(f +': '+ result);
    ob.hex4x4 = result;
  });
}

var state = { list: [], bykey: {}, index: 0, key: 0 }

var exiv2 = "/Users/jupdike/exiv2";

function readOneJpegExif(fname, ob) {
  const args = ['-P','X','pr',basesrc+'/'+fname];
  const child = execFile(exiv2, args, function(error, stdout, stderr) {
    stdout.split('\n').forEach(function (val, index, array) {
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
    set4x4PixelString(ob);
    //console.log("GOT> fname: " + fname + "  desc: " + ob.desc + "  title: "+ob.title);
  });
}

sapp.set('port', (process.env.PORT || 3000));

sapp.use('/', express.static(path.join(__dirname, 'public')));

sapp.use('/thumbs/', express.static(baseout));

sapp.use(bodyParser.json());
sapp.use(bodyParser.urlencoded({extended: true}));

// Additional middleware which will set headers that we need on each request.
sapp.use(function(req, res, next) {
  // Set permissive CORS header - this allows this server to be used only as
  // an API server in conjunction with something like webpack-dev-server.
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Disable caching so we'll always get the latest comments.
  res.setHeader('Cache-Control', 'no-cache');
  next();
});

sapp.get('/api/pics', function(req, res) {
  res.json(state);   //JSON.parse(data));
});

sapp.post('/api/pics', function(req, res) {
  var data = req.body;
  console.log('POST>');
  console.log(data);
  // TODO use this data object to update file .fname to description .desc and title .title

  var desc = data.desc;
  var title = data.title;
  var fname = data.fname;
  var fnamepath = basesrc + '/' + fname;

  var cnts =  'set   ' + XMP_DC_DESC + '   ' + desc;
  cnts += '\n';
  cnts += 'set   ' + XMP_DC_TITLE+ '         ' + title;
  cnts += '\n';
  let cmdfile = '/tmp/cmdfile.txt';

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
      console.log("called "+exiv2 + " " + args);

      // update global state so GET requests return up to date data (no serer restart necessary for page reload)
      state.bykey[fname].desc = desc;
      state.bykey[fname].title = title;
      set4x4PixelString(state.bykey[fname]);

      console.log("BACK TO CLIENT>");
      //data['desc'] = 'g=e'; // for testing if client is updating with this info. YES. IT IS.
      console.log(state.bykey[fname]);

      res.json(state.bykey[fname]);

    });

  });

});

if (cmd === 'server') {
  sapp.listen(sapp.get('port'), function() {
    console.log('Server started: http://localhost:' + sapp.get('port') + '/');
  });
}

// read the stuff from JPEG files into JSON objects!
var files = fs.readdirSync(basesrc);
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

files.forEach(function (val, index, array) {
  if (val.toLowerCase().endsWith('.jpg') || val.toLowerCase().endsWith('.jpeg')) {
    var ob = { fname: val, index: count }; // index != correct count since we skip .DS_STORE, etc. (frown)
    count++;
    state.list.push(ob);
    state.bykey[val] = ob;
    var expectedDots = (index*100.0)/files.length;
    while (dots < expectedDots) {
      fs.writeSync(1, ".");
      dots++;
    }
    readOneJpegExif(val, ob);
  }
});
fs.writeSync(2, "\n");

// TODO use cmd at some point, esp. if we do the image magick convert calls from Node.js instead of Python
