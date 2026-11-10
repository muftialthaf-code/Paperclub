import test from 'node:test';
import assert from 'node:assert/strict';
import {drawingChallenges,drawingCategories,createSpeedRound,toggleSpeedCard} from './drawingDeck';

test('library has at least 200 unique challenges across all required categories',()=>{
 assert(drawingChallenges.length>=200);
 assert.equal(new Set(drawingChallenges).size,drawingChallenges.length);
 assert.equal(Object.keys(drawingCategories).length,11);
});
test('reset gives exactly 16 hidden cards, changes every word, increments round and never reuses a complete selection',()=>{
 let game=createSpeedRound();const combinations=new Set<string>();
 for(let i=0;i<500;i++){
  assert.equal(game.items.length,16);assert.equal(new Set(game.items).size,16);
  assert.equal(game.revealed.length,16);assert(game.revealed.every(v=>v===false));assert.equal(game.round,i+1);
  const signature=[...game.items].sort().join('|');assert(!combinations.has(signature));combinations.add(signature);
  const next=createSpeedRound({...game,revealed:Array(16).fill(true)});
  assert(next.items.every(word=>!game.items.includes(word)));game=next;
 }
});
test('individual challenges do not repeat until every word in the pool has been used',()=>{
 let game=createSpeedRound();let used=new Set<string>();let cycles=0;
 for(let i=0;i<1000;i++){
  for(const word of game.items){
   if(used.size===drawingChallenges.length){used=new Set();cycles++}
   assert(!used.has(word),`Repeated ${word} before library exhaustion (${used.size}/${drawingChallenges.length})`);used.add(word);
  }
  game=createSpeedRound(game);
 }
 assert(cycles>=50);
});
test('revealing and hiding affects only the chosen card and never changes words',()=>{
 const game=createSpeedRound();const revealed=toggleSpeedCard(game,7);
 assert.equal(revealed.revealed.filter(Boolean).length,1);assert(revealed.revealed[7]);
 assert.deepEqual(revealed.items,game.items);assert(game.revealed.every(v=>!v));
 assert.deepEqual(toggleSpeedCard(revealed,7),game);
});
test('persisted shuffle bag survives reload without losing reveal or reset history',()=>{
 let game=toggleSpeedCard(createSpeedRound(),15);game=createSpeedRound(game);game=toggleSpeedCard(game,3);
 const restored=JSON.parse(JSON.stringify(game));assert.deepEqual(restored,game);
 const next=createSpeedRound(restored);assert.equal(next.round,3);assert(next.items.every(w=>!game.items.includes(w)));
 assert.equal(next.selections.length,3);
});
