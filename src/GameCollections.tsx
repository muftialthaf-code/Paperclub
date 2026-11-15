import {tx} from './i18n/translate';
import React from 'react';
import { Pencil, Users, ArrowRight } from 'lucide-react';
import { games } from './engine';
export type Collection = 'all' | 'paper' | 'none';
export default function GameCollections({ value, onChange }: {
    value: Collection;
    onChange: (value: Collection) => void;
}) {
    return <div className="game-collections" aria-label={tx("Game collections")}><button className={`collection-card${value === 'paper' ? ' selected' : ''}`} onClick={() => onChange('paper')} aria-pressed={value === 'paper'}><span className="collection-icon"><Pencil size={24}/></span><span><strong>{tx("Paper & Pen")}</strong><small>{tx("Sketch, solve and create together. Just add paper and pens.")}</small><b>{tx(games.filter(g => g.collection === 'paper').length)}{tx(" games \u00B7 Explore ")}<ArrowRight size={14}/></b></span></button><button className={`collection-card${value === 'none' ? ' selected' : ''}`} onClick={() => onChange('none')} aria-pressed={value === 'none'}><span className="collection-icon"><Users size={24}/></span><span><strong>{tx("No Props Needed")}</strong><small>{tx("Just people, imagination and a little friendly competition.")}</small><b>{tx(games.filter(g => g.collection === 'none').length)}{tx(" games \u00B7 No materials \u00B7 Explore ")}<ArrowRight size={14}/></b></span></button></div>;
}
