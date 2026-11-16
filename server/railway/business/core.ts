import {createHash,createHmac,randomBytes,timingSafeEqual,createCipheriv,createDecipheriv} from 'node:crypto';
import type {VenueBrand} from '../../../src/business/types';
import {games} from '../../../src/engine';
export class BusinessError extends Error {constructor(public status:number,public code:string){super(code)}}
export const fail=(status:number,code:string):never=>{throw new BusinessError(status,code)};
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const token=()=>randomBytes(32).toString('base64url');
export const identifier=(v:unknown)=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(v)?v:fail(400,'invalid_identifier');
export function text(v:unknown,max=80){if(typeof v!=='string')return fail(400,'invalid_field');const s=v.normalize('NFC').trim();if(!s||s.length>max||/[\u0000-\u001f\u007f]/.test(s))return fail(400,'invalid_field');return s}
export const email=(v:unknown)=>{const s=text(v,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))return fail(400,'invalid_email');return s};
export const iso=(value:Date|string)=>new Date(value).toISOString();
export const blankBrand=(name:string):VenueBrand=>({displayName:name,welcomeEn:'Make room for a little play.',welcomeAr:'حيّاكم، خلّونا نلعب مع بعض.',primary:'#24365b',background:'#faf9f6',logoId:null,games:games.filter(g=>g.collection==='none').map(g=>g.id)});
function luminance(hex:string){const rgb=hex.slice(1).match(/../g)!.map(n=>parseInt(n,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
export const INHERITABLE=['primary','background','logoId','welcomeEn','welcomeAr','games','featured','categories','promo'] as const;
export type Inherit=Partial<Record<typeof INHERITABLE[number],boolean>>;
export function inheritFlags(v:unknown):Inherit{if(v===undefined||v===null)return{};if(typeof v!=='object'||Array.isArray(v))return fail(400,'invalid_inherit');const out:Inherit={};for(const[k,flag]of Object.entries(v as Record<string,unknown>)){if(!(INHERITABLE as readonly string[]).includes(k)||typeof flag!=='boolean')return fail(400,'invalid_inherit');if(flag)(out as any)[k]=true}return out}
/** Homepage layout: optional featured game, tenant-named categories and a short promotional message. */
function layout(v:any,gameIds:string[]){
 const featured=v.featured?String(v.featured):null;if(featured&&!gameIds.includes(featured))return fail(400,'invalid_featured');
 const rawCategories=v.categories===undefined||v.categories===null?[]:v.categories;if(!Array.isArray(rawCategories)||rawCategories.length>8)return fail(400,'invalid_categories');
 const ids=new Set<string>();const categories=rawCategories.map((c:any,i:number)=>{if(!c||typeof c!=='object')return fail(400,'invalid_categories');const id=typeof c.id==='string'&&/^[a-z0-9-]{1,30}$/.test(c.id)?c.id:'c'+(i+1);if(ids.has(id))return fail(400,'invalid_categories');ids.add(id);const g=Array.isArray(c.games)?c.games:[];if(g.length<1||g.length>24||new Set(g).size!==g.length||g.some((x:unknown)=>typeof x!=='string'||!gameIds.includes(x)))return fail(400,'invalid_categories');return{id,en:text(c.en,40),ar:text(c.ar,40),games:g as string[]}});
 let promo=null as null|{en:string,ar:string};if(v.promo&&(v.promo.en||v.promo.ar)){promo={en:text(v.promo.en,120),ar:text(v.promo.ar,120)}}
 return{featured,categories,promo};
}
export function brand(v:any):VenueBrand{if(!v||typeof v!=='object')return fail(400,'invalid_brand');const color=(s:unknown)=>typeof s==='string'&&/^#[0-9a-f]{6}$/i.test(s)?s:fail(400,'invalid_colour');const primary=color(v.primary),background=color(v.background);if(luminance(background)<.7)fail(400,'colour_contrast');if((Math.max(luminance(primary),luminance(background))+.05)/(Math.min(luminance(primary),luminance(background))+.05)<4.5||1.05/(luminance(primary)+.05)<4.5)return fail(400,'colour_contrast');if(!Array.isArray(v.games)||v.games.length<1||v.games.length>24||new Set(v.games).size!==v.games.length||v.games.some((id:unknown)=>!games.some(g=>g.id===id)))return fail(400,'invalid_games');return{displayName:text(v.displayName),welcomeEn:text(v.welcomeEn,300),welcomeAr:text(v.welcomeAr,300),primary,background,logoId:v.logoId?identifier(v.logoId):null,games:v.games,...layout(v,v.games)}}
/** Organisation defaults are a complete brand without a branch name. */
export function defaultsBrand(v:any):Omit<VenueBrand,'displayName'>{const {displayName:_,...rest}=brand({...v,displayName:'Organisation'});return rest}
/** Resolve what guests see: a branch's own published brand with any inherited fields replaced by the organisation's published defaults. */
export function effectiveBrand(own:VenueBrand|null,defaults:any,inherit:Inherit|null|undefined):VenueBrand|null{
 if(!own)return null;const out:any={featured:null,categories:[],promo:null,...own};
 if(defaults&&inherit)for(const f of INHERITABLE)if(inherit[f]&&defaults[f]!==undefined)out[f]=defaults[f];
 const ids:string[]=out.games;if(out.featured&&!ids.includes(out.featured))out.featured=null;
 out.categories=(out.categories||[]).map((c:any)=>({...c,games:c.games.filter((g:string)=>ids.includes(g))})).filter((c:any)=>c.games.length>0);
 return out as VenueBrand;
}
export function locationSettings(p:any){const timezone=text(p.timezone||'Asia/Riyadh',64);try{new Intl.DateTimeFormat('en',{timeZone:timezone}).format()}catch{return fail(400,'invalid_timezone')}const rotationHour=p.rotationHour??6,sessionMinutes=p.sessionMinutes??120;if(!Number.isInteger(rotationHour)||rotationHour<0||rotationHour>23||!Number.isInteger(sessionMinutes)||sessionMinutes<15||sessionMinutes>240)return fail(400,'invalid_schedule');return{timezone,rotationHour,sessionMinutes}}
/** Every window is exactly 24 hours. Time-zone offset is anchored when the location schedule is created/changed. */
export function rotationAnchor(now:number,zone:string,hour:number){const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'numeric',day:'numeric',hour:'numeric',minute:'numeric',second:'numeric',hourCycle:'h23'}).formatToParts(now).map(x=>[x.type,x.value]));const wall=Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second);const offset=wall-Math.floor(now/1000)*1000;return Date.UTC(+p.year,+p.month-1,+p.day,hour)-offset}
export function codeWindow(now:number,anchor:number){const start=anchor+Math.floor((now-anchor)/86400000)*86400000;return{start,end:start+86400000}}
export function verifier(code:string,location:string,secret:string){return createHmac('sha256',secret).update('venue-code:'+location+':'+code).digest('hex')}
export function equal(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
const key=(secret:string)=>createHash('sha256').update('venue-codes:v1:'+secret).digest();
export function encrypt(value:string,secret:string){const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key(secret),iv);const out=Buffer.concat([c.update(value,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),out]).toString('base64url')}
export function decrypt(value:string,secret:string){const raw=Buffer.from(value,'base64url'),c=createDecipheriv('aes-256-gcm',key(secret),raw.subarray(0,12));c.setAuthTag(raw.subarray(12,28));return Buffer.concat([c.update(raw.subarray(28)),c.final()]).toString('utf8')}
