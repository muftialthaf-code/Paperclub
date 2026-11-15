import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root='https://paperclub.test';const listeners={};const cached=new Map();let online=true;
const absolute=url=>new URL(typeof url==='string'?url:url.url,root).href;
async function fetchLocal(request){
 if(!online)throw new Error('Offline');
 const path=new URL(absolute(request)).pathname;const file='dist'+(path==='/'?'/index.html':path);
 return new Response(fs.readFileSync(file),{status:200});
}
const context={URL,Response,fetch:fetchLocal,location:new URL(root),self:{skipWaiting(){},clients:{claim(){}},addEventListener:(name,fn)=>listeners[name]=fn},caches:{open:async()=>({addAll:async urls=>{for(const url of urls)cached.set(absolute(url),await fetchLocal(url))},put:async(request,response)=>cached.set(absolute(request),response)}),match:async request=>cached.get(absolute(request))?.clone()}};
vm.runInNewContext(fs.readFileSync('public/sw.js','utf8'),context);
let installed;listeners.install({waitUntil:p=>installed=p});await installed;online=false;
async function request(path,mode){let response;listeners.fetch({request:{method:'GET',url:absolute(path),mode},respondWith:p=>response=p});const r=await response;assert.equal(r.status,200);return r}
const html=await(await request('/','navigate')).text();const assets=[...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(m=>m[1]);assert(assets.some(p=>p.endsWith('.js')));assert(assets.some(p=>p.endsWith('.css')));
for(const path of [...assets,'/manifest.webmanifest','/icon.svg','/fonts/Tajawal-Regular.ttf','/fonts/Tajawal-Medium.ttf','/fonts/Tajawal-Bold.ttf'])assert((await(await request(path)).arrayBuffer()).byteLength>0);
console.log('PASS: first-load cache serves app HTML, JavaScript, CSS, manifest, icon and Arabic fonts with network disabled');
