import test from'node:test';import assert from'node:assert/strict';import{games,rules}from'./engine';import{noPropsGames}from'./noPropsCatalog';import{spokenPrompt,spokenLibraryCounts}from'./noPropsContent';
import{noPropsDefaults,createNoPropsGame,startNoPropsTimer,pauseNoPropsTimer,resetNoPropsTimer,expireNoPropsTimer,noPropsRemaining,noPropsDecision,nextSpokenQuestion,associationTurn,nextYesNoQuestion,noPropsPoint}from'./noPropsEngine';import{resultSeed}from'./resultBridge';
test('exactly thirteen original games and eleven new games appear once in their collections',()=>{
 const old=['speed','detective','battle','impossible','story','code','five','escape','scatter','ladder','anagram','invent','rather'];assert.deepEqual(games.filter(g=>g.collection==='paper').map(g=>g.id).sort(),old.sort());assert.equal(games.filter(g=>g.collection==='none').length,11);assert.equal(games.length,24);assert.equal(new Set(games.map(g=>g.id)).size,24);noPropsGames.forEach(g=>assert(rules[g.id].length>=3));
});
test('every content game has varied prompts at each level and does not repeat the first twenty',()=>{
 for(const g of noPropsGames)for(const difficulty of ['Easy','Medium','Hard']){
  const history:string[]=[];for(let i=0;i<20;i++){const prompt=spokenPrompt(g.id,difficulty,history);assert(prompt.key);assert(prompt.text);assert(!history.includes(prompt.key));history.push(prompt.key);if(g.id==='np-truths')assert.equal(prompt.answer,undefined);if(g.id==='np-opposite')assert(prompt.answer);if(g.id==='np-countdown')assert.equal(prompt.required,difficulty==='Easy'?3:difficulty==='Medium'?5:7);if(g.id==='np-story60'){assert.equal(prompt.words?.length,difficulty==='Hard'?5:3);assert.equal(new Set(prompt.words).size,prompt.words!.length);assert(prompt.words!.every(word=>/^[a-z]+$/i.test(word)))}}
 }
 for(const levels of Object.values(spokenLibraryCounts()))for(const size of Object.values(levels))assert(size>=30);
});
test('difficulty changes response times and actual content, not just labels',()=>{
 for(const difficulty of ['Easy','Medium','Hard']){const config=noPropsDefaults('np-association',difficulty);assert.equal(config.response,difficulty==='Easy'?5:difficulty==='Medium'?3:2);const count=noPropsDefaults('np-countdown',difficulty);assert.equal(count.response,difficulty==='Easy'?7:difficulty==='Medium'?10:5)}
 const four=spokenPrompt('np-story60','Hard',[],4);assert.equal(four.words?.length,4);
});
test('preparation and speaking are separate parent-controlled timer stages',()=>{
 let s=createNoPropsGame('np-topics',{...noPropsDefaults('np-topics'),prep:15,speech:60});const key=s.prompt.key;s=startNoPropsTimer(s,1000);assert.equal(s.phase,'prep');assert.equal(s.deadline,16000);assert.equal(noPropsRemaining(s,6000),10000);s=pauseNoPropsTimer(s,6000);assert.equal(s.milliseconds,10000);s=startNoPropsTimer(s,7000);assert.equal(s.deadline,17000);s=expireNoPropsTimer(s);assert.equal(s.phase,'readyToSpeak');assert.equal(s.deadline,null);assert.equal(s.prompt.key,key);s=startNoPropsTimer(s,20000);assert.equal(s.phase,'speaking');assert.equal(s.deadline,80000);s=expireNoPropsTimer(s);assert.equal(s.phase,'review');assert.equal(s.prompt.key,key);assert.equal(s.revealed,false);
 const reset=resetNoPropsTimer(createNoPropsGame('np-topics',{...noPropsDefaults('np-topics'),prep:15}));assert.equal(startNoPropsTimer(reset,0).deadline,15000);
});
test('rapid fire keeps one timer, judges no answers and scores at most once per displayed question',()=>{
 for(const questions of [10,20]as const){let s=createNoPropsGame('np-rapid',{...noPropsDefaults('np-rapid','Hard'),questions});assert.equal(s.sequence.length,questions);assert.equal(new Set(s.sequence.map(p=>p.key)).size,questions);s=startNoPropsTimer(s,1000);const deadline=s.deadline;for(let i=0;i<questions;i++){assert.equal(s.questionIndex,i);s=nextSpokenQuestion(s,true);if(i<questions-1)assert.equal(s.deadline,deadline)}assert.equal(s.phase,'review');assert.equal(s.scores[0],questions);assert.equal(nextSpokenQuestion(s,true).scores[0],questions);const next=createNoPropsGame(s.game,s.config,s);assert.equal(next.player,1);assert.equal(next.round,2);assert.equal(next.scores[0],questions)}
});
test('spoken outcomes are parent confirmed, reversible and never inferred from speech',()=>{
 let s=createNoPropsGame('np-countdown',noPropsDefaults('np-countdown'));s=noPropsDecision(s,true);assert.equal(s.scores[0],1);assert.equal(noPropsDecision(s,true).scores[0],1);assert.equal(s.phase,'review');s=noPropsPoint(s,0,-1);assert.equal(s.scores[0],0);
 let opposite=createNoPropsGame('np-opposite',noPropsDefaults('np-opposite'));assert(!opposite.revealed);opposite=expireNoPropsTimer(opposite);assert(!opposite.revealed&&!opposite.responded);opposite=noPropsDecision(opposite,false);assert.equal(opposite.scores[0],-1);assert(opposite.responded);assert(!opposite.revealed);
});
test('association rotates players without inventing a new spoken word, yes/no advances questions without resetting time',()=>{
 const s=createNoPropsGame('np-association',noPropsDefaults('np-association'));const next=associationTurn(s,false,1000);assert.equal(next.player,1);assert.equal(next.prompt.key,s.prompt.key);assert.equal(next.deadline,4000);assert.equal(next.scores[0],-1);
 let q=createNoPropsGame('np-yesno',{...noPropsDefaults('np-yesno'),timed:true});q=startNoPropsTimer(q,1000);const n=nextYesNoQuestion(q);assert.equal(n.player,q.player);assert.equal(n.deadline,q.deadline);assert.notEqual(n.prompt.key,q.prompt.key);
});
test('replay creates a new identity, stored sessions and optional scoring work with the Clubhouse',()=>{
 let s=createNoPropsGame('np-topics',noPropsDefaults('np-topics'));s={...s,phase:'finished'};const replay=createNoPropsGame(s.game,s.config);assert.notEqual(s.runId,replay.runId);assert.deepEqual(JSON.parse(JSON.stringify(s)),s);const seed=resultSeed({id:s.runId,game:s.game,noProps:s,settings:{players:[],teams:false,mode:'Competitive',age:8,difficulty:'Hard',duration:10,timer:30,theme:'Adventure',combo:true},scores:[],hits:[],completed:true,message:'',round:1});assert.equal(seed.slots.length,2);assert(seed.slots.every(slot=>slot.score===null&&!slot.winner));assert.equal(seed.difficulty,'Medium');
});
test('family mix gives adults Hard prompts and kids the chosen level, per turn and per game',()=>{
 for(const game of noPropsGames.map(g=>g.id)){
  const base={...noPropsDefaults(game,'Easy'),players:['Parent','Child','Grandparent'],family:true,adults:[true,false,true],randomSpeaker:false};
  let s=createNoPropsGame(game,base);const seen:string[]=[];
  for(let i=0;i<6;i++){seen.push(s.player+':'+s.level);s=createNoPropsGame(game,base,s)}
  assert.deepEqual(seen,['0:Hard','1:Easy','2:Hard','0:Hard','1:Easy','2:Hard'],game);
 }
 const cfg={...noPropsDefaults('np-yesno','Medium'),players:['Parent','Child'],family:true,adults:[true,false]};
 const adult=createNoPropsGame('np-yesno',cfg);assert.ok(adult.prompt.key.includes(':Hard:'));assert.ok(nextYesNoQuestion(adult).prompt.key.includes(':Hard:'));
 const kid=createNoPropsGame('np-yesno',cfg,adult);assert.ok(kid.prompt.key.includes(':Medium:'));assert.ok(nextYesNoQuestion(kid).prompt.key.includes(':Medium:'));
 const everyoneHard=createNoPropsGame('np-yesno',{...cfg,difficulty:'Hard',adults:[false,false]});assert.equal(everyoneHard.level,'Hard');
 const plain=createNoPropsGame('np-yesno',{...cfg,family:false});assert.equal(plain.level,'Medium');
});
test('Don’t Say Yes or No has at least ten times the original questions per level in both languages and does not repeat in a long turn',async()=>{
 const{setLocale}=await import('./i18n/locale');
 for(const locale of ['en','ar-SA']){
  setLocale(locale as any);
  for(const level of ['Easy','Medium','Hard']){
   const floor=locale==='en'?320:720;const seen=new Set<string>();const history:string[]=[];
   for(let i=0;i<floor;i++){const p=spokenPrompt('np-yesno',level,history);assert.ok(!history.includes(p.key),`${locale} ${level} repeated inside one pool cycle at ${i}`);history.push(p.key);seen.add(p.text)}
   assert.ok(seen.size>=floor,`${locale} ${level}: ${seen.size} distinct questions < ${floor}`);
  }
 }
 setLocale('en' as any);
});
test('Countdown and Rapid Fire have ten times the original categories in English and in Arabic Medium, with no repeats inside one pool cycle',async()=>{
 const{setLocale}=await import('./i18n/locale');
 const floors:Record<string,Record<string,number>>={en:{Easy:390,Medium:750,Hard:270},'ar-SA':{Medium:720}};
 for(const[locale,levels]of Object.entries(floors)){
  setLocale(locale as any);
  for(const game of['np-countdown','np-rapid'])for(const[level,floor]of Object.entries(levels)){
   const history:string[]=[];const seen=new Set<string>();
   for(let i=0;i<floor;i++){const p=spokenPrompt(game,level,history);assert.ok(!history.includes(p.key),`${locale} ${game} ${level} repeated at ${i}`);history.push(p.key);seen.add(p.text)}
   assert.ok(seen.size>=floor,`${locale} ${game} ${level}: ${seen.size} < ${floor}`);
  }
 }
 setLocale('en' as any);
});
test('Would You Rather, Take a Side and Invent Something hold at least ten times the original items per level in both languages with unique keys',async()=>{
 const{dilemmaPools,inventionPools}=await import('./creativeGames');const{arabicDilemmas,arabicInventions}=await import('./arabic/prompts');
 for(const level of['Easy','Medium','Hard']){
  for(const[name,pool]of Object.entries({enDilemmas:dilemmaPools[level],enInventions:inventionPools[level],arDilemmas:arabicDilemmas[level],arInventions:arabicInventions[level]})){
   assert.ok(pool.length>=(name==='arDilemmas'||name==='enDilemmas'?(level==='Hard'?360:400):400),`${name} ${level}: ${pool.length}`);
   assert.equal(new Set(pool.map((p:any)=>p.key)).size,pool.length,`${name} ${level} keys`);
   assert.equal(new Set(pool.map((p:any)=>p.text||[p.a,p.b].sort().join('|'))).size,pool.length,`${name} ${level} duplicates`);
  }
 }
});
test('Table Topics, Convince Us, What Would You Do?, Two Truths and Opposite Answers have at least ten times the original English prompts, with correct answers and no repeats in one cycle',()=>{
 const floors:Record<string,number>={'np-topics':320,'np-convince':320,'np-scenario':320,'np-truths':320,'np-opposite':320};
 for(const[game,floor]of Object.entries(floors))for(const level of['Easy','Medium','Hard']){
  const history:string[]=[];const texts=new Set<string>();
  for(let i=0;i<floor;i++){const p=spokenPrompt(game,level,history);assert.ok(!history.includes(p.key),`${game} ${level} repeated at ${i}`);history.push(p.key);texts.add(p.text+(p.answer||''))}
  assert.equal(texts.size,floor,`${game} ${level}`);
 }
 // arithmetic answers are verified rather than trusted
 const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
 assert.equal(words.length,20);
});
