// / / /   < r e f e rence path="/Users/jupdike/Documents/dev/nitpic/node_modules/@types/node/index.d.ts" />

const fs = require('fs')
const path = require('path')
const ipc = require('electron').ipcMain
const dialog = require('electron').dialog

function String_startswith(that, test): boolean {
  return that.lastIndexOf(test, 0) === 0;
};

// interface String {
//   startswith: (str: string) => boolean;
// }
// String.prototype.startswith = function(test): boolean {
//   return this.lastIndexOf(test, 0) === 0;
// };

export default class NitpicSettings {
  settings: any = {};
  getSettingsFile() {
    return path.join(this.datapath, 'nitpic.json');
  }
  constructor(public datapath: string) {
    try {
      fs.mkdirSync(datapath); // it's ok if it exists
    }
    catch (e) {
    }

    let settingsFile = this.getSettingsFile();
    console.error("Settings file should be here: " + settingsFile);
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

    //this.openFolder();
    this.saveSettings();
  }

  public saveSettings() {
    let settingsFile = this.getSettingsFile();
    var all = JSON.stringify(this.settings, null, 2);
    fs.writeFileSync(settingsFile, all);
    console.error('wrote:');
    console.error(all);
  }

  public openFolder(): boolean {
    var ret = false;
    var files: Array<string> = this.chooseDir('albumName', this.inputRootDir());
    if (files && files.length > 0) {
      console.error(files);
      var base = this.inputRootDir();
      var name = files[0];
      console.log(name);
      console.log(base);
      if (!String_startswith(name, this.inputRootDir())) {
        const options = {
          type: 'info',
          title: 'Must choose album inside input folder',
          message: "Album folder needs to be inside of base input folder, " + this.inputRootDir(),
          buttons: ['OK']
        }
        var indexUnused = dialog.showMessageBox(options);
        return false;
      }
      name = name.replace(base, '');
      if (String_startswith(name, '/')) {
        name = name.slice(1);
      }
      if (String_startswith(name, '\\')) {
        name = name.slice(1);
      }
      this.settings['albumName'] = name;
      ret = true;
    }
    return ret;
  }

  public exiv2(): string {
    return this.settings.exiv2Path as string;
  }

  public convert(): string {
    return this.settings.convertPath as string;
  }

  public s3cmd(): string {
    return this.settings.s3cmdPath as string;
  }

  inputRootDir(): string {
    return this.settings.inputRootDir as string;
  }

  public outputRootDir(): string {
    return this.settings.outputRootDir as string;
  }

  public albumName(): string {
    return this.settings.albumName as string;
  }

  public maxLength(): number {
    return this.settings.maxLength as number;
  }

  public s3bucketname(): string {
    return this.settings.s3bucketname as string;
  }

  public pathToWatermark(): string {
    return this.settings.pathToWatermark as string;
  }

  with(kstr: string, v: any, dict: any) {
    if (v) {
      dict[kstr] = v;
      return dict;
    }
    return dict;
  }

  chooseDir(s: string, defaultDir=null): Array<string> {
    return dialog.showOpenDialogSync(this.with('defaultPath', defaultDir,
    { title: 'Select '+s, properties: ['openDirectory'] }));
  }
}
