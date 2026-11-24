import{randomBytes,randomInt,createHash}from'node:crypto';
import{dilemmaPools}from'../../../src/creativeGames';
import{arabicDilemmas}from'../../../src/arabic/prompts';
import{likelyTo}from'../../../src/content/friendsContent';
import{likelyTo as arLikelyTo}from'../../../src/arabic/friendsContent';
import{fail}from'./core';

/**
 * Table Vote rooms: every guest plays on their own phone. Rooms live only in memory (no names or votes are stored),
 * belong to one venue location, last at most three hours and hold at most twelve players.
 * Prompts must come from the shipped content libraries, so a guest cannot push free text onto other phones.
 */
export type RoomKind='rather'|'likely';
export type RoomPlayer={id:string,name:string,keyHash:string,score:number,joined:number};
export type Room={code:string,locationId:string,kind:RoomKind,hostId:string,phase:'lobby'|'voting'|'reveal'|'finished',round:number,prompt:null|{text:string,a?:string,b?:string},players:RoomPlayer[],votes:Map<string,string>,created:number,touched:number,lastWinners:string[]};
export const ROOM_LIMITS={players:12,roomsPerLocation:10,lifetime:3*3600_000,idle:45*60_000};
const sha=(v:string)=>createHash('sha256').update(v).digest('hex');
const allowedPairs=new Set<string>();
for(const rows of [...Object.values(dilemmaPools),...Object.values(arabicDilemmas)])for(const r of rows as Array<{a:string,b:string}>)allowedPairs.add(r.a+'\n'+r.b);
const allowedLikely=new Set<string>();
for(const rows of Object.values(likelyTo))for(const x of rows)allowedLikely.add(`Who at the table is most likely to ${x}?`);
for(const rows of Object.values(arLikelyTo))for(const x of rows)allowedLikely.add(`مين على الطاولة أكثر واحد ممكن ${x}؟`);
export const cleanName=(v:unknown)=>{if(typeof v!=='string')return fail(400,'invalid_name');const n=v.replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);if(!n)return fail(400,'invalid_name');return n};
export class Rooms{
 private rooms=new Map<string,Room>();
 constructor(private now:()=>number=Date.now){}
 private sweep(){const t=this.now();for(const[c,r]of this.rooms)if(t-r.created>ROOM_LIMITS.lifetime||t-r.touched>ROOM_LIMITS.idle)this.rooms.delete(c)}
 count(locationId:string){this.sweep();return[...this.rooms.values()].filter(r=>r.locationId===locationId).length}
 create(locationId:string,kind:unknown,name:unknown){this.sweep();if(kind!=='rather'&&kind!=='likely')fail(400,'invalid_kind');const k=kind as RoomKind;
  if(this.count(locationId)>=ROOM_LIMITS.roomsPerLocation)fail(429,'too_many_rooms');
  let code='';for(let i=0;i<50;i++){code=String(randomInt(1000,10000));if(!this.rooms.has(code))break}if(this.rooms.has(code))fail(503,'no_free_code');
  const key=randomBytes(18).toString('base64url');const p:RoomPlayer={id:randomBytes(6).toString('hex'),name:cleanName(name),keyHash:sha(key),score:0,joined:this.now()};
  const room:Room={code,locationId,kind:k,hostId:p.id,phase:'lobby',round:0,prompt:null,players:[p],votes:new Map(),created:this.now(),touched:this.now(),lastWinners:[]};this.rooms.set(code,room);return{code,playerId:p.id,key}}
 private find(locationId:string,code:string){this.sweep();const r=this.rooms.get(code);if(!r||r.locationId!==locationId)return fail(404,'room_not_found');return r}
 private who(r:Room,key:unknown){const h=typeof key==='string'?sha(key):'';const p=r.players.find(x=>x.keyHash===h);if(!p)fail(403,'not_in_room');return p!}
 join(locationId:string,code:string,name:unknown){const r=this.find(locationId,code);if(r.phase==='finished')fail(409,'room_finished');if(r.players.length>=ROOM_LIMITS.players)fail(409,'room_full');
  const n=cleanName(name);if(r.players.some(p=>p.name.toLowerCase()===n.toLowerCase()))fail(409,'name_taken');
  const key=randomBytes(18).toString('base64url');const p:RoomPlayer={id:randomBytes(6).toString('hex'),name:n,keyHash:sha(key),score:0,joined:this.now()};r.players.push(p);r.touched=this.now();return{code:r.code,playerId:p.id,key}}
 state(locationId:string,code:string,key:unknown){const r=this.find(locationId,code),me=this.who(r,key);r.touched=this.now();const reveal=r.phase==='reveal'||r.phase==='finished';
  const tally:Record<string,number>={};if(reveal)for(const v of r.votes.values())tally[v]=(tally[v]||0)+1;
  return{code:r.code,kind:r.kind,phase:r.phase,round:r.round,prompt:r.prompt,me:{id:me.id,isHost:me.id===r.hostId,vote:r.votes.get(me.id)||null},
   players:r.players.map(p=>({id:p.id,name:p.name,score:p.score,isHost:p.id===r.hostId,voted:r.votes.has(p.id)})),tally:reveal?tally:null,winners:reveal?r.lastWinners:[]}}
 round(locationId:string,code:string,key:unknown,prompt:any){const r=this.find(locationId,code),me=this.who(r,key);if(me.id!==r.hostId)fail(403,'host_only');if(r.phase==='finished')fail(409,'room_finished');
  if(r.kind==='rather'){const a=prompt?.a,b=prompt?.b;if(typeof a!=='string'||typeof b!=='string'||!(allowedPairs.has(a+'\n'+b)||allowedPairs.has(b+'\n'+a)))fail(400,'prompt_not_allowed');r.prompt={text:typeof prompt.text==='string'?prompt.text.slice(0,120):'',a,b}}
  else{const t=prompt?.text;if(typeof t!=='string'||!allowedLikely.has(t))fail(400,'prompt_not_allowed');r.prompt={text:t}}
  r.phase='voting';r.round++;r.votes=new Map();r.lastWinners=[];r.touched=this.now();return this.state(locationId,code,key)}
 vote(locationId:string,code:string,key:unknown,choice:unknown){const r=this.find(locationId,code),me=this.who(r,key);if(r.phase!=='voting')fail(409,'not_voting');
  const ok=r.kind==='rather'?(choice==='A'||choice==='B'):typeof choice==='string'&&r.players.some(p=>p.id===choice);if(!ok)fail(400,'invalid_choice');r.votes.set(me.id,choice as string);r.touched=this.now();return this.state(locationId,code,key)}
 reveal(locationId:string,code:string,key:unknown){const r=this.find(locationId,code),me=this.who(r,key);if(me.id!==r.hostId)fail(403,'host_only');if(r.phase!=='voting')fail(409,'not_voting');
  const t:Record<string,number>={};for(const v of r.votes.values())t[v]=(t[v]||0)+1;const top=Math.max(0,...Object.values(t));let winners:string[]=[];
  if(top>0){if(r.kind==='rather'){const[a,b]=[t.A||0,t.B||0];if(a!==b){const side=a>b?'A':'B';winners=[...r.votes.entries()].filter(([,v])=>v===side).map(([p])=>p)}}else winners=Object.entries(t).filter(([,n])=>n===top).map(([p])=>p)}
  for(const p of r.players)if(winners.includes(p.id))p.score++;r.lastWinners=winners;r.phase='reveal';r.touched=this.now();return this.state(locationId,code,key)}
 finish(locationId:string,code:string,key:unknown){const r=this.find(locationId,code),me=this.who(r,key);if(me.id!==r.hostId)fail(403,'host_only');r.phase='finished';r.touched=this.now();return this.state(locationId,code,key)}
 leave(locationId:string,code:string,key:unknown){const r=this.find(locationId,code),me=this.who(r,key);if(me.id===r.hostId){r.phase='finished';return{ok:true}}r.players=r.players.filter(p=>p.id!==me.id);r.votes.delete(me.id);return{ok:true}}
}
