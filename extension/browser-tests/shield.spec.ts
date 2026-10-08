import {test,expect,chromium} from '@playwright/test';
import {cp,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {createServer} from 'node:http';

test('unpacked worker, warning, popup, options, heatmap and authenticated report',async()=>{
 const temporary=await mkdtemp(join(tmpdir(),'cyberlens-shield-'));
 const unpacked=join(temporary,'extension');await cp(resolve('dist'),unpacked,{recursive:true});
 const manifest=JSON.parse(await readFile(join(unpacked,'manifest.json'),'utf8'));
 // A test-only grant represents permission the user grants in the production options page.
 manifest.host_permissions.push('http://127.0.0.1/*');await writeFile(join(unpacked,'manifest.json'),JSON.stringify(manifest));
 const server=createServer((_req,res)=>{res.writeHead(200,{'Content-Type':'text/html'});res.end('<title>Shield test fixture</title><h1>Local fixture</h1><a href="http://127.0.0.1:8877/login-verify?link=1">Suspicious test link</a>');});
 await new Promise<void>(resolve=>server.listen(8877,'127.0.0.1',resolve));
 const context=await chromium.launchPersistentContext(join(temporary,'profile'),{channel:'chromium',executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--disable-extensions-except='+unpacked,'--load-extension='+unpacked]});
 try{
 const worker=context.serviceWorkers()[0]||await context.waitForEvent('serviceworker');const id=new URL(worker.url()).host;
 const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const ui=await context.newPage();ui.on('pageerror',error=>errors.push(error.message));await ui.goto(`chrome-extension://${id}/options.html`);
 await expect(ui.getByRole('heading',{name:'Shield settings'})).toBeVisible();
 await ui.evaluate(()=>chrome.runtime.sendMessage({type:'GET_FEED'}));
 await page.goto('http://127.0.0.1:8877/login-verify');
 await expect(page.getByRole('button',{name:'Proceed anyway'})).toBeVisible({timeout:30000});
 await page.getByRole('button',{name:'Proceed anyway'}).click();
 const result=await ui.evaluate(async()=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.includes('8877/login-verify'));return await chrome.runtime.sendMessage({type:'SCAN_URL',url:tab!.url,tabId:tab!.id});});
 expect(result.status).toBe('ready');expect(result.result.verdict).toBe('DANGEROUS');
 await ui.evaluate(async value=>{await chrome.storage.session.set({contextResult:value});},result);
 await ui.goto(`chrome-extension://${id}/popup.html?context=1`);await expect(ui.getByRole('heading',{name:'DANGEROUS'})).toBeVisible();
 await ui.goto(`chrome-extension://${id}/sidepanel.html`);await expect(ui.getByRole('region',{name:'India state incident heatmap'})).toBeVisible();
 await expect(ui.locator('.leaflet-interactive').first()).toBeVisible({timeout:20000});
 const username='shield'+Date.now(),password=crypto.randomUUID()+'A7!';
 const register=await context.request.post('http://localhost:8080/api/auth/register',{data:{username,password,email:username+'@example.test'}});expect(register.ok()).toBeTruthy();
 await ui.goto(`chrome-extension://${id}/options.html`);await ui.getByLabel('Username',{exact:true}).fill(username);await ui.getByLabel('Password',{exact:true}).fill(password);await ui.getByRole('button',{name:'Sign in',exact:true}).click();await expect(ui.getByRole('button',{name:'Sign out'})).toBeVisible();
 await ui.goto(`chrome-extension://${id}/report.html?url=${encodeURIComponent('http://127.0.0.1:8877/login-verify')}&title=Shield%20test%20fixture`);
 await expect(ui.getByLabel('Page title / report title')).toHaveValue('Shield test fixture');await ui.getByLabel('What happened?',{exact:false}).fill('Automated local fixture report for verifying the Shield submission flow.');
 await ui.getByRole('button',{name:'Submit to CyberLens'}).click();await expect(ui.getByRole('heading',{name:'Report received by CyberLens'})).toBeVisible();
 // A failed navigation must discard a verdict from the preceding website.
 await page.goto('http://127.0.0.1:8878/unavailable').catch(()=>undefined);
 await expect.poll(()=>worker.evaluate(async()=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.includes('8878/unavailable'));return tab?.id===undefined?'missing':await chrome.action.getBadgeText({tabId:tab.id});})).toBe('…');
 const unavailable=await ui.evaluate(async()=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.includes('8878/unavailable'));return chrome.runtime.sendMessage({type:'SCAN_URL',url:'http://127.0.0.1:8878/unavailable',tabId:tab!.id});});
 expect(unavailable.status).toBe('error');expect(unavailable.message).toContain('failed to load');
 expect(errors).toEqual([]);
 }finally{await context.close();await new Promise<void>(resolve=>server.close(()=>resolve()));await rm(temporary,{recursive:true,force:true});}
});
