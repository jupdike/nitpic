# Nitpic, a cross-platform photo gallery creation and publication desktop app (Mac, Windows, Linux)

## Nitpic's an Interactive Thumbnailer, Publisher, and Image Captioner

Nitpic assumes you have at least one of two long term goals: archiving high-res
originals of your best work, and publishing galleries of your best work on the web.
Nitpic exists to serve a very specific function in a larger context of photography:
for a user to own their data and the mechanism of publication of that data.

## Own Your Data

Many free or proprietary services exist that are easier to use, but do you own your data?
You can use Google Photo, Apple Photos "app" (really also a service, and data lives across
devices), Flickr, Facebook, Pinterest, Snapchat, Instagram, etc. but those are essentially
walled gardens, and they can change terms at the drop of the hat. [1] Squarespace is one of
the least worst of the easy-to-use hosting services, and at least you pay for the service,
so your relationship to the company is more clear, but it could be hard to migrate to another
service or even retrieve your data if you stop paying.

So if you are going to have to export and import your data into new services every
several years, and you need to keep a copy of all of your data as you go anyway, why not
import it into a future-proof, open format: files and folders!

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
Nitpic uses the **exvi2** command-line tool to modify just the EXIF field(s) off the original file,
in place.

### Modern, Responsive, High-Res, Retina-friendly

Nitpic has some cool features not found elsewhere:

- **Square cropping**, but with class: adjust the crop whether your images is portrait or
landscape, just choose north, south, east, or west, if center cropping is not working
on any specific image.
- **Blurry image previews**: fast loading 4x4 pixel thumbnails look gorgeous and make it
clear that your page is loading. (The image data for these tiny "thumbnails" is in the album
JSON, along with the image captions, so it loads really fast, all at once. Great for really
large galleries.)
- **You own and pay for your images to be published**. You pay Amazon (or Azure, or
anything that can put buckets (folders corresponding to an album) of static files on the
public internet.) I do not touch your data. You can switch to any service you like, any time
you like. (If you fork Nitpic and get other services working, I would love to know about it.)
- **Independent image hosting**: host your blog or website on any service, and embed your
galleries there using JavaScript, then host your images for cheap wherever that makes sense,
whether it is the same service, or yet another service.
- **Open source**: just fork Nitpic and make it do what you want, if it is not to your
liking.

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

### Anti-goals

Nitpic does not require a fancy server setup, just static file hosting of any sort.
Nitpic is not an image management / searching tool (like Lightroom or Apple Photos) nor
is it an image editor. Nitpic is not a blogging platform. Nitpic is not a service.
Nitpic is not marketed for medical or health industry use. Nitpic is not an easy, all-in-one
solution. Nitpic is not a community of like-minded suckers handing over their best work
to a VC-backed company located in another country. Nitpic does not assume that it knows
best. Nitpic seeks to be dispensible and replaceable.

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

## Developer Setup

- brew install imagemagick
- brew install exiv2 (or from source... hmmm... double check this)
- Execute npm install -- to get Electron, React, jQuery packages installed into node_modules
- Execute ./build.sh to create build/ and compile .ts to .js files, etc.
- Run ./run.sh to launch Electron app.

<hr/>

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

