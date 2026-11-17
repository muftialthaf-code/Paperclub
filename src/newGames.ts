import type{Challenge,Settings}from'./engine';
import{ladderPools,anagramPools,scrambleWord}from'./wordGames';
import{inventionPools,dilemmaPools}from'./creativeGames';
export const newGameIds=['ladder','anagram','invent','rather'];
export function chooseContent<T extends{key:string}>(pool:T[],history:string[]):T{
 if(!pool.length)throw Error('No challenges available');
 const keys=new Set(pool.map(p=>p.key));const own=history.filter(k=>keys.has(k));
 const consumed=own.length%pool.length;const used=new Set(consumed?own.slice(-consumed):[]);
 let available=pool.filter(p=>!used.has(p.key)&&p.key!==own.at(-1));if(!available.length)available=pool.filter(p=>!used.has(p.key));
 return available[Math.floor(Math.random()*available.length)];
}
export function newGameChallenge(id:string,s:Settings,history:string[]):Challenge{
 const level=['Easy','Medium','Hard'].includes(s.difficulty)?s.difficulty:'Medium';
 if(id==='ladder'){const item=chooseContent(ladderPools[level],history);const path=Math.random()<.5?[...item.path].reverse():item.path;return {key:item.key,text:`${path[0]} → ${path.at(-1)}`,from:path[0],to:path.at(-1),minimum:item.minimum,steps:path.length-1,answer:path.join(' → '),hint:'Keep the word length fixed. Change exactly one letter each time; every step must be a real English word.',instruction:'Write a word ladder on paper. Change one letter at a time, using valid English words, until you reach the target. The host may award a point for a valid ladder and a bonus for the fewest changes.'}}
 if(id==='anagram'){const item=chooseContent(anagramPools[level],history);return {key:item.key,text:scrambleWord(item.word),answer:item.word,category:item.category,hint:`The answer has ${item.word.length} letters. Category: ${item.category}.`,instruction:'Host: copy or read the scrambled letters onto paper. Players solve on their own paper; award points manually. Next Word keeps the same round timer running.'}}
 if(id==='invent'){const item=chooseContent(inventionPools[level],history);return {key:item.key,text:item.text,category:item.category,instruction:'Draw your invention on paper, give it a name, and explain how it works. After the timer, present your ideas and vote. There is no single correct answer.'}}
 const item=chooseContent(dilemmaPools[level],history);return {key:item.key,text:'Would you rather…',optionA:item.a,optionB:item.b,category:item.category,instruction:'Choose independently, then reveal A or B together. Take turns explaining why. There is no correct answer; listen to each other’s reasoning.'};
}
