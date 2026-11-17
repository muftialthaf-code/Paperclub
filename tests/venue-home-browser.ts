import assert from'node:assert/strict';import{Pool}from'pg';import{serve}from'@hono/node-server';import{serveStatic}from'@hono/node-server/serve-static';import{chromium}from'playwright';import{mkdir}from'node:fs/promises';import{createHash}from'node:crypto';import sharp from'sharp';
import{createApp}from'../server/railway/app';import{createAuth,type Mail}from'../server/railway/auth';import{migrate,migrateAuth}from'../server/railway/migrate';import{blankBrand}from'../server/railway/business/core';
const connectionString=process.env.TEST_DATABASE_URL;if(!connectionString)throw Error('A dedicated TEST_DATABASE_URL is required');
const master=new Pool({connectionString}),schema='home_'+crypto.randomUUID().replaceAll('-','');await master.query('CREATE SCHEMA '+schema);const pool=new Pool({connectionString,options:'-c search_path='+schema,max:5});
const origin='http://127.0.0.1:18083',mail:Mail[]=[];const c={origin,secret:'venue-home-fixture-only-secret-with-more-than-32-chars',databaseUrl:connectionString,smtpPort:465,production:false,emailFrom:'test@example.test',resendKey:'injected-test-mail-only'};
const auth=createAuth(pool,c,async m=>{mail.push(m)}),app=createApp(pool,c,auth);app.use('*',serveStatic({root:'./dist'}));app.get('*',serveStatic({path:'./dist/index.html'}));
let server:ReturnType<typeof serve>|undefined,browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;const output=process.env.BROWSER_OUTPUT_DIR||'/tmp/venue-home';await mkdir(output,{recursive:true});
try{
 await migrate(pool,'db/postgres');await migrateAuth(pool,auth);server=serve({overrideGlobalObjects:false,fetch:app.fetch,hostname:'127.0.0.1',port:18083});
 const businessId=crypto.randomUUID(),locationId=crypto.randomUUID(),codeId=crypto.randomUUID(),sessionId=crypto.randomUUID();
 const logoId=crypto.randomUUID();await pool.query("INSERT INTO businesses(id,name,status,contact_email) VALUES ($1,'Harbour Café','active','host@example.test')",[businessId]);await pool.query('INSERT INTO venue_assets(id,business_id,content) VALUES ($1,$2,$3)',[logoId,businessId,await sharp({create:{width:240,height:90,channels:4,background:'#bc4d3a'}}).png().toBuffer()]);
 const brand={...blankBrand('Harbour Café'),logoId,menu:[{kind:'drink',en:'Karak tea',ar:'شاي كرك'},{kind:'dessert',en:'Date cake',ar:'كيكة التمر'}],games:['np-topics','np-yesno','np-convince','speed','invent'],featured:'np-yesno',promo:{en:'Family night every Thursday',ar:'ليلة العائلة كل خميس'},categories:[{id:'talk',en:'Conversation',ar:'سوالف',games:['np-topics','np-convince']},{id:'quick',en:'Quick play',ar:'لعب سريع',games:['np-yesno']}]};

 await pool.query("INSERT INTO venue_locations(id,business_id,slug,name,status,draft,published,rotation_anchor) VALUES ($1,$2,'harbour-home','Harbour','active',$3,$3,NOW())",[locationId,businessId,JSON.stringify(brand)]);
 await pool.query("INSERT INTO venue_daily_codes(id,location_id,starts_at,expires_at,verifier,ciphertext) VALUES ($1,$2,NOW()-INTERVAL '1 hour',NOW()+INTERVAL '23 hours','x','x')",[codeId,locationId]);
 const raw='guest-token-for-browser-test';await pool.query('INSERT INTO venue_guest_sessions(id,location_id,token_hash,code_id,expires_at) VALUES ($1,$2,$3,$4,NOW()+INTERVAL \'2 hours\')',[sessionId,locationId,createHash('sha256').update(raw).digest('hex'),codeId]);
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/opt/pw-browsers/chromium',headless:true,args:['--no-sandbox']});const errors:string[]=[];
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});await context.addCookies([{name:'pc-venue-'+locationId,value:raw,url:origin+'/api/venue/harbour-home',httpOnly:true,sameSite:'Strict'}]);
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/venue/harbour-home');
 await page.getByRole('status').filter({hasText:'Family night every Thursday'}).waitFor();
 const logo=page.locator('img.venue-logo');await logo.waitFor();assert.ok(await logo.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0),'the logo loads');const box=(await logo.boundingBox())!;assert.ok(Math.abs(box.x+box.width/2-195)<4,'the logo is centred horizontally: '+JSON.stringify(box));assert.ok(box.y<130,'the logo sits at the top of the screen: '+box.y);
 assert.equal(await page.getByText('Play time left').count(),0,'no play timer');assert.equal(await page.locator('.venue-session-clock').count(),0);
 await page.getByRole('heading',{name:/Don.t Say Yes or No/}).first().waitFor();assert.ok(await page.getByText('FEATURED TODAY').isVisible(),'featured game card');
 const group=page.getByRole('group',{name:'Game categories'});assert.equal(await group.getByRole('button').count(),3,'All + two venue categories');
 const cards=()=>page.locator('.game-grid .game-card').count();const all=await cards();assert.equal(all,5);
 await group.getByRole('button',{name:'Conversation'}).click();assert.equal(await cards(),2,'category filters the grid');
 await group.getByRole('button',{name:'Quick play'}).click();assert.equal(await cards(),1);
 await group.getByRole('button',{name:'All games'}).click();assert.equal(await cards(),5);
 await page.screenshot({path:output+'/venue-home-mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'venue home fits mobile width');
 await page.getByRole('button',{name:'العربية',exact:true}).click();await page.getByRole('status').filter({hasText:'ليلة العائلة كل خميس'}).waitFor();await page.getByRole('group',{name:'تصنيفات الألعاب'}).getByRole('button',{name:'سوالف'}).click();assert.equal(await cards(),2);await page.screenshot({path:output+'/venue-home-arabic.png',fullPage:true});
 await page.getByRole('button',{name:'Play now'}).or(page.getByRole('button',{name:'العب الحين'})).click();
 assert.deepEqual(errors,[]);console.log('PASS: venue homepage promo, featured game, tenant categories, Arabic labels and mobile fit. Screenshots: '+output);
}finally{await browser?.close();if(server)await new Promise<void>(r=>server!.close(()=>r()));await pool.end();await master.query('DROP SCHEMA '+schema+' CASCADE');await master.end()}
