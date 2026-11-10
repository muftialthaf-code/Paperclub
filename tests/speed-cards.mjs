import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import assert from 'node:assert/strict';
const bundle=await build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',write:false,loader:{'.css':'empty'},define:{'process.env.NODE_ENV':'"production"'}});
const source=bundle.outputFiles[0].text;
const wait=()=>new Promise(r=>setTimeout(r,20));let dom,d;
async function boot(saved={}){
 dom=new JSDOM('<div id="root"></div>',{url:'https://paperclub.test',runScripts:'dangerously',pretendToBeVisual:true});
 dom.window.scrollTo=()=>{};dom.window.fetch=()=>{throw Error('Gameplay must not require network')};
 for(const[k,v]of Object.entries(saved))dom.window.localStorage.setItem(k,v);
 dom.window.eval(source);d=dom.window.document;await wait();
}
async function click(text){const b=[...d.querySelectorAll('button')].find(b=>b.textContent.includes(text));assert(b,`Missing ${text}`);b.click();await wait()}
const state=()=>JSON.parse(dom.window.localStorage.getItem('pc-session')).speed;
const cards=()=>[...d.querySelectorAll('.mystery-card')];
await boot();await click('Start playing');await click('Speed Drawing');
assert(!d.querySelector('[role="dialog"]'));assert.equal(cards().length,16);
assert(!d.querySelector('.play-header'));assert(!d.querySelector('input,canvas,.timer,.score-panel'));
assert.deepEqual(cards().map(b=>b.querySelector('.mystery-number').textContent),Array.from({length:16},(_,i)=>String(i+1)));
assert(cards().every(b=>b.textContent.includes('Tap to reveal')&&b.getAttribute('aria-pressed')==='false'));
assert(d.body.textContent.includes('Round 1'));assert(d.body.textContent.includes('0/16 revealed'));
for(const index of [4,0,15]){cards()[index].click();await wait();assert.equal(cards()[index].querySelector('.mystery-word').textContent,state().items[index]);}
assert(d.body.textContent.includes('3/16 revealed'));cards()[4].click();await wait();assert(d.body.textContent.includes('2/16 revealed'));assert(!cards()[4].querySelector('.mystery-word'));
const first=state().items;await click('Reset – New 16 Words');assert(state().items.every(w=>!first.includes(w)));assert(d.body.textContent.includes('Round 2'));assert(d.body.textContent.includes('0/16 revealed'));assert.equal(cards().length,16);
for(let n=0;n<20;n++){const previous=state().items;await click('Reset – New 16 Words');assert(state().items.every(w=>!previous.includes(w)));assert(cards().every(b=>b.getAttribute('aria-pressed')==='false'));}
cards()[8].click();await wait();const snapshot=state();const saved={};for(let i=0;i<dom.window.localStorage.length;i++){const k=dom.window.localStorage.key(i);saved[k]=dom.window.localStorage.getItem(k)}dom.window.close();
await boot(saved);await click('Resume game');assert.deepEqual(state(),snapshot);assert(cards()[8].getAttribute('aria-pressed')==='true');
dom.window.close();
// Existing saved memory-version games migrate into a fresh card grid.
const legacy=JSON.parse(saved['pc-session']);delete legacy.speed;legacy.memory={phase:'recall',items:first};
await boot({'pc-session':JSON.stringify(legacy)});await click('Resume game');assert.equal(cards().length,16);assert(cards().every(b=>b.getAttribute('aria-pressed')==='false'));assert(d.body.textContent.includes('Round 1'));dom.window.close();
console.log('PASS: direct start; 16 numbered cards; reveal/hide/progress; 22 fresh resets; no setup/timers/scoring; persisted resume; legacy migration; network-free gameplay');
