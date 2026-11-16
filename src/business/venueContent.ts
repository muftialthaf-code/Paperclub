import type{VenuePrompt}from'./types';import{getLocale}from'../i18n/locale';
let entries:VenuePrompt[]=[];const turns=new Map<string,number>();
export function setVenueContent(prompts:VenuePrompt[]){entries=prompts.filter(p=>p.status==='approved');turns.clear()}
export function clearVenueContent(){entries=[];turns.clear()}
export function themedPrompt(gameId:string,difficulty:string,history:string[]=[]){const pool=entries.filter(p=>p.gameId===gameId&&p.locale===getLocale()&&p.difficulty===difficulty);if(!pool.length)return null;const key=gameId+':'+difficulty+':'+getLocale(),turn=turns.get(key)||0;turns.set(key,turn+1);if(turn%2)return null;const available=pool.filter(p=>!history.includes('venue:'+p.id)&&!history.includes(p.text));const p=(available.length?available:pool)[Math.floor(Math.random()*(available.length||pool.length))];return{key:'venue:'+p.id,text:p.text}}
export function themedDrawingWords(difficulty:string){return entries.filter(p=>p.gameId==='speed'&&p.locale===getLocale()&&p.difficulty===difficulty).map(p=>p.text)}
