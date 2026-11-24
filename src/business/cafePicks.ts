import{games}from'../engine';
/** Quick, talk-and-laugh games that need no pens or paper: the default game list for a new café venue. */
export const CAFE_PICKS:string[]=['rather','five','np-topics','np-yesno','np-likely','np-hottakes','np-side','np-truths','np-rapid','np-opposite','np-countdown','np-association','np-scenario'].filter(id=>games.some(g=>g.id===id));
