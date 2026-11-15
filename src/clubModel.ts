import {isArabic,getLocale} from './i18n/locale';
import {t,awardNote} from './i18n/translate';
export type Profile={id:string,name:string,avatar:string,color:string,kind:'family'|'guest',audience:'child'|'adult',retained:boolean,createdAt:string,archived:boolean};
export type ResultEntry={profileId:string,name:string,score:number|null,winner:boolean,team:boolean};
export type ClubResult={id:string,sessionId:string,gameId:string,difficulty:string,date:string,entries:ResultEntry[],cooperative:boolean,completedTogether:boolean,partyId?:string};
export type Party={id:string,title:string,date:string,players:string[],games:string[],status:'active'|'finished'};
export type Award={id:string,profileId:string,name:string,title:string,note:string,date:string,gameId?:string,partyId?:string,resultId?:string};
export type ClubData={version:1,profiles:Profile[],results:ClubResult[],parties:Party[],awards:Award[],activePartyId:string|null};
export const emptyClub=():ClubData=>({version:1,profiles:[],results:[],parties:[],awards:[],activePartyId:null});
export const uid=()=>crypto.randomUUID();
export const clubMonth=(value:string|Date=new Date())=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit'}).formatToParts(new Date(value));return parts.find(p=>p.type==='year')!.value+'-'+parts.find(p=>p.type==='month')!.value};
export const clubPoints=(r:ClubResult,e:ResultEntry)=>3+(r.cooperative?(r.completedTogether?2:0):(e.winner?2:0));
export const isDrawing=(game:string)=>['speed','impossible','detective'].includes(game);
export function profileStats(data:ClubData,id:string,month?:string,gameId?:string,partyId?:string,difficulty?:string){
 const records=data.results.filter(r=>(!month||clubMonth(r.date)===month)&&(!gameId||r.gameId===gameId)&&(!partyId||r.partyId===partyId)&&(!difficulty||r.difficulty===difficulty)).flatMap(r=>r.entries.filter(e=>e.profileId===id).map(e=>({r,e})));
 return {played:records.length,wins:records.filter(({r,e})=>!r.cooperative&&e.winner).length,points:records.reduce((n,{r,e})=>n+clubPoints(r,e),0),best:records.filter(({e})=>!e.team&&e.score!==null).reduce<number|null>((n,{e})=>n===null?e.score:Math.max(n,e.score!),null),records};
}
export function addResult(data:ClubData,result:ClubResult):ClubData{
 if(data.results.some(r=>r.sessionId===result.sessionId))throw Error('This game result has already been saved.');
 if(!result.entries.length)throw Error('Choose at least one player.');
 const ids=result.entries.map(e=>e.profileId);if(new Set(ids).size!==ids.length)throw Error('A player can only appear once in a result.');
 if(result.entries.some(e=>!data.profiles.some(p=>p.id===e.profileId)||e.score!==null&&!Number.isFinite(e.score)))throw Error('Select valid player profiles and scores.');
 return {...data,results:[result,...data.results]};
}
export function mergeProfiles(data:ClubData,source:string,target:string):ClubData{
 if(source===target||!data.profiles.some(p=>p.id===source)||!data.profiles.some(p=>p.id===target))throw Error('Choose two different profiles.');
 const name=data.profiles.find(p=>p.id===target)!.name;
 const results=data.results.map(r=>{const entries:ResultEntry[]=[];for(const e of r.entries){const next=e.profileId===source?{...e,profileId:target,name}:e;const existing=entries.find(v=>v.profileId===next.profileId);if(existing){existing.winner||=next.winner;existing.score=existing.score===null?next.score:next.score===null?existing.score:Math.max(existing.score,next.score);existing.team||=next.team}else entries.push({...next})}return {...r,entries}});
 return {...data,profiles:data.profiles.filter(p=>p.id!==source),results,awards:data.awards.map(a=>a.profileId===source?{...a,profileId:target,name}:a),parties:data.parties.map(p=>({...p,players:[...new Set(p.players.map(id=>id===source?target:id))]}))};
}
export function removeProfile(data:ClubData,id:string):ClubData{return {...data,profiles:data.profiles.filter(p=>p.id!==id),results:data.results.map(r=>({...r,entries:r.entries.filter(e=>e.profileId!==id)})).filter(r=>r.entries.length),awards:data.awards.filter(a=>a.profileId!==id),parties:data.parties.map(p=>({...p,players:p.players.filter(p=>p!==id)}))}}
export function validateClub(value:unknown):ClubData{
 const d=value as ClubData;const str=(v:unknown,max=500):v is string=>typeof v==='string'&&v.length<=max;const strs=(v:unknown)=>Array.isArray(v)&&v.length<=10000&&v.every(s=>str(s));
 if(!d||d.version!==1||!Array.isArray(d.profiles)||!Array.isArray(d.results)||!Array.isArray(d.parties)||!Array.isArray(d.awards))throw Error('This is not a Paperclub backup.');
 if([d.profiles,d.results,d.parties,d.awards].some(a=>a.length>10000))throw Error('This backup is too large.');
 const date=(v:unknown)=>str(v)&&!Number.isNaN(Date.parse(v));
 for(const p of d.profiles)if(!p||!str(p.id)||!str(p.name,40)||!p.name.trim()||!str(p.avatar,8)||!/^#[a-f\d]{6}$/i.test(p.color)||!['family','guest'].includes(p.kind)||!['child','adult'].includes(p.audience)||typeof p.retained!=='boolean'||typeof p.archived!=='boolean'||!date(p.createdAt))throw Error('Invalid player profile in backup.');
 const ids=new Set(d.profiles.map(p=>p.id));if(ids.size!==d.profiles.length)throw Error('Duplicate player IDs in backup.');
 for(const r of d.results)if(!r||!str(r.id)||!str(r.sessionId)||!str(r.gameId)||!str(r.difficulty)||!date(r.date)||typeof r.cooperative!=='boolean'||typeof r.completedTogether!=='boolean'||r.partyId!==undefined&&!str(r.partyId)||!Array.isArray(r.entries)||r.entries.some(e=>!e||!ids.has(e.profileId)||!str(e.name,40)||typeof e.winner!=='boolean'||typeof e.team!=='boolean'||e.score!==null&&(typeof e.score!=='number'||!Number.isFinite(e.score)))||new Set(r.entries.map(e=>e.profileId)).size!==r.entries.length)throw Error('Invalid game result in backup.');
 for(const p of d.parties)if(!p||!str(p.id)||!str(p.title,80)||!date(p.date)||!strs(p.players)||p.players.some(id=>!ids.has(id))||!strs(p.games)||!['active','finished'].includes(p.status))throw Error('Invalid party in backup.');
 for(const a of d.awards)if(!a||!str(a.id)||!ids.has(a.profileId)||!str(a.name,40)||!str(a.title,80)||!str(a.note,240)||!date(a.date)||['gameId','partyId','resultId'].some(key=>a[key as keyof Award]!==undefined&&!str(a[key as keyof Award])))throw Error('Invalid award in backup.');
 if(d.activePartyId!==null&&(!str(d.activePartyId)||!d.parties.some(p=>p.id===d.activePartyId&&p.status==='active')))throw Error('Invalid active party.');
 if(new Set(d.results.map(r=>r.sessionId)).size!==d.results.length||new Set(d.awards.map(a=>a.id)).size!==d.awards.length||new Set(d.parties.map(p=>p.id)).size!==d.parties.length)throw Error('Duplicate records in backup.');
 return d;
}
export const xml=(s:string)=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export function certificateSvg(a:Award,gameName='Paperclub'){
 const wrap=(s:string,max:number)=>{const lines:string[]=[];let line='';for(const word of s.split(/\s+/)){if((line+' '+word).trim().length>max&&line){lines.push(line);line=word}else line=(line+' '+word).trim()}if(line)lines.push(line);return lines};
 const title=wrap(t(a.title),36),note=wrap(awardNote(a.note),65).slice(0,4);
 const titleText=title.map((s,i)=>`<tspan x="600" dy="${i?48:0}">${xml(s)}</tspan>`).join('');
 const noteText=note.map((s,i)=>`<tspan x="600" dy="${i?28:0}">${xml(s)}</tspan>`).join('');
 let svg= `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="850" viewBox="0 0 1200 850" role="img"><title>${isArabic()?xml(t(a.title))+' لـ '+xml(a.name):xml(a.title)+' awarded to '+xml(a.name)}</title><rect width="1200" height="850" fill="#faf9f6"/><rect x="28" y="28" width="1144" height="794" rx="12" fill="none" stroke="#24365b" stroke-width="3"/><rect x="42" y="42" width="1116" height="766" rx="8" fill="none" stroke="#c7deda"/><g text-anchor="middle" fill="#24365b"><text x="600" y="122" font-family="Georgia,serif" font-size="34">paperclub ✳</text><text x="600" y="181" font-family="Arial,sans-serif" font-size="16" letter-spacing="5">CERTIFICATE OF ACHIEVEMENT</text><text x="600" y="265" font-family="Georgia,serif" font-size="45" fill="#bc4d3a">${titleText}</text><text x="600" y="${title.length>1?400:375}" font-family="Arial,sans-serif" font-size="18">Proudly presented to</text><text x="600" y="465" font-family="Georgia,serif" font-size="${a.name.length>25?36:54}">${xml(a.name)}</text><path d="M340 490H860" stroke="#bdd9d1"/><text x="600" y="550" font-family="Arial,sans-serif" font-size="22">${noteText}</text><text x="600" y="712" font-family="Arial,sans-serif" font-size="19">${xml(t(gameName))} · ${xml(new Date(a.date).toLocaleDateString(getLocale()==='ar-SA'?'ar-SA-u-ca-gregory-nu-latn':'en-GB',{timeZone:'Asia/Riyadh',year:'numeric',month:'long',day:'numeric'}))}</text><text x="600" y="756" font-family="Arial,sans-serif" font-size="14" fill="#626d82">A little paper. A lot of memories.</text></g></svg>`;
 if(isArabic())svg=svg.replace('CERTIFICATE OF ACHIEVEMENT',t('CERTIFICATE OF ACHIEVEMENT')).replace('Proudly presented to',t('Proudly presented to')).replace('A little paper. A lot of memories.',t('A little paper. A lot of memories.')).replace(/font-family="(?:Georgia,serif|Arial,sans-serif)"/g,'font-family="Tajawal,Arial,sans-serif" direction="rtl" unicode-bidi="plaintext"').replace('letter-spacing="5"','letter-spacing="0"');
 return svg;
}
export function emailDraft(a:Award,recipient:string,gameName:string){
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)||/[\r\n]/.test(recipient))throw Error('Enter the parent or guardian’s email address.');
 const subject=(isArabic()?`شهادة بيبركلب لـ ${a.name}`:`A Paperclub certificate for ${a.name}`).replace(/[\r\n]/g,' ');
 const body=isArabic()?`هلا،\n\n${a.name} استحق جائزة ${t(a.title)} في ${t(gameName)}!\n\n${awardNote(a.note)}\n\nتلقون الشهادة بالمرفقات.\n\nمن مضيفكم في بيبركلب`:`Hello,\n\n${a.name} earned the ${a.title} award during ${gameName}!\n\n${a.note}\n\nPlease find their certificate attached.\n\nFrom your Paperclub host`;
 return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
