import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{createAuth,type Mail}from'./auth';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
const url=process.env.TEST_DATABASE_URL;
function totp(secret:string){const al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=al.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),ctr=Buffer.alloc(8);ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(ctr).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
test('business permission boundaries: scoping, cross-business isolation, MFA locks, inactive businesses and unreviewed public text',{skip:!url},async()=>{
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
  let owner=await signup('owner@example.test');const nomfa=await signup('nomfa@example.test'),A=await signup('a@example.test'),mgr=await signup('mgr@example.test'),smgr=await signup('smgr@example.test'),B=await signup('b@example.test');
  const enabled=await json(await raw('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner));const secret=new URL(enabled.totpURI).searchParams.get('secret')!;owner=jar(await raw('/api/auth/two-factor/verify-totp','POST',{code:totp(secret),trustDevice:false},owner),owner);
  const unlock=()=>status('unlock',req('/owner/unlock','POST',{code:totp(secret)},owner),200);await unlock();
  const bizA=await json(await req('/owner/businesses','POST',{name:'A',email:'a@example.test'},owner)),bizB=await json(await req('/owner/businesses','POST',{name:'B',email:'b@example.test'},owner));
  const accept=async(invite:any,cookie:string)=>status('accept',req('/invitations/accept','POST',{token:new URL(invite.url).hash.slice(1)},cookie),200);
  await accept(bizA.invitation,A);await accept(bizB.invitation,B);
  const loc=async(biz:string,slug:string,cookie:string)=>(await json(await status('location',req('/businesses/'+biz+'/locations','POST',{name:slug,slug},cookie),201))).id;
  const L1=await loc(bizA.id,'loc-one',A),L2=await loc(bizA.id,'loc-two',A),LB=await loc(bizB.id,'loc-b',B);
  const invite=async(email:string,role:string,locationId:string|null)=>json(await status('invite',req('/businesses/'+bizA.id+'/invitations','POST',{email,role,locationId},A),201));
  await accept(await invite('mgr@example.test','manager',null),mgr);await accept(await invite('smgr@example.test','manager',L1),smgr);
  const detail=async()=>(await json(await req('/businesses/'+bizA.id,'GET',undefined,A))).locations;
  const draft=(await detail()).find((l:any)=>l.id===L1).draft;
  const png=await sharp({create:{width:9,height:9,channels:4,background:'#ff0000'}}).png().toBuffer();
  const upload=(biz:string,cookie:string,q='')=>app.request(c.origin+'/api/business/businesses/'+biz+'/logo'+q,{method:'POST',headers:{origin:c.origin,'content-type':'image/png',cookie},body:png});
  const logoB=(await json(await upload(bizB.id,B))).id;

  // Location-scoped manager: sibling and business-wide operations are refused.
  for(const[m,p,d,want]of[['GET','/locations/'+L2+'/code',undefined,404],['GET','/locations/'+L2+'/report',undefined,404],['GET','/locations/'+L2+'/prompts',undefined,404],['GET','/locations/'+L2+'/preview',undefined,404],['POST','/locations/'+L2+'/code/replace',{},404],['POST','/locations/'+L2+'/sessions/revoke',{},404],['POST','/locations/'+L2+'/review',{},404],['PATCH','/locations/'+L2,{name:'x',draft,revision:0},404],['POST','/locations/'+L2+'/prompts',{gameId:'np-topics',locale:'en',difficulty:'Easy',text:'hello there'},404],['GET','/businesses/'+bizA.id+'/audit',undefined,403],['GET','/businesses/'+bizA.id+'/staff',undefined,403],['POST','/businesses/'+bizA.id+'/invitations',{email:'z@example.test',role:'staff'},403],['POST','/businesses/'+bizA.id+'/locations',{name:'n',slug:'new-branch'},403],['PATCH','/businesses/'+bizA.id,{name:'hijack'},403],['GET','/businesses/'+bizB.id,undefined,404],['GET','/locations/'+LB+'/code',undefined,404],['PATCH','/locations/'+LB,{name:'x',draft,revision:0},404]]as any)await status('scoped manager '+m+' '+p,req(p,m,d,smgr),want);
  await status('scoped logo without location',upload(bizA.id,smgr),403);await status('scoped logo for sibling',upload(bizA.id,smgr,'?locationId='+L2),404);await status('scoped logo for own location',upload(bizA.id,smgr,'?locationId='+L1),201);
  const rv=(await detail()).find((l:any)=>l.id===L1).revision;
  const logoL2=(await json(await upload(bizA.id,A,'?locationId='+L2))).id,logoL1=(await json(await upload(bizA.id,A,'?locationId='+L1))).id,logoShared=(await json(await upload(bizA.id,A))).id;
  await status('scoped manager reads sibling-location logo',req('/assets/'+logoL2,'GET',undefined,smgr),404);await status('scoped manager reads own-location logo',req('/assets/'+logoL1,'GET',undefined,smgr),200);await status('scoped manager reads business-wide logo',req('/assets/'+logoShared,'GET',undefined,smgr),200);
  await status('scoped manager uses sibling-location logo',req('/locations/'+L1,'PATCH',{name:'x',draft:{...draft,logoId:logoL2},revision:rv},smgr),400);await status('owner cannot attach sibling logo either',req('/locations/'+L1,'PATCH',{name:'x',draft:{...draft,logoId:logoL2},revision:rv},A),400);
  await status('logo for a location of another business',upload(bizA.id,A,'?locationId='+LB),404);
  await status('foreign-business logo in draft',req('/locations/'+L1,'PATCH',{name:'x',draft:{...draft,logoId:logoB},revision:rv},smgr),400);await status('foreign-business logo read',req('/assets/'+logoB,'GET',undefined,smgr),404);

  // Unscoped manager cannot administer the business or the platform.
  for(const[m,p,d,want]of[['GET','/businesses/'+bizA.id+'/staff',undefined,403],['POST','/businesses/'+bizA.id+'/invitations',{email:'z@example.test',role:'staff'},403],['PATCH','/businesses/'+bizA.id,{status:'suspended'},403],['PATCH','/businesses/'+bizA.id,{name:'x'},403],['PATCH','/prompts/x',{status:'approved'},403],['POST','/locations/'+L1+'/publish',{revision:0},403],['PATCH','/locations/'+L1,{name:'x',draft,revision:rv,status:'active'},403],['GET','/owner/overview',undefined,403],['GET','/owner/audit',undefined,403],['PATCH','/owner/customers/x',{suspended:true},403],['GET','/businesses/'+bizB.id,undefined,404],['POST','/businesses/'+bizB.id+'/locations',{name:'n',slug:'inject-b'},404]]as any)await status('manager '+m+' '+p,req(p,m,d,mgr),want);

  // Invitations and cross-business administration.
  await status('invite into another business location',req('/businesses/'+bizA.id+'/invitations','POST',{email:'q@example.test',role:'staff',locationId:LB},A),404);
  const staffRow=(await pool.query("SELECT id FROM business_memberships WHERE business_id=$1 AND role='manager' LIMIT 1",[bizA.id])).rows[0].id;
  await status('foreign owner edits staff',req('/staff/'+staffRow,'PATCH',{role:'owner'},B),404);await status('foreign owner removes staff',req('/staff/'+staffRow,'DELETE',undefined,B),404);

  // Platform owner and MFA locks.
  await status('allowlisted owner without MFA',req('/owner/businesses','GET',undefined,nomfa),403);
  await status('second sign-in pending authenticator',req('/owner/businesses','GET',undefined,jar(await raw('/api/auth/sign-in/email','POST',{email:'owner@example.test',password:'business-test-password'}))),[401,403]);
  await pool.query('DELETE FROM business_admin_stepup');const before=(await pool.query('SELECT secret FROM "twoFactor"')).rows[0].secret;
  for(const p of['disable','get-totp-uri','generate-backup-codes'])await status('locked '+p,raw('/api/auth/two-factor/'+p,'POST',{password:'business-test-password'},owner),403);
  await status('re-enroll refused',raw('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner),400);assert.equal((await pool.query('SELECT secret FROM "twoFactor"')).rows[0].secret,before);
  await status('owner console locked after unlock removed',req('/owner/businesses','GET',undefined,owner),403);await unlock();

  // GAP 1: pending, suspended and expired businesses cannot change anything; reads still show status.
  const pending=(await json(await status('request business',req('/requests','POST',{name:'Pending'},mgr),201))).id;
  await status('pending business cannot create locations',req('/businesses/'+pending+'/locations','POST',{name:'p',slug:'pending-loc'},mgr),403);
  await status('pending business can still be read',req('/businesses/'+pending,'GET',undefined,mgr),200);
  const writes:Array<[string,string,any]>=[['POST','/businesses/'+bizA.id+'/locations',{name:'s',slug:'suspended-loc'}],['POST','/businesses/'+bizA.id+'/invitations',{email:'w@example.test',role:'staff'}],['POST','/locations/'+L1+'/code/replace',{}],['POST','/locations/'+L1+'/sessions/revoke',{}],['POST','/locations/'+L1+'/review',{}],['POST','/locations/'+L1+'/prompts',{gameId:'np-topics',locale:'en',difficulty:'Easy',text:'suspended text'}],['PATCH','/businesses/'+bizA.id,{name:'renamed'}]];
  const blocked=async()=>{for(const[m,p,d]of writes){const r=await status('inactive '+m+' '+p,req(p,m,d,A),403);assert.equal((await r.json()).error,'business_inactive')}await status('inactive logo',upload(bizA.id,A),403);await status('inactive business read',req('/businesses/'+bizA.id,'GET',undefined,A),200);await status('inactive staff list read',req('/businesses/'+bizA.id+'/staff','GET',undefined,A),200);await status('inactive audit read',req('/businesses/'+bizA.id+'/audit','GET',undefined,A),200)};
  await status('suspend',req('/businesses/'+bizA.id,'PATCH',{status:'suspended'},owner),200);await blocked();
  await status('platform owner can still manage suspended business',req('/businesses/'+bizA.id+'/invitations','POST',{email:'ok@example.test',role:'staff'},owner),201);
  await status('reactivate expired',req('/businesses/'+bizA.id,'PATCH',{status:'active',accessUntil:new Date(Date.now()-60000).toISOString()},owner),200);await blocked();
  await status('reactivate',req('/businesses/'+bizA.id,'PATCH',{status:'active',accessUntil:null},owner),200);
  await status('active business writes again',req('/locations/'+L1+'/sessions/revoke','POST',{},A),200);

  // GAP 2: location name edits are not guest-visible until the owner publishes.
  await status('review',req('/locations/'+L1+'/review','POST',{},A),200);let l1=(await detail()).find((l:any)=>l.id===L1);
  await status('publish',req('/locations/'+L1+'/publish','POST',{revision:l1.revision},owner),200);
  const publicName=async()=>(await json(await raw('/api/venue/loc-one'))).venue.name;const published=await publicName();assert.equal(published,l1.draft.displayName);
  l1=(await detail()).find((l:any)=>l.id===L1);
  await status('rename location',req('/locations/'+L1,'PATCH',{name:'UNREVIEWED LIVE TEXT',draft:l1.draft,timezone:l1.timezone,rotationHour:l1.rotationHour,sessionMinutes:l1.sessionMinutes,revision:l1.revision},A),200);
  assert.equal(await publicName(),published,'a manager rename must not reach guests before owner publication');
  l1=(await detail()).find((l:any)=>l.id===L1);assert.equal(l1.name,'UNREVIEWED LIVE TEXT');
  await status('draft display name change',req('/locations/'+L1,'PATCH',{name:l1.name,draft:{...l1.draft,displayName:'Reviewed New Name'},timezone:l1.timezone,rotationHour:l1.rotationHour,sessionMinutes:l1.sessionMinutes,revision:l1.revision},A),200);
  assert.equal(await publicName(),published);l1=(await detail()).find((l:any)=>l.id===L1);
  await status('publish new name',req('/locations/'+L1+'/publish','POST',{revision:l1.revision},owner),200);assert.equal(await publicName(),'Reviewed New Name');
 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
