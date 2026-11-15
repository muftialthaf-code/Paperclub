import React,{createContext,useContext,useState}from'react';
import{getLocale,setLocale,type Locale}from'./locale';
const Context=createContext({locale:getLocale()});
let guard:{active:boolean,leave:()=>void}={active:false,leave:()=>{}};
export function registerLanguageGuard(value:typeof guard){guard=value}
export const useLocale=()=>useContext(Context).locale;
export default function LanguageProvider({children}:{children:React.ReactNode}){
 const[locale,update]=useState(getLocale);const[pending,setPending]=useState<Locale|null>(null);const[switchError,setSwitchError]=useState(false);
 setLocale(locale);
 function change(next:Locale){if(next===locale)return;if(guard.active){setSwitchError(false);setPending(next);return}guard.leave();setLocale(next);update(next)}
 function confirm(){if(!pending)return;try{guard.leave()}catch{setSwitchError(true);return}setLocale(pending);update(pending);setPending(null)}
 return <Context.Provider value={{locale}}>{children}<div className="language-toggle" role="group" aria-label={locale==='en'?'Language':'اللغة'} dir="ltr"><button lang="en" aria-pressed={locale==='en'} onClick={()=>change('en')}>{locale==='en'?'EN':'English'}</button><span aria-hidden="true">|</span><button lang="ar-SA" aria-pressed={locale==='ar-SA'} onClick={()=>change('ar-SA')}>العربية</button></div>{pending&&<div className="modal-backdrop language-confirm"><section className="setup-modal" role="dialog" aria-modal="true" aria-labelledby="language-confirm-title"><h2 id="language-confirm-title">{locale==='en'?'Switch game language?':'نغيّر لغة اللعب؟'}</h2><p>{locale==='en'?'Your current game will pause and stay saved in English. You’ll return to the library in Arabic. Resume each language’s game separately.':'بنوقف لعبتكم ونحفظها بالعربي، وبنرجعكم لمكتبة الألعاب بالإنجليزي. تقدرون تكملون لعبة كل لغة لحالها.'}</p>{switchError&&<p role="alert">{locale==='en'?'Could not save your game. Free some device storage and try again. Your game has stayed open.':'ما قدرنا نحفظ اللعبة. فضّوا مساحة بالجهاز وجرّبوا مرة ثانية. لعبتكم للحين مفتوحة.'}</p>}<div className="actions"><button className="primary" onClick={confirm}>{locale==='en'?'Save & switch to Arabic':'احفظ وغيّر للإنجليزي'}</button><button className="secondary" onClick={()=>setPending(null)}>{locale==='en'?'Keep playing':'نكمل اللعب'}</button></div></section></div>}</Context.Provider>
}
