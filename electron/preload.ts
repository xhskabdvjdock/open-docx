import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('wordProps', {
  chooseFile: () => ipcRenderer.invoke('file:choose'), readFile: (p: string) => ipcRenderer.invoke('file:read', p),
  saveFile: (p: string, data: string, backup: boolean) => ipcRenderer.invoke('file:save', p, data, backup),
  saveAs: (p: string, data: string) => ipcRenderer.invoke('file:save-as', p, data), setTimes: (p: string, t: object) => ipcRenderer.invoke('file:set-times', p, t),
  onOpenPath: (fn: (p: string) => void) => ipcRenderer.on('file:open-path', (_e,p) => fn(p)), onBeforeClose: (fn: () => void) => ipcRenderer.on('window:before-close', fn), closeReady: () => ipcRenderer.send('window:close-ready'),
});
