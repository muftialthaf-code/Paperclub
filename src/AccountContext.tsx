import {ensurePrivateApiReady} from './privateApi';
import React,{createContext,useContext,useEffect,useState}from'react';
export type Family={id:string,name:string,role:'owner'|'editor'|'viewer',createdAt:string};
export type Parent={id:string,email:string|null,displayName:string};
type Account={user:Parent|null,account:{displayName:string,createdAt:string}|null,families:Family[],provider:'chatgpt'|'email-google'};
const blank:Account={user:null,account:null,families:[],provider:'email-google'};
export class AccountError extends Error{constructor(public code:string,public status=0){super(code)}}
export async function accountRequest<T>(path:string,init:RequestInit={}):Promise<T>{try{try{await ensurePrivateApiReady()}catch{throw new AccountError('private_worker_update')}const response=await fetch(path,{...init,credentials:'same-origin',cache:'no-store',headers:{...(init.body?{'Content-Type':'application/json'}:{}),...init.headers}});const data=await response.json();if(!response.ok)throw new AccountError(data.error||'accounts_unavailable',response.status);return data as T}catch(error){if(error instanceof AccountError)throw error;throw new AccountError('connection_failed')}}
type Context=Account&{status:'loading'|'ready'|'unavailable',error:string,selected:Family|null,refresh:()=>Promise<void>,select:(id:string)=>void,createFamily:(name:string,displayName:string)=>Promise<boolean>,renameFamily:(name:string)=>Promise<boolean>,saveName:(name:string)=>Promise<boolean>};
const Context=createContext<Context|null>(null);
export default function AccountProvider({children}:{children:React.ReactNode}){
 const[data,setData]=useState<Account>(blank),[status,setStatus]=useState<Context['status']>('loading'),[error,setError]=useState(''),[familyId,setFamilyId]=useState('');
 async function refresh(){try{const next=await accountRequest<Account>('/api/account');setData(next);setStatus('ready');setError('');setFamilyId(id=>{if(next.families.some(f=>f.id===id))return id;let saved='';try{saved=localStorage.getItem('pc-family-choice:'+next.user?.id)||''}catch{}return next.families.find(f=>f.id===saved)?.id||next.families[0]?.id||''})}catch(e){setError((e as AccountError).code);setStatus('unavailable');setData(blank);setFamilyId('')}}
 useEffect(()=>{void refresh();const focus=()=>{void refresh()};window.addEventListener('focus',focus);return()=>window.removeEventListener('focus',focus)},[]);
 const selected=data.families.find(f=>f.id===familyId)||null;
 function select(id:string){if(!data.families.some(f=>f.id===id))return;setFamilyId(id);try{localStorage.setItem('pc-family-choice:'+data.user?.id,id)}catch{}}
 async function createFamily(name:string,displayName:string){setError('');try{const r=await accountRequest<{family:Family}>('/api/families',{method:'POST',body:JSON.stringify({name,displayName})});await refresh();setFamilyId(r.family.id);return true}catch(e){setError((e as AccountError).code);return false}}
 async function renameFamily(name:string){if(!selected)return false;try{await accountRequest('/api/families/'+encodeURIComponent(selected.id),{method:'PATCH',body:JSON.stringify({name})});setData(v=>({...v,families:v.families.map(f=>f.id===selected.id?{...f,name}:f)}));return true}catch(e){setError((e as AccountError).code);return false}}
 async function saveName(displayName:string){try{await accountRequest('/api/account',{method:'PATCH',body:JSON.stringify({displayName})});await refresh();return true}catch(e){setError((e as AccountError).code);return false}}
 return <Context.Provider value={{...data,status,error,selected,refresh,select,createFamily,renameFamily,saveName}}>{children}</Context.Provider>
}
export function useAccount(){const value=useContext(Context);if(!value)throw Error('Account provider missing');return value}
export const signInHref='/signin-with-chatgpt?return_to='+encodeURIComponent('/?account=1');
export const signOutHref='/signout-with-chatgpt?return_to='+encodeURIComponent('/?account=1');
