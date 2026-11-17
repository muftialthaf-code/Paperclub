import assert from'node:assert/strict';import{Pool}from'pg';import{serve}from'@hono/node-server';import{serveStatic}from'@hono/node-server/serve-static';import{chromium}from'playwright';import{mkdir}from'node:fs/promises';
import{createApp}from'../server/railway/app';import{createAuth,type Mail}from'../server/railway/auth';import{migrate,migrateAuth}from'../server/railway/migrate';
const connectionString=process.env.TEST_DATABASE_URL;if(!connectionString)throw Error('A dedicated TEST_DATABASE_URL is required');
const master=new Pool({connectionString}),schema='fmix_'+crypto.randomUUID().replaceAll('-','');await master.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString,options:'-c search_path='+schema,max:5});
const origin='http://127.0.0.1:18084',mail:Mail[]=[];const c={origin,secret:'family-mix-fixture-only-secret-with-more-than-32-chars',databaseUrl:connectionString,smtpPort:465,production:false,emailFrom:'test@example.test',resendKey:'injected-test-mail-only'};
const auth=createAuth(pool,c,async m=>{mail.push(m)}),app=createApp(pool,c,auth);app.use('*',serveStatic({root:'./dist'}));app.get('*',serveStatic({path:'./dist/index.html'}));
let server:ReturnType<typeof serve>|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;const output=process.env.BROWSER_OUTPUT_DIR||'/tmp/family-mix';await mkdir(output,{recursive:true});
const profile=(name:string,audience:'adult'|'child',kind:'family'|'guest'='family',archived=false)=>({id:crypto.randomUUID(),name,avatar:'🦊',color:'#e0f2ee',kind,audience,retained:kind==='family',createdAt:new Date().toISOString(),archived});
const club={version:1,profiles:[profile('Maha','adult'),profile('Omar','child'),profile('Noura','adult'),profile('Sami','child'),profile('Visitor Lina','child','guest'),profile('Old Sara','adult','family',true)],results:[],parties:[],awards:[],activePartyId:null};
try{
 await migrate(pool,'db/postgres');await migrateAuth(pool,auth);server=serve({overrideGlobalObjects:false,fetch:app.fetch,hostname:'127.0.0.1',port:18084});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',headless:true,args:['--no-sandbox']});const errors:string[]=[];
 const context=await browser.newContext({viewport:{width:1100,height:1000}});await context.addInitScript(value=>{if(!localStorage.getItem('pc-clubhouse'))localStorage.setItem('pc-clubhouse',value)},JSON.stringify(club));
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/');
 await page.getByRole('button',{name:'Game Library',exact:true}).first().click();await page.getByRole('button',{name:'No Props Needed'}).first().click();
 await page.getByRole('button',{name:'Table Topics',exact:true}).first().click();
 const names=()=>page.locator('.setup-modal .name-inputs input').evaluateAll(els=>els.map(e=>(e as HTMLInputElement).value));
 // the setup opens with the Clubhouse family, not Player 1..4; guests and archived profiles are left out
 await page.locator('#np-setup-title').waitFor();await page.getByText('Player names & saved profiles (optional)').click();
 assert.deepEqual(await names(),['Maha','Omar','Noura','Sami']);
 // family mix is already on because the family has adults and children, and nobody is asked who is an adult
 const mix=page.getByLabel('Family mix: adults play Hard on their turns');assert.equal(await mix.isChecked(),true);
 const tags=await page.locator('.family-mix-tag').allTextContents();assert.equal(tags.length,4);assert.match(tags[0],/Adult/);assert.match(tags[1],/Child/);assert.match(tags[2],/Adult/);assert.match(tags[3],/Child/);
 assert.equal(await page.locator('.family-mix input[type=checkbox]').count(),0,'no manual adult/child tick boxes for Clubhouse players');
 await page.screenshot({path:output+'/family-mix-setup.png'});
 // a name that is not in the Clubhouse is the only one that needs an answer
 await page.locator('.setup-modal .name-inputs input').nth(3).fill('Cousin Faisal');assert.equal(await page.locator('.family-mix input[type=checkbox]').count(),1);assert.equal(await page.locator('.family-mix-tag').count(),3);
 await page.locator('.family-mix input[type=checkbox]').check();
 await page.getByRole('button',{name:'Start Game',exact:true}).click();
 // turn levels follow the profiles: Maha (adult) Hard, Omar (child) Medium, Noura (adult) Hard, Cousin Faisal ticked adult -> Hard
 const level=async()=>(await page.locator('.np-game .eyebrow').first().innerText());
 await page.locator('.np-game').waitFor();assert.match(await level(),/Hard/);assert.match(await page.locator('.np-game p').first().innerText(),/Maha/);
 await page.screenshot({path:output+'/family-mix-adult-turn.png'});
 const next=async()=>{await page.locator('.np-main-action').click();await page.locator('.np-game').waitFor()};
 // finish the turn, then move to the next speaker
 for(const[who,expected]of[['Omar',/Medium/],['Noura',/Hard/],['Cousin Faisal',/Hard/]]as const){
  const advance=page.getByRole('button',{name:/next|new|finish|end/i}).last();void advance;
  await page.locator('.np-main-action').scrollIntoViewIfNeeded();await page.locator('.np-main-action').click();
  await page.waitForFunction(w=>document.querySelector('.np-game')?.textContent?.includes(w),who,{timeout:8000});assert.match(await level(),expected,who);
 }
 assert.deepEqual(errors,[]);console.log('PASS: Clubhouse family auto-fills the setup, family mix reads Adult/Child from profiles, only unknown names are asked, and turn levels follow the profiles. Screenshots: '+output);
}finally{await browser?.close();if(server)await new Promise<void>(r=>server!.close(()=>r()));await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
