const {app, BrowserWindow, Menu, shell} = require('electron')
const path = require('path')
const url = require('url')
const fs = require('fs')
const ipc = require('electron').ipcMain
const os = require('os')

//app.setName("Nitpic"); // does nothing. TODO this should be in the Info.plist and we should use electron-packager

import Server from './Server'
import NitpicSettings from './NitpicSettings'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win = null;
let windows = [];

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
const numcores = (numcpus*0.25)|0 + 1;

var settings: NitpicSettings;
var server: Server;

function createWindow() {
  let template = [{
    label: "Application",
    submenu: [
        { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
        { type: 'separator' },
        { label: 'Services', submenu: [] },
        { type: 'separator' },
        {
          label: 'Hide Nitpic',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: 'Hide Others',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: 'Show All', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]},
    {
      label: "File",
      submenu: [
          { label: "Open Folder...", accelerator: "CmdOrCtrl+O", click: function() { funcIndexPageLoadedOrOpenFolder(null, true); } },
          { label: "Preview", accelerator: "CmdOrCtrl+T", click: function() { openPreview(null); } },
          { label: "Publish", accelerator: "CmdOrCtrl+P", click: function() { openPublish(null); } },
          { type: 'separator' },
          { label: 'Close Window', accelerator: 'CmdOrCtrl+W', selector: 'performClose:' },
      ]},
    {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]},
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            win.webContents.reload();
          },
        },
        {
          label: 'Toggle Full Screen',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            let w = win
            for(let i = 0; i < windows.length; i++) {
              if(windows[i] != null) {
                w = windows[i];
                break;
              }
            }
            w.setFullScreen(!w.isFullScreen());
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'Alt+CmdOrCtrl+I',
          click: () => {
            // toggle all windows' dev tools
            win.webContents.toggleDevTools();
            windows.forEach((w) => {
              if(!w) { return; } // these get nulled out... weird approach
              w.webContents.toggleDevTools();
            });
          },
        },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          selector: 'performMiniaturize:',
        },
        {
          label: 'Zoom',
          accelerator: 'CmdOrCtrl+N',
          selector: 'performZoom:',
        },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Nitpic Documentation...',
          click: () => { shell.openExternal("https://github.com/jupdike/nitpic/"); },
        },
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  var datapath = path.join(getAppDataPath(), 'Nitpic', 'Settings');
  settings = new NitpicSettings(datapath);

  console.log("maxLength is: "+settings.maxLength());

  console.log("OS says it has this many cores : "+numcpus); // could be 2x physical cores, because of hyper-threading
  console.log("OS probably has this many cores: "+numcores);

  server = new Server(ipc_send, settings);

  // Create the browser window.
  win = new BrowserWindow({width: 1160, height: 800, webPreferences: webPreferences, })
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
  //win.webContents.openDevTools() // not needed because of menu and kb shortcut
}

// this doesn't exist because there may be more than one window but there is always only one main process for the renderer (browser window) processes to talk to
// but they don't say that in the docs, which is asinine
function ipc_send(msg, ...args) {
  win.webContents.send(msg, ...args); // WTF dumb-asses --- violates the principal of least surprise
}

ipc.on('index-page-loaded', funcIndexPageLoadedOrOpenFolder);
// vvvvv (so we can call from elsewhere in code too)
function funcIndexPageLoadedOrOpenFolder(event, requestUserPickFolder) {
  console.error('index page loaded!');
  console.error('requestUserPickFolder:', requestUserPickFolder);
  if (requestUserPickFolder) {
    if (settings.openFolder()) {
      settings.saveSettings();
      server.openFolder(); // set the folder to the new setting
    }
    else {
      return;
    }
  }
  ipc_send("progress-update", {progress: 0, message: "Ready"});
  ipc_send("update-publish-button", {noPub: server.noPub});
  ipc_send("progress-update", {folderName: settings.albumName() + " @" + settings.maxLength()+"px"});
  server.convertThumbnails(numcores, () => {
    server.readMetadata( () => {
      console.log('sending progress-update');
      ipc_send("progress-update", {progress: 0, message: "Ready"});
      let arg = {maxLength: settings.maxLength()};
      console.log('sending metadata-read with ', arg);
      ipc_send('metadata-read', arg);
    });
  });
}

ipc.on('show-url-window', openUrlWindow);
function openUrlWindow(event, url) {
  console.log('main page wants to show url:', url);

  var newIndex = windows.length;
  var wind = new BrowserWindow({width: 1160, height: 700, webPreferences: webPreferences, })
  wind.setMinimumSize(1160, 600);
  windows.push(wind);

  // Emitted when the window is closed.
  wind.on('closed', () => {
    windows[newIndex] = null; // null out the reference where the .push just added it (keep all the indices the same, however)
  })

  wind.loadURL(url);
}

let webPreferences = {
  preload: path.join(__dirname, 'preload.js'),
}

ipc.on('show-preview', openPreview);
function openPreview(event) {
  console.log("main should show a preview window");

  server.writeoutMetadataJsonEtc('http://localhost:3000/static/', 'index.json');

  var newIndex = windows.length;
  var wind = new BrowserWindow({width: 1160, height: 700, webPreferences: webPreferences, })
  wind.setMinimumSize(440, 440);
  windows.push(wind);

  // Emitted when the window is closed.
  wind.on('closed', () => {
    windows[newIndex] = null; // null out the reference where the .push just added it (keep all the indices the same, however)
  })

  wind.loadURL(url.format({
    pathname: path.join(__dirname, 'client', 'gallery.html'),
    protocol: 'file:',
    slashes: true
  }))
  //wind.webContents.openDevTools()
}

ipc.on('show-publish', openPublish);
function openPublish(event) {
  console.log("main should show a publish window");

  server.writeoutMetadataJsonEtc('http://localhost:3000/static/', 'index.json');
  
  var newIndex = windows.length;
  var wind = new BrowserWindow({width: 800, height: 700, webPreferences: webPreferences, })
  wind.setMinimumSize(800, 600);
  windows.push(wind);

  // Emitted when the window is closed.
  wind.on('closed', () => {
    windows[newIndex] = null; // null out the reference where the .push just added it (keep all the indices the same, however)
  })

  wind.loadURL(url.format({
    pathname: path.join(__dirname, 'client', 'publish.html'),
    protocol: 'file:',
    slashes: true
  }))
  //wind.webContents.openDevTools()
}

app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q

  // ... but this causes a crashy problem with no main window, so just quit the app and all is less confusing...

  //if (process.platform !== 'darwin') {
    app.quit()
  //}
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
