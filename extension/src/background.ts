import browser,{type Runtime} from 'webextension-polyfill';
import {request,ApiError} from './api';
import {settings,digest,matchesDomain} from './settings';
import type {ScanState,ScanResult,Alert,Stats,Message} from './types';
const session=browser.storage.session;
const timers=new Map<number,ReturnType<typeof setTimeout>>();
const pending=new Map<string,Promise<ScanState>>();
const failedPages=new Map<number,string>();
function pageState(id:number,url:string,state:ScanState):ScanState{return failedPages.get(id)===url?{status:'error',message:'This page failed to load. URL analysis cannot confirm this site is safe.'}:state;}
async function quota(){const data=await session.get('requestTimes');const now=Date.now();const times=((data.requestTimes||[]) as number[]).filter(time=>now-time<60000);if(times.length>=24)throw new ApiError('Scan budget reached. Wait a minute before checking more links.',429);await session.set({requestTimes:[...times,now]});}
let serial=Promise.resolve();
function queued<T>(work:()=>Promise<T>):Promise<T>{const next=serial.then(work,work);serial=next.then(()=>undefined,()=>undefined);return next;}
async function scanUrl(url:string,force=false):Promise<ScanState>{
 let parsed:URL;try{parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error();}catch{return {status:'error',message:'Only HTTP and HTTPS pages can be checked.'};}
 const config=await settings();const hash=await digest(parsed.href);const key='url:v2:'+hash;
 if(config.blocklist.some(domain=>matchesDomain(parsed.hostname,domain)))return {status:'ready',result:{verdict:'DANGEROUS',score:100,category:'LOCAL_POLICY',reasons:['Domain is on your personal blocklist.']}};
 if(config.allowlist.some(domain=>matchesDomain(parsed.hostname,domain)))return {status:'ready',result:{verdict:parsed.protocol==='http:'?'SUSPICIOUS':'SAFE',score:parsed.protocol==='http:'?30:0,category:'LOCAL_POLICY',reasons:['You allowlisted this domain. Backend analysis was skipped.',...(parsed.protocol==='http:'?['HTTP does not encrypt this connection; do not enter sensitive information.']:[])]}};
 const stored=await session.get(key);const cached=stored[key] as {expires:number;state:ScanState}|undefined;
 if(!force&&cached&&cached.expires>Date.now())return cached.state;
 if(pending.has(key))return pending.get(key)!;
 const task=queued(async()=>{let state:ScanState;try{await quota();state={status:'ready',result:await request<ScanResult>('/api/scan/url',{url:parsed.href})};}catch(error){state={status:error instanceof ApiError&&error.status?'error':'offline',message:error instanceof Error?error.message:'Service unavailable'};}
 await session.set({[key]:{expires:Date.now()+(state.status==='ready'?600000:15000),state}});const all=await session.get(null);const cache=Object.keys(all).filter(name=>name.startsWith('url:'));const expired=cache.filter(name=>(all[name] as {expires:number}).expires<Date.now());await session.remove([...expired,...cache.filter(name=>!expired.includes(name)).slice(0,Math.max(0,cache.length-expired.length-200))]);return state;});
 pending.set(key,task);try{return await task;}finally{pending.delete(key);}
}
async function badge(tabId:number,state:ScanState){const verdict=state.status==='ready'?state.result.verdict:undefined;await browser.action.setBadgeText({tabId,text:verdict==='DANGEROUS'?'!':verdict==='SUSPICIOUS'?'?':verdict==='SAFE'?'OK':'…'});await browser.action.setBadgeBackgroundColor({tabId,color:verdict==='DANGEROUS'?'#dc2626':verdict==='SUSPICIOUS'?'#d97706':verdict==='SAFE'?'#047857':'#475569'});await browser.action.setTitle({tabId,title:'CyberLens Shield: '+(verdict||'analysis unavailable')});}
async function inject(tabId:number){try{await browser.scripting.executeScript({target:{tabId},files:['content.js']});}catch{/* Restricted pages and sites without permission remain badge-only. */}}
async function navigate(tabId:number,url:string){const config=await settings();if(!config.autoScan||!/^https?:/.test(url)||new URL(url).origin===new URL(config.backendUrl).origin)return;const allowed=await browser.permissions.contains({origins:[new URL(url).origin+'/*']});if(!allowed)return;let state=await scanUrl(url);try{state=pageState(tabId,url,state);const current=await browser.tabs.get(tabId);if((current.pendingUrl&&current.pendingUrl!==url)||(current.url&&current.url!==url))return;await badge(tabId,state);await inject(tabId);await browser.tabs.sendMessage(tabId,{type:'PAGE_RESULT',state,url,linkScanning:config.linkScanning}).catch(()=>undefined);}catch{/* The tab may have closed or navigated while scanning. */}}
function debounce(tabId:number,url:string){clearTimeout(timers.get(tabId));timers.set(tabId,setTimeout(()=>{timers.delete(tabId);void navigate(tabId,url);},500));}
browser.webNavigation.onBeforeNavigate.addListener(details=>{if(details.frameId!==0)return;failedPages.delete(details.tabId);clearTimeout(timers.get(details.tabId));void badge(details.tabId,{status:'error',message:'Checking current page.'});});
browser.webNavigation.onErrorOccurred.addListener(details=>{if(details.frameId!==0)return;failedPages.set(details.tabId,details.url);clearTimeout(timers.get(details.tabId));void badge(details.tabId,pageState(details.tabId,details.url,{status:'error',message:'Page unavailable.'}));});
browser.webNavigation.onCommitted.addListener(details=>{if(details.frameId===0)debounce(details.tabId,details.url);});
browser.webNavigation.onDOMContentLoaded.addListener(details=>{if(details.frameId===0)debounce(details.tabId,details.url);});
browser.tabs.onUpdated.addListener((id,change,tab)=>{if(change.status==='complete'&&tab.url)debounce(id,tab.url);});
browser.tabs.onRemoved.addListener(id=>{failedPages.delete(id);clearTimeout(timers.get(id));timers.delete(id);});
async function poll(){const config=await settings();if(!config.notifications)return;try{const alerts=await request<Alert[]>('/api/alerts/recent?limit=50');const data=await browser.storage.local.get(['seenAlerts','alertsPrimed']);const seen=(data.seenAlerts||[]) as string[];if(data.alertsPrimed){for(const alert of alerts.filter(item=>item.severity>=config.minimumSeverity&&!seen.includes(item.id)).slice(0,3))await browser.notifications.create('alert:'+alert.id,{type:'basic',iconUrl:browser.runtime.getURL('icons/shield128.png'),title:'CyberLens: '+alert.threatType.replaceAll('_',' '),message:alert.citizenExplanation?.slice(0,180)||'New high-severity incident. Open CyberLens for details.'});}await browser.storage.local.set({seenAlerts:[...new Set([...alerts.map(a=>a.id),...seen])].slice(0,200),alertsPrimed:true});}catch{/* A later alarm retries; no offline result is labeled safe. */}}
async function setup(){await browser.alarms.create('cyberlens-alerts',{periodInMinutes:2});}
browser.runtime.onInstalled.addListener(()=>{void setup();void poll();});browser.runtime.onStartup.addListener(()=>void setup());browser.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='cyberlens-alerts')void poll();});
browser.notifications.onClicked.addListener(async id=>{const config=await settings();if(id.startsWith('alert:'))await browser.tabs.create({url:config.dashboardUrl+'/incidents/'+encodeURIComponent(id.slice(6))});else await browser.tabs.create({url:browser.runtime.getURL('popup.html?context=1')});});
browser.runtime.onMessage.addListener((incoming:unknown,sender:Runtime.MessageSender)=>{
 const message=incoming as Message;
 if(!message||typeof message.type!=='string')return undefined;
 const internal=sender.id===browser.runtime.id&&!!sender.url?.startsWith(browser.runtime.getURL(''));
 if(message.type==='SCAN_URL'){if(!internal&&sender.tab?.url&&message.url!==sender.tab.url)return Promise.resolve({status:'error',message:'Page scan must match the sending tab.'});return scanUrl(message.url,message.force).then(async state=>{const id=internal?message.tabId:sender.tab?.id;if(id!==undefined){state=pageState(id,message.url,state);const current=await browser.tabs.get(id);if((current.pendingUrl&&current.pendingUrl!==message.url)||(current.url&&current.url!==message.url))return {status:'error',message:'Page changed during the scan. Recheck the current URL.'} as ScanState;await badge(id,state);await inject(id);const config=await settings();await browser.tabs.sendMessage(id,{type:'PAGE_RESULT',state,url:message.url,linkScanning:config.linkScanning}).catch(()=>undefined);}return state;});}
 if(message.type==='SCAN_LINKS'){if(!sender.tab||!Array.isArray(message.urls))return Promise.resolve([]);return settings().then(async config=>{if(!config.linkScanning)return [];return Promise.all([...new Set(message.urls)].filter(url=>typeof url==='string'&&url.length<=2048&&/^https?:/.test(url)).slice(0,4).map(async url=>({hash:await digest(url),state:await scanUrl(url)})));});}
 if(message.type==='SCAN_TEXT'&&internal)return queued(async()=>{try{await quota();return {status:'ready',result:await request('/api/scan/text',{text:message.text})};}catch(error){return {status:'offline',message:error instanceof Error?error.message:'Service unavailable'};}});
 if(message.type==='GET_FEED'&&internal)return Promise.all([request<Alert[]>('/api/alerts/recent?limit=10'),request<Stats>('/api/stats/summary')]).then(([alerts,stats])=>({alerts,stats}));
 if(message.type==='GET_HEATMAP'&&internal)return request('/api/incidents/heatmap');
 if(message.type==='SETTINGS_CHANGED'&&internal){return session.get(null).then(data=>session.remove(Object.keys(data).filter(key=>key.startsWith('url:')||key==='contextResult'))).then(()=>setup());}
 return undefined;
});

async function menus(){await browser.contextMenus.removeAll();browser.contextMenus.create({id:'shield-link',title:'Check this link with CyberLens',contexts:['link']});browser.contextMenus.create({id:'shield-text',title:'Check selected text',contexts:['selection']});}
browser.runtime.onInstalled.addListener(()=>void menus());
browser.contextMenus.onClicked.addListener(async(info,tab)=>{
 let state:ScanState;
 if(info.menuItemId==='shield-link'&&info.linkUrl)state=await scanUrl(info.linkUrl);
 else if(info.menuItemId==='shield-text'&&info.selectionText){state=await queued(async()=>{try{await quota();return {status:'ready',result:await request<ScanResult>('/api/scan/text',{text:info.selectionText!.slice(0,2000)})};}catch(error){return {status:'offline',message:error instanceof Error?error.message:'Analysis unavailable'};}});}
 else return;
 await session.set({contextResult:state});
 const result=state.status==='ready'?state.result:undefined;
 await browser.notifications.create('context-result',{type:'basic',iconUrl:browser.runtime.getURL('icons/shield128.png'),title:result?'CyberLens: '+result.verdict+' · '+result.score+'/100':'CyberLens: no verdict',message:result?result.reasons.slice(0,2).join(' ').slice(0,240):(state as {message:string}).message});

});
