# Nitpic, a cross-platform photo gallery creation and publication app

-- ? Network Interactive Thumbnail Publication Image Creation

- Execute npm install -- to get Electron, React, jQuery packages installed into node_modules
- Execute ./build.sh to create build/ photo and compile .ts to .js files, etc.
- Run ./run.sh to launch Electorn app.

# old Python gallery bits

HOW I DID IT -- caps.txt to EXIF

X using /gallery/caps.txt, run this:
  python gal.py exif2jpg . ~/Desktop/juneau-24
X run 'caps' command to read back --> it worked!
X run:
  python gal.py caps ~/Dropbox/jfu-54-hd out-ignored
--> it works and gives me back all my metadata

(old code path, not needed since JS reads this directly now)
X run:
  python gal.py jsoncaps ~/Dropbox/jfu-54-hd/ ~/Dropbox/Public/gallery/
prints out clean JSON objects, one per line, of all the gallery image items

CURRENT commands:

X run:
  python gal.py thumbs ~/Dropbox/jfu-54-hd/ ~/Dropbox/Public/gallery/

X run:
  python gal.py pages ~/Dropbox/jfu-54-hd/ ~/Dropbox/Public/gallery/
no caps.txt file needed!

# JavaScript server...

Example usage:

  node server.js cmd src dst

e.g.

  node server.js server ~/Dropbox/jfu-54-hd/ ~/Dropbox/Public/gallery/

then open:

  http://localhost:3000/index.html
  
to edit the metadata (captions, gravity), or

  http://localhost:3000/gallery.html

to view the gallery, which at some point will be live somewhere...  (Babel or TypeScript to .js/ES5)

