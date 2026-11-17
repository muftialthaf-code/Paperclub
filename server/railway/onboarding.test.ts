import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{createAuth,type Mail}from'./auth';import{paletteFromPixels,brand,blankBrand}from'./business/core';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
const url=process.env.TEST_DATABASE_URL;
function totp(secret:string){const al='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=al.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),ctr=Buffer.alloc(8);ctr.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(ctr).digest(),o=h[h.length-1]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1000000).padStart(6,'0')}
test('onboarding: logo colours, six-digit codes, sessions that last the whole code day, automatic venue QR, menu data and guess protection',{skip:!url},async()=>{
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
  // --- palette extraction is pure and always readable
  const solid=(r:number,g:number,b:number,n=400,extra:number[]=[])=>Uint8Array.from([...Array.from({length:n},()=>[r,g,b,255]).flat(),...extra]);
  const transparentWhite=Array.from({length:2000},()=>[255,255,255,0]).flat();
  for(const[name,rgba]of[['red',solid(192,57,43,300,transparentWhite)],['teal',solid(20,150,140,300,transparentWhite)],['yellow',solid(250,200,20,300,transparentWhite)],['pale pink',solid(255,200,210,300,transparentWhite)],['black on white',Uint8Array.from([...solid(10,10,10,300),...Array.from({length:900},()=>[255,255,255,255]).flat()])],['empty',Uint8Array.from(transparentWhite)]]as const){
   const p=paletteFromPixels(rgba);assert.doesNotThrow(()=>brand({...blankBrand('x'),primary:p.primary,background:p.background}),name+' must satisfy the server colour rules: '+JSON.stringify(p));
  }
  const red=paletteFromPixels(solid(192,57,43,300,transparentWhite));assert.ok(parseInt(red.primary.slice(1,3),16)>parseInt(red.primary.slice(5,7),16),'a red logo gives a reddish brand colour');
  const teal=paletteFromPixels(solid(20,150,140,300,transparentWhite));assert.ok(parseInt(teal.primary.slice(3,5),16)>parseInt(teal.primary.slice(1,3),16),'a teal logo gives a teal brand colour');
  const mostlyBlue=paletteFromPixels(Uint8Array.from([...solid(30,60,200,300),...solid(200,40,40,20),...Array.from({length:600},()=>[255,255,255,255]).flat()]));assert.ok(parseInt(mostlyBlue.primary.slice(5,7),16)>parseInt(mostlyBlue.primary.slice(1,3),16),'the dominant colour wins over a small accent');
  await migrate(pool,'db/postgres');await migrateAuth(pool,auth);
  let owner=await signup('owner@example.test');const A=await signup('a@example.test');
  const enabled=await json(await raw('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner));const secret=new URL(enabled.totpURI).searchParams.get('secret')!;owner=jar(await raw('/api/auth/two-factor/verify-totp','POST',{code:totp(secret),trustDevice:false},owner),owner);
  await status('unlock',req('/owner/unlock','POST',{code:totp(secret)},owner),200);
  const bizA=await json(await req('/owner/businesses','POST',{name:'Cafe',email:'a@example.test'},owner));await status('accept',req('/invitations/accept','POST',{token:new URL(bizA.invitation.url).hash.slice(1)},A),200);
  const L1=(await json(await req('/businesses/'+bizA.id+'/locations','POST',{name:'Olaya',slug:'onboard-one'},A))).id;
  // --- the logo upload answers with a palette taken from the image
  const logo=await sharp({create:{width:120,height:120,channels:4,background:{r:192,g:57,b:43,alpha:1}}}).png().toBuffer();
  const uploaded=await json(await app.request(c.origin+'/api/business/businesses/'+bizA.id+'/logo?locationId='+L1,{method:'POST',headers:{origin:c.origin,'content-type':'image/png',cookie:A},body:logo}).then(r=>{assert.equal(r.status,201);return r}));
  assert.match(uploaded.palette.primary,/^#[0-9a-f]{6}$/);assert.match(uploaded.palette.background,/^#[0-9a-f]{6}$/);assert.doesNotThrow(()=>brand({...blankBrand('x'),...uploaded.palette}));assert.ok(parseInt(uploaded.palette.primary.slice(1,3),16)>parseInt(uploaded.palette.primary.slice(5,7),16),'palette follows the logo colour');
  // --- every location starts with exactly one QR
  const qrs=(await json(await req('/locations/'+L1+'/qr','GET',undefined,A))).codes;assert.equal(qrs.length,1);assert.equal(qrs[0].kind,'location');
  // --- menu validation, publication and guest payload
  const detail=async()=>(await json(await req('/businesses/'+bizA.id,'GET',undefined,A))).locations.find((l:any)=>l.id===L1);
  const save=async(menu:any)=>{const l=await detail();return req('/locations/'+L1,'PATCH',{revision:l.revision,name:l.name,timezone:l.timezone,rotationHour:l.rotationHour,sessionMinutes:l.sessionMinutes,draft:{...l.draft,logoId:uploaded.id,...uploaded.palette,menu},inherit:{}},A)};
  for(const[label,menu]of[['unknown kind',[{kind:'snack',en:'Chips',ar:''}]],['no names',[{kind:'food',en:'',ar:''}]],['too long',[{kind:'food',en:'x'.repeat(41),ar:''}]],['not a list',{kind:'food'}],['too many',Array.from({length:61},(_,i)=>({kind:'food',en:'Item '+i,ar:''}))]]as any)await status('menu '+label,save(menu),400);
  await status('valid menu with duplicates',save([{kind:'drink',en:'Karak tea',ar:'شاي كرك'},{kind:'drink',en:'karak tea',ar:'شاي كرك'},{kind:'food',en:'Club sandwich',ar:''},{kind:'dessert',en:'',ar:'كنافة'}]),200);
  assert.equal((await detail()).draft.menu.length,3,'duplicates are removed');
  await status('publish',req('/locations/'+L1+'/publish','POST',{revision:(await detail()).revision},owner),200);
  const venue=(await json(await raw('/api/venue/onboard-one'))).venue;assert.equal(venue.brand.menu.length,3);assert.equal(venue.brand.logoId,uploaded.id);assert.equal(venue.brand.primary,uploaded.palette.primary);
  // --- six-digit codes; a session lasts the whole code window
  const daily=await json(await req('/locations/'+L1+'/code','GET',undefined,A));assert.match(daily.code,/^\d{6}$/);
  const entry=await raw('/api/venue/onboard-one/entry','POST',{code:daily.code.slice(0,3)+' '+daily.code.slice(3)});await status('code with a space is accepted',Promise.resolve(entry),200);
  const maxAge=Number(/Max-Age=(\d+)/.exec(entry.headers.get('set-cookie')||'')?.[1]);const untilWindowEnd=(Date.parse(daily.expiresAt)-Date.now())/1000;assert.ok(Math.abs(maxAge-untilWindowEnd)<5,'the cookie lasts until the code window ends: '+maxAge+' vs '+untilWindowEnd);
  const body=await entry.json();assert.equal(Date.parse(body.session.expiresAt),Date.parse(daily.expiresAt));const guest=jar(entry);
  for(const bad of['12345','1234567','abcdef','12 34 5x'])assert.equal((await raw('/api/venue/onboard-one/entry','POST',{code:bad})).status,400,bad);
  // --- an older eight-character code still on file is re-issued as digits the first time the dashboard reads it
  await pool.query("UPDATE venue_daily_codes SET ciphertext=$1 WHERE location_id=$2",[(await import('./business/core')).encrypt('ABCD2345',c.secret),L1]);
  const reissued=await json(await req('/locations/'+L1+'/code','GET',undefined,A));assert.match(reissued.code,/^\d{6}$/);
  // --- sustained guessing replaces the code automatically; existing sessions stay
  const before=reissued.code;let failures=0;for(let i=0;i<320;i++){if(i%15===0)ip++;const r=await raw('/api/venue/onboard-one/entry','POST',{code:String(100000+((i*7919)%899999)).slice(0,6)});if(r.status===400)failures++;else if(r.status!==429)assert.fail('unexpected '+r.status)}
  assert.ok(failures>=300,'guesses were recorded: '+failures);
  const after=await json(await req('/locations/'+L1+'/code','GET',undefined,A));assert.notEqual(after.code,before,'the daily code is replaced automatically after sustained guessing');
  assert.equal((await raw('/api/venue/onboard-one/session','GET',undefined,guest)).status,200,'existing sessions keep playing');
  const events=(await json(await req('/businesses/'+bizA.id+'/audit','GET',undefined,A))).events.map((e:any)=>e.action);assert.ok(events.includes('code.auto_replaced'));
 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
