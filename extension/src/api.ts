import browser from 'webextension-polyfill';
import {settings} from './settings';
export class ApiError extends Error{constructor(message:string,public status=0){super(message);}}
export async function request<T>(path:string,body?:unknown, retry=true):Promise<T>{
 const config=await settings();const session=await browser.storage.session.get(['token','tokenBackend']);
 for(let attempt=0;attempt<(retry?2:1);attempt++){
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(config.backendUrl+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(session.token&&session.tokenBackend===config.backendUrl?{Authorization:'Bearer '+session.token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal,credentials:'omit',cache:'no-store'});
   if(!response.ok){if(response.status===401)await browser.storage.session.remove('token');throw new ApiError(response.status===429?'Rate limit reached. Wait one minute before retrying.':response.status===401?'Please sign in again.':response.status===403?'Your account cannot perform this action.':'Service returned HTTP '+response.status,response.status);}
   const payload=await response.json();if(payload.success===false)throw new ApiError(payload.error||'Request failed');return (payload.success===true?payload.data:payload) as T;
  }catch(error){if(error instanceof ApiError&&error.status<500)throw error;if(attempt===(retry?1:0))throw new ApiError('CyberLens is offline or timed out. No safety verdict is available.');await new Promise(resolve=>setTimeout(resolve,400));}finally{clearTimeout(timeout);}
 }throw new ApiError('CyberLens unavailable');
}
