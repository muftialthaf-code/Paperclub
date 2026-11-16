import React from'react';import{Megaphone,Star}from'lucide-react';import{tx}from'../i18n/translate';
import type{VenueBrand}from'./types';import{b,useBusinessLocale}from'./api';
/** Guest homepage extras for a venue: optional promo, featured game and the venue's own category chips. */
export default function VenueHome({brand,games,category,onCategory,onOpen}:{brand:VenueBrand,games:Array<{id:string,name:string,desc:string}>,category:string,onCategory:(id:string)=>void,onOpen:(id:string)=>void}){
 const locale=useBusinessLocale();const ar=locale==='ar-SA';const featured=games.find(g=>g.id===brand.featured);const cats=(brand.categories||[]).filter(c=>c.games.some(id=>games.some(g=>g.id===id)));
 if(!brand.promo&&!featured&&!cats.length)return null;
 return <section className="venue-home" aria-label={b('Venue highlights','أبرز ما في المكان')}>
  {brand.promo&&<p className="venue-promo" role="status"><Megaphone size={17}/><span>{ar?brand.promo.ar:brand.promo.en}</span></p>}
  {featured&&<div className="venue-featured"><Star size={18}/><div><span className="eyebrow">{b('FEATURED TODAY','مميزة اليوم')}</span><h2>{tx(featured.name)}</h2><p>{tx(featured.desc)}</p></div><button className="primary" onClick={()=>onOpen(featured.id)}>{b('Play now','العب الحين')}</button></div>}
  {cats.length>0&&<div className="venue-categories" role="group" aria-label={b('Game categories','تصنيفات الألعاب')}><button className={category===''?'active':''} aria-pressed={category===''} onClick={()=>onCategory('')}>{b('All games','كل الألعاب')}</button>{cats.map(c=><button key={c.id} className={category===c.id?'active':''} aria-pressed={category===c.id} onClick={()=>onCategory(c.id)}>{ar?c.ar:c.en}</button>)}</div>}
 </section>;
}
