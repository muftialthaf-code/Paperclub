# Paperclub
A parent-operated, screen-free family game platform. React 19, TypeScript, Vite and Tailwind. No accounts, backend, analytics or external AI.

## Run
`npm install`, then `npm run dev`.
`npm run build` creates the deployable `dist/`.
`npm test` validates generation and puzzle answers.
`node tests/journeys.mjs` checks Speed Drawing and complete journeys for the other seven games in a simulated DOM.
`node tests/speed-cards.mjs` checks the exact mystery-card flow, resets, progress, direct launch, saved-state restoration and migration from the previous game.
`node tests/offline.mjs` checks first-load asset caching and offline responses.

## Structure
- `src/engine.ts`: registry, rules, procedural challenge generation and validated escape puzzles. Add a registry entry and generator for a new game.
- `src/drawingDeck.ts`: 250 local Speed Drawing challenges and a persisted shuffle bag. Each reset generates 16 new hidden cards, preserves word history, and increments the round.
- `src/SpeedDrawing.tsx`: simple mystery-card grid. Tap to reveal/hide; no setup, timer, memory phase or scoring.
- `src/main.tsx`: shared setup, parent game guide, timers, scores, persistence and game-specific interactions.
- `src/style.css`: responsive paper-and-ink design system.
- `public/sw.js`: same-origin offline cache after first load.

Session, names, preferences, favourites and recents persist only in localStorage on the current device. Nicknames work well. Clearing browser data clears saves. Service workers require HTTPS or localhost. Installation and offline operation need verification on target mobile browsers.

QA: production build, generator tests and simulated-DOM journeys. Visual browser and real-device touch QA are unverified because the managed browser control tool was not offered in this session.
