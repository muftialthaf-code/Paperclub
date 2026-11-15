import{isArabic}from'./locale';
import{uiArabic,uiTemplates}from'./uiArabic';
export const missingTranslations=new Set<string>();
const folded=Object.fromEntries(Object.entries(uiArabic).map(([key,value])=>[key.toLowerCase(),value]));
const patterns=Object.entries(uiTemplates).sort((a,b)=>b[0].replace(/\{\d+\}/g,'').length-a[0].replace(/\{\d+\}/g,'').length).map(([source,target])=>({source,target,re:new RegExp('^'+source.trim().split(/\{\d+\}/).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(.*?)')+'$','s')}));
export function t(text:string):string{
 if(!isArabic()||!/[A-Za-z]/.test(text))return text;
 const value=text.trim();if(/[\u0600-\u06ff]/.test(value)&&(value.match(/[A-Za-z][A-Za-z0-9]*/g)||[]).every(token=>/^(Au|Fe|Na|Ag|H2O|HH|MM|[A-Z][1-9]?)$/.test(token)))return text;const match=uiArabic[value]??folded[value.toLowerCase()];if(match!==undefined)return text.replace(value,match);
 for(const p of patterns){const m=value.match(p.re);if(m)return text.replace(value,p.target.replace(/\{(\d+)\}/g,(_,n)=>/^(Award|Deduct|Remove point|Confirmed score|Profile for|A Paperclub certificate|\{0\} sank|\{0\}, your turn)/.test(p.source)?m[+n+1]||'':t(m[+n+1]||'')))}
 if(/^[A-Z]$/.test(value))return text;
 if(/^(paperclub|Paperclub|A|B|EN|English|HH:MM|HH|MM|MB|SVG|JSON|kg|Au|Fe|Na|Ag|H2O|parent@example\.com)$/i.test(value)||/^(https?:|mailto:|[\w.-]+@)/.test(value))return text;
 missingTranslations.add(value);return text;
}
/** Translate display values only. User text without a catalogue entry stays untouched. */
export function tx<T>(value:T):T{if(typeof value==='string')return t(value) as T;if(Array.isArray(value))return value.map(tx) as T;return value}
export function awardNote(text:string){return ['For bringing imagination, kindness and brilliant ideas to the table.','Chosen by the family for a wonderfully creative drawing.'].includes(text)?t(text):text}
