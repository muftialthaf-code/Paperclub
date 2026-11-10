import type {Challenge, Settings, Puzzle} from './engine';
const choose = <T,>(items: readonly T[]) => items[Math.floor(Math.random()*items.length)];
export const adultConcepts = [
 'Opportunity cost','Confirmation bias','Procrastination','A conflict of interest','A slippery slope',
 'Supply and demand','Work life balance','The butterfly effect','A double standard','An identity crisis',
 'Creative burnout','Imposter syndrome','A self fulfilling prophecy','The generation gap','Analysis paralysis',
 'A false economy','Peer pressure','A moral dilemma','Delayed gratification','A hidden agenda',
 'A calculated risk','A chain reaction','A tipping point','A vicious circle','A compromise',
 'Culture shock','A second opinion','An awkward silence','A race against time','A change of perspective',
 'The glass ceiling','A leap of faith','A missed opportunity','A temporary solution','A long term investment',
 'The path of least resistance','A public relations disaster','A delicate negotiation','A turning point','A domino effect',
 'A storm in a teacup','The elephant in the room','A needle in a haystack','Burning the candle at both ends',
 'Putting the cart before the horse','A wolf in sheep’s clothing','A blessing in disguise','Moving the goalposts',
 'Biting off more than you can chew','Reading between the lines','Thinking outside the box','Back to square one',
 'The calm before the storm','The last straw','A fish out of water','A wild goose chase','An uphill battle',
 'The tip of the iceberg','A drop in the ocean','Walking on eggshells',
];
export const adultRoles = ['an architect','a historian','a diplomat','an inventor','a conductor','an accountant','a journalist','a curator','a cartographer','an entrepreneur','a negotiator','a philosopher'];
const adultActions = ['negotiating with a dragon','pitching a completely impractical invention','conducting a silent orchestra','organising a meeting in zero gravity','trying to stop a domino effect','auctioning an invisible painting','rewriting the laws of physics','repairing a clock that runs backwards','mediating a dispute between robots','giving directions to a time traveller','balancing a budget made of balloons','designing a bridge between clouds'];
const adultPlaces = ['in an upside down museum','at a crowded airport','inside a giant hourglass','on a moving chessboard','at the bottom of the ocean','in a library with no gravity','at a midnight train station','on a floating island','inside a paper city','at an underwater conference'];
export const adultDrawingConstraints = ['Use one continuous line','Use geometric shapes only','Include a clear foreground and background','Show three different emotions without words','Draw from an overhead perspective','Use negative space as part of the scene','Make the setting recognisable without labels','Include both a cause and its consequence'];
export function adultDrawing(): Challenge {
 return {text:`${choose(adultRoles)} ${choose(adultActions)} ${choose(adultPlaces)}. ${choose(adultDrawingConstraints)}.`,instruction:'Everyone draws the same complex scene on paper. Follow the drawing constraint; use no written labels. Vote for the most inventive interpretation.'};
}
export const adultQuickCategories = [
 'European capital cities','chemical elements that are metals','countries that border Germany',
 'authors of classic novels','economic terms','rhetorical devices','currencies used outside Europe',
 'prime numbers greater than twenty','composers of classical music','countries crossed by the equator',
 'Shakespeare plays','renewable energy technologies','architectural styles','branches of philosophy',
 'cognitive biases','inventions developed before electricity','languages with a non Latin writing system',
 'films that won the Academy Award for Best Picture','national currencies in Asia','types of business expense',
 'techniques used to preserve food','mountain ranges outside Europe','scientific units named after people',
 'landlocked countries','novels adapted into films','organisations with a three letter acronym',
 'logical fallacies','countries that share a border with France','musical genres originating before nineteen fifty',
 'jobs that require professional certification','metals used in electronics','methods of generating electricity',
];
export function adultQuickChallenge(): Challenge {
 return {text:`Name three ${choose(adultQuickCategories)}.`,instruction:'Adult challenge: read the category, then start the timer. The player writes three different valid examples. Agree on answers together before awarding a point.'};
}
const adultStoryStarts:Record<string,string[]>={
 Funny:['A meticulous town planner has accidentally approved a parade through the mayor’s office','A museum curator discovers that the priceless exhibit is a remarkably convincing sandwich','An accountant receives an invoice from their future self'],
 Adventure:['A cartographer discovers that one route on every map has been deliberately erased','A retired explorer receives a message from an expedition that vanished twenty years ago','A historian finds a travel journal describing events that have not happened yet'],
 Mystery:['An archivist finds two identical letters dated fifty years apart','A journalist notices that every witness remembers a different version of the same event','A clockmaker is asked to repair a clock that stops whenever someone tells the truth'],
 Fantasy:['A diplomat must negotiate a treaty between a city and the forest growing beneath it','An inventor discovers that borrowed time must eventually be repaid','A librarian learns that removing a book changes one detail in the real world'],
};
export const adultStoryConstraints = ['Use an unreliable narrator and plant a clue that another player can develop','Show the character’s motive through an action rather than explaining it','Introduce a choice with two equally costly consequences','Keep the tone but change the reader’s understanding of an earlier detail','Foreshadow the ending using an ordinary object','Write dialogue with a hidden second meaning','Reverse a character’s apparent motive without contradicting earlier events','Make a coincidence turn out to have a deliberate cause'];
export const adultTwists = ['The apparent antagonist offers a solution, but asks for a difficult compromise.','A trusted witness has told the truth while leaving out one crucial detail.','The evidence is genuine, but everyone has interpreted it incorrectly.','The main character must choose between keeping a promise and revealing the truth.','An earlier act of kindness has an unforeseen consequence.','The object everyone wants is valuable for a completely different reason.','Two characters have been pursuing the same goal for incompatible reasons.','A small detail from the opening becomes the key to resolving the conflict.'];
export function adultStory(s:Settings):Challenge {
 return {text:`${choose(adultStoryStarts[s.theme]||adultStoryStarts.Adventure)}. ${choose(['The decision cannot wait until morning','Nobody can agree on who should take responsibility','The obvious solution would break an important promise','The only person who can help has a conflicting motive'])}.`,instruction:`Adults: build a coherent story one sentence at a time. ${choose(adultStoryConstraints)}. Keep the story family friendly.`};
}
export function storyTurn(s:Settings, completedTurns:number):Challenge {
 const name=s.players[completedTurns%s.players.length];
 const twist=completedTurns%s.players.length===0;
 const last=completedTurns>=s.players.length*3-1;
 if(s.difficulty==='Hard')return {text:last?'Resolve the central dilemma and pay off an earlier clue.':twist?choose(adultTwists):choose(adultStoryConstraints),instruction:`${name}, add one sentence. ${last?'Give the story a satisfying conclusion without introducing a new coincidence.':'Preserve earlier facts and pass the paper when finished.'}`};
 return {text:last?'Write the ending to your story.':twist?choose(['A mysterious stranger arrives.','A hidden door opens nearby.','An unexpected animal joins the adventure.','The main character loses something important.','A secret message appears.','A new friend offers to help.']):'Add the next sentence to your story.',instruction:`${name}, it’s your turn. ${last?'Finish the adventure together.':'Pass the paper when you finish.'}`};
}
export type BattleConfig={size:number,ships:number[]};
export const battleConfig=(difficulty:string):BattleConfig=>difficulty==='Hard'?{size:9,ships:[2,3,4,5]}:difficulty==='Medium'?{size:7,ships:[2,3,4]}:{size:5,ships:[2,3,4]};
export const battleTarget=(config:BattleConfig)=>config.ships.reduce((a,b)=>a+b,0);
export function battleRules(config:BattleConfig):string[]{
 const end=String.fromCharCode(64+config.size);
 return [`Each player draws two ${config.size}×${config.size} grids, labelled A–${end} and 1–${config.size}.`,`Secretly place ships of lengths ${config.ships.join(', ')} in straight lines. No overlaps. One grid holds your fleet; the other tracks shots.`,`Alternate calling coordinates. The opponent reports hit or miss. Record the result on both paper grids.`,`The first player to hit all ${battleTarget(config)} enemy ship squares wins. Announce when each ship is sunk.`];
}
export function adultAdventure():Puzzle[]{
 const x=choose([12,14,17,19,23,26,29]),offset=choose([5,7,9,11]);
 const n=choose([11,14,17,21,24]);const start=choose([2,5,7,9]),forward=choose([17,19,23,28]),back=choose([3,5,8]);const dial=(start+forward-back)%12;
 const labels=['A','B','C','D','E','F'].sort(()=>Math.random()-.5).slice(0,4);const [a,b,c,d]=labels;const order=d+b+a+c;
 const hour=choose([9,10,11,13,14,15]),minute=choose([10,20,35,45]),first=choose([25,35,45]),wait=choose([10,15,20]),second=choose([20,30,40]);const end=hour*60+minute+first+wait+second;const time=`${String(Math.floor(end/60)).padStart(2,'0')}:${String(end%60).padStart(2,'0')}`;
 const final=x*2+n+14-dial;
 return [
 {text:`Two identical sealed crates and a ${offset} kg counterweight weigh ${x*2+offset} kg altogether. What is the weight of one crate in kg? Enter the number only.`,answer:String(x),hint:`Subtract ${offset} from the total, then divide the remaining weight by two.`},
 {text:`A sequence reads ${n}, ${n+2}, ${n+5}, ${n+9}, __. The difference increases by one each time. What comes next?`,answer:String(n+14),hint:'The gaps are 2, 3, 4, then 5.'},
 {text:`Four crates ${labels.join(', ')} stand in a row. ${c} is immediately to the right of ${a}. ${b} is not at either end. ${d} stands somewhere to the left of ${b}. Enter the four letters in order, left to right, with no spaces.`,answer:order,hint:`Treat ${a}${c} as a joined pair. Place ${b} in an interior position and test where ${d} can stand to its left.`},
 {text:`A circular dial is labelled 0 to 11. It starts at ${start}, moves forward ${forward} steps, then backward ${back} steps. After 11 it wraps to 0. Which number does it finish on?`,answer:String(dial),hint:`Calculate ${start} + ${forward} − ${back}, then subtract 12 repeatedly until the number lies between 0 and 11.`},
 {text:`An inspection starts at ${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}. The first check takes ${first} minutes, followed by a ${wait} minute wait and a ${second} minute final check. At what time can the door open? Use 24 hour HH:MM format.`,answer:time,hint:`Add ${first+wait+second} minutes to the starting time, carrying full hours as needed.`},
 {text:'Final lock: double your answer from lock 1, add your answer from lock 2, then subtract your answer from lock 4. Enter the resulting number.',answer:String(final),hint:`Use your recorded answers: (${x} × 2) + ${n+14} − ${dial}.`},
 ];
}
