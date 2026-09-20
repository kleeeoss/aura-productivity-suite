const { contextBridge } = require('electron');

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  // We can add IPC methods here if needed, but the current app uses localStorage
  // which works perfectly out of the box in Electron without any IPC overhead.
  isElectron: true
});
