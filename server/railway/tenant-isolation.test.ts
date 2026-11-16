import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{createAuth,type Mail}from'./auth';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
const url=process.env.TEST_DATABASE_URL;
function totp(secret:string){const al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=al.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),ctr=Buffer.alloc(8);ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(ctr).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
test('tenant isolation matrix: another business is refused on every management endpoint and venue resource',{skip:!url},async()=>{
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
  let owner=await signup('owner@example.test');const A=await signup('a@example.test'),B=await signup('b@example.test'),staffA=await signup('staff@example.test'),stranger=await signup('stranger@example.test');
  const enabled=await json(await raw('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner));const secret=new URL(enabled.totpURI).searchParams.get('secret')!;owner=jar(await raw('/api/auth/two-factor/verify-totp','POST',{code:totp(secret),trustDevice:false},owner),owner);
  await status('unlock',req('/owner/unlock','POST',{code:totp(secret)},owner),200);
  const bizA=await json(await req('/owner/businesses','POST',{name:'Chain A',email:'a@example.test'},owner)),bizB=await json(await req('/owner/businesses','POST',{name:'Chain B',email:'b@example.test'},owner));
  const accept=async(invite:any,cookie:string)=>status('accept',req('/invitations/accept','POST',{token:new URL(invite.url).hash.slice(1)},cookie),200);await accept(bizA.invitation,A);await accept(bizB.invitation,B);
  const L1=(await json(await req('/businesses/'+bizA.id+'/locations','POST',{name:'iso-a',slug:'iso-a'},A))).id;await status('B location',req('/businesses/'+bizB.id+'/locations','POST',{name:'iso-b',slug:'iso-b'},B),201);
  const staffInvite=await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'staff@example.test',role:'staff'},A));await accept(staffInvite,staffA);
  const openInvite=await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'someone@example.test',role:'staff'},A));
  const png=await sharp({create:{width:9,height:9,channels:4,background:'#ff0000'}}).png().toBuffer();
  const asset=(await json(await app.request(c.origin+'/api/business/businesses/'+bizA.id+'/logo',{method:'POST',headers:{origin:c.origin,'content-type':'image/png',cookie:A},body:png}))).id;
  const prompt=(await json(await status('prompt',req('/locations/'+L1+'/prompts','POST',{gameId:'np-topics',locale:'en',difficulty:'Medium',text:'Describe the best family table.'},A),201))).id;
  const qr=(await json(await status('qr',req('/locations/'+L1+'/qr','POST',{kind:'table',label:'T1'},A),201))).id;
  const member=(await pool.query("SELECT id FROM business_memberships WHERE business_id=$1 AND role='staff'",[bizA.id])).rows[0].id;
  const draft={displayName:'x',welcomeEn:'x',welcomeAr:'x',primary:'#1a3a6b',background:'#fafafa',logoId:null,games:['np-topics']};
  const calls:Array<[string,string,string,any?]>=[
   ['GET','/businesses/'+bizA.id],['PATCH','/businesses/'+bizA.id,{name:'hijack'}],['POST','/businesses/'+bizA.id+'/locations',{name:'x',slug:'hijack'}],['GET','/businesses/'+bizA.id+'/staff'],['POST','/businesses/'+bizA.id+'/invitations',{email:'x@example.test',role:'owner'}],['GET','/businesses/'+bizA.id+'/audit'],
   ['GET','/businesses/'+bizA.id+'/defaults'],['PATCH','/businesses/'+bizA.id+'/defaults',{revision:0,defaults:{...draft}}],['POST','/businesses/'+bizA.id+'/defaults/review',{}],['GET','/businesses/'+bizA.id+'/report'],['POST','/businesses/'+bizA.id+'/logo'],
   ['GET','/assets/'+asset],['GET','/locations/'+L1],['PATCH','/locations/'+L1,{revision:0,name:'x',timezone:'Asia/Riyadh',rotationHour:6,sessionMinutes:120,draft}],['POST','/locations/'+L1+'/review',{}],['POST','/locations/'+L1+'/restore',{revision:0}],['GET','/locations/'+L1+'/preview'],
   ['GET','/locations/'+L1+'/prompts'],['POST','/locations/'+L1+'/prompts',{gameId:'np-topics',locale:'en',difficulty:'Easy',text:'Injected prompt text'}],['PATCH','/locations/'+L1+'/prompts/'+prompt,{gameId:'np-topics',locale:'en',difficulty:'Easy',text:'Injected prompt text'}],
   ['GET','/locations/'+L1+'/code'],['POST','/locations/'+L1+'/code/replace',{}],['POST','/locations/'+L1+'/sessions/revoke',{}],['GET','/locations/'+L1+'/report'],
   ['GET','/locations/'+L1+'/qr'],['POST','/locations/'+L1+'/qr',{kind:'table',label:'Hijack'}],['PATCH','/qr/'+qr,{status:'disabled'}],['POST','/qr/'+qr+'/regenerate',{}],
   ['PATCH','/staff/'+member,{role:'owner'}],['DELETE','/staff/'+member],['DELETE','/invitations/'+openInvite.id],
  ];
  for(const[method,path,data]of calls){const r=await req(path,method,data,B);assert.ok([403,404].includes(r.status),'B '+method+' '+path+' -> '+r.status+' '+await r.clone().text())}
  // an unrelated verified account with no membership is refused too, and owner-console endpoints are owner-only
  for(const[method,path,data]of calls){const r=await req(path,method,data,stranger);assert.ok([403,404].includes(r.status),'stranger '+method+' '+path+' -> '+r.status)}
  for(const path of['/owner/businesses','/owner/overview','/owner/customers','/owner/audit','/owner/reviews']){assert.equal((await req(path,'GET',undefined,B)).status,403,path)}
  await status('B cannot publish',req('/locations/'+L1+'/publish','POST',{revision:0},B),403);await status('B cannot approve prompts',req('/prompts/'+prompt,'PATCH',{status:'approved'},B),403);await status('B cannot publish defaults',req('/businesses/'+bizA.id+'/defaults/publish','POST',{revision:0},B),403);
  await status('B cannot use A invitation',req('/invitations/accept','POST',{token:new URL(openInvite.url).hash.slice(1)},B),404);
  // nothing was changed by the attempts, and A still has full access
  const a=await json(await req('/businesses/'+bizA.id,'GET',undefined,A));assert.equal(a.business.name,'Chain A');assert.equal(a.locations.length,1);assert.equal((await json(await req('/locations/'+L1+'/prompts','GET',undefined,A))).prompts.length,1);assert.equal((await json(await req('/locations/'+L1+'/qr','GET',undefined,A))).codes.length,1);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM business_memberships WHERE business_id=$1',[bizA.id])).rows[0].n,2);
  // guest-facing resources of an unpublished or other tenant never leak
  await status('unpublished venue is not public',raw('/api/venue/iso-a'),404);await status('nonsense slug',raw('/api/venue/nonexistent-slug'),404);
 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
