import test from 'node:test';
import assert from 'node:assert/strict';
import {generate,defaults,adventure} from './engine';
import {adultConcepts,adultQuickCategories,adultStoryConstraints,adultTwists,storyTurn,battleConfig,battleTarget} from './adultGames';
import {createSpeedRound,drawingPool,adultDrawingChallenges} from './drawingDeck';
const settings={...defaults,difficulty:'Hard',age:5};

test('adult drawing and deduction content is used regardless of child age',()=>{
 for(let i=0;i<100;i++){
  const drawing=generate('impossible',settings);assert(drawing.text.split('. ').length>=2);assert(drawing.instruction.includes('constraint'));
  assert(adultConcepts.includes(generate('detective',settings).text));
  const quick=generate('five',settings);assert(adultQuickCategories.some(category=>quick.text===`Name three ${category}.`));
  const story=generate('story',settings);assert(story.instruction.startsWith('Adults:'));assert(adultStoryConstraints.some(c=>story.instruction.includes(c)));
 }
});
test('children get simple content and adults get complex content in Speed Drawing without changing the card game',()=>{
 for(const difficulty of ['Easy','Medium','Hard']){
  let game=createSpeedRound(undefined,difficulty);let seen=new Set<string>();const size=drawingPool(difficulty).length;
  for(let i=0;i<100;i++){
   assert.equal(game.items.length,16);assert.equal(game.difficulty,difficulty);
   if(difficulty==='Hard')assert(game.items.every(word=>adultDrawingChallenges.includes(word)));
   for(const word of game.items){if(seen.size===size)seen=new Set();assert(!seen.has(word));seen.add(word)}
   const next=createSpeedRound(game);assert(next.items.every(word=>!game.items.includes(word)));game=next;
  }
 }
});
test('adult story turns preserve continuity while adding constraints and nuanced twists',()=>{
 const opening=storyTurn(settings,1);assert(adultStoryConstraints.includes(opening.text));
 assert(adultTwists.includes(storyTurn(settings,settings.players.length).text));
 assert(storyTurn(settings,settings.players.length*3-1).text.includes('dilemma'));
 assert(!generate('story',{...defaults,difficulty:'Easy'}).instruction.includes('Adults:'));
});
test('Battleship uses a larger adult board and fleet',()=>{
 assert.deepEqual(battleConfig('Easy'),{size:5,ships:[2,3,4]});
 assert.deepEqual(battleConfig('Medium'),{size:7,ships:[2,3,4]});
 assert.deepEqual(battleConfig('Hard'),{size:9,ships:[2,3,4,5]});
 assert.equal(battleTarget(battleConfig('Hard')),14);
});
function permutations<T>(a:T[]):T[][]{if(!a.length)return [[]];return a.flatMap((v,i)=>permutations(a.filter((_,j)=>i!==j)).map(rest=>[v,...rest]))}
test('all six adult escape puzzles have unique, verifiable solutions across 200 adventures',()=>{
 for(let i=0;i<200;i++){
  const p=adventure(settings);assert.equal(p.length,6);
  const first=p[0].text.match(/\d+/g)!.map(Number);assert.equal(+p[0].answer,(first[1]-first[0])/2);
  const sequence=p[1].text.match(/\d+/g)!.map(Number);assert.equal(+p[1].answer,sequence[0]+14);
  const order=p[2].answer.split('');const [d,b,a,c]=order;
  const solutions=permutations(order).filter(row=>row.indexOf(c)===row.indexOf(a)+1&&row.indexOf(b)>0&&row.indexOf(b)<3&&row.indexOf(d)<row.indexOf(b));assert.equal(solutions.length,1);assert.equal(solutions[0].join(''),p[2].answer);
  const dial=p[3].text.match(/\d+/g)!.map(Number);assert.equal(+p[3].answer,(dial[2]+dial[3]-dial[4])%12);
  const time=p[4].text.match(/\d+/g)!.map(Number);const minutes=time[0]*60+time[1]+time[2]+time[3]+time[4];assert.equal(p[4].answer,`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`);
  assert.equal(+p[5].answer,+p[0].answer*2 + +p[1].answer - +p[3].answer);
 }
});
