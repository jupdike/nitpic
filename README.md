# Nitpic, a cross-platform photo gallery creation and publication desktop app (Mac, Windows, Linux)

![Colorful, hexagonal Nitpic icon](https://updike-org.s3-us-west-2.amazonaws.com/PhotoPublishing/blog-pics/nitpic-icon.png "Nitpic icon")

## Nitpic's an Interactive Thumbnailer, Publisher, and Image Captioner

Nitpic assumes you have at least one of two long term goals: archiving high-res originals
of your best work (along with hand-written captions or subtitles), and publishing galleries
of your best work on the web. Nitpic exists to serve a very specific function in a larger
context of photography: for a user to own their data and the mechanism of publication of that
data.

## Own Your Data

Many free or proprietary services exist that are easier to use, but do you own your data?
You can use Google Photo, Apple Photos "app" (really also a service, and data lives across
devices), Flickr, Facebook, Pinterest, Snapchat, Instagram, etc. but those are essentially
walled gardens, and they can change terms at the drop of a hat. [1] Squarespace is one of
the least worst of the easy-to-use hosting services, and at least you pay for the service,
so your relationship to the company is more clear, but it could be hard to migrate to another
service or even retrieve your data if you stop paying.

So if you are going to have to export and import your data into new services every
several years (or be forced to do this at random, outside of your control), and you need to
keep a copy of all of your data as you go anyway, why not import it into a future-proof,
open format: files and folders!

If you know you want to own your data -- with a copy on your desktop/laptop,
a physical backup (you *do* have a backup, right?), perhaps also backed up to the
cloud with Dropbox and/or Backblaze -- and you need just a little bit of metadata (captions,
album cover image, album date), and if you need to publish galleries as well,
then Nitpic may be for you.

## Features and Benefits

### Metadata

- **Little or no 'special' (proprietary) metadata** files (giant DB hairballs / XML) to import or export
- **Uses standard EXIF headers** for Title and Description, readable and writable by other
apps, for example, Apple Photos (macOS). But Nitpic is better for captioning than Photos because
that app does not let you add a caption and export without recompressing your JPGs, whereas
Nitpic uses the **exvi2** command-line tool to modify just the EXIF field(s) of the original file,
in place.

### Modern, Responsive (Mobile-first), High-Res, Retina-friendly Design

Nitpic has some cool features not found elsewhere:

- **Square cropping**, but with class: adjust the crop whether your images is portrait or
landscape, just choose north, south, east, or west, if center cropping is not working
on any specific image.
- **Blurry image previews**: fast loading 6x6 pixel thumbnails look gorgeous and make it
clear that your page is loading. (The image data for these tiny "thumbnails" is in the album
JSON, along with the image captions, so it loads really fast, all at once. Great for really
large galleries.)
- **You own and pay for your images to be published**. You pay Amazon (or Azure, or
anything that can put buckets (folders corresponding to an album) of static files on the
public internet.) I do not touch your data. You can switch to any service you like, any time
you like. (If you fork Nitpic and get other services working, I would love to know about it.)
- **Independent image hosting**: host your blog or website on any service, and embed your
galleries there using JavaScript, then host your images inexpensively wherever that makes sense,
whether it is the same service, or yet another service.
- **Open source**: just fork Nitpic and make it do what you want, if it is not to your
liking.
- **Keyboard-ready**: zip through the slideshow/fullscreen mode with the Arrow Keys. Hit Spacebar
to Play/Pause and Esc to exit.
- **Touch-ready**: looks great on mobile phones and tablets and works great, in terms of large touch
targets and swipe gestures.

### "Pic" and Choose

Use just the parts of Nitpic that you need:

- **Thumbnailer**: output lives in its own entire folder of albums, so your original
folder of albums remain just that: folder(s) of original, high-res images, completely
archivable and futurproof. Thumbnail output is downsampled and/or watermarked so
you can publish any (or none) of the output knowing your originals are separate.
- **Caption Editor**: if all you need is interactive caption editing, just use that
feature and those captions are saved *in the same file as the image data*, namely
as standard EXIF JPG data. If you don't need the thumbnails, just delete the output
folder when you are done; if you need to come back to the album and caption some more,
or re-caption, this thumbnail image data can just be regenerated, and quickly too,
using as many cores as your machine supports.
- **Gallery Creator**: lightweight, modern, embeddable galleries with just a few
lines of JavaScript in your HTML (blog, etc.) or use the index.html generated for
you, and go from there. Gallery CSS and JavaScript is free to modify and redistribute
(BSD license), even for commericial purposes.
- **Publisher**: sync an album at a time to an Amazon S3 bucket. Small changes are
easier to re-sync (just metadata JSON file is re-uploaded, or only new images).

### Tell *Your* Stories

Since your galleries are easily embeddable, you can put your images next to text and
really tell your whole story. (Requires your own blog setup, say at NearlyFreeSpeech.net,
Github Pages (Github.io), or any webhost.)

### Anti-Goals

Nitpic does not require a fancy server setup, just static file hosting of any sort.
Nitpic is not an image management / searching tool (like Lightroom or Apple Photos) nor
is it an image editor. Nitpic is not a blogging platform. Nitpic is not a service.
Nitpic is not marketed for medical or health industry use. Nitpic is not an easy, all-in-one
solution. Nitpic is not a community of like-minded suckers handing over their best work
to a VC-backed company located in another country. Nitpic does not assume that it knows
best. Nitpic seeks to be dispensible, modular and replaceable.

[1] Example: Google bought Picasa and it was great for many
years. Then they axed it and now all my work (10+ years) of posting photos and adding
captions and metadata, picking album covers, etc. is lost in a sea of Big Data
soup (i.e. Google Photos, which defaults to hiding subsets of your photo albums at
random. Wankers.) In addition Dropbox just axed web publishing (in Public folder)
just weeks after I upgraded to Pro. Wankers. This was after Flickr gave me a Pro
account with "no limits" and then revoked it. And Posterous hosted my free blog,
and then was acqui-hired by Twitter and "sunsetted" like a two-legged horse. And
why do people hand over their best work to Medium? You are feeding their VC-backed
machine.

## Developer Setup (only way to use this currently, sadly...)

Edit `~/Library/Application\ Support/nitpic/Settings/nitpic.json`

Here is an example:

```
{
  "inputRootDir": "/Users/jupdike/Dropbox/PhotoAlbums",
  "outputRootDir": "/Users/jupdike/Dropbox/PhotoPublishing",
  "s3bucketname": "updike-org",
  "pathToWatermark": "/Users/jupdike/Documents/dev/jared-updike-org-mark.png",
  "exiv2Path": "/Users/jupdike/exiv2",
  "convertPath": "/usr/local/bin/convert",
  "s3cmdPath": "/usr/local/bin/s3cmd",
  "maxLength": 1560,
  "albumName": "Art-Fabulous"
}
```

Then

- brew install imagemagick
- brew install exiv2 (or from source... hmmm... double check this)
- brew install s3cmd
- sudo npm install -g webpack webpack-cli
- Execute npm install -- to get Electron, React, jQuery packages installed into node_modules

- IMPORTANT to make Nitpic.app in parallel `nitpic-dist` folder by copying `node_modules/electron/dist/Electron.app` (like 205 MB) and renaming a few things and adding .icns file and edit Info.plist...
  - nitpic.icns is in ~/Dropbox/_Done/ ... copy to ~/Documents/dev/nitpic-dist/ and copy again nitpic-dist/Nitpic.app/Contents/Resources/ ...
  - cd node_modules/electron/dist && open  ---- and rename copied Electron.app to Nitpic.app, move to ~/Documents/dev/jfu/nitpic-dist/
  - rename /Users/jupdike/Documents/dev/fju/nitpic-dist/Nitpic.app/Contents/MacOS/Electron to Nitpic (true exectuable binary itself)
  - edit Info.plist and change CFBundleName to Nitpic and CFBundleIconFile to nitpic.icns and CFBundleIdentifier to org.updike.nitpic  AND CFBundleDisplayName and CFBundleExecutable to Nitpic

- Execute ./build.sh to create build/ and compile .ts to .js files, etc.
- Run ./run.sh to launch Electron app.
  - move that to keep in Dock and you are in business

- TODO get watermark PNG image and put it in the right place (check nitpic.json)

## IMAGE MAGICK CONVERT static commandline build stuff (Work in Progress)

```
531  IMBUILD=/tmp/imbuild
  532  mkdir $IMBUILD
  533  mkdir im_download && cd im_download
  534  curl -O http://www.imagemagick.org/download/ImageMagick.tar.gz
  535  ls
  536  tar zxvf ImageMagick.tar.gz 
  537  ls
  538  cd ImageMagick
  539  cd ImageMagick-*
  540  ls
  541  cd ..
  542  ls
  543  rm ImageMagick.tar.gz 
  544  cd ImageMagick-7.0.7-4/
  545  ls
  546  curl -O http://www.imagemagick.org/download/delegates/libpng-1.6.24.tar.gz
  547  ls
  548  tar ztvf libpng-1.6.24.tar.gz 
  549* rm libpng-1.6.31.tar.gz 
  550  curl -O http://www.imagemagick.org/download/delegates/libpng-1.6.31.tar.gz
  551  curl -O http://www.imagemagick.org/download/delegates/jpegsrc.v9b.tar.gz
  552  tar zxvf libpng-1.6.31.tar.gz 
  553  tar zxvf jpegsrc.v9b.tar.gz 
  554  ls -la
  555  rm jpeg*.tar.gz
  556  rm libpng-1.6.31.tar.gz 
  557  ls -la
  558  cd jpeg-9b/
  559  ls
  560  cd ..
  561  ls
  562  cd libpng-1.6.31/
  563  ls
  564  cd ..
  565  ls
  566  mv libpng-1.6.31/ png
  567  cd png
  568  ./configure --disable-shared --disable-dependency-tracking && make
  569  cd ..
  570  ls
  571  mv jpeg-9b/ jpeg
  572  cd jpeg/
  573  ls
  574  ./configure --disable-shared --disable-dependency-tracking && make
  575  ./configure --disable-shared --disable-dependency-tracking --enable-delegate-build --disable-installed --without-frozenpaths --prefix $IMBUILD --with-openexr=no --disable-docs --without-lcms --without-x --without-webp --without-jpeg --without-pango --enable-hdri=no --without-gvc
  576  ./configure --disable-shared --disable-dependency-tracking --enable-delegate-build --disable-installed --without-frozenpaths --prefix $IMBUILD --with-openexr=no --disable-docs --without-lcms --without-x --without-webp --without-freetype --without-pango --enable-hdri=no --without-gvc
  577  ./configure --disable-shared --disable-dependency-tracking && make
  578  make
  579  cd ..
  580  ./configure --disable-shared --disable-dependency-tracking --enable-delegate-build --disable-installed --without-frozenpaths --prefix $IMBUILD --with-openexr=no --disable-docs --without-lcms --without-x --without-webp --without-freetype --without-pango --enable-hdri=no --without-gvc
  581  ./configure --disable-shared --disable-dependency-tracking --enable-delegate-build --disable-installed --without-frozenpaths --prefix $IMBUILD --with-openexr=no --disable-docs --without-lcms --without-x --without-webp --without-freetype --without-pango --enable-hdri=no --without-gvc --without-tiff --without-mpeg --without-fontconfig
  582  history | less
```
