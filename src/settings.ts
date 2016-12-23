/// <reference path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/node/index.d.ts" />

const fs = require('fs')
const path = require('path')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

interface Action {
  (any): void;
}

export default class NitpicSettings {
  settings: any = {};
  constructor(public datapath: string) {
    try {
      fs.mkdirSync(datapath); // it's ok if it exists
    }
    catch (e) {
    }
    
    let settingsFile = path.join(this.datapath, 'nitpic.json');
    console.error("settings file should be here: " + settingsFile);
    this.settings = { }
    try {
      let s = fs.readFileSync(settingsFile);
      this.settings = JSON.parse(s) as {[k:string]: string};
    }
    catch (e) {
    }
    console.error('--- found settings: ---');
    console.error(this.settings);
    //
    ['inputRootDir', 'outputRootDir'].forEach(s => {
      if (!this.settings.hasOwnProperty(s)) {
        const options = {
          type: 'info',
          title: 'Select '+s,
          message: "Select the folder for "+s,
          buttons: ['OK']
        }
        var indexUnused = dialog.showMessageBox(options);
        var files: Array<string> = this.chooseDir(s);
        console.error(files);
        if (files && files.length > 0) {
          console.error(files);
          this.settings[s] = files[0];
        }
      }
    });
    var all = JSON.stringify(this.settings, null, 2);
    fs.writeFileSync(settingsFile, all);
    console.error('wrote:');
    console.error(all);
  }

  inputRootDir(): string {
    return this.settings.inputRootDir as string;
  }

  outputRootDir(): string {
    return this.settings.outputRootDir as string;
  }

  chooseDir(s: string): Array<string> {
    return dialog.showOpenDialog({ title: 'Select '+s, properties: ['openDirectory'] });
  }
}
