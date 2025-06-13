const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendLog: (msg) => ipcRenderer.send('log', msg)
});
