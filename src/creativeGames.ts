import{easyDilemmas,mediumDilemmas,hardDilemmas,easyInventions,mediumInventions,hardInventions}from'./content/dilemmaExpansion';
export type Invention={key:string,category:string,text:string};
export type Dilemma={key:string,category:string,a:string,b:string};
function inventions(level:string,rows:string):Invention[]{return rows.trim().split('\n').map((row,i)=>{const[category,text]=row.split('|');return {key:`invent:${level}:${i}`,category,text}})}
function dilemmas(level:string,rows:string):Dilemma[]{return rows.trim().split('\n').map((row,i)=>{const[category,a,b]=row.split('|');return {key:`rather:${level}:${i}`,category,a,b}})}
export const inventionPools:Record<string,Invention[]>={
Easy:inventions('Easy',`
Home|Invent a robot that tidies your toys by turning cleanup into a game.
Transport|Invent shoes that let you bounce safely like a kangaroo.
Food|Invent a breakfast machine that can make funny faces with food.
Animals|Invent a playground where a very small pet and a very large pet can play together.
Space|Invent a lunchbox that stops your sandwiches floating away on the moon.
Nature|Invent a watering can that knows when a plant is thirsty.
Funny|Invent an umbrella for a giraffe that keeps its whole neck dry.
Fantasy|Invent a friendly dragon’s toothbrush that can handle warm dragon breath.
Family|Invent a way to carry all your picnic things without dropping anything.
Exploration|Invent a boat that makes crossing a puddle feel like a big adventure.
Home|Invent a bed that gently helps a sleepy person get ready for the day.
Food|Invent a tool that peels a banana and keeps your hands clean.
Animals|Invent a raincoat that an octopus could put on by itself.
Transport|Invent a scooter that leaves a trail of bubbles instead of noise.
Nature|Invent a hat that gives a tiny garden enough light and water.
Funny|Invent a machine that sorts mismatched socks into funny new pairs.
Space|Invent a space helmet that makes it easy to talk to a friendly alien.
Fantasy|Invent a doorbell that a fairy and a giant can both reach.
Family|Invent a game that makes waiting for your food at a cafe fun.
Everyday|Invent a backpack that helps you remember your favourite things.
Nature|Invent a bird feeder that protects its food from the rain.
Transport|Invent a vehicle for a snail that wants to arrive at a party on time.
Food|Invent a spoon that cools soup to just the right temperature.
Home|Invent a way to find your slippers in the dark without turning on a light.
Funny|Invent a musical instrument that can be played with your elbows.
Animals|Invent a way for a penguin to keep its ice cream cold on a sunny day.
Fantasy|Invent a castle lift for a sleepy giant.
Family|Invent a picnic blanket that stays flat on a windy day.
Space|Invent a garden for a tiny planet with only one flower.
Everyday|Invent a pencil case that helps pencils find their way home.
Food|Invent a plate that stops peas rolling off the table.
Nature|Invent a treehouse entrance that does not hurt the tree.
Funny|Invent a machine that makes your shadow do a silly dance.
Transport|Invent a bicycle bell that sounds different for each animal riding the bike.
Home|Invent a book holder that turns pages for someone wearing big mittens.
Animals|Invent a bath for a dog that loves bubbles but dislikes splashes.
Fantasy|Invent a shop counter where mermaids and people can buy snacks together.
Everyday|Invent a way to carry a snowball home without it melting.
Space|Invent a chair that stays on the floor in a spaceship.
Family|Invent a family board game that fits inside a matchbox.
`),
Medium:inventions('Medium',`
Transport|Invent a vehicle that travels on roads and water, and show how it changes between the two.
Home|Invent furniture that changes from a reading corner into a place for four people to eat.
Everyday|Invent a device that carries twenty shopping bags while leaving your hands free.
Nature|Invent a way to collect rain for a garden and release it slowly on dry days.
Space|Invent a tool an astronaut can use with thick gloves to fix a very small part.
Food|Invent a lunchbox that keeps hot food hot and cold food cold without mixing them.
Animals|Invent a bridge that helps small animals cross a busy path safely.
Funny|Invent a machine that turns a boring chore into a cooperative game for two people.
Fantasy|Invent a moving house that can cross a river without leaving its garden behind.
Family|Invent a way for people of different heights to share one kitchen counter comfortably.
Transport|Invent a bike that can carry groceries and then fold into a small cupboard.
Environment|Invent a beach-cleaning device that picks up litter but leaves shells and living things alone.
Food|Invent a picnic container that keeps insects out while letting everyone reach the food.
Home|Invent a lamp that helps two people read without lighting up the whole room.
Exploration|Invent a hiking tool that helps you navigate and can also make a safe shelter.
Animals|Invent a pet feeder that knows which of two different pets it is feeding.
Space|Invent a way to wash clothes in space while using very little water.
Funny|Invent a playground game that can be enjoyed equally in silence or with music.
Nature|Invent a window garden that can move to follow the sunshine without falling.
Family|Invent a way to share one table between a messy art project and a family meal.
Transport|Invent a wheelchair-friendly treehouse entrance that also works when there is no electricity.
Environment|Invent packaging that protects a fragile gift and can become something useful afterwards.
Food|Invent a kitchen gadget that measures ingredients and helps tidy up when cooking is finished.
Home|Invent a way to dry wet shoes without making the rest of a small room damp.
Exploration|Invent a floating research station that can observe fish without disturbing them.
Animals|Invent a birdhouse that can be cleaned easily without removing the birds’ shelter.
Space|Invent a way to grow vegetables on a spaceship and collect every spare drop of water.
Funny|Invent a delivery system that brings biscuits to the sofa without spilling the tea.
Nature|Invent a path light that helps people see at night without bothering nearby wildlife.
Family|Invent a way for a large family to pack and unpack a campsite quickly.
Transport|Invent a bus stop that offers shelter and useful information without needing a screen.
Environment|Invent a way to reuse paper scraps in a cafe while keeping them clean and organised.
Food|Invent a lunch system that lets people choose portions and reduces leftover food.
Home|Invent a room divider that can create a quiet space but fold away for a party.
Exploration|Invent a way to carry a camera across a muddy stream without stepping into the water.
Animals|Invent a way to give a nervous pet a quiet hiding place during a noisy celebration.
Space|Invent a sports game for astronauts in low gravity, including equipment and a way to score.
Fantasy|Invent a market stall that can serve both flying customers and customers on the ground.
Everyday|Invent a wearable organiser that keeps useful tools nearby without getting in the way.
Family|Invent a way for two people to tell a story together when they cannot hear one another.
`),
Hard:inventions('Hard',`
Environment|Invent a neighbourhood waste system that produces no landfill, is affordable to maintain and works during a power cut.
Rescue|Invent a rescue machine that handles both floods and earthquake debris without putting its operator in danger.
Communication|Invent a worldwide communication system that uses neither the internet nor satellites and protects private messages.
Transport|Invent a public transport interchange that serves walkers, wheelchairs and bicycles without increasing its ground footprint.
Space|Invent a lunar habitat that recycles water, shields residents from radiation and can be repaired with local materials.
Food|Invent a food storage system for a remote village that uses no grid electricity and gives clear warnings before food spoils.
Nature|Invent a way to restore a damaged reef without introducing plastic, loud machinery or invasive species.
Home|Invent a compact home that adapts to changing mobility needs without structural rebuilding.
Energy|Invent a community energy store that uses common materials, survives extreme temperatures and is easy to recycle.
Everyday|Invent a public drinking fountain that stays hygienic, uses little water and works without hand contact.
Environment|Invent a clothing system that can be resized, repaired and fully recycled without mixing incompatible materials.
Rescue|Invent an emergency shelter that one person can carry, assemble without tools and ventilate safely in hot weather.
Communication|Invent a warning system usable by people who cannot see, hear or read the local language.
Transport|Invent a delivery network that reduces traffic, protects pedestrians and can operate during a communications outage.
Space|Invent a method of collecting orbital rubbish without creating smaller fragments or using expendable nets.
Food|Invent a school meal system that handles different dietary needs, prevents waste and protects individual privacy.
Nature|Invent a wildlife crossing that supports several species and allows people to inspect it without disturbing the animals.
Home|Invent a building facade that cools rooms, admits daylight and can be cleaned from indoors.
Energy|Invent a human-powered device that stores intermittent effort and supplies a steady, useful output.
Everyday|Invent a repair station that diagnoses common faults, keeps users safe and needs no proprietary spare parts.
Environment|Invent a refill system for household liquids that prevents contamination and makes containers accessible to all users.
Rescue|Invent a way to deliver clean water after a disaster when roads are blocked and fuel is scarce.
Communication|Invent a tool that translates instructions into actions without storing recordings or personal data.
Transport|Invent a small ferry that works in shallow water, carries mobility aids and uses renewable energy.
Space|Invent a greenhouse for a Mars expedition that balances light, heat and water while containing any soil dust.
Food|Invent a reusable food-delivery container that records whether it has stayed safe without a battery or a screen.
Nature|Invent an urban planting system that supports pollinators, saves rainwater and requires minimal maintenance.
Home|Invent a quiet ventilation system that works in a densely occupied building without drawing power from the grid.
Energy|Invent a street-lighting system that adapts to use, protects dark skies and can be repaired module by module.
Everyday|Invent a shared workshop system that prevents tool loss without cameras, identity tracking or locked individual cupboards.
Environment|Invent a way to separate mixed rubbish using mechanical principles rather than electronics or chemicals.
Rescue|Invent a wearable rescue signal that works through smoke and heavy rain without relying on a mobile network.
Communication|Invent a meeting tool that gives quieter participants equal opportunity without measuring or recording voices.
Transport|Invent a cargo bicycle that is stable at low speed, fits a narrow doorway and can be maintained with ordinary tools.
Space|Invent a modular research robot that can cross sand, ice and rock and recover after one motor fails.
Food|Invent a communal cooker that shares heat efficiently and lets several cooks control their own dishes independently.
Nature|Invent a drought-resistant public garden that remains accessible and offers shade without using treated drinking water.
Home|Invent a room that can switch between work, rest and shared meals without anyone lifting heavy furniture.
Energy|Invent a way to recover useful energy from a busy building without making movement harder for its occupants.
Everyday|Invent a fair system for borrowing scarce equipment that needs no money, phone or permanent record of borrowers.
`),
};
export const dilemmaPools:Record<string,Dilemma[]>={
Easy:dilemmas('Easy',`
Animals|Have a friendly pet dinosaur|Have a friendly pet dragon
Food|Eat tiny pancakes with a giant spoon|Eat one giant pancake with a tiny spoon
Adventure|Sleep in a treehouse|Sleep in a cosy lighthouse
Superpowers|Fly as slowly as a butterfly|Run as fast as a cheetah
Funny|Have shoes that squeak like ducks|Have a hat that chirps like a bird
Nature|Talk to garden birds|Talk to sea creatures
Everyday|Have a bedroom with a slide|Have a bedroom with a climbing wall
Imagination|Ride a rainbow to school|Ride a friendly cloud to school
Animals|Be as tall as a giraffe for a day|Be as small as a mouse for a day
Food|Grow strawberries in your garden|Grow a tree full of your favourite apples
Adventure|Visit a castle made of snow|Visit a village built in giant trees
Superpowers|Make friendly bubbles with your hands|Make tiny rainbows with your fingers
Funny|Have hair that glows gently in the dark|Have freckles that change colour
Nature|Watch a butterfly hatch|Watch a baby turtle reach the sea
Family|Teach your family a silly dance|Invent a new family song
Imagination|Have a flying bicycle|Have a boat that can hop over puddles
Animals|Spend a day looking after pandas|Spend a day looking after penguins
Food|Invent a new ice cream flavour|Invent a new pizza topping
Adventure|Explore a secret garden|Explore a friendly pirate ship
Superpowers|Jump safely over tall trees|Float safely down from any height
Funny|Have a backpack that tells jokes|Have a pencil case that sings quietly
Nature|Find an unusual seashell|Find a perfectly shaped pine cone
Everyday|Build a pillow fort|Build a cardboard spaceship
Imagination|Live in a giant mushroom house|Live in a cosy house inside a tree
Animals|Have a cat that fetches things|Have a dog that helps find lost socks
Food|Have a picnic by a lake|Have a picnic in a flower garden
Adventure|Travel on a steam train|Travel in a hot air balloon
Superpowers|Make yourself warm with a thought|Make a cool breeze with a wave
Funny|Wear a cape made of leaves|Wear a crown made of colourful feathers
Nature|See the northern lights|See a glowing sea at night
Family|Organise a treasure hunt|Organise a family talent show
Imagination|Visit a library run by owls|Visit a bakery run by friendly bears
Animals|Ride gently on a giant tortoise|Sail with a friendly dolphin
Food|Bake a cake shaped like a castle|Bake biscuits shaped like animals
Adventure|Discover a hidden waterfall|Discover a cave full of harmless glowing crystals
Superpowers|Remember every song you hear|Remember every picture you see
Funny|Have a shadow that waves hello|Have a reflection that smiles first
Nature|Plant a sunflower that grows taller than you|Grow a pumpkin bigger than your chair
Everyday|Spend a rainy afternoon making art|Spend a rainy afternoon making up stories
Imagination|Have a toy robot that tells stories|Have a toy dragon that projects stars on the ceiling
`),
Medium:dilemmas('Medium',`
Exploration|Explore the deepest ocean with a small expert team|Explore outer space with a large research crew
Superpowers|Fly anywhere but only at walking speed|Teleport but only to places you have visited
Everyday|Have a robot do your chores but choose your daily schedule|Do your own chores and choose your own schedule
Nature|Live near a forest with no shops nearby|Live in a lively city with only a small garden
Friendship|Learn a new skill alongside a beginner friend|Learn it quickly with an expert teacher
Imagination|Have a map that reveals new places|Have a compass that points towards interesting stories
Food|Cook one dish brilliantly|Be able to cook many dishes reasonably well
Adventure|Plan every detail of an expedition|Discover the route as you travel with a reliable guide
Science|Understand how every machine works|Understand how every living thing grows
Superpowers|Speak every language but never sing|Sing any song beautifully but speak only one language
Everyday|Have a huge art kit you cannot move|Have a small art kit you can take anywhere
Nature|Protect one endangered species really well|Improve habitats for many common species
Friendship|Work in a team where everyone has the same skill|Work in a team where everyone has a different skill
Imagination|Write a book that changes its ending each time|Draw a map that gains a new island each month
Food|Grow all your own vegetables|Make all your own bread and pasta
Adventure|Take a long trip with one comfortable base|Take shorter trips to many different places
Science|Invent a useful tool with no moving parts|Invent a fun machine with lots of moving parts
Superpowers|Become invisible but only while standing still|Change your appearance but only for five minutes
Everyday|Have a room that rearranges itself each week|Have a room where you can change any one feature each day
Nature|Spend a year observing one wild animal|Spend a year learning about a whole ecosystem
Friendship|Teach a friend something you already know|Learn something completely new together
Imagination|Have a door to a different friendly world every week|Have a door to one favourite world forever
Food|Try a new food every day|Perfect a favourite recipe over a month
Adventure|Find an old map with missing details|Find a new map with one secret route
Science|Build a small working model of a city|Build a large working model of one invention
Superpowers|Control the weather over your garden|Control the light inside any one room
Everyday|Finish projects quickly with simple tools|Finish them slowly with excellent tools
Nature|Have a tiny garden full of variety|Have a large garden with one spectacular tree
Friendship|Lead a small project|Support a much larger project with a specialist skill
Imagination|Meet a character from a favourite story|Let a favourite character visit your town
Food|Open a travelling food stall|Run a small neighbourhood cafe
Adventure|Travel by bicycle with flexible plans|Travel by train with a fixed itinerary
Science|See a time lapse of a forest growing|See a slow motion view of a raindrop falling
Superpowers|Remember everything you read for one week|Remember only the most important detail forever
Everyday|Share a workshop with many useful tools|Have a private workspace with just a few tools
Nature|Watch a familiar place change through every season|Visit a completely new landscape once
Friendship|Help organise a brilliant event|Create something small that a friend can keep
Imagination|Have a storybook that answers one question each day|Have a sketchbook that brings one tiny drawing to life each week
Adventure|Reach a beautiful destination after a difficult journey|Have an easy journey with many interesting stops
Decision making|Choose your next project by careful planning|Choose it by experimenting with several small ideas
`),
Hard:dilemmas('Hard',`
Time|Know one fixed event in the future but be unable to change it|Change one past decision without learning what the original outcome would have been
Values|Receive full credit for a modest useful invention|Remain anonymous for an invention that helps millions
Strategy|Have complete information but very little time to decide|Have plenty of time but incomplete information
Community|Improve one public service dramatically|Improve every public service by a small amount
Creativity|Create a masterpiece that cannot be reproduced|Create a simple design anyone can adapt and improve
Knowledge|Understand one subject in exceptional depth|Understand the connections between many subjects
Leadership|Lead a brilliant team that often disagrees|Lead an agreeable team that needs more guidance
Environment|Restore a small ecosystem completely|Make a much larger damaged ecosystem moderately healthier
Time|Pause time while you think but be unable to act|Act twice as quickly but have no extra thinking time
Values|Keep every promise you make but make very few|Make many commitments and renegotiate them honestly when circumstances change
Strategy|Choose a reliable solution with limited benefits|Choose an uncertain solution with much greater possible benefits
Community|Design a fair rule that needs exceptions|Design a flexible rule that needs careful judgement every time
Creativity|Work with unlimited materials and a strict brief|Work with limited materials and complete creative freedom
Knowledge|Know when you are mistaken without knowing the answer|Know the right answer without being able to explain why
Leadership|Make a difficult decision alone and take responsibility|Share the decision and responsibility with a divided group
Environment|Build something extremely durable but hard to recycle|Build something easy to recycle that needs frequent replacement
Time|Revisit one ordinary day with your current knowledge|Experience one completely unfamiliar day without preparation
Values|Give useful advice that is rarely followed|Ask questions that help others discover their own solutions
Strategy|Have a detailed plan that cannot be altered|Have a flexible plan with an uncertain destination
Community|Create a beautiful shared space with strict opening hours|Create a simple shared space that is always accessible
Creativity|Have an idea nobody understands yet|Improve an existing idea in a way everyone immediately appreciates
Knowledge|Recover lost knowledge from the past|Discover entirely new knowledge with no immediate use
Leadership|Build a team around complementary specialists|Build a team of adaptable generalists
Environment|Reduce energy use through better technology|Reduce energy use through changes in everyday habits
Time|Always estimate how long a task will take accurately|Always notice the most important task to do next
Values|Offer equal resources to everyone|Offer different resources according to carefully assessed need
Strategy|Succeed on your first attempt without understanding why|Succeed after several attempts and understand the whole process
Community|Let a small group make decisions quickly with public accountability|Let everyone participate in decisions that take much longer
Creativity|Make work that is widely enjoyed for a short time|Make work that a small audience values for generations
Knowledge|Be exceptionally good at spotting patterns|Be exceptionally good at spotting important exceptions
Leadership|Be remembered for a bold new direction|Be remembered for making a good system work consistently
Environment|Protect a landscape by limiting access|Keep access open and invest heavily in restoration
Time|Have one extra hour each day that must be spent learning|Have one extra hour each day that must be spent helping someone
Values|Receive honest feedback immediately|Receive thoughtful feedback only after a long reflection
Strategy|Solve an immediate problem with a temporary measure|Wait longer for a solution designed to last
Community|Support many small local projects|Support one ambitious project serving a wider region
Creativity|Keep complete control of a collaborative work|Share control and gain ideas you would never have imagined
Knowledge|Know the likely consequences of your own choices|Understand the motives behind other people’s choices
Leadership|Make a process transparent but slower|Keep the process efficient and explain decisions afterwards
Environment|Design a product people repair themselves|Design a shared service so fewer products are needed
`),
};
// Expanded libraries: appended after the original curated items so existing prompt keys stay stable.
{
 const dilemmaRows:Record<string,Array<{category:string,a:string,b:string}>>={Easy:easyDilemmas,Medium:mediumDilemmas,Hard:hardDilemmas};
 for(const level of Object.keys(dilemmaRows)){const pool=dilemmaPools[level];const seen=new Set(pool.flatMap(d=>[d.a.toLowerCase(),d.b.toLowerCase()].sort().join('|')));
  for(const row of dilemmaRows[level]){const signature=[row.a.toLowerCase(),row.b.toLowerCase()].sort().join('|');if(seen.has(signature))continue;seen.add(signature);pool.push({key:`rather:${level}:${pool.length}`,...row})}}
 const ideaRows:Record<string,Array<{category:string,text:string}>>={Easy:easyInventions,Medium:mediumInventions,Hard:hardInventions};
 for(const level of Object.keys(ideaRows)){const pool=inventionPools[level];const seen=new Set(pool.map(i=>i.text.toLowerCase()));
  for(const row of ideaRows[level]){const key=row.text.toLowerCase();if(seen.has(key))continue;seen.add(key);pool.push({key:`invent:${level}:${pool.length}`,...row})}}
}
