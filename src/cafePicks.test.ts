import test from 'node:test';import assert from 'node:assert/strict';
import{CAFE_PICKS}from'./business/cafePicks';import{games}from'./engine';
test('café picks are real, unique games that need no pens or paper',()=>{
 assert.ok(CAFE_PICKS.length>=8);assert.equal(new Set(CAFE_PICKS).size,CAFE_PICKS.length);
 for(const id of CAFE_PICKS){const g=games.find(x=>x.id===id);assert.ok(g,id);assert.ok(g.collection==='none'||['rather','five'].includes(id),id)}
});
