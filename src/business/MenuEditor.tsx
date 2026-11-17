import React,{useState}from'react';import{b}from'./api';import type{MenuItem}from'./types';
const kinds:Array<[MenuItem['kind'],string,string,string,string]>=[['drink','Drinks','المشروبات','Karak tea | شاي كرك\nIced latte','شاي كرك\nلاتيه بارد | Iced latte'],['food','Food','الأكل','Club sandwich | كلوب ساندويتش\nShakshuka','كبسة دجاج\nشكشوكة | Shakshuka'],['dessert','Desserts','الحلويات','Date cake | كيكة التمر\nKunafa','كنافة\nكيكة التمر | Date cake']];
const hasArabic=(t:string)=>/[؀-ۿ]/.test(t);
const toLines=(items:MenuItem[],kind:string)=>items.filter(i=>i.kind===kind).map(i=>i.en&&i.ar?i.en+' | '+i.ar:i.en||i.ar).join('\n');
export function parseMenu(text:string,kind:MenuItem['kind']):MenuItem[]{
 return text.split('\n').map(l=>l.trim()).filter(Boolean).map(line=>{const[first,second=''] =line.split('|').map(x=>x.trim());let en=first.slice(0,40),ar=second.slice(0,40);if(!second&&hasArabic(first)){ar=en;en=''}else if(second&&hasArabic(first)&&!hasArabic(second)){[en,ar]=[second.slice(0,40),first.slice(0,40)]}return{kind,en,ar}}).filter(i=>i.en||i.ar);
}
/** Simple menu entry: one item per line, optional second name after a vertical bar. Items appear mixed into the games guests play. */
export default function MenuEditor({value,onChange,disabled}:{value:MenuItem[],onChange:(items:MenuItem[])=>void,disabled?:boolean}){
 const[text,setText]=useState<Record<string,string>>(()=>Object.fromEntries(kinds.map(([k])=>[k,toLines(value,k)])));
 const total=value.length;
 function change(kind:MenuItem['kind'],next:string){const all={...text,[kind]:next};setText(all);onChange(kinds.flatMap(([k])=>parseMenu(all[k]||'',k)))}
 return <fieldset className="business-menu" disabled={disabled}><legend>{b('Your menu','قائمتك')}</legend><p className="small">{b('Add a few items you serve. Guests will meet them inside the games, mixed in with the usual questions, so the experience feels like your place. One item per line; add the Arabic name after a vertical bar if you have both.','أضف شوية أصناف تقدمها. الضيوف يلاقونها داخل الألعاب ومخلوطة مع الأسئلة المعتادة، فتحس التجربة إنها من مكانك. صنف بكل سطر؛ وإذا عندك الاسمين اكتب الاسم العربي بعد الخط العمودي.')}</p>
  <div className="business-form-grid">{kinds.map(([kind,en,ar,exEn,exAr])=><label key={kind}>{b(en,ar)}<textarea rows={5} dir="auto" value={text[kind]} onChange={e=>change(kind,e.target.value)} placeholder={b(exEn,exAr)} aria-describedby="menu-count"/></label>)}</div>
  <p id="menu-count" className="small" role="status">{b(total+' of 60 items added. Menu items are reviewed with the rest of your branding before guests see them.',total+' من ٦٠ صنف مضاف. الأصناف تنراجع مع باقي هويتك قبل ما يشوفها الضيوف.')}{total>60&&' '+b('Too many items; remove some before saving.','أصناف كثيرة؛ احذف بعضها قبل الحفظ.')}</p></fieldset>;
}
