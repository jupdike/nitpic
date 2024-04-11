const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronIpcAPI', {
    send: (...theArgs) => ipcRenderer.send(...theArgs),
    on: (...theArgs) => ipcRenderer.on(...theArgs)
})

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron,
  // we can also expose variables, not just functions
})
