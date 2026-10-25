import { app, BrowserWindow, dialog, ipcMain, nativeTheme } from 'electron';
import { readFile, writeFile, rename, copyFile, stat, utimes, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID, createHash } from 'node:crypto';
import { applySystemTimes } from './system-times';

const allowed = new Set(['.docx', '.dotx', '.docm']);
let win: BrowserWindow | null = null;
let queuedPath: string | undefined;
const fileHash = (b: Buffer) => createHash('sha256').update(b).digest('hex');
function candidatePath(argv: string[]) { return argv.slice(1).find((v) => !v.startsWith('-') && allowed.has(path.extname(v).toLowerCase())); }
function sendOpen(p?: string) { if (p && win) { if (win.webContents.isLoading()) win.webContents.once('did-finish-load', () => win?.webContents.send('file:open-path', p)); else win.webContents.send('file:open-path', p); } }
async function createWindow() {
  win = new BrowserWindow({ width: 1100, height: 760, minWidth: 800, minHeight: 560, title: 'محرر خصائص Word', backgroundColor: nativeTheme.shouldUseDarkColors ? '#202020' : '#f3f3f3', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const trustedFile=pathToFileURL(path.join(__dirname,'../ui-dist/index.html')).href;
  win.webContents.on('will-navigate', (e, url) => { const trustedDev=process.env.VITE_DEV_SERVER_URL&&url.startsWith(process.env.VITE_DEV_SERVER_URL); if (url!==trustedFile&&!trustedDev) e.preventDefault(); });
  if (process.env.VITE_DEV_SERVER_URL) await win.loadURL(process.env.VITE_DEV_SERVER_URL); else await win.loadFile(path.join(__dirname, '../ui-dist/index.html'));
  sendOpen(queuedPath);
  win.on('close', (e) => { e.preventDefault(); win?.webContents.send('window:before-close'); });
}
const gotLock = app.requestSingleInstanceLock();
app.on('open-file', (e, p) => { e.preventDefault(); if (allowed.has(path.extname(p).toLowerCase())) { if (win) sendOpen(p); else queuedPath = p; } });
if (!gotLock) app.quit(); else {
  app.on('second-instance', (_e, argv) => { const p = candidatePath(argv); if (win) { if (win.isMinimized()) win.restore(); win.focus(); } sendOpen(p); });
  app.whenReady().then(async () => { queuedPath ??= candidatePath(process.argv); await createWindow(); });
}

ipcMain.handle('file:choose', async () => { const r = await dialog.showOpenDialog({ properties: ['openFile'], filters: [{ name: 'ملفات Word', extensions: ['docx', 'dotx', 'docm'] }] }); return r.canceled ? null : r.filePaths[0]; });
ipcMain.handle('file:read', async (_e, p: string) => { if (!allowed.has(path.extname(p).toLowerCase())) throw new Error('صيغة الملف غير مدعومة. اختر docx أو dotx أو docm.'); const info = await stat(p); const data = await readFile(p); return { data: data.toString('base64'), path: p, size: info.size, created: info.birthtime.toISOString(), modified: info.mtime.toISOString(), accessed: info.atime.toISOString(), sha256: fileHash(data), platform: process.platform }; });
ipcMain.handle('file:save', async (_e, p: string, b64: string, backup: boolean) => { const data = Buffer.from(b64, 'base64'); const tmp = `${p}.${randomUUID()}.tmp`; if (backup) await copyFile(p, `${p}.bak`); try { await writeFile(tmp, data, { flag: 'wx' }); await rename(tmp, p); } catch (err) { await unlink(tmp).catch(() => {}); throw new Error('تعذّر حفظ الملف. أغلقه في Word وتأكد من صلاحية الكتابة.'); } return { sha256: fileHash(data), size: data.length }; });
ipcMain.handle('file:save-as', async (_e, source: string, b64: string) => { const r = await dialog.showSaveDialog({ defaultPath: source, filters: [{ name: 'ملفات Word', extensions: ['docx', 'dotx', 'docm'] }] }); if (r.canceled || !r.filePath) return null; const tmp = `${r.filePath}.${randomUUID()}.tmp`; try { await writeFile(tmp, Buffer.from(b64, 'base64'), { flag: 'wx' }); await rename(tmp, r.filePath); } catch (err) { await unlink(tmp).catch(() => {}); throw new Error('تعذّر حفظ النسخة في المسار المحدد.'); } return r.filePath; });
ipcMain.handle('file:set-times', async (_e, p: string, t: { created?: string; modified?: string; accessed?: string }) => applySystemTimes(p,t,process.platform,{isPackaged:app.isPackaged,resourcesPath:process.resourcesPath,appPath:app.getAppPath()}));
ipcMain.on('window:close-ready', () => { win?.removeAllListeners('close'); win?.close(); });
