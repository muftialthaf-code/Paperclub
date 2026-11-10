export type ScatterCategory={id:string,group:string,level:number,family:string,title:string,examples:string[]};
export const scatterCategories:ScatterCategory[]=[];
function add(group:string,level:number,rows:string){for(const row of rows.trim().split('\n')){const[family,title,words]=row.split('|');scatterCategories.push({id:`sc-${scatterCategories.length}`,group,level,family,title,examples:words.split(',').map(s=>s.trim())})}}
add('Animals',0,`
animals|An animal|ant,bear,cat,dog,elephant,fox,goat,horse,lion,monkey,panda,rabbit,snake,tiger,wolf
animals|A farm animal|alpaca,bull,chicken,donkey,goat,horse,llama,pig,sheep,turkey
animals|A sea creature|anemone,crab,dolphin,eel,jellyfish,krill,lobster,octopus,prawn,ray,shark,turtle,whale
animals|An animal with four legs|antelope,bear,cat,dog,elephant,fox,giraffe,horse,koala,lion,moose,pig,rabbit,tiger,wolf
animals|A flying animal|albatross,bat,crow,duck,eagle,falcon,gull,hawk,kingfisher,owl,parrot,raven,sparrow,toucan,woodpecker
pet|Something a pet needs|attention,bed,collar,exercise,food,grooming,harness,lead,medicine,play,rest,shelter,toys,water
`);
add('Animals',1,`
animals|An animal found in Africa|aardvark,baboon,cheetah,elephant,giraffe,hippopotamus,jackal,kudu,lion,meerkat,ostrich,rhino,springbok,warthog
animals|An insect|ant,beetle,cricket,dragonfly,earwig,flea,grasshopper,katydid,ladybird,moth,praying mantis,silverfish,termite,wasp
animals|An animal that lays eggs|alligator,bird,crocodile,duck,emu,frog,gecko,hen,iguana,kiwi,lizard,newt,ostrich,penguin,quail,snake,turtle
habitat|An animal habitat|arctic,burrow,cave,desert,estuary,forest,grassland,jungle,kelp forest,lake,mountain,ocean,pond,reef,savanna,wetland
pet|Something in a vet clinic|antiseptic,bandages,cages,disinfectant,gloves,kennels,medicine,scales,thermometer,waiting room
`);
add('Animals',2,`
animals|A nocturnal animal|aardvark,badger,cat,dormouse,fox,hedgehog,kiwi,leopard,moth,owl,porcupine,raccoon,tarsier,wombat
animals|An endangered animal|amur leopard,blue whale,cheetah,dugong,elephant,giant panda,hawksbill turtle,indri,kakapo,lemur,mountain gorilla,orangutan,pangolin,red panda,saola,tiger,vaquita,whale shark
adaptation|An animal adaptation|antlers,blubber,camouflage,echolocation,fur,gills,hibernation,insulation,migration,poison,quills,scales,tusks,venom,webbed feet
`);
add('Food',0,`
produce|A fruit|apple,banana,cherry,date,fig,grape,kiwi,lemon,mango,orange,pear,raspberry,strawberry,tangerine,watermelon
produce|A vegetable|artichoke,broccoli,carrot,daikon,eggplant,fennel,garlic,kale,lettuce,mushroom,onion,pea,radish,spinach,turnip,watercress
sweet|A dessert|apple pie,brownie,cake,doughnut,eclair,fudge,gelato,ice cream,jelly,kulfi,lemon tart,mousse,pudding,rice pudding,sorbet,trifle,waffle
meal|A breakfast food|avocado,bagel,cereal,eggs,fruit,granola,jam,kedgeree,muesli,oatmeal,pancakes,toast,waffles,yogurt
snack|A snack|apple,biscuit,cracker,dates,fruit,granola bar,hummus,kale chips,nuts,olives,popcorn,raisins,seeds,trail mix,walnuts
utensil|Something used to cook|apron,bowl,colander,dish,egg timer,frying pan,grater,kettle,ladle,mixer,oven,pan,rolling pin,sieve,tongs,whisk
`);
add('Food',1,`
meal|A dish served hot|apple crumble,baked potato,curry,dumplings,enchiladas,fish pie,gnocchi,hotpot,jambalaya,kebab,lasagne,moussaka,noodles,omelette,pizza,risotto,soup,tacos,waffles
sweet|Something sweet|apple,banana,caramel,dates,eclair,fudge,grapes,honey,jam,kulfi,lollipop,maple syrup,nougat,orange,pastry,raisin,sugar,toffee,wafer
produce|An ingredient in a salad|avocado,beetroot,cucumber,dill,egg,feta,grapes,herbs,kale,lettuce,mint,nuts,olives,peppers,radish,spinach,tomato,walnuts
drink|A drink|apple juice,banana smoothie,cocoa,decaf coffee,espresso,fruit juice,ginger tea,hot chocolate,iced tea,kefir,lemonade,milk,orange juice,peppermint tea,rooibos,smoothie,tea,water
meal|A food from another country|arancini,biryani,couscous,dim sum,empanada,falafel,gyoza,hummus,injera,jambalaya,kimchi,lasagne,miso soup,naan,paella,quesadilla,ramen,sushi,tapas,wonton
`);
add('Food',2,`
seasoning|A herb or spice|anise,basil,cumin,dill,epazote,fennel,ginger,hyssop,juniper,kaffir lime,lavender,mint,nutmeg,oregano,paprika,rosemary,saffron,turmeric,vanilla,wasabi
method|A cooking technique|air frying,baking,caramelising,deglazing,emulsifying,fermenting,grilling,infusing,julienning,kneading,marinating,poaching,reducing,steaming,toasting,whisking
utensil|Professional kitchen equipment|air fryer,blender,colander,deep fryer,espresso machine,griddle,kitchen scale,ladle,mandoline,oven,pressure cooker,refrigerator,salamander,tandoor,whisk
`);
add('Places',0,`
place|A place in a town|airport,bakery,cafe,doctor,fire station,garden,hospital,library,market,park,restaurant,school,theatre,warehouse
holiday|A place to visit on holiday|aquarium,beach,castle,desert,forest,gallery,island,lake,museum,national park,ocean,palace,ruins,safari,temple,waterfall
home|A room or area of a home|attic,balcony,cellar,dining room,entrance,garden,hallway,kitchen,living room,office,pantry,roof,study,terrace,workshop
travel|Something at an airport|airplane,baggage,check in desk,departures,escalator,flight board,gate,information desk,kiosk,luggage,passport,runway,security,trolley,waiting area
travel|A way to travel|airplane,bicycle,car,donkey,ferry,gondola,helicopter,kayak,lorry,motorbike,plane,railway,scooter,train,walking
`);
add('Places',1,`
nation|A country|Argentina,Brazil,Canada,Denmark,Egypt,France,Germany,Hungary,India,Japan,Kenya,Lebanon,Mexico,Norway,Oman,Peru,Romania,Spain,Turkey,Vietnam,Wales,Zambia
city|A city|Athens,Berlin,Cairo,Dublin,Edinburgh,Florence,Geneva,Hanoi,Istanbul,Jakarta,Kyoto,Lisbon,Madrid,Nairobi,Oslo,Paris,Rome,Seoul,Tokyo,Vienna,Warsaw,York,Zagreb
landmark|A tourist attraction|Acropolis,Big Ben,Colosseum,Disneyland,Eiffel Tower,Forbidden City,Great Wall,Hagia Sophia,Kew Gardens,Louvre,Machu Picchu,Petra,Stonehenge,Taj Mahal,Versailles
natureplace|A natural landmark|Amazon River,Ben Nevis,Cliffs of Moher,Dead Sea,Everest,Grand Canyon,Iguazu Falls,Kilimanjaro,Lake Victoria,Niagara Falls,Red Sea,Sahara,Table Mountain,Victoria Falls,Yellowstone
place|A place where people work|airport,bank,clinic,dentist,factory,garage,hospital,kitchen,library,mine,office,pharmacy,restaurant,studio,theatre,workshop
`);
add('Places',2,`
nation|A landlocked country|Afghanistan,Bolivia,Chad,Ethiopia,Hungary,Kazakhstan,Laos,Mali,Nepal,Paraguay,Rwanda,Switzerland,Uganda,Zambia
city|A capital city|Abuja,Bangkok,Canberra,Dakar,Edinburgh,Freetown,Georgetown,Helsinki,Islamabad,Jakarta,Kigali,Lima,Manila,Nicosia,Ottawa,Prague,Quito,Rabat,Stockholm,Tunis,Vienna,Wellington,Yerevan,Zagreb
geography|A geographical feature|archipelago,bay,canyon,delta,estuary,fjord,gorge,isthmus,lagoon,mesa,oasis,peninsula,reef,strait,tundra,valley,wetland
landmark|A river|Amazon,Brahmaputra,Congo,Danube,Euphrates,Ganges,Hudson,Indus,Jordan,Kwando,Limpopo,Mekong,Nile,Orinoco,Po,Rhine,Seine,Thames,Volga,Yangtze,Zambezi
`);
add('Objects',0,`
roomitem|Something in a bedroom|alarm clock,bed,curtains,duvet,fan,hanger,lamp,mirror,pillow,rug,sheets,toy,wardrobe
roomitem|Something in a kitchen|apron,bowl,cup,dish,fork,glass,kettle,ladle,mug,oven,pan,spoon,toaster,whisk
school|Something at school|art,book,chalk,desk,eraser,folder,glue,homework,ink,lunchbox,marker,notebook,pencil,ruler,scissors,teacher,whiteboard
carry|Something you carry|apple,bag,coat,drink,eraser,food,glasses,hat,keys,lunch,map,notebook,phone,rucksack,sandwich,ticket,wallet
clothes|Something you wear|apron,boots,coat,dress,earrings,fleece,gloves,hat,jacket,kilt,leggings,mittens,necklace,overalls,pyjamas,ring,socks,trousers,vest,watch
vehicle|A vehicle|ambulance,bus,car,digger,fire engine,gondola,helicopter,jeep,kayak,lorry,motorbike,plane,rickshaw,scooter,train,van,wagon,yacht
`);
add('Objects',1,`
roomitem|Something in a car|airbag,brake,clutch,dashboard,engine,fuel gauge,gearstick,headrest,jack,keys,mirror,odometer,pedal,radio,seatbelt,tyre,visor,windscreen
shape|Something round|apple,ball,coin,doughnut,earth,football,globe,hoop,lens,marble,orange,plate,ring,sun,tomato,wheel
material|Something made of metal|anchor,bell,coin,doorbell,engine,fork,gate,hinge,jug,key,ladder,motor,nail,pan,rail,screw,tin,watch
clothes|Something worn in winter|anorak,boots,coat,earmuffs,fleece,gloves,hat,jacket,leggings,mittens,overcoat,parka,scarf,thermal vest,wool socks
tool|A tool|awl,brace,clamp,drill,file,gimlet,hammer,jigsaw,knife,level,mallet,pliers,rake,saw,trowel,wrench
`);
add('Objects',2,`
material|A recyclable material|aluminium,brass,cardboard,copper,electronics,glass,iron,magazines,newspaper,paper,steel,tin
workplace|Office equipment|adding machine,binder,calculator,desk,eraser,filing cabinet,keyboard,laptop,monitor,notebook,organiser,printer,router,scanner,telephone,whiteboard
mechanism|Something with a motor|air conditioner,blender,car,drill,elevator,fan,generator,hairdryer,juicer,lathe,mixer,pump,robot,scooter,treadmill,vacuum,washer
`);
add('People',0,`
job|A job|artist,baker,chef,dentist,engineer,farmer,gardener,hairdresser,illustrator,judge,keeper,librarian,mechanic,nurse,optician,pilot,reporter,singer,teacher,vet,waiter
family|A person in a family|aunt,brother,cousin,dad,father,grandma,husband,mother,nephew,parent,sister,uncle,wife
name|A first name|Alex,Ben,Chris,Dana,Emma,Fatima,Grace,Hassan,Ivan,Jack,Kate,Lina,Mia,Noah,Olivia,Priya,Ryan,Sara,Tom,Victor,Will,Yara,Zoe
helper|Someone who helps people|ambulance driver,babysitter,counsellor,doctor,firefighter,guide,helper,judge,lifeguard,medic,nurse,optician,paramedic,rescuer,social worker,teacher,volunteer
`);
add('People',1,`
job|A person who works outdoors|archaeologist,builder,courier,diver,farmer,gardener,lifeguard,miner,park ranger,roofer,surveyor,tree surgeon,window cleaner
character|A superhero|Aquaman,Batman,Captain Marvel,Daredevil,Elastigirl,Flash,Green Lantern,Hulk,Iron Man,Jean Grey,Kitty Pryde,Loki,Ms Marvel,Nightcrawler,Spider Man,Thor,Vision,Wolverine
person|A famous person|Adele,Beyonce,Charlie Chaplin,David Attenborough,Emma Watson,Frida Kahlo,Galileo,Harry Styles,Isaac Newton,Jane Goodall,Keanu Reeves,Leonardo da Vinci,Marie Curie,Nelson Mandela,Oprah Winfrey,Pele,Rihanna,Serena Williams,Taylor Swift,Usain Bolt,Virginia Woolf,Will Smith
skill|A talent|acting,baking,coding,dancing,embroidery,fencing,gardening,illustration,juggling,knitting,music,painting,running,singing,teaching,writing
`);
add('People',2,`
person|A historical figure|Aristotle,Boudicca,Cleopatra,Darwin,Einstein,Florence Nightingale,Gandhi,Hypatia,Isaac Newton,Joan of Arc,Katherine Johnson,Leonardo da Vinci,Martin Luther King,Nelson Mandela,Rosa Parks,Socrates,Tesla,Victoria,Wellington
job|A profession needing specialist training|architect,barrister,cardiologist,dentist,engineer,geologist,journalist,lawyer,midwife,nurse,optometrist,pharmacist,radiographer,surgeon,teacher,veterinarian
quality|A quality of a good leader|adaptability,bravery,compassion,determination,empathy,fairness,generosity,honesty,integrity,judgement,kindness,listening,motivation,patience,resilience,self awareness,tact,vision,wisdom
`);
add('Entertainment',0,`
game|A game|army,board game,chess,dominoes,football,go fish,hide and seek,jenga,kickball,ludo,monopoly,noughts and crosses,tag,uno,word search
sound|A musical instrument|accordion,banjo,cello,drum,euphonium,flute,guitar,harp,keyboard,lute,maracas,oboe,piano,recorder,saxophone,trumpet,violin,whistle
sport|A sport|archery,basketball,cricket,diving,equestrian,fencing,golf,hockey,judo,karate,lacrosse,motorsport,netball,polo,rugby,swimming,tennis,volleyball,wrestling
character|A cartoon character|Ariel,Bugs Bunny,Cinderella,Dory,Elsa,Fred Flintstone,Garfield,Homer Simpson,Jerry,Krusty,Lisa Simpson,Mickey Mouse,Nemo,Olaf,Peppa Pig,Rapunzel,Scooby Doo,Tigger,Winnie the Pooh
`);
add('Entertainment',1,`
movie|A movie|Aladdin,Brave,Cars,Dumbo,Encanto,Frozen,Ghostbusters,Home Alone,Inside Out,Jumanji,Kung Fu Panda,Luca,Moana,Night at the Museum,Paddington,Ratatouille,Shrek,Tangled,Up,Wall E
activity|A hobby|art,baking,cycling,dancing,embroidery,fishing,gardening,hiking,juggling,knitting,language learning,music,origami,photography,reading,sewing,travelling,woodwork
character|A fictional character|Alice,Bilbo,Charlotte,Dorothy,Eeyore,Frodo,Gandalf,Hermione,Jack Sparrow,Katniss,Lyra,Matilda,Nemo,Peter Pan,Ron Weasley,Sherlock Holmes,Tarzan,Willy Wonka
sportgear|Sports equipment|arrow,ball,club,discus,football,goggles,helmet,javelin,kayak,lifejacket,mat,net,paddle,racket,skates,tennis ball,whistle
`);
add('Entertainment',2,`
artform|An art form|architecture,ballet,calligraphy,dance,embroidery,filmmaking,glassblowing,illustration,jewellery,knitting,literature,mosaic,origami,photography,quilting,sculpture,theatre,weaving
musicstyle|A musical style|ambient,blues,classical,disco,electronic,folk,gospel,hip hop,indie,jazz,klezmer,Latin,motown,opera,pop,reggae,soul,techno,world music
book|A book title|Alice in Wonderland,Black Beauty,Charlotte’s Web,Dracula,Emma,Frankenstein,Great Expectations,Heidi,Jane Eyre,Little Women,Matilda,Oliver Twist,Peter Pan,Rebecca,Secret Garden,Treasure Island,War and Peace
`);
add('Creative',0,`
noise|Something that makes noise|alarm,bell,clapping,dog,engine,firework,guitar,horn,jackhammer,kettle,lawnmower,motor,parrot,radio,siren,train,whistle
fun|Something that makes you laugh|antics,banana peel,cartoon,dancing,expression,funny face,giggles,impression,joke,kittens,limerick,monkey,prank,riddle,silliness,tickling,wordplay
spacebag|Something you would take to space|air,blanket,camera,diary,earphones,food,gloves,helmet,jacket,kit,light,map,notebook,oxygen,pen,radio,suit,tools,water
unsafefood|Something you should never eat|adhesive,bricks,chalk,detergent,erasers,fertiliser,glass,ink,keys,lego,metal,nails,paint,rocks,soap,tacks,wire
`);
add('Creative',1,`
monster|Something in a monster’s house|armchair,bones,cobwebs,dust,eyeballs,fangs,goo,haunted mirror,jars,keys,lantern,mud,nest,potion,rotten cheese,slime,tentacles,webs
invent|Something you could invent|automatic umbrella,bed making robot,cleaning shoes,dancing fridge,edible plates,flying bike,gardening robot,homework helper,invisible coat,jet boots,kindness machine,laundry folder,memory hat,noise catcher,pet translator,rain stopper,solar backpack,time machine,weather hat
emotion|Something that could surprise you|applause,birthday party,confetti,delivery,email,fireworks,gift,hidden door,invitation,joke,knock,letter,message,package,reunion,snow,thunder,visitor
noise|Something that is very quiet|air,bubble,cloud,dew,feather,grass,icicle,leaf,mist,painting,shadow,snow,whisper
`);
add('Creative',2,`
idea|Something money cannot buy|affection,belonging,character,dignity,empathy,friendship,genuine respect,happiness,integrity,joy,kindness,love,meaning,peace,respect,sincerity,trust,wisdom
emotion|A reason to celebrate|achievement,birthday,completion,discovery,engagement,friendship,graduation,homecoming,improvement,job offer,kindness,milestone,new beginning,promotion,reunion,success,triumph,victory,wedding
problem|Something you could improve in a city|accessibility,buses,cleanliness,drainage,education,footpaths,green spaces,housing,infrastructure,junctions,lighting,maintenance,parks,recycling,safety,transport,water supply
quality|Something that takes patience|art,baking,crafts,democracy,education,friendship,gardening,healing,investigation,juggling,knitting,learning,music,negotiation,parenting,research,science,teaching,writing
`);
add('Science',0,`
nature|Something found in nature|acorn,branch,cloud,dew,earth,flower,grass,hill,ice,leaf,moss,nest,oak,pebble,rain,snow,tree,water
plant|Something that grows|apple tree,bamboo,cactus,daisy,elm,fern,grass,hedge,ivy,kale,lavender,moss,nasturtium,oak,pine,rose,sunflower,tomato,wheat
body|A body part|arm,back,chin,ear,foot,hand,jaw,knee,leg,mouth,nose,palm,rib,shoulder,toe,wrist
weather|Something connected with weather|autumn,breeze,cloud,drizzle,evaporation,fog,gale,hail,ice,lightning,mist,rain,snow,thunder,wind
`);
add('Science',1,`
space|Something found in space|asteroid,black hole,comet,dust,earth,galaxy,ice,jupiter,kuiper belt,light,moon,nebula,orbit,planet,quasar,rocket,star,telescope,uranus,venus,white dwarf
energy|Something that uses electricity|alarm,blender,computer,dishwasher,elevator,fan,guitar amplifier,heater,iron,juicer,kettle,lamp,microwave,oven,phone,radio,scanner,television,vacuum,washer
science|A school subject|art,biology,chemistry,drama,english,french,geography,history,ict,japanese,latin,maths,music,physics,religion,science,technology,woodwork
plant|A tree|apple,birch,cedar,dogwood,elm,fir,ginkgo,hazel,ironwood,juniper,kapok,larch,maple,oak,pine,rowan,spruce,tamarind,willow,yew
`);
add('Science',2,`
science|A scientific field|astronomy,biology,chemistry,dendrology,ecology,forensics,geology,hydrology,immunology,kinematics,linguistics,meteorology,neuroscience,oceanography,physics,radiology,seismology,toxicology,virology,zoology
unit|A unit of measurement|ampere,bar,candela,degree,electronvolt,foot,gram,hectare,inch,joule,kilogram,litre,metre,newton,ohm,pascal,radian,second,tesla,volt,watt,yard
material|A chemical element|aluminium,boron,carbon,dysprosium,erbium,fluorine,gold,hydrogen,iron,krypton,lithium,magnesium,neon,oxygen,phosphorus,radon,silicon,titanium,vanadium,tungsten,yttrium,zinc
process|A natural process|adaptation,biodegradation,condensation,decay,erosion,freezing,germination,hibernation,infiltration,metamorphosis,nitrification,osmosis,photosynthesis,respiration,sedimentation,transpiration,weathering
`);
export type ScatterConfig={players:string[],teams:boolean,difficulty:string,count:10|12,duration:number,houseRule:boolean,sound:boolean};
export const scatterDefaults:ScatterConfig={players:['Player 1','Player 2'],teams:false,difficulty:'Easy',count:10,duration:120,houseRule:false,sound:false};
export type ScatterState={config:ScatterConfig,round:number,letter:string,categories:string[],lettersLeft:string[],categoryHistory:string[],combinations:string[],phase:'play'|'compare'|'finished',milliseconds:number,deadline:number|null,points:number[][],base:number[],reviewed:boolean[],cursor:number};
const shuffle=<T,>(a:T[])=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r};
export function eligibleCategories(difficulty:string,letter:string){return scatterCategories.filter(c=>(difficulty==='Easy'?c.level===0:difficulty==='Hard'?c.level>=1:c.level<=1)&&c.examples.some(w=>w[0].toUpperCase()===letter))}
function selectCategories(difficulty:string,letter:string,count:number,history:string[]=[]){
 const available=shuffle(eligibleCategories(difficulty,letter));available.sort((a,b)=>(difficulty==='Hard'?b.level-a.level:0)||Number(history.includes(a.id))-Number(history.includes(b.id))||(difficulty==='Medium'?b.level-a.level:0));
 // Bipartite matching: each answer family once, each topic group at most twice.
 // Augmenting paths avoid a greedy choice blocking another valid category.
 const families=[...new Set(available.map(c=>c.family))];
 const slots=new Map<string,string>();const matched=new Map<string,ScatterCategory>();
 function assign(family:string,visited:Set<string>):boolean{
  const options=available.filter(c=>c.family===family);
  for(const c of options)for(let slot=0;slot<2;slot++){
   const key=`${c.group}:${slot}`;if(visited.has(key))continue;visited.add(key);
   const occupant=slots.get(key);
   if(!occupant||assign(occupant,visited)){slots.set(key,family);matched.set(family,c);return true}
  }
  return false;
 }
 for(const family of families){assign(family,new Set());if(matched.size===count)break}
 const selected=[...matched.values()];
 return selected;
}
export function letterPool(difficulty:string,count:number){const letters=difficulty==='Easy'?'ABCDEHLMPRST':difficulty==='Medium'?'ABCDEFGHJKLMNPRSTVW':'ACDEGHIJKLMNOPRSTVWYZ';return [...letters].filter(l=>selectCategories(difficulty,l,count).length===count)}
export function createScatterRound(config:ScatterConfig,previous?:ScatterState):ScatterState{
 let letters=previous?.lettersLeft.length?[...previous.lettersLeft]:shuffle(letterPool(config.difficulty,config.count));
 if(letters.length>1&&letters[0]===previous?.letter)[letters[0],letters[1]]=[letters[1],letters[0]];
 const letter=letters.shift();if(!letter)throw Error('No playable letters for these settings');
 let categories:ScatterCategory[]=[];let signature='';for(let i=0;i<100;i++){categories=selectCategories(config.difficulty,letter,config.count,previous?.categoryHistory);signature=categories.map(c=>c.id).sort().join(',');if(!previous?.combinations.includes(signature))break}
 return {config,round:(previous?.round||0)+1,letter,categories:categories.map(c=>c.id),lettersLeft:letters,categoryHistory:[...(previous?.categoryHistory||[]),...categories.map(c=>c.id)],combinations:[...(previous?.combinations||[]),signature],phase:'play',milliseconds:config.duration*1000,deadline:null,points:categories.map(()=>config.players.map(()=>0)),base:previous?scatterScores(previous):config.players.map(()=>0),reviewed:categories.map(()=>false),cursor:0};
}
export const scatterScores=(s:ScatterState)=>s.base.map((b,p)=>b+s.points.reduce((sum,row)=>sum+row[p],0));
export function awardScatter(s:ScatterState,player:number,delta:number):ScatterState{return {...s,points:s.points.map((row,c)=>c===s.cursor?row.map((n,p)=>p===player?Math.max(0,Math.min(s.config.houseRule?2:1,n+delta)):n):row)}}
export function stopScatter(s:ScatterState,now=Date.now()):ScatterState{return {...s,phase:'compare',milliseconds:s.deadline?Math.max(0,s.deadline-now):s.milliseconds,deadline:null}}
export function scatterTime(s:ScatterState,now=Date.now()){return s.deadline?Math.max(0,s.deadline-now):s.milliseconds}
