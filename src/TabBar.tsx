import type { ReactNode } from 'react';
import { tx } from './i18n/translate';

export type TabItem = { id: string; label: string; icon: ReactNode };

/** Phone-only bottom navigation. Hidden by CSS above 700px. */
export default function TabBar({ items, page, onSelect }: { items: TabItem[]; page: string; onSelect: (id: string) => void }) {
  return <div className="tab-bar" style={{ ['--tabs' as string]: items.length }}>
    {items.map(item => <button key={item.id} className={page === item.id ? 'active' : ''} aria-current={page === item.id ? 'page' : undefined} onClick={() => onSelect(item.id)}>{item.icon}<span>{tx(item.label)}</span></button>)}
  </div>;
}
