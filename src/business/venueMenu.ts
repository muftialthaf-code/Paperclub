import{isArabic}from'../i18n/locale';
import type{MenuItem}from'./types';
/**
 * The venue's own menu, mixed into the shared game libraries so prompts feel personal.
 * Held only in memory for the current guest session and cleared when the session ends.
 */
let items:MenuItem[]=[];
export function setVenueMenu(next:MenuItem[]|undefined){items=Array.isArray(next)?next.filter(i=>i&&(i.en||i.ar)):[]}
export function clearVenueMenu(){items=[]}
export const hasVenueMenu=()=>items.length>0;
const pickName=(i:MenuItem)=>isArabic()?(i.ar||i.en):(i.en||i.ar);
const hasName=(i:MenuItem)=>!!pickName(i);
const usable=()=>items.filter(hasName);
const verb=(kind:MenuItem['kind'])=>kind==='drink'?{en:'Drink',ar:'تشرب'}:{en:'Eat',ar:'تاكل'};
/** Chance that a prompt in an eligible game comes from the menu instead of the standard library. */
const MENU_SHARE=0.3;
type Template={id:string,en:string,ar:string};
const T:Record<string,Template[]>={
 'np-topics':[{id:'t1',en:'What would you tell someone who has never tried {x}?',ar:'وش تقول لشخص ما جرب {x} عمره؟'},{id:'t2',en:'What would you add to {x}, and why?',ar:'وش تضيف على {x}؟ وليش؟'},{id:'t3',en:'Tell us your best memory with {x}.',ar:'احكِ لنا أحلى ذكرى لك مع {x}.'}],
 'np-convince':[{id:'c1',en:'{x} should be on every family’s table.',ar:'لازم يكون {x} على سفرة كل عيلة.'},{id:'c2',en:'{x} is the best thing on the menu.',ar:'أحلى شي بالمنيو هو {x}.'}],
 'np-yesno':[{id:'y1',en:'Do you like {x}?',ar:'تحب {x}؟'},{id:'y2',en:'Have you ever tried {x}?',ar:'جربت {x} قبل؟'},{id:'y3',en:'Would you order {x} for breakfast?',ar:'تطلب {x} مع الفطور؟'}],
 'np-association':[{id:'a1',en:'{x}',ar:'{x}'}],
 'np-rapid':[{id:'r1',en:'Name one thing that goes well with {x}.',ar:'اذكر شي يتماشى مع {x}.'}],
 'np-countdown':[{id:'k1',en:'Things that go well with {x}',ar:'أشياء تتماشى مع {x}'}],
};
function fill(t:Template,item:MenuItem){const name=pickName(item);return(isArabic()?t.ar:t.en).replace('{x}',name)}
/** A menu-based spoken prompt, or null when the menu should not be used this time. */
export function menuSpoken(game:string,level:string,history:string[],random:()=>number=Math.random){
 const list=usable();if(!list.length||random()>=MENU_SHARE)return null;
 if(game==='np-side'){const pair=menuPair(history,random);return pair?{key:pair.key,a:pair.a,b:pair.b,text:isArabic()?'أي طرف بتدافع عنه؟':'Which side will you defend?'}:null}
 const templates=T[game];if(!templates)return null;
 const options=list.flatMap((item,i)=>templates.map(t=>({key:`menu:${game}:${t.id}:${i}:${pickName(item)}`,t,item}))).filter(o=>!history.includes(o.key));if(!options.length)return null;
 const o=options[Math.floor(random()*options.length)];const text=fill(o.t,o.item);
 return{key:o.key,text,...(game==='np-countdown'?{required:level==='Easy'?3:level==='Medium'?5:7}:{})};
}
/** Two items of the same kind as a Would You Rather pair. */
export function menuPair(history:string[],random:()=>number=Math.random):{key:string,a:string,b:string}|null{
 const list=usable();const pairs:Array<[MenuItem,MenuItem]>=[];
 for(const kind of['drink','food','dessert']as const){const group=list.filter(i=>i.kind===kind);for(let x=0;x<group.length;x++)for(let y=x+1;y<group.length;y++)pairs.push([group[x],group[y]])}
 const options=pairs.map(([p,q])=>({key:`menu:pair:${p.kind}:${pickName(p)}:${pickName(q)}`,p,q})).filter(o=>!history.includes(o.key));if(!options.length)return null;
 const o=options[Math.floor(random()*options.length)];const v=verb(o.p.kind);const ar=isArabic();
 return{key:o.key,a:ar?`${v.ar} ${pickName(o.p)} بس لمدة أسبوع`:`${v.en} only ${pickName(o.p)} for a week`,b:ar?`${v.ar} ${pickName(o.q)} بس لمدة أسبوع`:`${v.en} only ${pickName(o.q)} for a week`};
}
/** Menu-based Challenge objects for the paper-and-pen engine. */
export function menuChallenge(id:string,level:string,history:string[],random:()=>number=Math.random){
 const list=usable();if(!list.length||random()>=MENU_SHARE)return null;const ar=isArabic();
 if(id==='rather'){const pair=menuPair(history,random);return pair?{key:pair.key,text:ar?'وش تختار؟':'Would you rather…',optionA:pair.a,optionB:pair.b,category:ar?'من قائمتنا':'From our menu',instruction:ar?'كل واحد يختار لحاله. اكشفوا اختياركم مع بعض، وبعدها قولوا ليه. اسمعوا لبعض باحترام.':'Choose independently, then reveal A or B together. Take turns explaining why. There is no correct answer; listen to each other’s reasoning.'}:null}
 if(id==='five'){const food=list.filter(i=>i.kind!=='drink');const pool=(food.length?food:list);const options=pool.map(item=>({key:`menu:five:${pickName(item)}`,item})).filter(o=>!history.includes(o.key));if(!options.length)return null;const o=options[Math.floor(random()*options.length)];const n=level==='Easy'?2:3;
  return{key:o.key,text:ar?`اذكر ${n===2?'مثالين':'ثلاثة أمثلة'}: مكونات ممكن تلقاها في ${pickName(o.item)}.`:`Name ${n===2?'two':'three'} ingredients you might find in ${pickName(o.item)}.`,instruction:ar?'اقروا الفئة أول، وبعدها شغّلوا الخمس ثواني. المضيف يشيك الإجابات ويحسب النقاط.':'Read the challenge aloud, then start the timer. Players write their answers. The parent checks them.'}}
 if(id==='detective'){const options=list.map(item=>({key:`menu:detective:${pickName(item)}`,item})).filter(o=>!history.includes(o.key));if(!options.length)return null;const o=options[Math.floor(random()*options.length)];return{key:o.key,text:pickName(o.item),instruction:ar?'أرِ السر للرسام فقط. يرسم دليل بعد دليل، والباقين يكتبون تخمينهم.':'Show the secret to the artist only. Draw one clue at a time. Everyone else writes a guess.'}}
 return null;
}
/** Menu names for the drawing decks (current language). */
export const menuDrawingWords=()=>usable().map(pickName);
