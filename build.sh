#!/bin/sh

webpack
tsc --sourceMap  src/*.ts
tsc --sourceMap --jsx react src/client/scripts/*.tsx
mkdir -p build/client/scripts
mkdir -p build/client/css
mkdir -p build/client/third-party
cwd=`pwd`
cp node_modules/react/dist/react.js build/client/third-party/
cp node_modules/react-dom/dist/react-dom.js build/client/third-party/
cp node_modules/jquery/dist/jquery.js build/client/third-party/
cp src/*.js build/
cp src/client/css/*.css build/client/css/
cp src/client/*.html build/client/
cp src/client/scripts/*.js build/client/scripts/
#cp *.png build/

mkdir -p /Users/jupdike/Documents/dev/jfu/nitpic-dist/Nitpic.app/Contents/Resources/app/build/
cp package.json /Users/jupdike/Documents/dev/jfu/nitpic-dist/Nitpic.app/Contents/Resources/app/
cp -R build/ /Users/jupdike/Documents/dev/jfu/nitpic-dist/Nitpic.app/Contents/Resources/app/build/
ln -s /Users/jupdike/Documents/dev/jfu/nitpic/node_modules /Users/jupdike/Documents/dev/jfu/nitpic-dist/Nitpic.app/Contents/Resources/app/node_modules

exit 0
