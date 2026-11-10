import test from 'node:test';
import assert from 'node:assert/strict';
import {secretMessage,createSecretCode,encodeSecretMessage,codeSymbols,easyCodeWords,type CipherKind} from './secretCode';
import {generate,defaults} from './engine';

test('Easy is always a single 3–4-letter word, at every age',()=>{
 assert(easyCodeWords.length>=100);
 for(const age of [5,6,8,14])for(let i=0;i<300;i++)assert.match(secretMessage('Easy',age),/^[A-Z]{3,4}$/);
});
test('Medium is always a longer word or a short phrase',()=>{
 for(const age of [5,6,8,14])for(let i=0;i<300;i++){
  const words=secretMessage('Medium',age).split(' ');
  assert(words.length===1?words[0].length>=7:words.length===2||words.length===3);
 }
});
test('Hard always produces a sentence, including when the youngest age is selected',()=>{
 for(const age of [5,6,8,14])for(let i=0;i<300;i++){
  const c=generate('code',{...defaults,difficulty:'Hard',age});
  assert(c.answer!.split(' ').length>=5);assert(c.text.includes(' / '));
 }
});
test('all five cipher methods preserve complete phrases and decode without information loss',()=>{
 const answer='THE FRIENDLY DRAGON FOUND THE GOLDEN KEY';
 for(const kind of ['numbers','reverse','shift','symbols','twoStage'] as CipherKind[]){
  for(const shift of [2,3,4,5]){
   const c=encodeSecretMessage(answer,kind,shift);
   const decoded=c.text.split(' / ').map(word=>word.split(' · ').map(token=>{
    switch(kind){
     case 'numbers':return String.fromCharCode(+token+64);
     case 'reverse':return String.fromCharCode(155-token.charCodeAt(0));
     case 'shift':return String.fromCharCode(65+(token.charCodeAt(0)-65-shift+26)%26);
     case 'symbols':return String.fromCharCode(65+codeSymbols.indexOf(token));
     case 'twoStage':return String.fromCharCode(+token-shift+64);
    }
   }).join('')).join(' ');
   assert.equal(decoded,answer);assert.equal(c.answer,answer);
   assert(!c.text.includes('undefined'));assert(c.instruction.includes('/ separates'));
  }
 }
});
test('fresh Hard sentences provide ample replay variety',()=>{
 const answers=new Set(Array.from({length:500},()=>createSecretCode('Hard',8).answer));
 assert(answers.size>300);
});

test('Hard uses only direct A1–Z26 numbers, with sentences retained',()=>{
 for(const age of [5,8,14])for(let i=0;i<300;i++){
  const c=createSecretCode('Hard',age);
  assert.match(c.text,/^[0-9 ·/]+$/);assert.equal(c.hint,'A = 1, B = 2 … Z = 26');
  const decoded=c.text.split(' / ').map(word=>word.split(' · ').map(n=>String.fromCharCode(+n+64)).join('')).join(' ');
  assert.equal(decoded,c.answer);assert(c.answer!.split(' ').length>=5);
 }
});
