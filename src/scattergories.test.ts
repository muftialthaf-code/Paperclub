import test from 'node:test';import assert from 'node:assert/strict';
import{scatterCategories,scatterDefaults,createScatterRound,letterPool,scatterScores,awardScatter,stopScatter,scatterTime}from'./scatterEngine';
test('library has 100+ different child-safe categories',()=>{assert(scatterCategories.length>=100);assert.equal(new Set(scatterCategories.map(c=>c.title)).size,scatterCategories.length);assert.equal(new Set(scatterCategories.map(c=>c.group)).size,8)});
test('all levels generate answerable, varied rounds with no letter repetition before exhaustion',()=>{
 for(const difficulty of ['Easy','Medium','Hard'])for(const count of [10,12]as const){
  const pool=letterPool(difficulty,count);assert(pool.length>=8);let seen=new Set<string>();let s=createScatterRound({...scatterDefaults,difficulty,count});
  for(let round=0;round<200;round++){
   if(seen.size===pool.length)seen=new Set();assert(!seen.has(s.letter));seen.add(s.letter);
   assert.equal(s.categories.length,count);const cats=s.categories.map(id=>scatterCategories.find(c=>c.id===id)!);
   assert.equal(new Set(cats.map(c=>c.family)).size,count);assert(new Set(cats.map(c=>c.group)).size>=Math.ceil(count/2));
   cats.forEach(c=>assert(c.examples.some(w=>w[0].toUpperCase()===s.letter)));
   if(difficulty==='Easy'){assert(!'QXZ'.includes(s.letter));assert(cats.every(c=>c.level===0))}if(difficulty==='Hard')assert(cats.some(c=>c.level===2));
   const next=createScatterRound(s.config,s);assert.notEqual(next.letter,s.letter);assert.notDeepEqual([...next.categories].sort(),[...s.categories].sort());s=next;
  }
 }
 assert(letterPool('Hard',12).some(l=>!'ABCDEHLMPRST'.includes(l)));
});
test('classic and house-rule scoring is bounded, reversible and preserved across rounds',()=>{
 for(const houseRule of [false,true]){
  let s=createScatterRound({...scatterDefaults,houseRule});s=awardScatter(s,0,2);assert.equal(s.points[0][0],houseRule?2:1);s=awardScatter(s,0,-1);assert.equal(s.points[0][0],houseRule?1:0);s=awardScatter(s,0,-5);assert.equal(s.points[0][0],0);s=awardScatter(s,1,1);s={...s,cursor:1};s=awardScatter(s,0,1);const totals=scatterScores(s);const next=createScatterRound(s.config,s);assert.deepEqual(scatterScores(next),totals);assert.deepEqual(next.config.players,s.config.players);assert.equal(next.round,2);assert(next.points.every(row=>row.every(n=>n===0)));
 }
});
test('timer arithmetic handles pause, expiry and saved deadlines',()=>{
 let s=createScatterRound(scatterDefaults);s={...s,deadline:1000+120000};assert.equal(scatterTime(s,11000),110000);const paused={...s,milliseconds:scatterTime(s,11000),deadline:null};assert.equal(scatterTime(paused,999999),110000);assert.equal(scatterTime(s,150000),0);const ended=stopScatter(s,150000);assert.equal(ended.phase,'compare');assert.equal(ended.deadline,null);assert.equal(ended.milliseconds,0);assert.deepEqual(JSON.parse(JSON.stringify(ended)),ended);
});

test('letters are drawn randomly even from an alphabetically ordered saved bag',()=>{
 const previous=createScatterRound(scatterDefaults);previous.letter='A';previous.lettersLeft=['B','C','D','E'];const random=Math.random;
 try{Math.random=()=>.99;const next=createScatterRound(scatterDefaults,previous);assert.equal(next.letter,'E');assert.deepEqual(next.lettersLeft,['B','C','D'])}finally{Math.random=random}
});
test('refresh gives new content, a full paused timer and retains awarded points and names',()=>{
 let previous=createScatterRound(scatterDefaults);previous=awardScatter(previous,0,1);previous={...previous,deadline:Date.now()+1000,milliseconds:1000,phase:'compare'};const next=createScatterRound(previous.config,previous);assert.notEqual(next.letter,previous.letter);assert.notDeepEqual([...next.categories].sort(),[...previous.categories].sort());assert.deepEqual(next.base,[1,0]);assert.equal(next.deadline,null);assert.equal(next.milliseconds,120000);assert.equal(next.phase,'play');assert.deepEqual(next.config.players,previous.config.players);
});
