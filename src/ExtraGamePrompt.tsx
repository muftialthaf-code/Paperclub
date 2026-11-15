import {tx} from './i18n/translate';
import React from 'react';
import { Heart, Shuffle } from 'lucide-react';
import type { Challenge } from './engine';
export type FavouriteQuestion = {
    challenge: Challenge;
    difficulty: string;
};
export function ExtraGamePrompt({ id, challenge: c, ended, speaker, favourite, onFavourite, onSpeaker }: {
    id: string;
    challenge: Challenge;
    ended: boolean;
    speaker?: string;
    favourite: boolean;
    onFavourite: () => void;
    onSpeaker: () => void;
}) {
    if (id === 'ladder')
        return <><div className="word-ladder-words"><div><span className="eyebrow">{tx("START")}</span><h2>{tx(c.from)}</h2></div><span aria-hidden="true">{tx("\u2192")}</span><div><span className="eyebrow">{tx("TARGET")}</span><h2>{tx(c.to)}</h2></div></div><p className="small">{tx(c.minimum !== undefined ? `Minimum ${c.minimum} letter changes.` : `One validated route takes ${c.steps} changes; other routes may exist.`)}{tx(" Every intermediate word must be real. Write your ladder on paper.")}</p></>;
    if (id === 'anagram')
        return <><span className="pill">{tx(c.category)}</span><h2 className="anagram-word">{tx(c.text)}</h2>{tx(ended && <p role="status" className="feedback"><strong>{tx("Round ended. Pencils down!")}</strong><br />{tx("Compare words solved and update each player\u2019s score. Start a new round when ready.")}</p>)}</>;
    if (id === 'invent')
        return <><span className="eyebrow">{tx(c.category)}</span><h2>{tx(c.text)}</h2>{tx(ended && <p role="status" className="feedback">{tx("Design time is over. Present your inventions, then vote together.")}</p>)}<details><summary>{tx("Presentation & voting guide")}</summary><p>{tx("Give the invention a name. Show your drawing, explain how it solves the problem, and describe what makes it special.")}</p><p>{tx("Vote for creativity, funniest idea or practicality. The parent can award points manually. There is no single correct solution.")}</p></details></>;
    return <><h2>{tx("Would you rather\u2026")}</h2><div className="rather-options"><article><span className="eyebrow">{tx("OPTION A")}</span><h3>{tx(c.optionA)}{tx("?")}</h3></article><article><span className="eyebrow">{tx("OPTION B")}</span><h3>{tx(c.optionB)}{tx("?")}</h3></article></div><p className="small">{tx("Choose independently. Reveal A or B together, then explain your reasons.")}</p><div className="actions"><button className="secondary" onClick={onSpeaker}><Shuffle size={17}/>{tx("Pick a speaker")}</button><button className="text-button" aria-label={tx("Favourite question")} aria-pressed={favourite} onClick={onFavourite}><Heart size={17} fill={favourite ? 'currentColor' : 'none'}/>{tx(favourite ? 'Question saved' : 'Save question')}</button></div>{tx(speaker && <p role="status" className="hint"><bdi>{speaker}</bdi>{tx(", explain your choice first. Everyone else gets a turn too.")}</p>)}</>;
}
export function FavouriteQuestions({ items, onRemove }: {
    items: FavouriteQuestion[];
    onRemove: (key: string) => void;
}) {
    if (!items.length)
        return null;
    return <section className="saved-questions"><div className="section-heading"><div><span className="eyebrow">{tx("CONVERSATIONS WORTH KEEPING")}</span><h2>{tx("Your favourite questions.")}</h2></div></div><div className="saved-question-grid">{tx(items.map(({ challenge: c, difficulty }) => <article className="challenge-panel" key={c.key}><span className="eyebrow">{tx("WOULD YOU RATHER? \u00B7 ")}{tx(difficulty)}</span><p><b>{tx("A.")}</b>{tx(" ")}{tx(c.optionA)}{tx("?")}</p><p><b>{tx("B.")}</b>{tx(" ")}{tx(c.optionB)}{tx("?")}</p><button className="text-button" onClick={() => onRemove(c.key!)}><Heart size={15} fill="currentColor"/>{tx("Remove favourite")}</button></article>))}</div></section>;
}
