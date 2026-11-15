import {tx} from './i18n/translate';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { createSpeedRound, toggleSpeedCard, type SpeedRound } from './drawingDeck';
type Props = {
    state?: SpeedRound;
    onChange: (state: SpeedRound) => void;
    onLeave: () => void;
    onRecord?: () => void;
};
export default function SpeedDrawing({ state, onChange, onLeave, onRecord }: Props) {
    const [initial] = useState(() => createSpeedRound());
    const game = state || initial;
    useEffect(() => { if (!state)
        onChange(initial); }, [state]);
    const revealed = game.revealed.filter(Boolean).length;
    function reset() {
        onChange(createSpeedRound(game));
        window.scrollTo({ top: 0, behavior: 'instant' });
    }
    return <section className={`speed-game${game.difficulty === 'Hard' ? ' adult-speed' : ''}`} aria-labelledby="speed-title">
    <header className="speed-heading">
      <div><h1 id="speed-title">{tx("Speed Drawing")}</h1><p>{tx("Reveal a card. Draw on paper. Guess together.")}</p></div>
      <button className="speed-leave" aria-label={tx("Back to rules and settings")} onClick={onLeave}><ArrowLeft size={20}/></button>
      <div className="speed-status" aria-live="polite" aria-atomic="true"><strong>{tx("Round ")}{tx(game.round)}</strong><label className="speed-level"><span className="sr-only">{tx("Difficulty")}</span><select aria-label={tx("Speed Drawing difficulty")} value={game.difficulty || 'Medium'} onChange={e => onChange(createSpeedRound(game, e.target.value))}><option dir="auto" value="Easy">{tx("Easy \u00B7 Kids")}</option><option dir="auto" value="Medium">{tx("Medium \u00B7 Kids")}</option><option dir="auto" value="Hard">{tx("Hard \u00B7 Adults")}</option></select></label><span>{tx(revealed)}{tx("/16 revealed")}</span></div>
    </header>
    <div className="mystery-grid" aria-label={tx("16 mystery drawing cards")}>
      {tx(game.items.map((word, index) => <button key={index} type="button" className={`mystery-card${game.revealed[index] ? ' is-revealed' : ''}`} aria-pressed={game.revealed[index]} aria-label={tx(`Card ${index + 1}${game.revealed[index] ? `: ${word}. Tap to hide` : '. Tap to reveal'}`)} onClick={() => onChange(toggleSpeedCard(game, index))}>{tx(game.revealed[index]
                ? <><span className="revealed-number">{tx(index + 1)}</span><span className="mystery-word">{tx(word)}</span></>
                : <><span className="mystery-number">{tx(index + 1)}</span><span className="mystery-instruction">{tx("Tap to reveal")}</span></>)}
      </button>))}
    </div>
    <div className="speed-reset"><button className="primary wide" onClick={reset}><RotateCcw size={18}/>{tx("Reset \u2013 New 16 Words")}</button>{tx(onRecord && <button className="text-button speed-award-button" onClick={onRecord}>{tx("Save participation or a drawing award")}</button>)}</div>
  </section>;
}
