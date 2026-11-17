import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
import{games,rules,generate,defaults}from'./engine';import{noPropsRules}from'./noPropsCatalog';
/**
 * Whoever runs a game may be a parent, a friend, a grandparent or a café guest, so gameplay text says "the host".
 * Account and certificate screens may still talk about a parent or guardian because that is who they are for.
 */
const gameplayFiles=['src/engine.ts','src/main.tsx','src/NoPropsGame.tsx','src/noPropsCatalog.ts','src/newGames.ts','src/Scattergories.tsx','src/ExtraGamePrompt.tsx','src/business/venueMenu.ts'];
const allowed=['Ages 5\\u201314 (and grown-ups)','ParentLogin','parent-note','parentId'];
test('gameplay text never assumes the host is a parent',()=>{
 for(const file of gameplayFiles){const text=readFileSync(file,'utf8');const stripped=allowed.reduce((t,a)=>t.split(a).join(''),text);
  const hit=stripped.match(/.{0,40}\b(the parent|The parent|PARENT|Parent:|parent[ -]controlled|parent[ -]awarded|parent confirmed|grown-up)\b.{0,40}/);assert.equal(hit,null,`${file}: ${hit?.[0]}`)}
});
test('rules and generated instructions for every game avoid parent wording',()=>{
 for(const[id,steps]of Object.entries({...rules,...noPropsRules}))for(const step of steps)assert.doesNotMatch(step,/\bparent\b/i,`${id}: ${step}`);
 for(const g of games.filter(x=>x.collection==='paper'))for(const difficulty of['Easy','Medium','Hard']){try{const c=generate(g.id,{...defaults,difficulty},[]);assert.doesNotMatch(c.instruction||'',/\bparent\b/i,`${g.id} ${difficulty}: ${c.instruction}`)}catch(e){if(e instanceof assert.AssertionError)throw e}}
});
