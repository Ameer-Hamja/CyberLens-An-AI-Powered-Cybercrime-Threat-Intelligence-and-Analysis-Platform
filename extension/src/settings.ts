import browser from 'webextension-polyfill';
import type {Settings} from './types';
export const defaults:Settings={backendUrl:'http://localhost:8080',dashboardUrl:'http://localhost:3000',autoScan:true,linkScanning:false,notifications:true,minimumSeverity:4,allowlist:[],blocklist:[]};
let builtConfig:Promise<Partial<Settings>>|undefined;
export async function settings():Promise<Settings>{builtConfig??=fetch(browser.runtime.getURL('config.json')).then(r=>r.json()).catch(()=>({}));const data=await browser.storage.local.get('settings');return {...defaults,...await builtConfig,...(data.settings as Partial<Settings>)};}
export function cleanBackend(value:string){const url=new URL(value);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use an HTTP(S) backend URL without credentials, query, or fragment');return url.origin+url.pathname.replace(/\/$/,'');}
export function hostPattern(value:string){return new URL(value).origin+'/*';}
export function matchesDomain(host:string,domain:string){return host===domain||host.endsWith('.'+domain);}
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
