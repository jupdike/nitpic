const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const ipc = require('electron').ipcMain
const os = require('os');

import Server from './Server'
import NitpicSettings from './NitpicSettings'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// on Mac this is /Users/jupdike/Library/Application Support/nitpic/Settings/
function getAppDataPath() {
  switch (process.platform) {
    case 'win32': return process.env['APPDATA'] || path.join(process.env['USERPROFILE'], 'AppData', 'Roaming');
    case 'darwin': return path.join(os.homedir(), 'Library', 'Application Support');
    case 'linux': return process.env['XDG_CONFIG_HOME'] || path.join(os.homedir(), '.config');
    default: throw new Error('Platform not supported');
  }
}

const numcpus = os.cpus().length;
const numcores = (numcpus*0.75)|0;

// TODO: change this to allow user to set this and store in NitpicSettings (along with -gravity of Center, N,S,E,W, NW, SW, NE, SE)
const default_watermark = 'jared-updike-org-mark.png';

var settings: NitpicSettings;
var server: Server;

function createWindow() {
  var datapath = path.join(getAppDataPath(), 'Nitpic', 'Settings');
  settings = new NitpicSettings(datapath);

  console.log("OS says it has this many cores : "+numcpus); // could be 2x physical cores, because of hyper-threading
  console.log("OS probably has this many cores: "+numcores);

  server = new Server(ipc_send, path.join(settings.inputRootDir(), settings.albumName()),
    path.join(settings.outputRootDir(), settings.albumName()), path.join(__dirname, default_watermark));

  // Create the browser window.
  win = new BrowserWindow({width: 1160, height: 800})
  win.setMinimumSize(1160, 600);

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'client', 'edit.html'),
    protocol: 'file:',
    slashes: true
  }))
  //win.webContents.openDevTools()
}

// this doesn't exist because there may be more than one window but there is always only one main process for the renderer (browser window) processes to talk to
// but they don't say that in the docs, which is asinine
function ipc_send(msg, ...args) {
  win.webContents.send(msg, ...args); // WTF dumb-asses --- violates the principal of least surprise
}

function readMetadataAndNavigate() {
  server.readMetadata( () => {
    ipc_send("progress-update", {progress: 0, message: "Ready"});
    ipc_send('metadata-read');
  });
}

ipc.on('index-page-loaded', (event) => {
  console.error('index page loaded!');
  ipc_send("progress-update", {progress: 0, message: "Ready"});
  ipc_send("progress-update", {folderName: settings.albumName()});
  server.convertThumbnails(numcores, () => {
    readMetadataAndNavigate();
  });
});

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
