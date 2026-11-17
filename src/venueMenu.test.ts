import test from'node:test';import assert from'node:assert/strict';
import{setVenueMenu,clearVenueMenu,menuSpoken,menuPair,menuChallenge,menuDrawingWords}from'./business/venueMenu';
import{spokenPrompt}from'./noPropsContent';import{generate,defaults}from'./engine';import{createSpeedRound}from'./drawingDeck';import{setLocale}from'./i18n/locale';
const menu=[{kind:'drink' as const,en:'Karak tea',ar:'شاي كرك'},{kind:'drink' as const,en:'Iced latte',ar:''},{kind:'food' as const,en:'Club sandwich',ar:'كلوب ساندويتش'},{kind:'food' as const,en:'Shakshuka',ar:''},{kind:'dessert' as const,en:'',ar:'كنافة'}];
const always=()=>0,never=()=>0.99;
test('menu prompts use the venue menu in each eligible game and language, never repeat, and stay out of the way when off',()=>{
 clearVenueMenu();for(const game of['np-topics','np-convince','np-yesno','np-association','np-rapid','np-countdown','np-side'])assert.equal(menuSpoken(game,'Medium',[],always),null,'no menu, no menu prompts');
 setVenueMenu(menu);
 for(const locale of['en','ar-SA']as const){setLocale(locale);
  for(const game of['np-topics','np-convince','np-yesno','np-association','np-rapid','np-countdown']){const p=menuSpoken(game,'Medium',[],always)!;assert.ok(p,game);assert.match(p.key,/^menu:/);const names=menu.map(i=>locale==='en'?(i.en||i.ar):(i.ar||i.en));assert.ok(names.some(n=>p.text.includes(n)),`${game} ${locale}: ${p.text}`);assert.ok(!/undefined|\{x\}/.test(p.text))}
  assert.equal(menuSpoken('np-topics','Medium',[],never),null,'only a share of prompts come from the menu');
  const sides=menuSpoken('np-side','Medium',[],always)!;assert.ok(sides.a&&sides.b&&sides.a!==sides.b);
 }
 setLocale('en');const count=menuSpoken('np-countdown','Hard',[],always)!;assert.equal((count as {required?:number}).required,7);
 // no repeats: ask until the menu is exhausted
 const seen:string[]=[];for(let i=0;i<200;i++){const p=menuSpoken('np-yesno','Easy',seen,always);if(!p)break;assert.ok(!seen.includes(p.key));seen.push(p.key)}assert.equal(seen.length,5*3,'every item × template exactly once');
 // pairs only mix the same kind
 const pairs=new Set<string>();const used:string[]=[];for(let i=0;i<50;i++){const p=menuPair(used,always);if(!p)break;used.push(p.key);pairs.add(p.a+'|'+p.b)}
 for(const pair of pairs){const[a,b]=pair.split('|');assert.ok(!(a.includes('Karak')&&b.includes('sandwich')),'a drink is never paired with a meal: '+pair)}
 // challenges for the paper engine
 const rather=menuChallenge('rather','Medium',[],always)!;assert.ok(rather.optionA&&rather.optionB&&rather.instruction);
 assert.match(menuChallenge('five','Easy',[],always)!.text,/^Name two ingredients/);assert.match(menuChallenge('five','Medium',[],always)!.text,/^Name three ingredients/);
 assert.ok(menuChallenge('detective','Easy',[],always)!.text.length>2);assert.equal(menuChallenge('scatter','Easy',[],always),null);
 setLocale('ar-SA');assert.match(menuChallenge('five','Easy',[],always)!.text,/مثالين/);setLocale('en');
});
test('menu items reach the real prompt generators and the drawing deck',()=>{
 setVenueMenu(menu);const real=Math.random;
 try{Math.random=()=>0;const p=spokenPrompt('np-yesno','Easy',[]);assert.match(p.key,/^menu:np-yesno/);
  const c=generate('rather',{...defaults,difficulty:'Medium'},[]);assert.match(c.key||'',/^menu:pair/);assert.ok(c.optionA&&c.optionB);
  Math.random=()=>0.99;assert.doesNotMatch(spokenPrompt('np-yesno','Easy',[]).key,/^menu:/);assert.doesNotMatch(generate('rather',{...defaults,difficulty:'Medium'},[]).key||'',/^menu:/)}finally{Math.random=real}
 let sawMenuWord=false;let game=createSpeedRound(undefined,'Medium');for(let i=0;i<5;i++){assert.equal(game.items.length,16);assert.equal(new Set(game.items).size,16);if(game.items.some(w=>menuDrawingWords().includes(w)))sawMenuWord=true;game=createSpeedRound(game)}assert.ok(sawMenuWord,'menu items are mixed into drawing rounds');
 const adult=createSpeedRound(undefined,'Hard');assert.ok(!adult.items.some(w=>menuDrawingWords().includes(w)),'adult scenes stay as written');
 clearVenueMenu();const plain=createSpeedRound(undefined,'Medium');assert.equal(plain.items.length,16);
});
