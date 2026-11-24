import assert from'node:assert/strict';import{Pool}from'pg';import{serve}from'@hono/node-server';import{serveStatic}from'@hono/node-server/serve-static';import{chromium}from'playwright';import{mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import sharp from'sharp';
import{createApp}from'../server/railway/app';import{createAuth,type Mail}from'../server/railway/auth';import{migrate,migrateAuth}from'../server/railway/migrate';import{blankBrand}from'../server/railway/business/core';
const connectionString=process.env.TEST_DATABASE_URL;if(!connectionString)throw Error('A dedicated TEST_DATABASE_URL is required');
const master=new Pool({connectionString}),schema='vote_'+crypto.randomUUID().replaceAll('-','');await master.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString,options:'-c search_path='+schema,max:5});
const origin='http://127.0.0.1:18084',mail:Mail[]=[];const c={origin,secret:'table-vote-fixture-only-secret-with-more-than-32-chars',databaseUrl:connectionString,smtpPort:465,production:false,emailFrom:'test@example.test',resendKey:'injected-test-mail-only'};
const auth=createAuth(pool,c,async m=>{mail.push(m)}),app=createApp(pool,c,auth);app.use('*',serveStatic({root:'./dist'}));app.get('*',serveStatic({path:'./dist/index.html'}));
let server:ReturnType<typeof serve>|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;const output=process.env.BROWSER_OUTPUT_DIR||'/tmp/table-vote';await mkdir(output,{recursive:true});
try{
 await migrate(pool,'db/postgres');await migrateAuth(pool,auth);server=serve({overrideGlobalObjects:false,fetch:app.fetch,hostname:'127.0.0.1',port:18084});
 const businessId=crypto.randomUUID(),locationId=crypto.randomUUID(),codeId=crypto.randomUUID(),sessionId=crypto.randomUUID();
 const logoId=crypto.randomUUID();await pool.query("INSERT INTO businesses(id,name,status,contact_email) VALUES ($1,'Harbour Café','active','host@example.test')",[businessId]);await pool.query('INSERT INTO venue_assets(id,business_id,content) VALUES ($1,$2,$3)',[logoId,businessId,await sharp({create:{width:240,height:90,channels:4,background:'#bc4d3a'}}).png().toBuffer()]);
 const brand={...blankBrand('Harbour Café'),logoId,menu:[{kind:'drink',en:'Karak tea',ar:'شاي كرك'},{kind:'dessert',en:'Date cake',ar:'كيكة التمر'}],games:['vote','np-yesno'],categories:[]};

 await pool.query("INSERT INTO venue_locations(id,business_id,slug,name,status,draft,published,rotation_anchor) VALUES ($1,$2,'harbour-vote','Harbour','active',$3,$3,NOW())",[locationId,businessId,JSON.stringify(brand)]);
 await pool.query("INSERT INTO venue_daily_codes(id,location_id,starts_at,expires_at,verifier,ciphertext) VALUES ($1,$2,NOW()-INTERVAL '1 hour',NOW()+INTERVAL '23 hours','x','x')",[codeId,locationId]);
 const raw2='second-guest-token-for-browser-test';await pool.query('INSERT INTO venue_guest_sessions(id,location_id,token_hash,code_id,expires_at) VALUES ($1,$2,$3,$4,NOW()+INTERVAL \'2 hours\')',[crypto.randomUUID(),locationId,createHash('sha256').update(raw2).digest('hex'),codeId]);const raw='guest-token-for-browser-test';await pool.query('INSERT INTO venue_guest_sessions(id,location_id,token_hash,code_id,expires_at) VALUES ($1,$2,$3,$4,NOW()+INTERVAL \'2 hours\')',[sessionId,locationId,createHash('sha256').update(raw).digest('hex'),codeId]);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',headless:true,args:['--no-sandbox']});const errors:string[]=[];
 const phone=async(token:string)=>{const context=await browser!.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await context.addCookies([{name:'pc-venue-'+locationId,value:token,url:origin+'/api/venue/harbour-vote',httpOnly:true,sameSite:'Strict'}]);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/venue/harbour-vote');await page.getByRole('button',{name:'Table Vote',exact:true}).click();return page};
 const host=await phone(raw),guest=await phone(raw2);
 await host.getByLabel('Your name').fill('Host');await host.getByRole('button',{name:'Host · Would You Rather'}).click();
 const code=(await host.locator('.table-vote-code').innerText()).trim();assert.match(code,/^\d{4}$/);
 await guest.getByLabel('Your name').fill('Amal');await guest.getByLabel('Four-digit code').fill(code);await guest.getByRole('button',{name:'Join',exact:true}).click();
 await host.getByText('Amal').first().waitFor();await guest.getByText('Waiting for the table').waitFor();
 await host.getByRole('button',{name:'Start first round'}).click();
 const options=guest.locator('.table-vote-options button');await options.first().waitFor();assert.equal(await options.count(),2);
 await host.locator('.table-vote-options button').first().click();await options.first().click();await host.getByText('2/2 voted').waitFor();
 await host.screenshot({path:output+'/table-vote-host.png',fullPage:true});
 await host.getByRole('button',{name:'Reveal results'}).click();await guest.getByRole('heading',{name:'Results'}).waitFor();assert.equal(await guest.locator('.table-vote-result').count(),2);
 await guest.getByText('The majority gets a point.').waitFor();assert.equal(await guest.locator('.score-row b').allInnerTexts().then(v=>v.sort().join(',')),'1,1');
 await host.getByRole('button',{name:'Finish game'}).click();await guest.getByRole('heading',{name:'Thanks for playing'}).waitFor();
 assert.equal(await host.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'fits mobile width');
 await guest.getByRole('button',{name:'العربية',exact:true}).click().catch(()=>{});
 assert.deepEqual(errors,[]);console.log('PASS: two phones host and join a Table Vote room, vote at once, see results and a shared scoreboard. Screenshots: '+output);
}finally{await browser?.close();if(server)await new Promise<void>(r=>server!.close(()=>r()));await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
