const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('imageShift', {
  platform: process.platform,
  app: 'Image-Shift',
  imageApi: {
    health: () => ipcRenderer.invoke('image:health'),
    pickInputFiles: () => ipcRenderer.invoke('image:pick-input-files'),
    pickOutputDir: () => ipcRenderer.invoke('image:pick-output-dir'),
    processBatch: (payload) => ipcRenderer.invoke('image:process-batch', payload),
    exportZip: (payload) => ipcRenderer.invoke('image:export-zip', payload)
  }
});
