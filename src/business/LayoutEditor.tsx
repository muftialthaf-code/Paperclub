import React from'react';import{games as allGames}from'../engine';import{tx}from'../i18n/translate';import{b}from'./api';import type{VenueCategory}from'./types';
export type Layout={featured?:string|null,categories?:VenueCategory[],promo?:{en:string,ar:string}|null};
/** Keep featured game and categories consistent with the enabled game list. */
export function pruneLayout<T extends Layout&{games:string[]}>(brand:T):T{
 const ids=brand.games;return{...brand,featured:brand.featured&&ids.includes(brand.featured)?brand.featured:null,categories:(brand.categories||[]).map(c=>({...c,games:c.games.filter(g=>ids.includes(g))})).filter(c=>c.games.length>0)};
}
export default function LayoutEditor({value,enabled,disabled,onChange}:{value:Layout,enabled:string[],disabled?:boolean,onChange:(value:Layout)=>void}){
 const cats=value.categories||[],promo=value.promo||{en:'',ar:''};const name=(id:string)=>tx(allGames.find(g=>g.id===id)?.name||id);
 const setCat=(i:number,patch:Partial<VenueCategory>)=>onChange({...value,categories:cats.map((c,j)=>j===i?{...c,...patch}:c)});
 const nextId=()=>{let n=cats.length+1;while(cats.some(c=>c.id==='c'+n))n++;return'c'+n};
 return <fieldset className="business-layout-editor" disabled={disabled}>
  <label>{b('Featured game','اللعبة المميزة')}<select value={value.featured||''} onChange={e=>onChange({...value,featured:e.target.value||null})}><option value="">{b('None','بدون')}</option>{enabled.map(id=><option key={id} value={id}>{name(id)}</option>)}</select></label>
  <div className="business-form-grid"><label>{b('Promotional message · English (optional)','رسالة ترويجية · إنجليزي (اختياري)')}<input dir="ltr" maxLength={120} value={promo.en} onChange={e=>onChange({...value,promo:e.target.value||promo.ar?{en:e.target.value,ar:promo.ar}:null})}/></label><label>{b('Promotional message · Arabic (optional)','رسالة ترويجية · عربي (اختياري)')}<input dir="rtl" maxLength={120} value={promo.ar} onChange={e=>onChange({...value,promo:e.target.value||promo.en?{en:promo.en,ar:e.target.value}:null})}/></label></div>
  {value.promo&&(!value.promo.en||!value.promo.ar)&&<p className="small" role="status">{b('Fill both languages, or clear both, before saving the promotional message.','عبّي اللغتين أو امسحهم كلهم قبل حفظ الرسالة الترويجية.')}</p>}
  <h4>{b('Homepage categories','تصنيفات الصفحة الرئيسية')}</h4><p className="small">{b('Guests see these as quick filters. Up to eight; each needs a name in both languages and at least one enabled game.','الضيوف يشوفونها كفلاتر سريعة. لين ثمانية؛ كل تصنيف يحتاج اسم باللغتين ولعبة وحدة مفعّلة على الأقل.')}</p>
  {cats.map((c,i)=><div className="business-category" key={c.id}><div className="business-form-grid"><label>{b('Name · English','الاسم · إنجليزي')}<input dir="ltr" maxLength={40} value={c.en} onChange={e=>setCat(i,{en:e.target.value})}/></label><label>{b('Name · Arabic','الاسم · عربي')}<input dir="rtl" maxLength={40} value={c.ar} onChange={e=>setCat(i,{ar:e.target.value})}/></label></div><div className="business-game-checks">{enabled.map(id=><label key={id}><input type="checkbox" checked={c.games.includes(id)} onChange={e=>setCat(i,{games:e.target.checked?[...c.games,id]:c.games.filter(g=>g!==id)})}/>{name(id)}</label>)}</div><button type="button" className="text-button" onClick={()=>onChange({...value,categories:cats.filter((_,j)=>j!==i)})}>{b('Remove category','احذف التصنيف')}</button></div>)}
  <button type="button" className="secondary" disabled={cats.length>=8||!enabled.length} onClick={()=>onChange({...value,categories:[...cats,{id:nextId(),en:'',ar:'',games:[]}]})}>{b('Add a category','أضف تصنيف')}</button>
 </fieldset>;
}
