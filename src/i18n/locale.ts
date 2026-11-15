export type Locale='en'|'ar-SA';
let current:Locale='en';
try{if(globalThis.localStorage?.getItem('pc-language')==='ar-SA')current='ar-SA'}catch{}
export const getLocale=()=>current;
export function setLocale(locale:Locale){current=locale;try{globalThis.localStorage?.setItem('pc-language',locale)}catch{}if(typeof document!=='undefined'){document.documentElement.lang=locale;document.documentElement.dir=locale==='ar-SA'?'rtl':'ltr';document.title=locale==='ar-SA'?'Paperclub — لمّة وألعاب':'Paperclub — Make room for play'}}
export const isArabic=()=>current==='ar-SA';
export function normalizeArabic(text:string){return text.normalize('NFC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).trim()}
export function matchesAnswer(input:string,answer:string){return normalizeArabic(input).replace(/\s+/g,'').toLocaleLowerCase()===normalizeArabic(answer).replace(/\s+/g,'').toLocaleLowerCase()}
export const defaultPlayer=(index:number,teams=false)=>isArabic()?`${teams?'الفريق':'اللاعب'} ${index+1}`:`${teams?'Team':'Player'} ${index+1}`;
export const localDefaultName=(name:string)=>isArabic()?name.replace(/^Player (\d+)$/,'اللاعب $1').replace(/^Team (\d+)$/,'الفريق $1'):name.replace(/^اللاعب (\d+)$/,'Player $1').replace(/^الفريق (\d+)$/,'Team $1');
