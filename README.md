# Paperclub
A parent-operated, screen-free family game platform. React 19, TypeScript, Vite and Tailwind. No accounts, backend, analytics or external AI.

## Run
`npm install`, then `npm run dev`.
`npm run build` creates the deployable `dist/`.
`npm test` validates generation and puzzle answers.
`node tests/journeys.mjs` checks Speed Drawing and complete journeys for the other seven games in a simulated DOM.
`node tests/speed-cards.mjs` checks the exact mystery-card flow, resets, progress, direct launch, saved-state restoration and migration from the previous game.
`node tests/offline.mjs` checks first-load asset caching and offline responses.
`node tests/secret-code.mjs` checks message lengths, difficulty selection at the youngest age, hidden answers and migration of older saved messages.

## Structure
- `src/engine.ts`: registry, rules, procedural challenge generation and validated escape puzzles. Add a registry entry and generator for a new game.
- `src/drawingDeck.ts`: 250 local Speed Drawing challenges and a persisted shuffle bag. Each reset generates 16 new hidden cards, preserves word history, and increments the round.
- `src/secretCode.ts`: level-specific message pools and phrase/sentence templates, five reversible cipher methods, and saved-message validation.
- `src/SpeedDrawing.tsx`: simple mystery-card grid. Tap to reveal/hide; no setup, timer, memory phase or scoring.
- `src/main.tsx`: shared setup, parent game guide, timers, scores, persistence and game-specific interactions.
- `src/style.css`: responsive paper-and-ink design system.
- `public/sw.js`: same-origin offline cache after first load.

Session, names, preferences, favourites and recents persist only in localStorage on the current device. Nicknames work well. Clearing browser data clears saves. Service workers require HTTPS or localhost. Installation and offline operation need verification on target mobile browsers.

QA: production build, generator tests and simulated-DOM journeys. Visual browser and real-device touch QA are unverified because the managed browser control tool was not offered in this session.

## Difficulty audiences
Easy and Medium are for children. Hard is for adults and does not use the child-age setting. Adult prompts remain family friendly.

Speed Drawing keeps its sixteen cards and direct start; a compact selector changes the content pool. Secret Code Hard keeps A1–Z26 numbers with adult sentences. Drawing and deduction use complex scenes and abstract concepts; storytelling adds narrative constraints; quick thinking uses adult knowledge categories. Battleship uses 5×5 / 7×7 / 9×9 grids (adult fleet lengths 2, 3, 4, 5). Escape Room uses four child puzzles on Easy, five on Medium, and six validated adult puzzles on Hard.

Older saved paper grids and escape adventures keep their original board/puzzles. Their Hard game screen offers a new adult game. Other saved Hard content updates, preserving names and scores; existing stories keep their written opening.
`node tests/adult-games.mjs` exercises adult mode in all eight games, including the complete adult Battleship and Escape Room flows.

## Scattergories
`src/scatterEngine.ts` contains 102 categories across eight topic groups. Each category has local example witnesses used to admit only answerable letter/category pairs; these examples never appear in active play. Matching selects distinct answer families and caps each topic at two categories. Letter shuffle bags, category history, scores and paused/running timers persist with the session.

`src/Scattergories.tsx` implements optional setup, individual/teams, 10/12 categories, 60/90/120/180-second timers, optional sound, classic/house scoring, per-category comparison, cumulative leaderboards and round/game endings. No written answers are collected or automatically judged.

`node tests/scattergories.mjs` checks the complete setup/play/comparison/next-round flow, timer controls and expiry, sound, manual ending, both scoring modes, teams and persisted resume.
