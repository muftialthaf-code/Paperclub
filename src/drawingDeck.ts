import{themedDrawingWords}from'./business/venueContent';
import{menuDrawingWords}from'./business/venueMenu';
import{adultRolesMore,adultActionsMore,drawingExtras,funnyAnimals,funnyActions,comboAdjectives,comboObjects}from'./content/drawingExpansion';
import {isArabic} from './i18n/locale';
import {arabicDrawingPool} from './arabic/common';
import {adultConcepts,adultRoles} from './adultGames';
/** All content is bundled locally. No network or AI service is used. */
export const drawingCategories: Record<string, string[]> = {
  Animals: ['Elephant','Giraffe','Camel','Flamingo','Octopus','Dinosaur','Penguin','Kangaroo','Crocodile','Turtle','Lion','Tiger','Zebra','Panda','Koala','Rabbit','Fox','Owl','Dolphin','Whale','Shark','Seahorse','Jellyfish','Peacock','Hedgehog'],
  Objects: ['Umbrella','Teapot','Backpack','Telescope','Camera','Clock','Candle','Key','Scissors','Glasses','Chair','Ladder','Balloon','Kite','Guitar','Drum','Crown','Treasure chest','Compass','Binoculars','Telephone','Paintbrush','Magnet','Spinning top','Lantern'],
  Food: ['Pizza','Ice cream','Birthday cake','Watermelon','Pineapple','Banana','Apple','Strawberry','Carrot','Broccoli','Cupcake','Doughnut','Sandwich','Pancakes','Popcorn','Cookie','Cheese','Cherries','Pear','Lemon','Corn on the cob','Croissant','Spaghetti','Taco','Bowl of soup'],
  Vehicles: ['Rocket','Helicopter','UFO','Airplane','Bicycle','Motorcycle','Fire engine','Ambulance','School bus','Taxi','Train','Tractor','Submarine','Sailboat','Pirate ship','Hot air balloon','Unicycle','Skateboard','Scooter','Rowboat','Dump truck','Race car','Cable car','Snowmobile','Space rover'],
  Characters: ['Superhero','Pirate','Astronaut','King','Queen','Princess','Knight','Robot','Ninja','Detective','Clown','Ballerina','Cowboy','Wizard','Explorer','Viking','Samurai','Magician','Circus acrobat','Lifeguard'],
  Places: ['Castle','Lighthouse','Treehouse','Farm','Zoo','Playground','Beach','Island','Library','Bakery','Museum','Cinema','Aquarium','Train station','Space station','Igloo','Campsite','Windmill','Pyramid','Bridge','Carnival','Skate park','Swimming pool','Flower shop','Mountain cabin'],
  Nature: ['Volcano','Waterfall','Mountain','Rainbow','Snowflake','Sunflower','Cactus','Palm tree','Mushroom','Seashell','Butterfly','Dragonfly','Bumblebee','Spider web','Leaf','Acorn','Pine cone','Cloud','Lightning bolt','Sun','Moon','Comet','Shooting star','Coral reef','Snowman'],
  Fantasy: ['Dragon','Mermaid','Unicorn','Ghost','Fairy','Phoenix','Griffin','Sea monster','Friendly troll','Goblin','Genie','Pegasus','Giant','Leprechaun','Enchanted mirror','Magic carpet','Magic wand','Flying castle','Talking tree','Crystal ball'],
  Occupations: ['Chef','Firefighter','Doctor','Nurse','Teacher','Farmer','Pilot','Police officer','Dentist','Scientist','Artist','Baker','Builder','Gardener','Veterinarian','Mechanic','Diver','Beekeeper','Musician','Mail carrier'],
  'Funny situations': ['A cat wearing boots','A dinosaur baking a cake','An elephant on a bicycle','A chicken at the piano','A dog doing yoga','A penguin surfing','A bear eating spaghetti','A giraffe in a tiny car','A frog with a crown','A shark wearing sunglasses','A rabbit on roller skates','A turtle winning a race','An octopus knitting','A fox flying a kite','A lion at the hairdresser','A duck lifting weights','A mouse with a giant sandwich','A monkey taking a selfie','A zebra painting stripes','A whale blowing bubbles'],
  'Imaginative combinations': ['A robot gardener','A flying teapot','A castle on a cloud','A rocket-shaped treehouse','A dragon in a spacesuit','A mermaid riding a seahorse','A unicorn delivering pizza','A pirate on the moon','A submarine with wings','A house inside a mushroom','A balloon-powered bicycle','An ice cream planet','A tree that grows doughnuts','A dinosaur school bus','A moon made of cheese','A flower with an umbrella','A tiny city in a bottle','A superhero snowman','A library under the sea','A rainbow bridge to a castle'],
};
const article=(word:string)=>/^[aeiou]/i.test(word)?'An':'A';
const fresh=(have:string[],more:string[])=>{const seen=new Set(have.map(w=>w.toLowerCase()));return more.filter(w=>{const k=w.toLowerCase();if(seen.has(k))return false;seen.add(k);return true})};
for(const [category,extra] of Object.entries(drawingExtras)){drawingCategories[category]=drawingCategories[category]||[];drawingCategories[category].push(...fresh(drawingCategories[category],extra))}
drawingCategories['Funny situations'].push(...fresh(drawingCategories['Funny situations'],funnyAnimals.flatMap(animal=>funnyActions.map(action=>`${article(animal)} ${animal} ${action}`))));
drawingCategories['Imaginative combinations'].push(...fresh(drawingCategories['Imaginative combinations'],comboAdjectives.flatMap(adjective=>comboObjects.map(object=>`${article(adjective)} ${adjective} ${object}`))));
export const drawingChallenges = [...new Set(Object.values(drawingCategories).flat())];
export const adultDrawingChallenges = [...new Set([...adultConcepts, ...[...adultRoles,...adultRolesMore].flatMap(role => ['negotiating with a dragon','chasing a deadline','pitching an invention','juggling conflicting priorities','solving a paradox','mediating a robot argument','repairing a time machine','conducting a silent orchestra','auctioning invisible art','balancing a chaotic budget','mapping a dream','escaping an endless meeting',...adultActionsMore].map(action => `${role} ${action}`))])];
export function drawingPool(difficulty:string):string[]{
 if(difficulty==='Hard')return adultDrawingChallenges;
 if(difficulty==='Easy')return Object.entries(drawingCategories).filter(([category])=>!['Funny situations','Imaginative combinations','Fantasy'].includes(category)).flatMap(([,words])=>words);
 return drawingChallenges;
}
export type SpeedRound = {
  difficulty?: string;
  items: string[];
  revealed: boolean[];
  round: number;
  remaining: string[];
  selections: string[];
};
function shuffled(items: string[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
const signature = (items: string[]) => [...items].sort().join('\u0000');

/** A persisted shuffle bag uses every challenge before refilling. */
export function createSpeedRound(previous?: SpeedRound, difficulty = previous?.difficulty || 'Medium'): SpeedRound {
  const custom=themedDrawingWords(difficulty);const pool=[...new Set([...custom,...(isArabic()?arabicDrawingPool(difficulty):drawingPool(difficulty))])];
  let remaining = previous && (previous.difficulty || 'Medium') === difficulty ? [...previous.remaining] : shuffled(pool);
  if(!previous&&custom.length)remaining=[...custom,...remaining.filter(word=>!custom.includes(word))];
  const previousWords = new Set(previous?.items || []);
  const items: string[] = [];
  while (items.length < 16) {
    if (!remaining.length) remaining = shuffled(pool);
    // At a bag boundary, defer words from the immediately preceding round.
    // Deferral preserves them in the bag instead of silently discarding them.
    const index = remaining.findIndex(word => !previousWords.has(word) && !items.includes(word));
    if (index === -1) {
      const deferred = remaining;
      remaining = [...shuffled(pool.filter(word => !deferred.includes(word))), ...deferred];
      continue;
    }
    items.push(remaining.splice(index, 1)[0]);
  }
  // Venue menu: a couple of the guest's own menu items join each round (never the adult scenes).
  if(difficulty!=='Hard'){const menuWords=menuDrawingWords().filter(word=>!previousWords.has(word)&&!items.includes(word));for(let i=0;i<Math.min(2,menuWords.length);i++){const word=menuWords.splice(Math.floor(Math.random()*menuWords.length),1)[0];items[Math.floor(Math.random()*items.length)]=word;if(new Set(items).size!==items.length){items.splice(0,items.length,...new Set(items));while(items.length<16){const spare=pool.find(w=>!items.includes(w)&&!previousWords.has(w));if(!spare)break;items.push(spare)}}}}
  const selections = previous?.selections || [];
  // Treat a selection as a set: merely shuffling the same 16 is never a new round.
  while (selections.includes(signature(items))) {
    const index = remaining.findIndex(word => !previousWords.has(word) && !items.includes(word));
    if (index === -1) remaining.push(...shuffled(pool.filter(word => !previousWords.has(word) && !items.includes(word))));
    else {
      const replacement = remaining.splice(index, 1)[0];
      remaining.push(items.pop()!);
      items.push(replacement);
    }
  }
  return { difficulty, items, revealed: Array(16).fill(false), round: (previous?.round || 0) + 1, remaining, selections: [...selections, signature(items)] };
}
export function toggleSpeedCard(state: SpeedRound, index: number): SpeedRound {
  return { ...state, revealed: state.revealed.map((visible, i) => i === index ? !visible : visible) };
}
