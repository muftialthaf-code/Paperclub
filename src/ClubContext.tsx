import React,{createContext,useContext,useState}from'react';
import{emptyClub,validateClub,uid,type ClubData,type Profile}from'./clubModel';
type Context={data:ClubData,commit:(next:ClubData)=>boolean,error:string,clearError:()=>void};
const Context=createContext<Context|null>(null);
export function ClubProvider({children}:{children:React.ReactNode}){
 const [initial]=useState(()=>{try{const raw=localStorage.getItem('pc-clubhouse');return {data:raw?validateClub(JSON.parse(raw)):emptyClub(),error:''}}catch{return {data:emptyClub(),error:'Your saved clubhouse could not be read. Your existing browser data has not been overwritten.'}}});
 const[data,setData]=useState(initial.data);const[error,setError]=useState(initial.error);
 function commit(next:ClubData){try{validateClub(next);localStorage.setItem('pc-clubhouse',JSON.stringify(next));setData(next);setError('');return true}catch(e){setError(e instanceof Error?e.message:'Could not save. Export a backup and check device storage.');return false}}
 return <Context.Provider value={{data,commit,error,clearError:()=>setError('')}}>{children}</Context.Provider>;
}
export function useClub(){const c=useContext(Context);if(!c)throw Error('Clubhouse provider missing');return c}
export const profileIcons=['🦊','🐼','🦁','🐙','🦋','🚀','🌻','⭐','🐧','🐉','🎨','🦉'];
export const profileColors=['#e0f2ee','#ece7fb','#ffe3d8','#fff0c7','#deebfb'];
export function makeProfile(name:string,kind:'family'|'guest'='family',audience:'child'|'adult'='child'):Profile{return {id:uid(),name:name.trim().slice(0,40),kind,audience,avatar:profileIcons[0],color:profileColors[0],retained:kind==='family',createdAt:new Date().toISOString(),archived:false}}
export function ProfileRoster({names,onNames,teams=false}:{names:string[],onNames:(names:string[])=>void,teams?:boolean}){
 const{data}=useClub();const available=data.profiles.filter(p=>!p.archived);if(!available.length||teams)return null;
 return <details className="profile-roster"><summary>Use clubhouse players</summary><div className="setup-grid">{names.map((n,i)=><label key={i}>Player {i+1}<select aria-label={`Saved profile for player ${i+1}`} value={available.find(p=>p.name===n)?.id||''} onChange={e=>{const p=available.find(p=>p.id===e.target.value);if(p)onNames(names.map((name,j)=>j===i?p.name:name))}}><option value="">Choose a saved player</option>{available.map(p=><option key={p.id} value={p.id}>{p.avatar} {p.name}{p.kind==='guest'?' · Guest':''}</option>)}</select></label>)}</div><p className="small">You’ll confirm profile assignments when saving the result.</p></details>;
}
