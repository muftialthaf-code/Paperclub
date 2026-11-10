import React, {useEffect, useState} from 'react';
import {ArrowLeft, RotateCcw} from 'lucide-react';
import {createSpeedRound, toggleSpeedCard, type SpeedRound} from './drawingDeck';

type Props = {
  state?: SpeedRound;
  onChange: (state: SpeedRound) => void;
  onLeave: () => void;
};

export default function SpeedDrawing({state, onChange, onLeave}: Props) {
  const [initial] = useState(() => createSpeedRound());
  const game = state || initial;
  useEffect(() => { if (!state) onChange(initial); }, [state]);
  const revealed = game.revealed.filter(Boolean).length;

  function reset() {
    onChange(createSpeedRound(game));
    window.scrollTo({top: 0, behavior: 'instant'});
  }

  return <section className="speed-game" aria-labelledby="speed-title">
    <header className="speed-heading">
      <div><h1 id="speed-title">Speed Drawing</h1><p>Reveal a card. Draw on paper. Guess together.</p></div>
      <button className="speed-leave" aria-label="Back to games" onClick={onLeave}><ArrowLeft size={20}/></button>
      <div className="speed-status" aria-live="polite" aria-atomic="true"><strong>Round {game.round}</strong><span>{revealed}/16 revealed</span></div>
    </header>
    <div className="mystery-grid" aria-label="16 mystery drawing cards">
      {game.items.map((word, index) => <button
        key={index}
        type="button"
        className={`mystery-card${game.revealed[index] ? ' is-revealed' : ''}`}
        aria-pressed={game.revealed[index]}
        aria-label={`Card ${index + 1}${game.revealed[index] ? `: ${word}. Tap to hide` : '. Tap to reveal'}`}
        onClick={() => onChange(toggleSpeedCard(game, index))}
      >{game.revealed[index]
        ? <><span className="revealed-number">{index + 1}</span><span className="mystery-word">{word}</span></>
        : <><span className="mystery-number">{index + 1}</span><span className="mystery-instruction">Tap to reveal</span></>}
      </button>)}
    </div>
    <div className="speed-reset"><button className="primary wide" onClick={reset}><RotateCcw size={18}/>Reset – New 16 Words</button></div>
  </section>;
}
