import { stat, utimes } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
export type FileTimes={created?:string;modified?:string;accessed?:string};
export type RuntimePaths={isPackaged?:boolean;resourcesPath?:string;appPath?:string};
export async function applySystemTimes(file:string,times:FileTimes,platform=process.platform,runtime:RuntimePaths={}):Promise<{creationSupported:boolean}> {
  if(platform==='win32') {
    const script=runtime.isPackaged?path.join(runtime.resourcesPath??process.cwd(),'set-file-times.ps1'):path.join(runtime.appPath??process.cwd(),'electron','set-file-times.ps1');
    await new Promise<void>((resolve,reject)=>{const child=spawn('powershell.exe',['-NoProfile','-NonInteractive','-File',script,'-Path',file,'-CreationTime',times.created??'','-ModificationTime',times.modified??'','-AccessTime',times.accessed??''],{windowsHide:true});let err='';child.stderr.on('data',x=>err+=String(x));child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error(err||'تعذّر ضبط تواريخ الملف في Windows.')));});
    return {creationSupported:true};
  }
  const current=await stat(file); await utimes(file,times.accessed?new Date(times.accessed):current.atime,times.modified?new Date(times.modified):current.mtime);
  if(platform==='darwin'&&times.created){const d=new Date(times.created);const value=`${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;try{await new Promise<void>((resolve,reject)=>{const child=spawn('SetFile',['-d',value,path.resolve(file)],{windowsHide:true});child.on('error',reject);child.on('close',code=>code===0?resolve():reject(new Error('SetFile failed')));});return {creationSupported:true};}catch{return {creationSupported:false};}}
  return {creationSupported:false};
}
