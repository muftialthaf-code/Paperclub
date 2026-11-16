import{spokenPrompt,type SpokenPrompt}from'./noPropsContent';
export type NoPropsConfig={players:string[],teams:boolean,difficulty:string,scoring:boolean,timed:boolean,prep:number,speech:number,response:number,questions:10|20,hardWords:4|5,audienceQuestions:boolean,randomSpeaker:boolean,family?:boolean,adults?:boolean[]};
/** Family mix: adult turns use Hard; kid turns use the chosen Easy/Medium level. Off when Hard is chosen for everyone. */
export const familyMix=(c:NoPropsConfig)=>!!c.family&&c.difficulty!=='Hard';
export const isAdultTurn=(c:NoPropsConfig,player:number)=>familyMix(c)&&!!c.adults?.[player];
export const levelFor=(c:NoPropsConfig,player:number)=>isAdultTurn(c,player)?'Hard':c.difficulty;
export type NoPropsState={runId:string,game:string,config:NoPropsConfig,round:number,turn:number,player:number,prompt:SpokenPrompt,history:string[],sequence:SpokenPrompt[],questionIndex:number,phase:'ready'|'prep'|'readyToSpeak'|'speaking'|'review'|'finished',milliseconds:number,deadline:number|null,scores:number[],responded:boolean,revealed:boolean,decision?:'success'|'miss',side?:'A'|'B',example:boolean,level?:string};
export function noPropsDefaults(game:string,difficulty='Medium'):NoPropsConfig{
 const easy=difficulty==='Easy',hard=difficulty==='Hard';
 return {players:['Player 1','Player 2'],teams:false,difficulty,scoring:['np-countdown','np-association','np-rapid','np-opposite'].includes(game),timed:!['np-side','np-scenario','np-truths','np-yesno'].includes(game),prep:game==='np-convince'?15:0,speech:game==='np-rapid'?(easy?60:hard?30:45):game==='np-yesno'?(easy?30:hard?60:45):60,response:game==='np-countdown'?(easy?7:hard?5:10):easy?5:hard?2:3,questions:10,hardWords:5,audienceQuestions:true,randomSpeaker:false};
}
export const isResponseGame=(game:string)=>['np-countdown','np-association','np-opposite'].includes(game);
export function noPropsDuration(s:NoPropsState,phase:'prep'|'speaking'='speaking'){return (phase==='prep'?s.config.prep:isResponseGame(s.game)?s.config.response:s.config.speech)*1000}
export function noPropsRemaining(s:NoPropsState,now=Date.now()){return s.deadline?Math.max(0,s.deadline-now):s.milliseconds}
export function createNoPropsGame(game:string,config:NoPropsConfig,previous?:NoPropsState,avoidHistory:string[]=[]):NoPropsState{
 const history=[...(previous?.history||avoidHistory)];const sequence:SpokenPrompt[]=[];const count=game==='np-rapid'?config.questions:1;
 const player=previous?(config.randomSpeaker&&config.players.length>1?((previous.player+1+Math.floor(Math.random()*(config.players.length-1)))%config.players.length):(previous.player+1)%config.players.length):(config.randomSpeaker?Math.floor(Math.random()*config.players.length):0);
 const level=levelFor(config,player);for(let i=0;i<count;i++){const p=spokenPrompt(game,level,history,config.hardWords);sequence.push(p);history.push(p.key)}
 const s:NoPropsState={runId:previous?.runId||crypto.randomUUID(),game,config,round:(previous?.round||0)+1,turn:0,player,prompt:sequence[0],sequence,history,questionIndex:0,phase:'ready',milliseconds:0,deadline:null,scores:previous?[...previous.scores]:config.players.map(()=>0),responded:false,revealed:false,example:false,level};
 s.milliseconds=noPropsDuration(s,config.prep>0?'prep':'speaking');return s;
}
export function startNoPropsTimer(s:NoPropsState,now=Date.now()):NoPropsState{
 const phase=s.phase==='ready'&&s.config.prep>0?'prep':s.phase==='prep'?'prep':'speaking';
 const left=s.phase==='readyToSpeak'?noPropsDuration(s):s.milliseconds||noPropsDuration(s,phase);
 return {...s,phase,deadline:now+left,milliseconds:left};
}
export function pauseNoPropsTimer(s:NoPropsState,now=Date.now()){return {...s,milliseconds:noPropsRemaining(s,now),deadline:null}}
export function resetNoPropsTimer(s:NoPropsState){const phase=s.phase==='prep'||s.phase==='ready'&&s.config.prep>0?'prep':'speaking';return {...s,deadline:null,milliseconds:noPropsDuration(s,phase),phase:s.phase==='ready'?s.phase:phase} as NoPropsState}
export function expireNoPropsTimer(s:NoPropsState):NoPropsState{return {...s,deadline:null,milliseconds:0,phase:s.phase==='prep'?'readyToSpeak':'review'}}
export function endNoPropsRound(s:NoPropsState,now=Date.now()):NoPropsState{return {...s,deadline:null,milliseconds:noPropsRemaining(s,now),phase:'review'}}
export function noPropsPoint(s:NoPropsState,player:number,delta:number){return {...s,scores:s.scores.map((n,i)=>i===player?n+delta:n)}}
export function noPropsDecision(s:NoPropsState,success:boolean):NoPropsState{
 if(s.decision)return s;
 const delta=s.game==='np-countdown'?(success?1:0):s.game==='np-opposite'?(success?0:-1):0;
 return {...(s.config.scoring?noPropsPoint(s,s.player,delta):s),phase:'review',deadline:null,responded:true,decision:success?'success':'miss'};
}
export function nextSpokenQuestion(s:NoPropsState,correct=false):NoPropsState{
 if(s.phase==='review'||s.phase==='finished')return s;
 const scored=correct&&s.config.scoring?noPropsPoint(s,s.player,1):s;
 if(s.questionIndex===s.sequence.length-1)return {...scored,phase:'review',deadline:null,responded:true};
 return {...scored,questionIndex:s.questionIndex+1,prompt:s.sequence[s.questionIndex+1],revealed:false,responded:false};
}
export function nextYesNoQuestion(s:NoPropsState):NoPropsState{
 const prompt=spokenPrompt(s.game,levelFor(s.config,s.player),s.history);
 return {...s,prompt,history:[...s.history,prompt.key],questionIndex:s.questionIndex+1};
}
export function associationTurn(s:NoPropsState,success:boolean,now=Date.now()):NoPropsState{
 const scored=!success&&s.config.scoring?noPropsPoint(s,s.player,-1):s;
 return {...scored,player:(s.player+1)%s.config.players.length,turn:s.turn+1,phase:'speaking',milliseconds:s.config.response*1000,deadline:now+s.config.response*1000,responded:false,decision:undefined};
}
