import{JSDOM}from'jsdom';import{build}from'esbuild';import assert from'node:assert/strict';
const bundle=await build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
const dom=new JSDOM('<div id="root"></div>',{url:'https://paperclub.test',runScripts:'dangerously',pretendToBeVisual:true});dom.window.scrollTo=()=>{};dom.window.eval(bundle.outputFiles[0].text);const d=dom.window.document;const wait=()=>new Promise(r=>setTimeout(r,15));await wait();
async function click(text){const b=[...d.querySelectorAll('button')].find(e=>e.textContent.includes(text));assert(b,`Missing ${text}`);b.click();await wait()}
async function value(el,v){const proto=el.tagName==='SELECT'?dom.window.HTMLSelectElement.prototype:dom.window.HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,v);el.dispatchEvent(new dom.window.Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));await wait()}
const saved=()=>JSON.parse(dom.window.localStorage.getItem('pc-session'));
await click('Start playing');await click('Speed Drawing');assert.equal(d.querySelectorAll('.mystery-card').length,16);const difficulty=d.querySelector('[aria-label="Speed Drawing difficulty"]');assert([...difficulty.options].some(o=>o.textContent==='Hard · Adults'));await value(difficulty,'Hard');assert.equal(saved().speed.difficulty,'Hard');assert.equal(saved().speed.round,2);await click('Reset – New 16 Words');assert.equal(saved().speed.difficulty,'Hard');assert.equal(saved().speed.round,3);assert.equal(d.querySelectorAll('.mystery-card').length,16);d.querySelector('[aria-label="Back to rules and settings"]').click();await wait();await click('Save & leave to game library');
for(const name of ['The Impossible Drawing','Doodle Detective','The 5-Second Challenge','Story Builders','Secret Code','Paper Battleship','Paper Escape Room']){
 await click(name);const labels=[...d.querySelectorAll('label')];const level=labels.find(e=>e.textContent.startsWith('Difficulty')).querySelector('select');await value(level,'Easy');const age=labels.find(e=>e.textContent.startsWith('Youngest player')).querySelector('select');await value(age,'5');await value(level,'Hard');assert(age.disabled);assert([...level.options].find(o=>o.value==='Hard').textContent.includes('Adults'));await click('Everyone ready?');assert.equal(saved().settings.difficulty,'Hard');assert.equal(saved().settings.age,5);assert(d.querySelector('.game-title').textContent.includes('Adults'));
 if(name==='The Impossible Drawing')assert(saved().challenge.instruction.includes('constraint'));
 if(name==='Doodle Detective'){assert(d.querySelector('.hidden-prompt'));await click('Ready for the secret?');assert(saved().challenge.instruction.includes('abstract idea'));}
 if(name==='The 5-Second Challenge')assert(saved().challenge.instruction.startsWith('Adult challenge'));
 if(name==='Story Builders'){assert(saved().challenge.instruction.startsWith('Adults:'));await click('Next storyteller');assert(saved().challenge.instruction.includes('Preserve earlier facts'));}
 if(name==='Secret Code'){assert.match(saved().challenge.text,/^[0-9 ·/]+$/);assert(saved().challenge.answer.split(' ').length>=5);}
 if(name==='Paper Battleship'){
  assert.deepEqual(saved().battle,{size:9,ships:[2,3,4,5]});assert(d.body.textContent.includes('0/14 enemy squares hit'));
  const coords=['A1','B1','C1','D1','E1','F1','G1','H1','I1','A2','B2','C2','D2','E2'];
  for(let i=0;i<14;i++){await value(d.querySelector('label input'),coords[i]);await click('Record hit');if(i<13){assert(!d.querySelector('.finish'));await value(d.querySelector('label input'),coords[i]);await click('Record miss')}}assert(d.querySelector('.finish'));assert.equal(saved().hits[0],14);
 }else if(name==='Paper Escape Room'){
  const puzzles=saved().puzzles;assert.equal(puzzles.length,6);
  for(const p of puzzles){assert(!d.querySelector('.answer'));await value(d.querySelector('form input'),p.answer);d.querySelector('form').dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));await wait()}
  assert(d.body.textContent.includes('You escaped!'));
 }else await click('Finish session');
 await click('Choose another game');
}
dom.window.close();console.log('PASS: adult difficulty selected and played in all eight games at child age 5; 16-card flow preserved; 14-hit Battleship finish; all six adult escape locks; A1–Z26 Secret Code');
