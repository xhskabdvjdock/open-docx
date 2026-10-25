import type { Model } from '../core/docx';
declare global {
  interface Window { wordProps: { chooseFile():Promise<string|null>; readFile(p:string):Promise<{data:string;path:string;size:number;created:string;modified:string;accessed:string;sha256:string;platform:string}>; saveFile(p:string,data:string,backup:boolean):Promise<{sha256:string;size:number}>; saveAs(p:string,data:string):Promise<string|null>; setTimes(p:string,t:object):Promise<{creationSupported:boolean}>; onOpenPath(fn:(p:string)=>void):void; onBeforeClose(fn:()=>void):void; closeReady():void } }
}
export {};
