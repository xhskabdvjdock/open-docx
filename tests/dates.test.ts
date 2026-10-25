import {describe,it,expect} from 'vitest';
import {localInputToUtc,toUtcW3cDtf,utcToLocalInput} from '../core/dates';
describe('date conversions',()=>{it('normalizes W3CDTF values to UTC seconds',()=>expect(toUtcW3cDtf('2024-06-01T10:00:00+03:00')).toBe('2024-06-01T07:00:00Z'));it('converts UTC to a local editable input and back',()=>{const local=utcToLocalInput('2024-06-01T07:00:00Z');expect(localInputToUtc(local)).toBe('2024-06-01T07:00:00Z');});it('rejects invalid dates',()=>expect(()=>toUtcW3cDtf('bad')).toThrow());});
