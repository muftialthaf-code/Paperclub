import React,{useCallback,useEffect,useRef,useState}from'react';
import{b,request,message,useBusinessLocale}from'./api';
import{dilemmaPools}from'../creativeGames';import{arabicDilemmas}from'../arabic/prompts';import{spokenPrompt}from'../noPropsContent';import{chooseContent}from'../newGames';
import{isArabic}from'../i18n/locale';
type Player={id:string,name:string,score:number,isHost:boolean,voted:boolean};
type RoomState={code:string,kind:'rather'|'likely',phase:'lobby'|'voting'|'reveal'|'finished',round:number,prompt:null|{text:string,a?:string,b?:string},me:{id:string,isHost:boolean,vote:string|null},players:Player[],tally:Record<string,number>|null,winners:string[]};
const LEVELS:Array<[string,string,string]>=[['Easy','Warm-up','تسخين'],['Medium','Social','سوالف'],['Hard','Deeper','أعمق']];
/** Table Vote: every guest answers on their own phone. The host's phone picks prompts; the server only accepts shipped prompts. */
export default function TableVote({slug,onClose}:{slug:string,onClose:()=>void}){
 useBusinessLocale();const base='/api/venue/'+slug+'/rooms';
 const[session,setSession]=useState<{code:string,key:string}|null>(()=>{try{const v=sessionStorage.getItem('pc-vote-'+slug);return v?JSON.parse(v):null}catch{return null}});
 const[state,setState]=useState<RoomState|null>(null);const[error,setError]=useState('');const[name,setName]=useState('');const[code,setCode]=useState('');const[level,setLevel]=useState('Medium');const[busy,setBusy]=useState(false);
 const used=useRef<string[]>([]);
 const save=(s:{code:string,key:string}|null)=>{setSession(s);try{s?sessionStorage.setItem('pc-vote-'+slug,JSON.stringify(s)):sessionStorage.removeItem('pc-vote-'+slug)}catch{}};
 const call=useCallback(async<T,>(path:string,method='GET',data?:unknown,key=session?.key)=>request<T>(path,method,data,key?{'x-room-key':key}:{}),[session?.key]);
 const act=async(fn:()=>Promise<void>)=>{setBusy(true);setError('');try{await fn()}catch(e){setError(message(e))}finally{setBusy(false)}};
 useEffect(()=>{if(!session)return;let live=true;const poll=async()=>{try{const s=await call<RoomState>(base+'/'+session.code);if(live){setState(s);setError('')}}catch(e){if(live){const m=(e as any)?.code;if(m==='room_not_found'||m==='not_in_room'){save(null);setState(null);setError(message(e))}}}};void poll();const t=setInterval(poll,1500);return()=>{live=false;clearInterval(t)}},[session?.code,session?.key]);
 const host=(kind:'rather'|'likely')=>act(async()=>{const r=await request<{code:string,key:string}>(base,'POST',{kind,name});save({code:r.code,key:r.key})});
 const join=()=>act(async()=>{const r=await request<{code:string,key:string}>(base+'/'+code.trim()+'/join','POST',{name});save({code:r.code,key:r.key})});
 const nextRound=()=>act(async()=>{if(!state)return;let prompt:any;if(state.kind==='rather'){const pool=(isArabic()?arabicDilemmas[level]:dilemmaPools[level]) as Array<{key:string,a:string,b:string}>;const c=chooseContent(pool.map(p=>({...p,key:p.key})),used.current);used.current.push(c.key);prompt={a:c.a,b:c.b,text:b('Which would you choose?','وش تختار؟')}}else{const p=spokenPrompt('np-likely',level,used.current);used.current.push(p.key);prompt={text:p.text}}setState(await call<RoomState>(base+'/'+state.code+'/round','POST',prompt))});
 const vote=(choice:string)=>act(async()=>{if(state)setState(await call<RoomState>(base+'/'+state.code+'/vote','POST',{choice}))});
 const reveal=()=>act(async()=>{if(state)setState(await call<RoomState>(base+'/'+state.code+'/reveal','POST',{}))});
 const finish=()=>act(async()=>{if(state)setState(await call<RoomState>(base+'/'+state.code+'/finish','POST',{}))});
 const leave=async()=>{try{if(session)await call(base+'/'+session.code+'/leave','POST',{})}catch{}save(null);setState(null);onClose()};
 const name_=(id:string)=>state?.players.find(p=>p.id===id)?.name||'';
 if(!session||!state)return<section className="table-vote" aria-labelledby="tv-title"><span className="eyebrow">{b('EVERYONE ON THEIR OWN PHONE','كل واحد على جواله')}</span><h1 id="tv-title">{b('Table Vote','تصويت الطاولة')}</h1><p>{b('One person hosts a table and shares the four-digit code. Everyone else joins on their own phone and votes at the same time.','واحد يفتح الطاولة ويعطي الباقين الرمز المكون من أربع أرقام. الكل يدخل من جواله ويصوتون مع بعض.')}</p>
  {error&&<p className="feedback" role="alert">{error}</p>}
  <label>{b('Your name','اسمك')}<input value={name} maxLength={20} autoComplete="off" onChange={e=>setName(e.target.value)}/></label>
  <div className="table-vote-actions"><button className="primary" disabled={busy||!name.trim()} onClick={()=>host('rather')}>{b('Host · Would You Rather','استضف · تفضل وش')}</button><button className="primary" disabled={busy||!name.trim()} onClick={()=>host('likely')}>{b('Host · Most Likely To','استضف · مين الأكثر')}</button></div>
  <h2>{b('Join a table','انضم لطاولة')}</h2><label>{b('Four-digit code','الرمز المكون من أربع أرقام')}<input dir="ltr" inputMode="numeric" pattern="[0-9]*" maxLength={4} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/></label>
  <div className="table-vote-actions"><button className="secondary" disabled={busy||!name.trim()||code.length!==4} onClick={join}>{b('Join','انضم')}</button><button className="text-button" onClick={onClose}>{b('Back to games','رجوع للألعاب')}</button></div></section>;
 const isHost=state.me.isHost;const levelPicker=isHost&&<div className="table-vote-levels" role="group" aria-label={b('Tone','الأجواء')}>{LEVELS.map(([id,en,ar])=><button key={id} className={level===id?'active':''} aria-pressed={level===id} onClick={()=>setLevel(id)}>{b(en,ar)}</button>)}</div>;
 const rank=[...state.players].sort((x,y)=>y.score-x.score);
 return<section className="table-vote" aria-live="polite"><span className="eyebrow">{state.kind==='rather'?b('WOULD YOU RATHER','تفضل وش'):b('MOST LIKELY TO','مين الأكثر')} · {b('TABLE','طاولة')} <bdi dir="ltr">{state.code}</bdi></span>
  {error&&<p className="feedback" role="alert">{error}</p>}
  {state.phase==='lobby'&&<><h1>{b('Waiting for the table','ننتظر الطاولة')}</h1><p className="table-vote-code" dir="ltr">{state.code}</p><p>{b('Everyone opens this venue page, picks Table Vote and joins with this code.','الكل يفتح صفحة المكان ويختار تصويت الطاولة وينضم بهالرمز.')}</p></>}
  {state.phase==='voting'&&state.prompt&&<><h1>{b('Round ','الجولة ')}{state.round}</h1><h2>{state.prompt.text}</h2>
   {state.kind==='rather'?<div className="table-vote-options">{(['A','B'] as const).map(k=><button key={k} className={state.me.vote===k?'chosen':''} aria-pressed={state.me.vote===k} disabled={busy} onClick={()=>vote(k)}>{k==='A'?state.prompt!.a:state.prompt!.b}</button>)}</div>
   :<div className="table-vote-options">{state.players.map(p=><button key={p.id} className={state.me.vote===p.id?'chosen':''} aria-pressed={state.me.vote===p.id} disabled={busy} onClick={()=>vote(p.id)}><bdi>{p.name}</bdi></button>)}</div>}
   <p className="small">{state.players.filter(p=>p.voted).length}/{state.players.length} {b('voted','صوتوا')}</p></>}
  {state.phase==='reveal'&&state.prompt&&<><h1>{b('Results','النتيجة')}</h1><h2>{state.prompt.text}</h2>
   {state.kind==='rather'?<div className="table-vote-options">{(['A','B'] as const).map(k=><div key={k} className={'table-vote-result'+(state.me.vote===k?' chosen':'')}><strong>{state.tally?.[k]||0}</strong><span>{k==='A'?state.prompt!.a:state.prompt!.b}</span></div>)}</div>
   :<ul className="table-vote-list">{state.players.map(p=>({p,n:state.tally?.[p.id]||0})).sort((x,y)=>y.n-x.n).map(({p,n})=><li key={p.id} className={state.winners.includes(p.id)?'winner':''}><bdi>{p.name}</bdi><b>{n}</b></li>)}</ul>}
   <p>{state.winners.length?state.kind==='rather'?b('The majority gets a point.','الأغلبية تاخذ نقطة.'):b('Most votes: ','الأكثر أصوات: ')+state.winners.map(name_).join(' · '):b('A tie. No points this round.','تعادل. ما فيه نقاط هالجولة.')}</p></>}
  {state.phase==='finished'&&<h1>{b('Thanks for playing','شكرًا للعب')}</h1>}
  <aside className="score-panel"><h3>{b('Scoreboard','لوحة النقاط')}</h3>{rank.map(p=><div className="score-row" key={p.id}><span><bdi>{p.name}</bdi>{p.isHost&&<small> · {b('host','المضيف')}</small>}</span><b>{p.score}</b></div>)}</aside>
  {isHost&&state.phase!=='finished'&&<div className="table-vote-actions">{levelPicker}
   {(state.phase==='lobby'||state.phase==='reveal')&&<button className="primary" disabled={busy||state.players.length<2} onClick={nextRound}>{state.phase==='lobby'?b('Start first round','ابدأ الجولة الأولى'):b('Next round','الجولة التالية')}</button>}
   {state.phase==='voting'&&<button className="primary" disabled={busy} onClick={reveal}>{b('Reveal results','اكشف النتيجة')}</button>}
   {state.phase!=='lobby'&&<button className="secondary" disabled={busy} onClick={finish}>{b('Finish game','أنهِ اللعبة')}</button>}</div>}
  {!isHost&&state.phase!=='finished'&&<p className="small">{state.phase==='lobby'?b('The host will start the first round.','المضيف راح يبدأ الجولة الأولى.'):state.phase==='reveal'?b('Waiting for the host’s next round.','ننتظر الجولة التالية من المضيف.'):''}</p>}
  <div className="table-vote-actions"><button className="text-button" onClick={leave}>{state.phase==='finished'?b('Back to games','رجوع للألعاب'):b('Leave table','اترك الطاولة')}</button></div></section>;
}
