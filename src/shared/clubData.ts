export type Profile={id:string,name:string,avatar:string,color:string,kind:'family'|'guest',audience:'child'|'adult',retained:boolean,createdAt:string,archived:boolean};
export type ResultEntry={profileId:string,name:string,score:number|null,winner:boolean,team:boolean};
export type ClubResult={id:string,sessionId:string,gameId:string,difficulty:string,date:string,entries:ResultEntry[],cooperative:boolean,completedTogether:boolean,partyId?:string};
export type Party={id:string,title:string,date:string,players:string[],games:string[],status:'active'|'finished'};
export type Award={id:string,profileId:string,name:string,title:string,note:string,date:string,gameId?:string,partyId?:string,resultId?:string};
export type ClubData={version:1,profiles:Profile[],results:ClubResult[],parties:Party[],awards:Award[],activePartyId:string|null};
export const emptyClub=():ClubData=>({version:1,profiles:[],results:[],parties:[],awards:[],activePartyId:null});

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
