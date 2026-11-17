import { TrendingUp, Type, Lightbulb, Scale, LayoutGrid, Pencil, Wand2, Lock, Timer, Search, BookOpen, Crosshair, DoorOpen, MessageCircle, Mic, Megaphone, Split, ListOrdered, Link2, Drama, Zap, Repeat, HelpCircle, Sparkles, type LucideIcon } from 'lucide-react';

/** One small, distinct glyph per game so the library does not look repetitive. Presentation only. */
const glyphs: Record<string, LucideIcon> = {
  ladder: TrendingUp, anagram: Type, invent: Lightbulb, rather: Scale, scatter: LayoutGrid, speed: Pencil,
  impossible: Wand2, code: Lock, five: Timer, detective: Search, story: BookOpen, battle: Crosshair, escape: DoorOpen,
  'np-topics': MessageCircle, 'np-story60': Mic, 'np-convince': Megaphone, 'np-side': Split, 'np-countdown': ListOrdered,
  'np-association': Link2, 'np-truths': Drama, 'np-scenario': HelpCircle, 'np-rapid': Zap, 'np-opposite': Repeat,
};

export default function GameGlyph({ id }: { id: string }) {
  const Icon = glyphs[id] || Sparkles;
  return <span className="game-glyph" aria-hidden="true"><Icon size={20} strokeWidth={2.2} /></span>;
}
