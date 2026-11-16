import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{createAuth,type Mail}from'./auth';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
const url=process.env.TEST_DATABASE_URL;
function totp(secret:string){const al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=al.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),ctr=Buffer.alloc(8);ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(ctr).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
test('permanent QR identities: opaque tokens, table labels, scan counts, disable, replace and tenant isolation',{skip:!url},async()=>{
 const master=new Pool({connectionString:url}),schema='perm_'+crypto.randomUUID().replaceAll('-','');await master.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString:url,options:'-c search_path='+schema,max:8});
 const c:RailwayConfig={origin:'http://paperclub.test',secret:'a-long-local-only-business-test-secret',databaseUrl:url!,smtpPort:465,production:false,ownerEmails:['owner@example.test','nomfa@example.test'],emailFrom:'t@example.test',resendKey:'x'};
 const mail:Mail[]=[];const auth=createAuth(pool,c,async m=>{mail.push(m)});const app=createApp(pool,c,auth);let ip=1;
 const req=(path:string,method='GET',data?:any,cookie='')=>app.request(c.origin+'/api/business'+path,{method,headers:{origin:c.origin,'content-type':'application/json','x-railway-client-ip':'192.0.2.'+ip,...(cookie?{cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});
 const raw=(path:string,method='GET',data?:any,cookie='')=>app.request(c.origin+path,{method,headers:{origin:c.origin,'content-type':'application/json','x-railway-client-ip':'192.0.2.'+ip,...(cookie?{cookie}:{})},body:data===undefined?undefined:JSON.stringify(data)});
 const jar=(r:Response,base='')=>{const m=new Map(base.split('; ').filter(Boolean).map(s=>s.split(/=(.*)/s).slice(0,2) as[string,string]));for(const v of r.headers.getSetCookie()){const[k,x]=v.split(';')[0].split(/=(.*)/s);if(x)m.set(k,x);else m.delete(k)}return[...m].map(([k,v])=>k+'='+v).join('; ')};
 const signup=async(e:string)=>{ip++;await raw('/api/auth/sign-up/email','POST',{name:e.split('@')[0],email:e,password:'business-test-password'});const l=mail.findLast(m=>m.to===e)!.text.match(/https?:\/\/\S+$/)![0];return jar(await app.request(l))};
 const status=async(label:string,p:Promise<Response>,expected:number|number[])=>{const r=await p;const want=([] as number[]).concat(expected);assert.ok(want.includes(r.status),label+': expected '+want+' got '+r.status+' '+await r.clone().text());return r};
 const json=async(r:Response)=>r.json();

 try{
  await migrate(pool,'db/postgres');await migrateAuth(pool,auth);
  let owner=await signup('owner@example.test');const A=await signup('a@example.test'),staff=await signup('staff@example.test'),smgr=await signup('smgr@example.test'),B=await signup('b@example.test');
  const enabled=await json(await raw('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner));const secret=new URL(enabled.totpURI).searchParams.get('secret')!;owner=jar(await raw('/api/auth/two-factor/verify-totp','POST',{code:totp(secret),trustDevice:false},owner),owner);
  await status('unlock',req('/owner/unlock','POST',{code:totp(secret)},owner),200);
  const bizA=await json(await req('/owner/businesses','POST',{name:'Chain A',email:'a@example.test'},owner)),bizB=await json(await req('/owner/businesses','POST',{name:'Chain B',email:'b@example.test'},owner));
  const accept=async(invite:any,cookie:string)=>status('accept',req('/invitations/accept','POST',{token:new URL(invite.url).hash.slice(1)},cookie),200);await accept(bizA.invitation,A);await accept(bizB.invitation,B);
  const loc=async(biz:string,slug:string,cookie:string)=>(await json(await status('location',req('/businesses/'+biz+'/locations','POST',{name:slug,slug},cookie),201))).id;
  const L1=await loc(bizA.id,'qr-one',A),L2=await loc(bizA.id,'qr-two',A),LB=await loc(bizB.id,'qr-b',B);
  await accept(await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'staff@example.test',role:'staff',locationId:L1},A)),staff);
  await accept(await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'smgr@example.test',role:'manager',locationId:L1},A)),smgr);
  for(const id of[L1,L2])await status('publish',req('/locations/'+id+'/publish','POST',{revision:0},owner),200);
  await status('publish B',req('/locations/'+LB+'/publish','POST',{revision:0},owner),200);
  // creation rules
  await status('invalid kind',req('/locations/'+L1+'/qr','POST',{kind:'room'},A),400);await status('table needs a label',req('/locations/'+L1+'/qr','POST',{kind:'table'},A),400);
  const venueQr=await json(await status('location qr',req('/locations/'+L1+'/qr','POST',{kind:'location'},A),201));assert.match(venueQr.token,/^[A-Za-z0-9_-]{22}$/);
  await status('only one location qr',req('/locations/'+L1+'/qr','POST',{kind:'location'},A),409);
  const t4=await json(await status('table 4',req('/locations/'+L1+'/qr','POST',{kind:'table',label:'Table 4'},A),201));await status('duplicate label',req('/locations/'+L1+'/qr','POST',{kind:'table',label:'table 4'},A),409);
  const t5=await json(await status('scoped manager makes a table',req('/locations/'+L1+'/qr','POST',{kind:'table',label:'Table 5'},smgr),201));
  await status('staff cannot create',req('/locations/'+L1+'/qr','POST',{kind:'table',label:'Table 6'},staff),403);await status('staff can list',req('/locations/'+L1+'/qr','GET',undefined,staff),200);
  await status('scoped manager cannot reach another location',req('/locations/'+L2+'/qr','POST',{kind:'table',label:'X'},smgr),404);await status('scoped manager cannot list another location',req('/locations/'+L2+'/qr','GET',undefined,smgr),404);
  const l2qr=await json(await req('/locations/'+L2+'/qr','POST',{kind:'table',label:'Table 4'},A).then(r=>{assert.equal(r.status,201);return r}));
  await status('other business cannot list',req('/locations/'+L1+'/qr','GET',undefined,B),404);await status('other business cannot patch',req('/qr/'+t4.id,'PATCH',{status:'disabled'},B),404);await status('other business cannot regenerate',req('/qr/'+t4.id+'/regenerate','POST',{},B),404);
  // scanning
  const scan=(token:string)=>app.request(c.origin+'/q/'+token,{redirect:'manual',headers:{'x-railway-client-ip':'192.0.2.'+(++ip)}});
  const hit=await scan(t4.token);assert.equal(hit.status,302);assert.equal(hit.headers.get('location'),'/venue/qr-one?q='+t4.token);assert.match(hit.headers.get('cache-control')||'',/no-store/);await scan(t4.token);await scan(venueQr.token);
  const listed=await json(await req('/locations/'+L1+'/qr','GET',undefined,A));assert.equal(listed.codes.find((x:any)=>x.id===t4.id).scans,2);assert.equal(listed.codes.find((x:any)=>x.id===venueQr.id).scans,1);assert.equal(listed.codes.length,3);
  assert.equal((await scan('AAAAAAAAAAAAAAAAAAAAAA')).status,404);assert.equal((await scan('short')).status,404);assert.equal((await scan(t4.token+'x')).status,404);
  // the venue page learns the table label only from a valid token for this very venue
  const page=async(slug:string,q:string)=>(await json(await raw('/api/venue/'+slug+(q?'?q='+q:'')))).table;
  assert.deepEqual(await page('qr-one',t4.token),{kind:'table',label:'Table 4'});assert.equal(await page('qr-one',l2qr.token),null,'a token from another location must not label this venue');assert.equal(await page('qr-one','garbage'),null);assert.equal(await page('qr-one',''),null);
  // disable / enable
  await status('disable',req('/qr/'+t4.id,'PATCH',{status:'disabled'},A),200);assert.equal((await scan(t4.token)).status,404);assert.equal(await page('qr-one',t4.token),null);
  await status('re-enable',req('/qr/'+t4.id,'PATCH',{status:'active'},A),200);assert.equal((await scan(t4.token)).status,302);
  await status('rename',req('/qr/'+t4.id,'PATCH',{label:'Window table'},A),200);assert.equal((await page('qr-one',t4.token)).label,'Window table');
  await status('invalid status',req('/qr/'+t4.id,'PATCH',{status:'replaced'},A),400);
  // regenerate retires the old token for good
  const fresh=await json(await status('regenerate',req('/qr/'+t5.id+'/regenerate','POST',{},A),201));assert.notEqual(fresh.token,t5.token);assert.equal((await scan(t5.token)).status,404);assert.equal((await scan(fresh.token)).status,302);
  await status('replaced code cannot be revived',req('/qr/'+t5.id,'PATCH',{status:'active'},A),409);await status('replaced code cannot be regenerated again',req('/qr/'+t5.id+'/regenerate','POST',{},A),409);
  assert.equal((await json(await req('/locations/'+L1+'/qr','GET',undefined,A))).codes.length,3,'replaced codes leave the active list');
  // tenant and lifecycle gates
  await status('suspend business',req('/businesses/'+bizA.id,'PATCH',{status:'suspended'},owner),200);assert.equal((await scan(fresh.token)).status,404);assert.equal((await scan(t4.token)).status,404);
  await status('inactive business cannot create QR',req('/locations/'+L1+'/qr','POST',{kind:'table',label:'Table 9'},A),403);
  await status('reactivate',req('/businesses/'+bizA.id,'PATCH',{status:'active'},owner),200);assert.equal((await scan(fresh.token)).status,302);
  const events=(await json(await req('/businesses/'+bizA.id+'/audit','GET',undefined,A))).events.map((e:any)=>e.action);for(const a of['qr.created','qr.updated','qr.regenerated'])assert.ok(events.includes(a),a);
  assert.ok(!JSON.stringify((await json(await req('/owner/audit','GET',undefined,owner))).events).includes(t4.token),'tokens are not written to the audit trail');
 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
