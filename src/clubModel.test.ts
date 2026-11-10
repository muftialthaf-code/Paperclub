import test from 'node:test';import assert from 'node:assert/strict';
import{emptyClub,addResult,clubPoints,profileStats,mergeProfiles,removeProfile,validateClub,certificateSvg,emailDraft,clubMonth,type Profile,type ClubResult,type Award}from'./clubModel';
import{resultSeed}from'./resultBridge';import{defaults}from'./engine';
const profile=(id:string,audience:'child'|'adult'='child'):Profile=>({id,name:id,avatar:'🦊',color:'#e0f2ee',kind:'family',audience,retained:true,createdAt:'2026-11-10T00:00:00.000Z',archived:false});
const record=(id:string,score=10):ClubResult=>({id,sessionId:id,gameId:'scatter',difficulty:'Medium',date:'2026-11-10T12:00:00.000Z',entries:[{profileId:'Alex',name:'Alex',score,winner:true,team:false}],cooperative:false,completedTogether:false});
test('club points stay comparable across raw scores and never auto-award certificate points',()=>{
 const r=record('a',1000);assert.equal(clubPoints(r,r.entries[0]),5);const coop={...r,cooperative:true,completedTogether:true};assert.equal(clubPoints(coop,r.entries[0]),5);assert.equal(clubPoints({...coop,completedTogether:false},r.entries[0]),3);
 let d={...emptyClub(),profiles:[profile('Alex')]};d=addResult(d,record('a',1000));d=addResult(d,record('b',2));assert.equal(profileStats(d,'Alex').points,10);assert.equal(profileStats(d,'Alex').best,1000);assert.equal(profileStats(d,'Alex').wins,2);assert.throws(()=>addResult(d,record('a')),/already/);
});
test('month boundaries use Riyadh time and game / level / party filters preserve real records',()=>{
 assert.equal(clubMonth('2026-10-31T22:00:00Z'),'2026-11');const r={...record('a'),date:'2026-10-31T22:00:00Z',partyId:'party'};const d={...emptyClub(),profiles:[profile('Alex')],results:[r]};assert.equal(profileStats(d,'Alex','2026-11','scatter','party','Medium').played,1);assert.equal(profileStats(d,'Alex','2026-10').played,0);assert.equal(profileStats(d,'Alex',undefined,'code').played,0);
});
test('team scores never inflate individual personal bests',()=>{
 const r=record('a',99);r.entries[0].team=true;const d={...emptyClub(),profiles:[profile('Alex')],results:[r]};assert.equal(profileStats(d,'Alex').best,null);assert.equal(profileStats(d,'Alex').points,5);
});
test('merging duplicate profiles preserves results once, transfers awards and party membership',()=>{
 const r=record('a');r.entries.push({profileId:'Guest',name:'Guest',score:12,winner:true,team:false});const d={...emptyClub(),profiles:[profile('Alex'),profile('Guest')],results:[r],awards:[{id:'award',profileId:'Guest',name:'Guest',title:'Creative Spark',note:'Well played',date:r.date}],parties:[{id:'party',title:'Game day',date:r.date,players:['Alex','Guest'],games:['scatter'],status:'active' as const}],activePartyId:'party'};
 const next=mergeProfiles(d,'Guest','Alex');assert.equal(next.profiles.length,1);assert.equal(next.results[0].entries.length,1);assert.equal(profileStats(next,'Alex').points,5);assert.equal(next.awards[0].profileId,'Alex');assert.deepEqual(next.parties[0].players,['Alex']);assert.equal(validateClub(next),next);const removed=removeProfile(next,'Alex');assert.equal(removed.results.length,0);assert.equal(removed.awards.length,0);assert.equal(removed.parties[0].players.length,0);
});
test('validated backups reject malformed or duplicate data',()=>{
 assert.deepEqual(validateClub(emptyClub()),emptyClub());assert.throws(()=>validateClub({version:2}));const d={...emptyClub(),profiles:[profile('Alex'),profile('Alex')]};assert.throws(()=>validateClub(d),/Duplicate/);assert.throws(()=>validateClub({...emptyClub(),profiles:[{...profile('Alex'),color:'red;display:none'}]}));
});
test('certificate text is escaped and sharing prepares a draft without sending',()=>{
 const a:Award={id:'cert',profileId:'Alex',name:'Alex <script>',title:'Drawing Champion',note:'A & B < C',date:'2026-11-10T00:00:00Z'};const svg=certificateSvg(a,'Speed Drawing');assert(svg.includes('Alex &lt;script&gt;'));assert(!svg.includes('<script>'));assert(svg.includes('A &amp; B &lt; C'));assert(svg.includes('1200'));const draft=emailDraft(a,'parent@example.com','Speed Drawing');assert(draft.startsWith('mailto:'));assert(decodeURIComponent(draft).includes('Please find their certificate attached.'));assert.throws(()=>emailDraft(a,'parent@example.com\nbcc:bad@example.com','Speed Drawing'));
});
test('result adapter distinguishes unscored drawings, unfinished stories, cooperative escapes and Battleship wins',()=>{
 const base={id:'s',game:'speed',settings:defaults,scores:[9,2,1,0],hits:[14,0],completed:true,message:'',round:1};assert.equal(resultSeed({...base,speed:{round:3}}).sessionId,'s:speed:3');assert.equal(resultSeed(base).slots.length,0);assert.equal(resultSeed({...base,game:'story'}).completedTogether,false);assert(resultSeed({...base,game:'story',round:12}).completedTogether);assert(resultSeed({...base,game:'escape',message:'You escaped!'}).completedTogether);assert(!resultSeed({...base,game:'escape',message:'Time’s up'}).completedTogether);assert(resultSeed({...base,game:'battle',battle:{size:9,ships:[2,3,4,5]}}).slots[0].winner);
});
