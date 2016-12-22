#!/bin/sh

tsc --sourceMap  src/*.ts
tsc --sourceMap --jsx react src/client/scripts/*.tsx
mkdir -p build/client/scripts
mkdir -p build/client/css
cp src/*.js build/
cp src/client/*.html build/client/
cp src/client/scripts/*.js build/client/scripts/
