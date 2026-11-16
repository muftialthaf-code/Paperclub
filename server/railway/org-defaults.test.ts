import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{createAuth,type Mail}from'./auth';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
const url=process.env.TEST_DATABASE_URL;
function totp(secret:string){const al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=al.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),ctr=Buffer.alloc(8);ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(ctr).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
test('organisation defaults: branches inherit published organisation branding, layout and games field by field, without crossing branches or businesses',{skip:!url},async()=>{
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
  let owner=await signup('owner@example.test');const nomfa=await signup('nomfa@example.test'),A=await signup('a@example.test'),smgr=await signup('smgr@example.test'),B=await signup('b@example.test');void nomfa;
  const enabled=await json(await raw('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner));const secret=new URL(enabled.totpURI).searchParams.get('secret')!;owner=jar(await raw('/api/auth/two-factor/verify-totp','POST',{code:totp(secret),trustDevice:false},owner),owner);
  await status('unlock',req('/owner/unlock','POST',{code:totp(secret)},owner),200);
  const bizA=await json(await req('/owner/businesses','POST',{name:'Chain A',email:'a@example.test'},owner)),bizB=await json(await req('/owner/businesses','POST',{name:'Chain B',email:'b@example.test'},owner));
  const accept=async(invite:any,cookie:string)=>status('accept',req('/invitations/accept','POST',{token:new URL(invite.url).hash.slice(1)},cookie),200);await accept(bizA.invitation,A);await accept(bizB.invitation,B);
  const loc=async(biz:string,slug:string,cookie:string)=>(await json(await status('location',req('/businesses/'+biz+'/locations','POST',{name:slug,slug},cookie),201))).id;
  const L1=await loc(bizA.id,'chain-a-one',A),L2=await loc(bizA.id,'chain-a-two',A),LB=await loc(bizB.id,'chain-b-one',B);
  const si=await json(await req('/businesses/'+bizA.id+'/invitations','POST',{email:'smgr@example.test',role:'manager',locationId:L1},A));await accept(si,smgr);
  const png=await sharp({create:{width:9,height:9,channels:4,background:'#ff0000'}}).png().toBuffer();
  const upload=(biz:string,cookie:string,q='')=>app.request(c.origin+'/api/business/businesses/'+biz+'/logo'+q,{method:'POST',headers:{origin:c.origin,'content-type':'image/png',cookie},body:png});
  const sharedLogo=(await json(await upload(bizA.id,A))).id,branchLogo=(await json(await upload(bizA.id,A,'?locationId='+L1))).id;
  const detail=async()=>(await json(await req('/businesses/'+bizA.id,'GET',undefined,A))).locations;
  const findLoc=async(id:string)=>(await detail()).find((l:any)=>l.id===id);
  const saveLocation=async(id:string,draftPatch:any,inherit:any,cookie=A)=>{const l=await findLoc(id);return req('/locations/'+id,'PATCH',{revision:l.revision,name:l.name,timezone:l.timezone,rotationHour:l.rotationHour,sessionMinutes:l.sessionMinutes,draft:{...l.draft,...draftPatch},inherit},cookie)};
  const publishLocation=async(id:string)=>{const l=await findLoc(id);await status('publish location',req('/locations/'+id+'/publish','POST',{revision:l.revision},owner),200)};
  const defaultsRevision=async()=>(await json(await req('/businesses/'+bizA.id+'/defaults','GET',undefined,A))).revision;
  const good={primary:'#1a3a6b',background:'#fafafa',welcomeEn:'Welcome to the chain',welcomeAr:'حيّاكم عندنا',logoId:sharedLogo,games:['np-topics','speed','invent'],featured:'speed',categories:[{id:'quick',en:'Quick play',ar:'لعب سريع',games:['np-topics','invent']}],promo:{en:'Happy hour 4–6pm',ar:'ساعة سعيدة'}};
  // --- defaults validation and permissions
  for(const[label,patch]of[['featured not enabled',{featured:'battle'}],['category game not enabled',{categories:[{id:'x',en:'X',ar:'س',games:['battle']}]}],['branch-only logo',{logoId:branchLogo}],['bad colour contrast',{primary:'#eeeeee'}],['too many categories',{categories:Array.from({length:9},(_,i)=>({id:'c'+i,en:'C',ar:'ج',games:['speed']}))}]]as any)await status('defaults '+label,req('/businesses/'+bizA.id+'/defaults','PATCH',{revision:0,defaults:{...good,...patch}},A),400);
  await status('scoped manager cannot edit defaults',req('/businesses/'+bizA.id+'/defaults','PATCH',{revision:0,defaults:good},smgr),403);
  await status('other business cannot read defaults',req('/businesses/'+bizA.id+'/defaults','GET',undefined,B),404);await status('other business cannot edit defaults',req('/businesses/'+bizA.id+'/defaults','PATCH',{revision:0,defaults:good},B),404);
  await status('owner saves defaults',req('/businesses/'+bizA.id+'/defaults','PATCH',{revision:0,defaults:good},A),200);
  await status('stale defaults revision',req('/businesses/'+bizA.id+'/defaults','PATCH',{revision:0,defaults:good},A),409);
  const asScoped=await json(await req('/businesses/'+bizA.id+'/defaults','GET',undefined,smgr));assert.equal(asScoped.draft,null);assert.equal(asScoped.editable,false);
  await status('owner requests review',req('/businesses/'+bizA.id+'/defaults/review','POST',{},A),200);
  assert.ok((await json(await req('/owner/reviews','GET',undefined,owner))).defaults.some((d:any)=>d.id===bizA.id));
  await status('vendor cannot publish defaults',req('/businesses/'+bizA.id+'/defaults/publish','POST',{revision:1},A),403);
  await status('stale publish',req('/businesses/'+bizA.id+'/defaults/publish','POST',{revision:0},owner),409);
  await status('platform publishes defaults',req('/businesses/'+bizA.id+'/defaults/publish','POST',{revision:1},owner),200);
  // --- inheritance: L1 inherits everything shareable, L2 inherits nothing
  await status('invalid inherit key',saveLocation(L1,{},{displayName:true}),400);
  await status('L1 inherits',saveLocation(L1,{displayName:'Chain A One',primary:'#222222',games:['np-scenario']},{primary:true,background:true,welcomeEn:true,welcomeAr:true,logoId:true,games:true,featured:true,categories:true,promo:true}),200);await publishLocation(L1);
  await status('L2 keeps its own brand',saveLocation(L2,{displayName:'Chain A Two',primary:'#333333',games:['np-scenario','battle']},{}),200);await publishLocation(L2);
  const view=async(slug:string)=>(await json(await raw('/api/venue/'+slug))).venue;
  let v1=await view('chain-a-one');assert.equal(v1.name,'Chain A One');assert.equal(v1.brand.primary,'#1a3a6b');assert.deepEqual(v1.brand.games,good.games);assert.equal(v1.brand.featured,'speed');assert.equal(v1.brand.categories[0].en,'Quick play');assert.equal(v1.brand.promo.en,good.promo.en);assert.equal(v1.brand.logoId,sharedLogo);
  const v2=await view('chain-a-two');assert.equal(v2.brand.primary,'#333333');assert.deepEqual(v2.brand.games,['np-scenario','battle']);assert.equal(v2.brand.promo,null);assert.equal(v2.brand.featured,null);
  await status('inherited shared logo is served',raw('/api/venue/chain-a-one/logo/'+sharedLogo),200);await status('branch-only logo is not served for another location',raw('/api/venue/chain-a-two/logo/'+branchLogo),404);
  // --- guest session honours inherited games
  const code=(await json(await req('/locations/'+L1+'/code','GET',undefined,A))).code;const entry=await raw('/api/venue/chain-a-one/entry','POST',{code});await status('entry',Promise.resolve(entry),200);const guest=jar(entry);
  await status('inherited game allowed',raw('/api/venue/chain-a-one/runs','POST',{id:crypto.randomUUID(),gameId:'speed'},guest),201);await status('non-inherited game refused',raw('/api/venue/chain-a-one/runs','POST',{id:crypto.randomUUID(),gameId:'np-scenario'},guest),403);
  // --- draft edits are private until published; publishing reaches inheriting branches immediately
  const rev=await defaultsRevision();await status('draft defaults',req('/businesses/'+bizA.id+'/defaults','PATCH',{revision:rev,defaults:{...good,primary:'#5a1a6b',games:['np-topics','speed'],featured:'speed',categories:[]}},A),200);
  assert.equal((await view('chain-a-one')).brand.primary,'#1a3a6b');
  const preview=await json(await req('/locations/'+L1+'/preview','GET',undefined,A));assert.equal(preview.venue.brand.primary,'#5a1a6b');
  await status('publish new defaults',req('/businesses/'+bizA.id+'/defaults/publish','POST',{revision:await defaultsRevision()},owner),200);
  v1=await view('chain-a-one');assert.equal(v1.brand.primary,'#5a1a6b');assert.deepEqual(v1.brand.games,['np-topics','speed']);assert.deepEqual(v1.brand.categories,[]);
  assert.equal((await view('chain-a-two')).brand.primary,'#333333');
  // --- the other business is untouched
  await status('vendor cannot edit another business location',req('/locations/'+LB,'PATCH',{revision:0,name:'x',timezone:'Asia/Riyadh',rotationHour:6,sessionMinutes:120,draft:good,inherit:{primary:true}},A),404);
  await status('other business cannot save inheritance on our location',req('/locations/'+L1,'PATCH',{revision:0,name:'x',timezone:'Asia/Riyadh',rotationHour:6,sessionMinutes:120,draft:good,inherit:{primary:true}},B),404);
 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
