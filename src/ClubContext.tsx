import{localizedError}from'./i18n/errors';import{tx}from'./i18n/translate';
import React,{createContext,useContext,useState,useEffect,useRef}from'react';
import{emptyClub,validateClub,uid,type ClubData,type Profile}from'./clubModel';
import{useAccount,accountRequest,AccountError}from'./AccountContext';
type Snapshot={data:ClubData,revision:number,updatedAt:string};
type Context={data:ClubData,commit:(next:ClubData)=>Promise<boolean>,error:string,clearError:()=>void,source:'device'|'cloud',loading:boolean,saveState:'saved'|'saving'|'failed'|'conflict',retry:()=>Promise<void>,reload:()=>Promise<void>,unsaved:ClubData|null,deviceData:ClubData,importDevice:()=>Promise<boolean>};
const Context=createContext<Context|null>(null);
export function ClubProvider({children}:{children:React.ReactNode}){
 const account=useAccount();const family=account.selected;const scope=account.user&&family?account.user.id+':'+family.id:'';
 const[initial]=useState(()=>{try{const raw=localStorage.getItem('pc-clubhouse');return{data:raw?validateClub(JSON.parse(raw)):emptyClub(),error:''}}catch{return{data:emptyClub(),error:'Your saved clubhouse could not be read. Your existing browser data has not been overwritten.'}}});
 const[deviceData,setDeviceData]=useState(initial.data),[cloud,setCloud]=useState<{scope:string,snapshot:Snapshot}|null>(null),[error,setError]=useState(initial.error),[loading,setLoading]=useState(false),[saveState,setSaveState]=useState<Context['saveState']>('saved'),[unsaved,setUnsaved]=useState<ClubData|null>(null);
 const scopeRef=useRef(scope);scopeRef.current=scope;const busy=useRef(false),draft=useRef<ClubData|null>(null),current=useRef(cloud);current.current=cloud;
 const source=scope?'cloud':'device';const data=scope?(cloud?.scope===scope?cloud.snapshot.data:emptyClub()):deviceData;
 async function reload(){if(!scope||!family||busy.current)return;setLoading(true);setError('');setUnsaved(null);draft.current=null;try{const snapshot=await accountRequest<Snapshot>('/api/families/'+encodeURIComponent(family.id)+'/clubhouse');validateClub(snapshot.data);if(scopeRef.current===scope){const next={scope,snapshot};current.current=next;setCloud(next);setSaveState('saved')}}catch(e){if(scopeRef.current===scope)setError(e instanceof AccountError?e.code:'accounts_unavailable')}finally{if(scopeRef.current===scope)setLoading(false)}}
 useEffect(()=>{setCloud(null);current.current=null;setError(scope?'':initial.error);setSaveState('saved');setUnsaved(null);draft.current=null;busy.current=false;if(scope)void reload();else setLoading(false)},[scope]);
 useEffect(()=>{const protect=(event:BeforeUnloadEvent)=>{if(busy.current||draft.current){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',protect);return()=>window.removeEventListener('beforeunload',protect)},[]);
 async function commit(next:ClubData):Promise<boolean>{
  if(busy.current){setError('save_in_progress');return false}try{validateClub(next)}catch(e){setError(localizedError(e));return false}
  if(!scope){try{localStorage.setItem('pc-clubhouse',JSON.stringify(next));setDeviceData(next);setError('');return true}catch(e){setError(localizedError(e));return false}}
  const base=current.current;if(!family||base?.scope!==scope||loading){setError('family_loading');return false}
  if(family.role==='viewer'){setError('read_only');return false}
  if(draft.current&&draft.current!==next){setError('resolve_unsaved');return false}
  busy.current=true;setSaveState('saving');setError('');draft.current=next;setUnsaved(next);
  try{const result=await accountRequest<{revision:number,updatedAt:string}>('/api/families/'+encodeURIComponent(family.id)+'/clubhouse',{method:'PUT',body:JSON.stringify({data:next,revision:base.snapshot.revision})});if(scopeRef.current!==scope)return false;const updated={scope,snapshot:{data:next,...result}};current.current=updated;setCloud(updated);draft.current=null;setUnsaved(null);setSaveState('saved');return true}catch(e){if(scopeRef.current!==scope)return false;const code=e instanceof AccountError?e.code:'connection_failed';setError(code);setSaveState(code==='revision_conflict'?'conflict':'failed');return false}finally{busy.current=false}
 }
 async function retry(){if(draft.current)await commit(draft.current)}
 async function importDevice(){if(!scope||data.profiles.length||data.results.length||data.awards.length||data.parties.length){setError('import_requires_empty_family');return false}return commit(deviceData)}
 return <Context.Provider value={{data,commit,error,clearError:()=>setError(''),source,loading:loading||!!scope&&cloud?.scope!==scope,saveState,retry,reload,unsaved,deviceData,importDevice}}>{children}</Context.Provider>
}
export function useClub(){const c=useContext(Context);if(!c)throw Error('Clubhouse provider missing');return c}
export const profileIcons = ['🦊', '🐼', '🦁', '🐙', '🦋', '🚀', '🌻', '⭐', '🐧', '🐉', '🎨', '🦉'];
export const profileColors = ['#e0f2ee', '#ece7fb', '#ffe3d8', '#fff0c7', '#deebfb'];
export function makeProfile(name: string, kind: 'family' | 'guest' = 'family', audience: 'child' | 'adult' = 'child'): Profile { return { id: uid(), name: name.trim().slice(0, 40), kind, audience, avatar: profileIcons[0], color: profileColors[0], retained: kind === 'family', createdAt: new Date().toISOString(), archived: false }; }
export function ProfileRoster({ names, onNames, teams = false }: {
    names: string[];
    onNames: (names: string[]) => void;
    teams?: boolean;
}) {
    const { data } = useClub();
    const available = data.profiles.filter(p => !p.archived);
    if (!available.length || teams)
        return null;
    return <details className="profile-roster"><summary>{tx("Use clubhouse players")}</summary><div className="setup-grid">{tx(names.map((n, i) => <label key={i}>{tx("Player ")}{tx(i + 1)}<select aria-label={tx(`Saved profile for player ${i + 1}`)} value={available.find(p => p.name === n)?.id || ''} onChange={e => { const p = available.find(p => p.id === e.target.value); if (p)
        onNames(names.map((name, j) => j === i ? p.name : name)); }}><option dir="auto" value="">{tx("Choose a saved player")}</option>{tx(available.map(p => <option dir="auto" key={p.id} value={p.id}>{tx(p.avatar)}{tx(" ")}{p.name}{tx(p.kind === 'guest' ? ' · Guest' : '')}</option>))}</select></label>))}</div><p className="small">{tx("You\u2019ll confirm profile assignments when saving the result.")}</p></details>;
}
