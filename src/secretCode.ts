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
const youngSubjects = ['cat','dog','bear','duck','frog','fox','robot','dragon','pirate','rabbit'];
const olderSubjects = ['astronaut','explorer','detective','wizard','inventor','dolphin','princess','librarian','unicorn','penguin'];
const adjectives = ['friendly','brave','clever','curious','sleepy','tiny','happy','helpful','little','playful'];
const destinations = ['castle','forest','garden','island','village','river','mountain','cave','tower','beach'];
const treasures = ['golden key','hidden map','silver crown','magic book','glowing gem','lost compass','secret letter','tiny telescope','treasure chest','crystal star'];

export function secretMessage(difficulty: string, age: number): string {
  if (difficulty === 'Easy') return choose(easyCodeWords).toUpperCase();
  if (difficulty !== 'Hard') {
    const words = age < 8 ? familiarLongWords : [...familiarLongWords, ...advancedLongWords];
    return (Math.random() < 0.55 ? choose(words) : choose(shortPhrases)).toUpperCase();
  }
  // Age adjusts familiarity, never the selected level or sentence length.
  const subject = choose(age < 8 ? youngSubjects : [...youngSubjects, ...olderSubjects]);
  const adjective = choose(adjectives);
  const destination = choose(destinations);
  const treasure = choose(treasures);
  return choose([
    `The ${adjective} ${subject} found the ${treasure}`,
    `Follow the ${adjective} ${subject} to the ${destination}`,
    `Look for the ${treasure} inside the ${destination}`,
    `The ${subject} hid the ${treasure} near the ${destination}`,
    `A ${adjective} ${subject} lives in the ${destination}`,
    `Bring the ${treasure} to the ${adjective} ${subject}`,
    `The ${adjective} ${subject} will help us find the ${treasure}`,
    `Our next adventure begins at the ${destination}`,
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
