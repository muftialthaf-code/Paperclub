import{codeWordsMore}from'./content/codeWordsExpansion';
import{wordBanks}from'./wordGames';
import type {Challenge} from './engine';

const choose = <T,>(values: readonly T[]) => values[Math.floor(Math.random() * values.length)];
export const easyCodeWords = (
  'cat dog fox owl ant bee bat cow pig hen ram yak ape eel emu elk cub pup bug fly ' +
  'sun moon star rain snow wind leaf tree seed rose lily pond lake hill rock sand wave cave ' +
  'fish bird duck frog bear lion wolf deer goat lamb seal crab clam moth swan crow dove mole hare toad newt orca ' +
  'cake pie jam bun egg pear plum kiwi corn peas bean rice oats soup milk lime mint ' +
  'book pen desk lamp bed rug door bell key lock kite ball doll drum boat ship car bus bike cart ' +
  'shoe sock hat cap coat vest ring bead comb soap cup bowl fork pan pot dish coin dice gift flag tent nest shell'
).split(/\s+/).filter(word => word.length >= 3 && word.length <= 4);
{const seen = new Set(easyCodeWords);for (const word of [...codeWordsMore, ...Object.values(wordBanks).flat().map(w => w.toLowerCase()).filter(w => w.length >= 3 && w.length <= 4)]) if (!seen.has(word)) { seen.add(word); easyCodeWords.push(word); }}

const familiarLongWords = [
  'butterfly','strawberry','sunflower','rainbow','dinosaur','elephant','giraffe','penguin',
  'dolphin','octopus','hamster','ladybird','snowman','snowflake','firefly','seashell',
  'pineapple','pancakes','popcorn','sandwich','cupcake','chocolate','blueberry','broccoli',
  'bicycle','airplane','sailboat','tractor','balloon','trumpet','whistle','backpack',
  'umbrella','treasure','kingdom','princess','mermaid','unicorn','dragonfly','waterfall',
  'mountain','volcano','coconut','pumpkin','blanket','pillowcase','playground','treehouse',
];
const advancedLongWords = [
  'observatory','constellation','archaeologist','expedition','laboratory','navigation',
  'telescope','submarine','helicopter','lighthouse','binoculars','kaleidoscope','compass',
  'sapphire','emerald','amethyst','discovery','invention','adventure','imagination',
  'mysterious','camouflage','caterpillar','chameleon','porcupine','astronaut','spaceship',
];
const shortPhrases = [
  'hidden treasure','magic key','secret door','silver moon','golden crown','friendly dragon',
  'pirate ship','flying carpet','sleepy robot','rainbow bridge','tiny castle','brave explorer',
  'blue planet','giant pancake','dancing penguin','talking tree','mystery island','lost map',
  'moon garden','happy monster','paper rocket','starry night','snowy mountain','enchanted forest',
  'under the sea','behind the waterfall','follow the stars','open the chest','find the key',
  'save the castle','across the river','a secret message','the hidden passage','a curious fox',
];

export function secretMessage(difficulty: string, age: number): string {
  if (difficulty === 'Easy') return choose(easyCodeWords).toUpperCase();
  if (difficulty !== 'Hard') {
    const words = age < 8 ? familiarLongWords : [...familiarLongWords, ...advancedLongWords];
    return (Math.random() < 0.55 ? choose(words) : choose(shortPhrases)).toUpperCase();
  }
  // Adult messages retain the simple number key; difficulty comes from language and length.
  const subject=choose(['historian','architect','journalist','archivist','diplomat','cartographer','researcher','curator','engineer','botanist','analyst','composer','philosopher','astronomer','conservator']);
  const action=choose(['discovered','examined','recovered','restored','documented','studied','protected','catalogued','reconstructed','authenticated']);
  const object=choose(['ancient manuscript','missing blueprint','coded journal','historic artifact','secret treaty','rare painting','sealed letter','unfinished symphony','original sketch','forgotten archive']);
  const description=choose(['mysterious','valuable','hidden','original','forgotten','remarkable','unusual','unexpected']);
  return choose([
    `The ${subject} ${action} the ${description} ${object}`,
    `The ${subject} questioned the ${description} story behind the ${object}`,
    `Every ${description} detail in the ${object} deserves careful consideration`,
    `A patient ${subject} ${action} what the ${description} records concealed`,
    `The ${subject} kept the ${object} safe until morning`,
    `Nobody expected the ${subject} to find the ${description} ${object}`,
  ]).toUpperCase();
}

export type CipherKind = 'numbers' | 'reverse' | 'shift' | 'symbols' | 'twoStage';
export const codeSymbols = ['☀','☁','★','◆','●','▲','♥','✚','☾','☂','♣','♠','□','◇','○','△','☆','✦','✿','❖','⌂','⊕','⊗','⊙','≋','∞'];
export function encodeSecretMessage(answer: string, kind: CipherKind, shift = 3): Challenge {
  const text = answer.split(' ').map(word => [...word].map(letter => {
    const value = letter.charCodeAt(0) - 65;
    switch (kind) {
      case 'numbers': return String(value + 1);
      case 'reverse': return String.fromCharCode(90 - value);
      case 'shift': return String.fromCharCode(65 + (value + shift) % 26);
      case 'symbols': return codeSymbols[value];
      case 'twoStage': return String(value + 1 + shift);
    }
  }).join(' · ')).join(' / ');
  const hints: Record<CipherKind, string> = {
    numbers: 'A = 1, B = 2 … Z = 26',
    reverse: 'Reverse alphabet: A ↔ Z, B ↔ Y …',
    shift: `Letters moved forward ${shift} places. Move them back to decode.`,
    symbols: codeSymbols.map((symbol, i) => `${symbol}=${String.fromCharCode(65 + i)}`).join('  '),
    twoStage: `Subtract ${shift} from each number, then use A=1, B=2 …`,
  };
  return {
    text, answer, hint: hints[kind],
    instruction: `${kind === 'twoStage' ? 'Two-stage cipher: undo the number shift, then turn numbers into letters. ' : ''}Copy this code onto paper. ${answer.includes(' ') ? 'Each / separates two words. ' : ''}Decode the message together, or race to solve it. The key and answer stay hidden until you ask.`,
  };
}

export function createSecretCode(difficulty: string, age: number): Challenge {
  const kinds: CipherKind[] = difficulty === 'Easy' || difficulty === 'Hard'
    ? ['numbers'] : ['numbers','reverse','shift'];
  return encodeSecretMessage(secretMessage(difficulty, age), choose(kinds), choose([2,3,4,5]));
}

export function matchesSecretLevel(answer: string | undefined, difficulty: string): boolean {
  if (!answer || !/^[A-Z]+(?: [A-Z]+)*$/i.test(answer)) return false;
  const words = answer.split(' ');
  if (difficulty === 'Easy') return words.length === 1 && answer.length >= 3 && answer.length <= 4;
  if (difficulty === 'Hard') return words.length >= 5;
  return words.length === 1 ? answer.length >= 7 : words.length === 2 || words.length === 3;
}
