import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{createAuth,type Mail}from'./auth';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
const url=process.env.TEST_DATABASE_URL;
function totp(secret:string){const al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=al.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),ctr=Buffer.alloc(8);ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(ctr).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
test('consolidated branch report: per-branch and total counts, scope limits and tenant isolation',{skip:!url},async()=>{
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
  const L1=await loc(bizA.id,'rep-one',A),L2=await loc(bizA.id,'rep-two',A),LB=await loc(bizB.id,'rep-b',B);
  await accept(await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'staff@example.test',role:'staff'},A)),staff);
  await accept(await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'smgr@example.test',role:'manager',locationId:L1},A)),smgr);
  for(const id of[L1,L2,LB])await status('publish',req('/locations/'+id+'/publish','POST',{revision:0},owner),200);
  const guestAt=async(slug:string,locationId:string,cookie:string)=>{const code=(await json(await req('/locations/'+locationId+'/code','GET',undefined,cookie))).code;const e=await app.request(c.origin+'/api/venue/'+slug+'/entry',{method:'POST',headers:{origin:c.origin,'content-type':'application/json','x-railway-client-ip':'192.0.2.'+(++ip)},body:JSON.stringify({code})});assert.equal(e.status,200);return jar(e)};
  const g1=await guestAt('rep-one',L1,A),g1b=await guestAt('rep-one',L1,A),g2=await guestAt('rep-two',L2,A),gB=await guestAt('rep-b',LB,B);
  const run=async(slug:string,guest:string,gameId:string,done:boolean)=>{const id=crypto.randomUUID();await status('run',raw('/api/venue/'+slug+'/runs','POST',{id,gameId},guest),201);if(done)await status('complete',raw('/api/venue/'+slug+'/runs/'+id+'/complete','POST',{},guest),200)};
  await run('rep-one',g1,'np-topics',true);await run('rep-one',g1b,'np-topics',false);await run('rep-one',g1,'np-yesno',true);await run('rep-two',g2,'np-topics',true);await run('rep-b',gB,'np-topics',true);
  const qr=await json(await req('/locations/'+L1+'/qr','POST',{kind:'table',label:'T1'},A));for(let i=0;i<3;i++)assert.equal((await app.request(c.origin+'/q/'+qr.token,{redirect:'manual',headers:{'x-railway-client-ip':'192.0.2.'+(++ip)}})).status,302);
  const report=await json(await status('chain report',req('/businesses/'+bizA.id+'/report?days=30','GET',undefined,A),200));
  const one=report.locations.find((r:any)=>r.id===L1),two=report.locations.find((r:any)=>r.id===L2);
  assert.equal(report.locations.length,2);assert.deepEqual([one.sessions,one.starts,one.completions,one.qrScans],[2,3,2,3]);assert.deepEqual([two.sessions,two.starts,two.completions,two.qrScans],[1,1,1,0]);
  assert.deepEqual([report.totals.sessions,report.totals.starts,report.totals.completions,report.totals.qrScans],[3,4,3,3]);assert.ok(report.totals.pageVisits>=0);
  assert.deepEqual(report.games.map((g:any)=>[g.gameId,g.starts,g.completions]),[['np-topics',3,2],['np-yesno',1,1]]);
  assert.ok(!report.locations.some((r:any)=>r.id===LB),'another business is never included');
  assert.ok(!JSON.stringify(report).includes(qr.token),'report carries no QR tokens or codes');
  await status('unscoped staff can read the consolidated report',req('/businesses/'+bizA.id+'/report','GET',undefined,staff),200);
  await status('scoped manager cannot read chain-wide counts',req('/businesses/'+bizA.id+'/report','GET',undefined,smgr),403);
  await status('other business is refused',req('/businesses/'+bizA.id+'/report','GET',undefined,B),404);await status('anonymous is refused',req('/businesses/'+bizA.id+'/report','GET'),401);
  await status('invalid period',req('/businesses/'+bizA.id+'/report?days=5','GET',undefined,A),400);
  const bReport=await json(await req('/businesses/'+bizB.id+'/report','GET',undefined,B));assert.deepEqual([bReport.totals.sessions,bReport.totals.starts],[1,1]);
 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
