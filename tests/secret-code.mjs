import{JSDOM}from'jsdom';import{build}from'esbuild';import assert from'node:assert/strict';
const bundle=await build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
const dom=new JSDOM('<div id="root"></div>',{url:'https://paperclub.test',runScripts:'dangerously',pretendToBeVisual:true});dom.window.scrollTo=()=>{};dom.window.eval(bundle.outputFiles[0].text);const d=dom.window.document;const wait=()=>new Promise(r=>setTimeout(r,25));await wait();
async function click(text){const b=[...d.querySelectorAll('button')].find(x=>x.textContent.includes(text));assert(b,`Missing ${text}`);b.click();await wait()}
async function select(label,value){const el=[...d.querySelectorAll('label')].find(x=>x.textContent.startsWith(label)).querySelector('select');Object.getOwnPropertyDescriptor(dom.window.HTMLSelectElement.prototype,'value').set.call(el,value);el.dispatchEvent(new dom.window.Event('change',{bubbles:true}));await wait()}
await click('Start playing');
for(const level of ['Easy','Medium','Hard']){
 await click('Secret Code');assert(d.querySelector('.code-level-guide'));await select('Difficulty',level);await select('Youngest player',5);await click('Everyone ready?');assert(d.querySelector('.game-title').textContent.includes(level));
 for(let i=0;i<4;i++){
  const c=JSON.parse(dom.window.localStorage.getItem('pc-session')).challenge;
  const words=c.answer.split(' ');assert(level==='Easy'?/^[A-Z]{3,4}$/.test(c.answer):level==='Medium'?(words.length===1?c.answer.length>=7:words.length<=3):words.length>=5);
  if(level==='Hard'){assert.match(c.text,/^[0-9 ·/]+$/);assert.equal(c.hint,'A = 1, B = 2 … Z = 26');}assert(!d.querySelector('.answer'));await click('Show key');assert(!d.querySelector('.answer'));await click('Reveal answer');assert(d.querySelector('.answer').textContent.includes(c.answer));await click('Hide answer');assert(!d.querySelector('.answer'));await click('Next round');
 }
 await click('Finish session');await click('Choose another game');
}
const legacy=JSON.parse(dom.window.localStorage.getItem('pc-session'));legacy.settings.difficulty='Hard';legacy.settings.age=5;legacy.challenge={text:'3 · 1 · 20',answer:'CAT',instruction:'Old challenge'};legacy.completed=false;legacy.round=3;legacy.scores=[2,1,0,0];legacy.revealed=true;dom.window.close();
const restored=new JSDOM('<div id="root"></div>',{url:'https://paperclub.test',runScripts:'dangerously',pretendToBeVisual:true});restored.window.scrollTo=()=>{};restored.window.localStorage.setItem('pc-session',JSON.stringify(legacy));restored.window.eval(bundle.outputFiles[0].text);await wait();await wait();const migrated=JSON.parse(restored.window.localStorage.getItem('pc-session'));assert(migrated.challenge.answer.split(' ').length>=5);assert.equal(migrated.round,3);assert.deepEqual(migrated.scores,[2,1,0,0]);assert.equal(migrated.revealed,false);restored.window.close();
for(const oldText of ['UIF · PME · ESBHPO','21 · 9 · 6 / 7 · 19 · 2 · 8 · 16 · 15']){
 const previous={...legacy,challenge:{text:oldText,answer:'THE FRIENDLY DRAGON FOUND THE GOLDEN KEY',hint:'Old key'},revealed:true};
 const resumed=new JSDOM('<div id="root"></div>',{url:'https://paperclub.test',runScripts:'dangerously',pretendToBeVisual:true});resumed.window.scrollTo=()=>{};resumed.window.localStorage.setItem('pc-session',JSON.stringify(previous));resumed.window.eval(bundle.outputFiles[0].text);await wait();await wait();const current=JSON.parse(resumed.window.localStorage.getItem('pc-session'));assert.equal(current.challenge.answer,previous.challenge.answer);assert.equal(current.challenge.hint,'A = 1, B = 2 … Z = 26');const decoded=current.challenge.text.split(' / ').map(w=>w.split(' · ').map(n=>String.fromCharCode(+n+64)).join('')).join(' ');assert.equal(decoded,previous.challenge.answer);assert.equal(current.round,3);assert.deepEqual(current.scores,previous.scores);assert.equal(current.revealed,false);resumed.window.close();
}
console.log('PASS: all difficulty levels at age 5, fresh rounds, hint/answer privacy and saved-session migration with scores preserved');
