import test from'node:test';import assert from'node:assert/strict';import{Pool}from'pg';import{createHmac}from'node:crypto';import sharp from'sharp';
import{maintain}from'./maintenance';
import{createAuth,type Mail}from'./auth';import{createApp}from'./app';import{migrate,migrateAuth}from'./migrate';import type{RailwayConfig}from'./config';
import{blankBrand,brand,rotationAnchor,codeWindow,encrypt,decrypt}from'./business/core';
const url=process.env.TEST_DATABASE_URL;
test('venue code windows last exactly 24 hours, encryption and accessible brand validation',()=>{const before=Date.parse('2026-11-16T02:59:59Z'),after=Date.parse('2026-11-16T03:00:00Z'),anchor=rotationAnchor(after,'Asia/Riyadh',6);const first=codeWindow(before,anchor),next=codeWindow(after,anchor);assert.equal(first.end-first.start,86400000);assert.equal(next.start,first.end);assert.equal(next.start,after);assert.equal(decrypt(encrypt('ABCD2345','a'.repeat(40)),'a'.repeat(40)),'ABCD2345');assert.throws(()=>decrypt(encrypt('ABCD2345','a'.repeat(40)),'b'.repeat(40)));assert.equal(brand(blankBrand('Cafe')).games.length,13);assert.throws(()=>brand({...blankBrand('Cafe'),primary:'#eeeeee',background:'#ffffff'}));assert.throws(()=>brand({...blankBrand('Cafe'),games:['fake-game']}))});
function totp(secret:string){const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';let bits='';for(const c of secret.replace(/=+$/,''))bits+=alphabet.indexOf(c.toUpperCase()).toString(2).padStart(5,'0');const bytes=Buffer.from(bits.match(/.{8}/g)!.map(v=>parseInt(v,2))),counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));const h=createHmac('sha1',bytes).update(counter).digest(),offset=h[h.length-1]&15;return String((h.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0')}
test('PostgreSQL business acceptance: real MFA, isolation, approvals, exact code rotation, guest expiry and reports',{skip:!url},async()=>{
 const master=new Pool({connectionString:url}),schema='biz_'+crypto.randomUUID().replaceAll('-','');await master.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString:url,options:'-c search_path='+schema,max:8});
 const c:RailwayConfig={origin:'http://paperclub.test',secret:'a-long-local-only-business-test-secret',databaseUrl:url!,smtpPort:465,production:false,ownerEmails:['owner@example.test'],emailFrom:'test@example.test',resendKey:'injected-only'};
 const mail:Mail[]=[];const auth=createAuth(pool,c,async m=>{mail.push(m)});let now=Date.now();const app=createApp(pool,c,auth,{now:()=>now});let ip=1;
 function req(path:string,method='GET',data?:any,cookie='',other:Record<string,string>={}){return app.request(c.origin+path,{method,headers:{origin:c.origin,'content-type':'application/json','x-railway-client-ip':'192.0.2.'+ip,...(cookie?{cookie}:{}),...other},body:data===undefined?undefined:JSON.stringify(data)})}
 function cookies(r:Response,base=''){const jar=new Map(base.split('; ').filter(Boolean).map(s=>s.split(/=(.*)/s).slice(0,2) as[string,string]));for(const value of r.headers.getSetCookie()){const[k,v]=value.split(';')[0].split(/=(.*)/s);if(v)jar.set(k,v);else jar.delete(k)}return[...jar].map(([k,v])=>k+'='+v).join('; ')}
 async function ok(r:Response,status=200){assert.equal(r.status,status,await r.clone().text());return r.json()}
 async function signup(email:string){ip++;await ok(await req('/api/auth/sign-up/email','POST',{name:email.split('@')[0],email,password:'business-test-password'}));const link=mail.findLast(m=>m.to===email)!.text.match(/https?:\/\/\S+$/)![0];const verified=await app.request(link);assert.equal(verified.status,302);return cookies(verified)}
 try{
  await migrate(pool,'db/postgres');await migrateAuth(pool,auth);assert.equal((await ok(await req('/api/status'))).business,'ready');
  let owner=await signup('owner@example.test');const a=await signup('alice@example.test'),b=await signup('bob@example.test'),staff=await signup('staff@example.test');
  assert.equal((await req('/api/business/me')).status,401);
  assert.equal((await req('/api/business/owner/businesses','GET',undefined,owner)).status,403);
  assert.equal((await req('/api/business/owner/businesses','GET',undefined,a)).status,403);
  const enabled=await ok(await req('/api/auth/two-factor/enable','POST',{password:'business-test-password'},owner));assert.ok(enabled.totpURI);assert.ok(enabled.backupCodes.length);
  const secret=new URL(enabled.totpURI).searchParams.get('secret')!,code=totp(secret);const verification=await req('/api/auth/two-factor/verify-totp','POST',{code,trustDevice:false},owner);await ok(verification);owner=cookies(verification,owner);
  assert.equal((await req('/api/business/owner/businesses','GET',undefined,owner)).status,403);
  await ok(await req('/api/business/owner/unlock','POST',{code:totp(secret)},owner));
  const me=await ok(await req('/api/business/me','GET',undefined,owner));assert.equal(me.ownerUnlocked,true);
  const bizA=(await ok(await req('/api/business/requests','POST',{name:'Cafe A'},a),201)).id;
  assert.equal((await req('/api/business/requests','POST',{name:'Duplicate'},a)).status,409);
  await ok(await req('/api/business/businesses/'+bizA,'PATCH',{status:'active',name:'Cafe A Updated',contactEmail:'contact@example.test'},owner));assert.equal((await ok(await req('/api/business/businesses/'+bizA,'GET',undefined,a))).business.contactEmail,'contact@example.test');
  const created=await ok(await req('/api/business/owner/businesses','POST',{name:'Cafe B',email:'bob@example.test'},owner),201),bizB=created.id;
  const invitationToken=new URL(created.invitation.url).hash.slice(1);
  assert.equal((await req('/api/business/invitations/accept','POST',{token:invitationToken},a)).status,404);
  await ok(await req('/api/business/invitations/accept','POST',{token:invitationToken},b));
  assert.equal((await req('/api/business/invitations/accept','POST',{token:invitationToken},b)).status,404);
  assert.equal((await req('/api/business/businesses/'+bizA,'GET',undefined,b)).status,404);
  const locA=(await ok(await req('/api/business/businesses/'+bizA+'/locations','POST',{name:'Olaya',slug:'cafe-a-olaya'},a),201)).id;
  const locA2=(await ok(await req('/api/business/businesses/'+bizA+'/locations','POST',{name:'Second',slug:'cafe-a-second'},a),201)).id;
  const locB=(await ok(await req('/api/business/businesses/'+bizB+'/locations','POST',{name:'Branch B',slug:'cafe-b'},b),201)).id;
  const staffInvite=await ok(await req('/api/business/businesses/'+bizA+'/invitations','POST',{email:'staff@example.test',role:'staff',locationId:locA},a),201);
  await ok(await req('/api/business/invitations/accept','POST',{token:new URL(staffInvite.url).hash.slice(1)},staff));
  const staffDetail=await ok(await req('/api/business/businesses/'+bizA,'GET',undefined,staff));assert.equal(staffDetail.locations.length,1);assert.equal(staffDetail.locations[0].id,locA);
  assert.equal((await req('/api/business/locations/'+locA2+'/code','GET',undefined,staff)).status,404);
  assert.equal((await req('/api/business/locations/'+locA+'/code/replace','POST',{},staff)).status,403);
  const team=await ok(await req('/api/business/businesses/'+bizA+'/staff','GET',undefined,a));const staffId=team.staff.find((v:any)=>v.email==='staff@example.test').id,ownerId=team.staff.find((v:any)=>v.email==='alice@example.test').id;assert.equal((await req('/api/business/staff/'+ownerId,'PATCH',{role:'manager'},a)).status,409);await ok(await req('/api/business/staff/'+staffId,'PATCH',{role:'manager',locationId:locA},a));
  assert.equal((await req('/api/business/businesses/'+bizA+'/locations','POST',{name:'Forbidden',slug:'forbidden'},staff)).status,403);
  await ok(await req('/api/business/staff/'+staffId,'PATCH',{role:'staff',locationId:locA},a));
  assert.equal((await req('/api/venue/cafe-a-olaya')).status,404);
  let detail=await ok(await req('/api/business/businesses/'+bizA,'GET',undefined,a));let location=detail.locations.find((l:any)=>l.id===locA);
  const draft={...location.draft,displayName:'Cafe A Family Table',games:['np-topics','speed','invent']};
  const save={name:'Olaya',draft,timezone:'Asia/Riyadh',rotationHour:6,sessionMinutes:120,revision:0};
  await ok(await req('/api/business/locations/'+locA,'PATCH',save,a));
  assert.equal((await req('/api/business/locations/'+locA,'PATCH',save,a)).status,409);
  assert.equal((await req('/api/business/locations/'+locA+'/publish','POST',{revision:1},a)).status,403);
  const png=await sharp({create:{width:20,height:20,channels:4,background:'#ff0000'}}).png().toBuffer();
  const upload=await app.request(c.origin+'/api/business/businesses/'+bizA+'/logo',{method:'POST',headers:{origin:c.origin,'content-type':'image/png',cookie:a},body:png});const logo=(await ok(upload,201)).id;
  assert.equal((await req('/api/business/assets/'+logo,'GET',undefined,b)).status,404);
  assert.equal((await app.request(c.origin+'/api/business/businesses/'+bizA+'/logo',{method:'POST',headers:{origin:c.origin,'content-type':'image/svg+xml',cookie:a},body:'<svg/>'})).status,415);
  const prompt=(await ok(await req('/api/business/locations/'+locA+'/prompts','POST',{gameId:'np-topics',locale:'en',difficulty:'Medium',text:'Describe the perfect family breakfast at Cafe A.'},a),201)).id;
  const reviews=await ok(await req('/api/business/owner/reviews','GET',undefined,owner));assert.ok(reviews.locations.some((v:any)=>v.id===locA));assert.equal((await req('/api/business/locations/'+locA+'/prompts','POST',{gameId:'np-topics',locale:'en',difficulty:'Medium',text:'Describe the perfect family breakfast at Cafe A.'},a)).status,409);await ok(await req('/api/business/locations/'+locA+'/review','POST',{},a));await ok(await req('/api/business/locations/'+locA+'/publish','POST',{revision:1},owner));
  const publicPage=await ok(await req('/api/venue/cafe-a-olaya'));assert.equal(publicPage.venue.brand.displayName,draft.displayName);assert.equal(publicPage.prompts,undefined);
  assert.equal((await req('/api/venue/cafe-a-olaya/session')).status,401);
  const daily=await ok(await req('/api/business/locations/'+locA+'/code','GET',undefined,a));assert.match(daily.code,/^\d{6}$/,'daily codes are six digits');assert.equal(Date.parse(daily.expiresAt)-Date.parse(daily.startsAt),86400000);
  const concurrent=await Promise.all(Array.from({length:5},()=>req('/api/business/locations/'+locA+'/code','GET',undefined,a).then(r=>r.json())));assert.ok(concurrent.every(v=>v.code===daily.code));
  assert.equal((await req('/api/venue/cafe-a-olaya/entry','POST',{code:'AAAAAAAA'})).status,400);
  const entry=await req('/api/venue/cafe-a-olaya/entry','POST',{code:daily.code});const initial=await ok(entry);let guest=cookies(entry);assert.match(entry.headers.get('set-cookie')!,/HttpOnly/);assert.equal(initial.prompts.length,0);const expiry=initial.session.expiresAt;
  await ok(await req('/api/business/prompts/'+prompt,'PATCH',{status:'approved'},owner));
  const access=await ok(await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest));assert.equal(access.prompts[0].text,'Describe the perfect family breakfast at Cafe A.');assert.equal((await req('/api/venue/cafe-b/session','GET',undefined,guest)).status,404);
  const reentry=await ok(await req('/api/venue/cafe-a-olaya/entry','POST',{code:daily.code},guest));assert.equal(reentry.session.expiresAt,expiry);
  const runId=crypto.randomUUID();await ok(await req('/api/venue/cafe-a-olaya/runs','POST',{id:runId,gameId:'np-topics'},guest),201);await ok(await req('/api/venue/cafe-a-olaya/runs/'+runId+'/complete','POST',{},guest));await ok(await req('/api/venue/cafe-a-olaya/runs/'+runId+'/complete','POST',{},guest));assert.equal((await req('/api/venue/cafe-a-olaya/runs','POST',{id:crypto.randomUUID(),gameId:'battle'},guest)).status,403);
  const report=await ok(await req('/api/business/locations/'+locA+'/report','GET',undefined,a));assert.equal(report.sessions,1);assert.equal(report.games[0].starts,1);assert.equal(report.games[0].completions,1);assert.ok(report.pageVisits>=1);assert.equal(report.failedEntries,1);
  await ok(await req('/api/business/locations/'+locA+'/code/replace','POST',{},a));assert.equal((await req('/api/venue/cafe-a-olaya/entry','POST',{code:daily.code})).status,400);assert.equal((await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest)).status,200);
  await ok(await req('/api/business/locations/'+locA+'/sessions/revoke','POST',{},a));assert.equal((await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest)).status,401);
  const replacement=await ok(await req('/api/business/locations/'+locA+'/code','GET',undefined,a));const fresh=await req('/api/venue/cafe-a-olaya/entry','POST',{code:replacement.code});await ok(fresh);guest=cookies(fresh);
  for(let i=0;i<21;i++)assert.equal((await req('/api/venue/cafe-a-olaya/entry','POST',{code:replacement.code})).status,200,'Correct entries behind one Wi-Fi must not count as failed attempts');
  now+=121*60000;assert.equal((await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest)).status,200,'there is no play-time limit inside the daily code window');now=Date.parse(replacement.expiresAt)-1000;assert.equal((await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest)).status,200);assert.equal(Date.parse((await ok(await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest))).session.expiresAt),Date.parse(replacement.expiresAt),'a session ends when its daily code window ends');now=Date.parse(replacement.expiresAt)+1;assert.equal((await req('/api/venue/cafe-a-olaya/session','GET',undefined,guest)).status,401,'a session cannot outlive the daily code window');
  now=Date.parse(replacement.expiresAt)+1;const nextDay=await ok(await req('/api/business/locations/'+locA+'/code','GET',undefined,a));assert.notEqual(nextDay.code,replacement.code);assert.equal(Date.parse(nextDay.startsAt),Date.parse(replacement.expiresAt));
  assert.equal((await req('/api/venue/cafe-a-olaya/entry','POST',{code:replacement.code})).status,400);
  await ok(await req('/api/business/businesses/'+bizA,'PATCH',{status:'suspended'},owner));assert.equal((await req('/api/venue/cafe-a-olaya')).status,404);
  const customers=await ok(await req('/api/business/owner/customers','GET',undefined,owner));assert.ok(customers.customers.length>=4);assert.ok(customers.customers.every((u:any)=>!('profiles'in u)&&!('results'in u)));
  const bob=customers.customers.find((u:any)=>u.email==='bob@example.test');await ok(await req('/api/business/owner/customers/'+bob.id,'PATCH',{suspended:true},owner));assert.equal((await req('/api/business/me','GET',undefined,b)).status,403);
  const vendorAudit=await ok(await req('/api/business/businesses/'+bizA+'/audit','GET',undefined,a));assert.ok(vendorAudit.events.some((e:any)=>e.actorName==='Paperclub'));
  const audit=await ok(await req('/api/business/owner/audit','GET',undefined,owner));assert.ok(audit.events.some((e:any)=>e.action==='code.replaced'));assert.ok(audit.events.every((e:any)=>!JSON.stringify(e).includes(daily.code)));
  assert.equal((await req('/api/business/businesses/'+bizA,'PATCH',{status:'active'},owner,{origin:'http://evil.test'})).status,403);
  await pool.query('DELETE FROM business_admin_stepup');assert.equal((await req('/api/auth/two-factor/disable','POST',{password:'business-test-password'},owner)).status,403);
  await ok(await req('/api/business/owner/unlock','POST',{code:enabled.backupCodes[0],recovery:true},owner));assert.equal((await req('/api/business/owner/businesses','GET',undefined,owner)).status,200);
  await pool.query("INSERT INTO venue_rate_limits(key,window_at,attempts) VALUES ('expired-fixture',NOW()-INTERVAL '2 days',1)");await maintain(pool);assert.equal((await pool.query("SELECT 1 FROM venue_rate_limits WHERE key='expired-fixture'")).rowCount,0);assert.equal((await pool.query('SELECT COUNT(*)::int AS n FROM businesses')).rows[0].n,2);

 }finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});

test('adding business MFA preserves existing pre-business users, family records and sessions',{skip:!url},async()=>{
 const{betterAuth}=await import('better-auth');const{getMigrations}=await import('better-auth/db/migration');const master=new Pool({connectionString:url}),schema='upgrade_'+crypto.randomUUID().replaceAll('-','');await master.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString:url,options:'-c search_path='+schema});const mail:Mail[]=[];const c:RailwayConfig={origin:'http://upgrade.test',secret:'a-local-upgrade-test-secret-longer-than-32',databaseUrl:url!,smtpPort:465,production:false,emailFrom:'test@example.test',resendKey:'injected'};const next=createAuth(pool,c,async m=>{mail.push(m)}),previous=betterAuth({...next.options,plugins:[]});
 try{await migrate(pool,'db/postgres');const plan=await getMigrations(previous.options);await plan.runMigrations();assert.equal((await pool.query("SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='user' AND column_name='twoFactorEnabled'")).rowCount,0);const signup=await previous.handler(new Request(c.origin+'/api/auth/sign-up/email',{method:'POST',headers:{origin:c.origin,'content-type':'application/json'},body:JSON.stringify({name:'Existing parent',email:'existing@example.test',password:'an-existing-test-password'})}));assert.equal(signup.status,200);const verified=await previous.handler(new Request(mail[0].text.match(/https?:\/\/\S+$/)![0]));const cookie=verified.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');const before=await previous.api.getSession({headers:new Headers({cookie})});assert.ok(before?.user.id);const id=before!.user.id;await pool.query('INSERT INTO parent_accounts(id,display_name,created_at,updated_at) VALUES ($1,\'Existing parent\',\'before\',\'before\')',[id]);await migrateAuth(pool,next);const after=await next.api.getSession({headers:new Headers({cookie})});assert.equal(after?.user.id,id);assert.equal(!!after?.user.twoFactorEnabled,false);assert.equal((await pool.query('SELECT display_name FROM parent_accounts WHERE id=$1',[id])).rows[0].display_name,'Existing parent')}
 finally{await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
});
