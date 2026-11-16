/** Extra 3–4 letter family-friendly words for Secret Code (Easy). Merged with the ladder and anagram vocabularies. */
const w=(s:string)=>s.split(/\s+/).filter(Boolean);
export const codeWordsMore=w(`
ace act add age aid aim air ale all amp and ant any ape arc are ark arm art ash ask ate awe axe
baby back bait bake ball band bank bark barn base bath beak beam bean bear beat beef bell belt bend best bike bill bird bite blue boat body bold bolt bone book boot bowl brim bulb bull bush bus buzz
cafe cage cake calf calm camp cane cape card care cart case cash cast cave chat chef chin chip city clap claw clay clip clock club coal coat code coin cold comb cook cool cork corn cost cozy crab crew crib crop crow cube curl cute
dairy dame damp dark dart dash data date dawn deal dear deck deep deer desk dial dice diet dime dine dirt disc dish dive dock dome door dove down draw drip drop drum duck dune dust duty
each earn ease east easy echo edge emu epic even ever exam eyes
face fact fade fair fall fame farm fast feed feet fern fife file film find fine fire firm fish fist five flag flat flip float flow foam fold folk food fool foot fork form fort four fowl frog fuel full fund fur fuzz
gain game gate gear gift gill girl glad glow glue goal goat gold golf good gown gram grab grin grip grow gulf gull gum gust
hail hair half hall hand hang hard harp hawk hay head heal heap hear heat heel help hen herb hero hide high hike hill hint hive hold hole home hood hook hoop hope horn hose host hour hug hunt hut
iced idea inch iron isle item ivy
jade jam jar jazz jeep jelly jet jig job jog join joke joy jump june junk jury just
keen keep kelp kept key kick kid kin king kiss kit kite kiwi knee knit knob knot
lace lack lady lake lamb lamp land lane lark lash last late lawn lazy lead leaf leak lean leap left lend lens life lift like lily limb lime line link lion list live load loaf loan lock loft log long look loop lord lost loud love luck lump lunch
mail main make mall map mare mark mask mass mast mat maze meal mean meat melt menu mess mice mild mile milk mill mind mine mint miss mist mitt moat mole monk moon moss moth move much mud mug mule myth
nail name nap navy neat neck nest net news nice nine node noon nose note nut
oak oar oat odd oil old once one open orca oval oven over owl own
pace pack pad page pail pain pair palm pan park part pass past path paw pay peak pear peas peg pen pest pet pick pier pig pile pill pine pink pipe plan play plot plug plum plus poem poet pole poll pond pony pool pop port pose post pot pour pray prey prize pup pure push
quay quick quiz
race rack raft rail rain rake ramp rang rare rate raw ray read real reed rent rest rice rich ride rim ring rink rise road roar robe rock role roll roof room root rope rose rub rug rule rush rust
sack safe sail sale salt sand sash save saw scan seal seat seed self sell send set shed ship shoe shop show sick side sign silk sing sink site size skin skip sky slam sled slip slow snow soap sock soft soil sold song soon sore sort soul soup sour spin spot spy star stay stem step stew stop stub such suit sun surf swan swim
tail tale talk tall tame tank tape task tea team tear tell tent term test text thin tick tide tidy tie tile till time tiny tip toad toe told toll tomb tone tool top torn toss tour town toy trap tray tree trim trip trot true tub tube tuck tune turn twig twin type
ugly unit upon use
vain vase vast veil vest view vine void vote
wade wage wait wake walk wall wand want warm wash wasp wave wax weak wear web week well west whale wheel wide wife wild will wind wine wing wink wipe wire wise wish wolf wood wool word work worm wrap wren
yard yarn yawn year yell yoga yolk zero zest zinc zone zoom zoo
`).filter(x=>x.length>=3&&x.length<=4&&!['mess','pain','shed','myth','tomb','void','jury','duty','dame','gust'].includes(x));
