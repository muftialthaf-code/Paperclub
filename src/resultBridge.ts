import type {Settings}from'./engine';
import type {ScatterState}from'./scatterEngine';
import{scatterScores}from'./scatterEngine';
import{battleTarget,type BattleConfig}from'./adultGames';
import{games}from'./engine';
import type {ResultSeed}from'./ResultRecorder';
type SessionView={id?:string,partyId?:string,game:string,settings:Settings,scores:number[],hits:number[],completed:boolean,message:string,round:number,scatter?:ScatterState,battle?:BattleConfig,speed?:{round:number,difficulty?:string}};
export function resultSeed(s:SessionView):ResultSeed{
 const scatter=s.game==='scatter'?s.scatter:undefined;
 const speed=s.game==='speed';
 const cooperative=s.game==='escape'||s.game==='story'||s.game!=='battle'&&!scatter&&!speed&&s.settings.mode==='Cooperative';
 const teams=scatter?scatter.config.teams:s.settings.teams;
 const names=scatter?scatter.config.players:s.settings.players;
 const scores=scatter?scatterScores(scatter):s.game==='battle'?s.hits:s.scores;
 const max=Math.max(0,...scores);
 const battleWon=s.game==='battle'&&s.completed&&max>=battleTarget(s.battle||{size:s.settings.difficulty==='Hard'?7:5,ships:[2,3,4]});
 return {sessionId:`${s.id||'legacy'}${speed?':speed:'+(s.speed?.round||s.round):''}`,gameId:s.game,gameName:games.find(g=>g.id===s.game)?.name||s.game,difficulty:scatter?scatter.config.difficulty:speed?s.speed?.difficulty||s.settings.difficulty:s.settings.difficulty,slots:speed?[]:names.map((name,i)=>({name,score:cooperative?null:scores[i]??0,winner:!cooperative&&max>0&&scores[i]===max&&(s.game!=='battle'||battleWon)})),teams,cooperative,completedTogether:s.game==='escape'?s.completed&&s.message.includes('You escaped!'):s.game==='story'?s.completed&&s.round>=s.settings.players.length*3:false,partyId:s.partyId};
}
