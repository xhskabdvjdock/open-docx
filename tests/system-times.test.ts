import {afterEach,describe,it,expect} from 'vitest';
import {mkdtemp,writeFile,stat,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {applySystemTimes} from '../electron/system-times';
let dir='';
afterEach(async()=>{if(dir)await rm(dir,{recursive:true,force:true});dir='';});
describe('real filesystem timestamps',()=>{
 it('updates modification and access times on the current platform',async()=>{dir=await mkdtemp(path.join(tmpdir(),'wordprops-'));const file=path.join(dir,'sample.tmp');await writeFile(file,'timestamps');const target=new Date('2021-04-05T06:07:08.000Z');const outcome=await applySystemTimes(file,{modified:target.toISOString(),accessed:target.toISOString()});const actual=await stat(file);expect(Math.abs(actual.mtime.getTime()-target.getTime())).toBeLessThan(2000);expect(Math.abs(actual.atime.getTime()-target.getTime())).toBeLessThan(2000);if(process.platform==='win32')expect(outcome.creationSupported).toBe(true);else expect(outcome.creationSupported).toBe(false);});
 it.skipIf(process.platform!=='win32')('changes Windows creation time through PowerShell',async()=>{dir=await mkdtemp(path.join(tmpdir(),'wordprops-'));const file=path.join(dir,'created.tmp');await writeFile(file,'creation');const target=new Date('2020-02-03T04:05:06');await applySystemTimes(file,{created:target.toISOString()});const actual=await stat(file);expect(Math.abs(actual.birthtime.getTime()-target.getTime())).toBeLessThan(2000);});
});
