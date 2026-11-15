import type{NoPropsState}from'./noPropsEngine';
import type {Settings}from'./engine';
import type {ScatterState}from'./scatterEngine';
import{scatterScores}from'./scatterEngine';
import{battleTarget,type BattleConfig}from'./adultGames';
import{games}from'./engine';
import type {ResultSeed}from'./ResultRecorder';
type SessionView={noProps?:NoPropsState,id?:string,partyId?:string,game:string,settings:Settings,scores:number[],hits:number[],completed:boolean,message:string,round:number,scatter?:ScatterState,battle?:BattleConfig,speed?:{round:number,difficulty?:string}};
export function resultSeed(s:SessionView):ResultSeed{
 const scatter=s.game==='scatter'?s.scatter:undefined;
 const speed=s.game==='speed';const spoken=s.noProps;
 const cooperative=!spoken&&(s.game==='escape'||s.game==='story'||s.game!=='battle'&&!scatter&&!speed&&s.settings.mode==='Cooperative');
 const teams=spoken?spoken.config.teams:scatter?scatter.config.teams:s.settings.teams;
 const names=spoken?spoken.config.players:scatter?scatter.config.players:s.settings.players;
 const scores=spoken?spoken.scores:scatter?scatterScores(scatter):s.game==='battle'?s.hits:s.scores;
 const max=spoken?Math.max(...scores):Math.max(0,...scores);const hasWinner=spoken?spoken.config.scoring&&scores.some(score=>score!==0):max>0;
 const battleWon=s.game==='battle'&&s.completed&&max>=battleTarget(s.battle||{size:s.settings.difficulty==='Hard'?7:5,ships:[2,3,4]});
 return {sessionId:`${s.id||'legacy'}${speed?':speed:'+(s.speed?.round||s.round):''}`,gameId:s.game,gameName:games.find(g=>g.id===s.game)?.name||s.game,difficulty:spoken?spoken.config.difficulty:scatter?scatter.config.difficulty:speed?s.speed?.difficulty||s.settings.difficulty:s.settings.difficulty,slots:speed?[]:names.map((name,i)=>({name,score:cooperative||spoken&&!spoken.config.scoring?null:scores[i]??0,winner:!cooperative&&hasWinner&&scores[i]===max&&(s.game!=='battle'||battleWon)})),teams,cooperative,completedTogether:s.game==='escape'?s.completed&&s.message.includes('You escaped!'):s.game==='story'?s.completed&&s.round>=s.settings.players.length*3:false,partyId:s.partyId};
}
