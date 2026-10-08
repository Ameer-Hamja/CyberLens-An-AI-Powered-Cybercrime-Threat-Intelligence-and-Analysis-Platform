import {describe,it,expect,vi} from 'vitest';
vi.mock('webextension-polyfill',()=>({default:{}}));
import {cleanBackend,hostPattern,matchesDomain,digest} from './settings';
describe('URL and permission boundaries',()=>{
 it('rejects non-HTTP backends and embedded credentials',()=>{for(const url of ['file:///tmp/a','javascript:alert(1)','https://user:password@example.com','https://example.com?token=a'])expect(()=>cleanBackend(url)).toThrow();});
 it('limits permissions to a selected origin',()=>expect(hostPattern('https://api.example.com/path')).toBe('https://api.example.com/*'));
 it('does not let a lookalike suffix match an allowlist',()=>{expect(matchesDomain('login.example.com','example.com')).toBe(true);expect(matchesDomain('example.com.attacker.test','example.com')).toBe(false);expect(matchesDomain('fakeexample.com','example.com')).toBe(false);});
 it('uses hashes for session cache keys',async()=>{const value=await digest('https://example.com');expect(value).toMatch(/^[a-f0-9]{64}$/);expect(value).not.toContain('example');});
});
