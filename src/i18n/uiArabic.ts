import{accountCopy}from'./accountCopy';
import{uiPairs}from'./uiPairs';
import{games,rules}from'../engine';
import{arabicMetadata}from'../arabic/common';
import{arabicRules}from'../arabic/rules';
export const uiArabic:Record<string,string>={...uiPairs,...accountCopy};
for(const g of games){const meta=arabicMetadata[g.id];if(meta){uiArabic[g.name]=meta[0];uiArabic[g.desc]=meta[1];uiArabic[g.tag]=meta[2]}for(const [i,rule]of(rules[g.id]||[]).entries())uiArabic[rule]=arabicRules[g.id]?.[i]||arabicRules[g.id]?.at(-1)||rule}
export const uiTemplates:Record<string,string>={
'{0}, your turn':'{0}، دورك', 'Word {0} · {1}':'الكلمة {0} · {1}', 'Player of the month · {0}':'لاعب الشهر · {0}',
' · Turn {0}':' · الدور {0}', ' · Word {0}':' · الكلمة {0}', ' · {0} points':' · {0} نقاط',
': {0}. Tap to hide':': {0}. اضغط عشان تخفي',
'Age {0}':'العمر {0}', 'Avatar {0}':'الصورة الرمزية {0}', 'Colour {0}':'اللون {0}',
'Award 1 point to {0}':'اعطِ نقطة لـ{0}', 'Award 2 points to {0}':'اعطِ نقطتين لـ{0}', 'Award point to {0}':'اعطِ نقطة لـ{0}',
'Deduct point from {0}':'اسحب نقطة من {0}', 'Remove point from {0}':'اسحب نقطة من {0}',
'CLUE {0} OF 3':'التلميح {0} من 3', 'Confirmed score for {0}':'النقاط المؤكدة لـ{0}',
'Card {0}. Tap to reveal':'البطاقة {0}. اضغط عشان تكشف', 'Card {0}: {1}. Tap to hide':'البطاقة {0}: {1}. اضغط عشان تخفي',
'Enter a coordinate such as A1. Use A–{0}, 1–{1}.':'اكتبوا إحداثية مثل A1. استخدموا A–{0} و1–{1}.',
'Favourite {0}':'أضف {0} للمفضلة','Open {0}':'افتح {0}','Play {0}':'العب {0}',
'Lock {0} of {1} · {2}':'القفل {0} من {1} · {2}',
'Minimum {0} letter changes.':'أقل عدد تغييرات: {0}.',
'One validated route takes {0} changes; other routes may exist.':'فيه مسار مؤكد بـ{0} تغييرات، وممكن تلقون غيره.',
'Player {0} name':'اسم اللاعب {0}', 'Team {0} name':'اسم الفريق {0}', 'Player {0}':'اللاعب {0}', 'Team {0}':'الفريق {0}',
'Profile for {0}':'ملف {0}', 'QUESTION {0} OF {1}':'السؤال {0} من {1}',
'Round letter {0}':'حرف الجولة {0}', 'Round {0}{1} · {2}':'الجولة {0}{1} · {2}',
'Saved profile for player {0}':'الملف المحفوظ للاعب {0}', 'The answer has {0} letters. Category: {1}.':'الإجابة {0} حروف. الفئة: {1}.',
'Up to {0} min':'لين {0} دقيقة', '{0} category points':'نقاط {0} بالفئة',
'{0} locks opened':'{0} أقفال انفتحت', '{0} players':'{0} لاعبين', '{0} sank the fleet!':'{0} أغرق الأسطول!',
'{0} seconds':'{0} ثواني', '{0} turns completed':'{0} أدوار اكتملت',
'{0}: Hit! Mark both paper grids.':'{0}: إصابة! سجّلوا على الشبكتين.',
'{0}: Miss. Mark both paper grids.':'{0}: ما أصبت. سجّلوا على الشبكتين.',
'Each player draws two {0}×{1} grids, labelled A–{2} and 1–{3}.':'كل لاعب يرسم شبكتين {0}×{1}، بحروف A–{2} وأرقام 1–{3}.',
'Secretly place ships of lengths {0} in straight lines. No overlaps. One grid holds your fleet; the other tracks shots.':'خبّوا سفن بأطوال {0} بخطوط مستقيمة وبدون تداخل. شبكة للأسطول والثانية للطلقات.',
'The first player to hit all {0} enemy ship squares wins. Announce when each ship is sunk.':'أول لاعب يصيب كل مربعات الخصم الـ{0} يفوز. أعلنوا إذا غرقت سفينة.',
'A Paperclub certificate for {0}':'شهادة بيبركلب لـ{0}',
};
