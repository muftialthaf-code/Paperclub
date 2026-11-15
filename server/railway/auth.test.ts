import test from 'node:test';
import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {createAuth,type Mail} from './auth';
import {createApp,publicRequest} from './app';
import {config,type RailwayConfig} from './config';
import {migrate,migrateAuth} from './migrate';
import {postgresDatabase,postgresSql} from './database';
import {emptyClub} from '../../src/shared/clubData';

const url=process.env.TEST_DATABASE_URL;
test('configuration rejects unsafe production origins and incomplete credentials',()=>{
 const base={APP_ORIGIN:'https://paperclub.test',DATABASE_URL:'postgres://test',BETTER_AUTH_SECRET:'a'.repeat(48),NODE_ENV:'production'};
 assert.equal(config(base).origin,base.APP_ORIGIN);
 for(const patch of [{APP_ORIGIN:'http://paperclub.test'},{APP_ORIGIN:'https://paperclub.test/path'},{BETTER_AUTH_SECRET:'short'},{GOOGLE_CLIENT_ID:'only-one'}])assert.throws(()=>config({...base,...patch}));
 assert.equal(postgresSql('SELECT display_name AS displayName FROM parent_accounts WHERE id = ?'),'SELECT display_name AS "displayName" FROM parent_accounts WHERE id = $1');
 const request=publicRequest(new Request('http://internal/api/account',{headers:{'oai-authenticated-user-id':'forged'}}),'https://paperclub.test');assert.equal(request.url,'https://paperclub.test/api/account');assert.equal(request.headers.has('oai-authenticated-user-id'),false);
});
test('real PostgreSQL: verified login, reset, revoked sessions, family isolation and atomic writes',{skip:!url},async()=>{
 const pool=new Pool({connectionString:url,max:5});
 // Isolated schema: never truncate a shared database, even if a test URL is misconfigured.
 const schema='test_'+crypto.randomUUID().replaceAll('-','');
 await pool.query('CREATE SCHEMA '+schema);
 const db=new Pool({connectionString:url,max:5,options:'-c search_path='+schema});
 const c:RailwayConfig={origin:'http://paperclub.test',secret:'local-test-secret-with-more-than-thirty-two-characters',databaseUrl:url!,smtpPort:587,production:false,emailFrom:'test@example.test',resendKey:'injected-mailer-only'};
 const mail:Mail[]=[];const auth=createAuth(db,c,async m=>{mail.push(m)});const app=createApp(db,c,auth);
 function req(path:string,method='GET',body?:unknown,cookie='',origin=c.origin,extra:Record<string,string>={}){return app.request(c.origin+path,{method,headers:{origin,'content-type':'application/json',...(cookie?{cookie}:{}),...extra},body:body===undefined?undefined:JSON.stringify(body)})}
 const cookies=(r:Response)=>r.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');
 async function signUp(email:string){const r=await req('/api/auth/sign-up/email','POST',{name:'Parent',email,password:'a-family-test-password',callbackURL:c.origin+'/?account=1'});assert.equal(r.status,200,await r.clone().text());assert.equal(cookies(r).includes('session_token'),false);const message=mail.findLast(m=>m.to===email)!;assert.ok(message);const link=message.text.match(/https?:\/\/\S+$/)![0];const verified=await app.request(link);assert.equal(verified.status,302,await verified.clone().text());assert.ok(cookies(verified).includes('session_token'));return cookies(verified)}
 try{
  await migrate(db,'db/postgres');await migrate(db,'db/postgres');await migrateAuth(db,auth);await migrateAuth(db,auth);
  assert.equal((await db.query('SELECT * FROM paperclub_migrations')).rowCount,1);
  // Health check uses public schema in production; the isolated test verifies its own schema separately.
  const headers=await req('/api/auth-config');assert.equal(headers.headers.get('x-frame-options'),'DENY');assert.match(headers.headers.get('cache-control')!,/no-store/);
  const a=await signUp('alice@example.test'),b=await signUp('bob@example.test');
  const me=await(await req('/api/account','GET',undefined,a)).json();assert.equal(me.user.email,'alice@example.test');
  const anonymous=await(await req('/api/account','GET',undefined,'',c.origin,{'oai-authenticated-user-id':me.user.id})).json();assert.equal(anonymous.user,null);
  const forged=await req('/api/families','POST',{name:'Fake'},'',c.origin,{'oai-authenticated-user-id':me.user.id});assert.equal(forged.status,401);
  const rejected=await req('/api/auth/sign-in/email','POST',{email:'alice@example.test',password:'a-family-test-password'},'','https://attacker.test');assert.equal(rejected.status,403);
  const created=await req('/api/families','POST',{name:'عائلتنا',displayName:'نورة'},a);assert.equal(created.status,201,await created.clone().text());const family=(await created.json()).family;assert.ok(family.createdAt);
  assert.equal((await req('/api/families/'+family.id+'/clubhouse','GET',undefined,b)).status,404);
  assert.equal((await req('/api/families/'+family.id,'PATCH',{name:'stolen'},b)).status,404);
  const path='/api/families/'+family.id+'/clubhouse';
  const writes=await Promise.all([req(path,'PUT',{revision:0,data:emptyClub()},a),req(path,'PUT',{revision:0,data:emptyClub()},a)]);assert.deepEqual(writes.map(r=>r.status).sort(),[200,409]);
  const state=await(await req(path,'GET',undefined,a)).json();assert.equal(state.revision,1);assert.ok(state.updatedAt);
  const adapter=postgresDatabase(db);await assert.rejects(adapter.batch([adapter.prepare("INSERT INTO parent_accounts(id,display_name,created_at,updated_at) VALUES (?, ?, ?, ?)").bind('rollback','Test','now','now'),adapter.prepare('INSERT INTO nonexistent_table VALUES (?)').bind('fail')]));assert.equal((await db.query("SELECT * FROM parent_accounts WHERE id='rollback'")).rowCount,0);
  const unverifiedEmail='pending@example.test';await req('/api/auth/sign-up/email','POST',{name:'Pending',email:unverifiedEmail,password:'a-family-test-password'});const pending=await req('/api/auth/sign-in/email','POST',{email:unverifiedEmail,password:'a-family-test-password'});assert.equal(pending.status,403);assert.equal((await pending.json()).code,'EMAIL_NOT_VERIFIED');
  const wrong=await req('/api/auth/sign-in/email','POST',{email:'alice@example.test',password:'wrong-password'});assert.equal(wrong.status,401);
  const login=await req('/api/auth/sign-in/email','POST',{email:'alice@example.test',password:'a-family-test-password'});assert.equal(login.status,200);const loginCookie=cookies(login);
  await req('/api/auth/sign-out','POST',{},loginCookie);assert.equal((await(await req('/api/account','GET',undefined,loginCookie)).json()).user,null);
  const reset=await req('/api/auth/request-password-reset','POST',{email:'alice@example.test',redirectTo:c.origin+'/account/reset-password'});assert.equal(reset.status,200);const resetLink=mail.findLast(m=>m.to==='alice@example.test')!.text.match(/https?:\/\/\S+$/)![0];const redirect=await app.request(resetLink);const token=new URL(redirect.headers.get('location')!,c.origin).searchParams.get('token');assert.ok(token);
  const changed=await req('/api/auth/reset-password','POST',{token,newPassword:'my-new-family-password'});assert.equal(changed.status,200,await changed.clone().text());assert.equal((await(await req('/api/account','GET',undefined,a)).json()).user,null);
  assert.equal((await req('/api/auth/reset-password','POST',{token,newPassword:'another-test-password'})).status,400);
  const googleAuth=createAuth(db,{...c,googleId:'test-client',googleSecret:'test-secret'},async()=>{});const google=await googleAuth.handler(new Request(c.origin+'/api/auth/sign-in/social',{method:'POST',headers:{origin:c.origin,'content-type':'application/json'},body:JSON.stringify({provider:'google',callbackURL:c.origin+'/?account=1',disableRedirect:true})}));assert.equal(google.status,200);const googleUrl=new URL((await google.json()).url);assert.equal(googleUrl.origin,'https://accounts.google.com');assert.equal(googleUrl.searchParams.get('redirect_uri'),c.origin+'/api/auth/callback/google');
  const secureOrigin='https://secure.paperclub.test',secureMail:Mail[]=[];
  const secureAuth=createAuth(db,{...c,origin:secureOrigin,production:true},async m=>{secureMail.push(m)});
  const secureSignup=await secureAuth.handler(new Request(secureOrigin+'/api/auth/sign-up/email',{method:'POST',headers:{origin:secureOrigin,'content-type':'application/json'},body:JSON.stringify({name:'Parent',email:'secure@example.test',password:'secure-family-password'})}));assert.equal(secureSignup.status,200);
  const secureLink=secureMail[0].text.match(/https?:\/\/\S+$/)![0];const secureVerify=await secureAuth.handler(new Request(secureLink));
  const sessionCookie=secureVerify.headers.getSetCookie().find(s=>s.startsWith('__Secure-better-auth.session_token='));assert.ok(sessionCookie);assert.match(sessionCookie,/HttpOnly/i);assert.match(sessionCookie,/SameSite=Lax/i);assert.match(sessionCookie,/; Secure/i);

 }finally{await db.end();await pool.query('DROP SCHEMA '+schema+' CASCADE');await pool.end()}
});
