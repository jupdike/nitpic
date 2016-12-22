const fs = require('fs')
const path = require('path')

export default class NitpicSettings {
  settings: any;
  constructor(public datapath: string) {
    console.error(datapath);
    try {
      fs.mkdirSync(datapath); // it's ok if it exists
    }
    catch (e) {
    }
    this.settings = { }
    try {
      let s = fs.readFileSync(path.join(this.datapath, 'nitpic.json'));
      this.settings = JSON.parse(s);
    }
    catch (e) {
    }
    console.error('--- found settings: ---');
    console.error(this.settings);
  }

  public hasRootFolders(): boolean {
    return false; // TODO look in this.settings
  }
}
