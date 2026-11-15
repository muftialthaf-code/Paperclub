# Paperclub
A parent-operated, screen-free family game platform. React 19, TypeScript, Vite and Tailwind. Public games plus optional parent login and private, server-backed family accounts. No child logins or external AI.

## Railway deployment
This deployment uses Node 24, PostgreSQL, verified email/password with Gmail SMTP, and Google parent sign-in. Public games remain available without login. Run `npm run build:railway` to build, `npm run db:migrate:railway` before starting, then `npm start`. Required variables and provider setup are in [docs/RAILWAY.md](docs/RAILWAY.md). The original Sites deployment remains separate.

## Original Sites build and game checks
`npm install`, then `npm run dev`.
`npm run build` creates the existing frontend plus the deployable Worker in `dist/server/`.
`npm test` validates generation and puzzle answers. `npm run test:accounts` and `npx tsx tests/accounts.ts` validate the parent-account API and UI against a migrated database.
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

## Family clubhouse (original device-only release)
The Clubhouse navigation opens parent-managed family and guest profiles, parties, confirmed results, per-game personal records, separate child/adult and guest leaderboards, monthly standings, parent awards and downloadable SVG certificates. No login or backend is required.

- `src/clubModel.ts`: versioned profile/result/party/award data, validated backups, safe profile merge/removal, club-point calculations and escaped certificate generation.
- `src/ClubContext.tsx`: device-local storage (`pc-clubhouse`), save-failure handling and optional saved-player selection in game setup.
- `src/Clubhouse.tsx`: roster management, party planning, standings, trophy cabinet, certificate preview, backups and parent email drafts.
- `src/ResultRecorder.tsx` and `src/resultBridge.ts`: explicit result confirmation for every game, identity mapping, team membership and unscored drawing participation. Results are deduplicated by game-session identity; a replay receives a fresh identity.

Club points: 3 for taking part plus 2 for a confirmed win, or 2 for cooperative completion. Awards add no points. Actual scores remain separate by game and difficulty. Team scores are not treated as individual personal bests. Month boundaries use Asia/Riyadh. Saved paper games are never silently imported as confirmed results.

Profiles, scores and certificates stay in the current browser. Backup/restore is available; there is no cross-device account sync yet. Email sharing opens a parent-reviewed `mailto:` draft, and the host manually attaches the downloaded certificate. The app does not send emails automatically, store child email addresses, or publish certificates publicly. Automatic email delivery and shared family accounts require a later server-backed release.

`node tests/clubhouse.mjs` checks profiles, guest play, party rosters, drawing votes, real game results, standings, certificates, profile merging and backup/restore. `node tests/club-results.mjs` checks replay identities, team assignments, party attribution and safe handling of storage failures.

## Timer buzzer
`src/timerSound.ts` synthesises a short buzzer locally with Web Audio. Every timed game uses it (Impossible Drawing, Secret Code, 5-Second Challenge, Doodle Detective, Paper Escape Room and Scattergories). `TimerSoundToggle` controls a shared, device-local sound preference, on by default. Audio is prepared during user gestures for mobile autoplay rules. Pauses, resets and manual finishes do not trigger it; deadline keys prevent repeated sounds. Unsupported audio never interrupts gameplay.
`node tests/timer-buzzer.mjs` checks all six timed games, expiry, single playback, pause/reset/manual-end silence and shared mute persistence using a mocked audio context. Real-device audibility remains unverified.

## Four additional paper games
Word Ladder, Anagram Race, Invent Something and Would You Rather? extend the existing registry, setup, session persistence, score controls, timers, buzzer, result confirmation and Clubhouse rather than introducing a new game shell or visual theme.

- `src/wordGames.ts`: reviewed 3/4/5-letter word banks with breadth-first validated ladder paths. Easy paths use 2–3 changes, Medium 3–4, Hard 4–5. A minimum is claimed only when the suggested path meets the Hamming-distance lower bound; other puzzles show the suggested route length. Anagram pools respect 4–5 / 5–7 / 7–10 letter bands, exclude known common ambiguous sets, include category clues and use an unchanged-word-safe shuffle.
- `src/creativeGames.ts`: 40 original invention problems and 40 dilemmas per level, spanning everyday, nature, fantasy, engineering and decision-making topics.
- `src/newGames.ts`: stable challenge keys and cycle-based selection prevent repetitions until a pool is exhausted. Ladder directions may reverse, but the pair is counted only once.
- `src/ExtraGamePrompt.tsx`: existing-theme word panels, balanced dilemma cards, optional presentation guidance and favourite-question viewing. Favourite questions persist separately from favourite games.

Anagram Next Word preserves the round deadline. Expiry ends the race without revealing answers; New Round resets the timer and word counter, preserves scores and draws fresh content. Invent Something also supports explicit presentation/voting stages. Neither game collects drawings or written answers. Word Ladder and Would You Rather? are untimed.

`npm test` validates every ladder and the content pools. `node tests/four-games.mjs` exercises all four games at every level, answer privacy, round/timer behaviour, score persistence, favourite questions, speaker selection and interrupted-session resume. The existing-game, Clubhouse, buzzer and offline checks continue to apply. Visual/mobile-browser QA is unverified when managed browser controls are unavailable.

## Paper & Pen / No Props Needed expansion
The registry now keeps all 13 existing game IDs, descriptions and mechanics under `collection: paper`, and adds 11 games under `collection: none`. `GameCollections` provides the same two entry points on Home and in the library; topic, age, player and duration filters remain available. Random quick play respects the selected collection. Existing saved games do not need migration.

- `src/noPropsCatalog.ts`: metadata and instructions for Table Topics, Story in 60 Seconds, Convince Us, Take a Side, Categories Countdown, Word Association, Two Truths and a Lie, What Would You Do?, Don’t Say Yes or No, Rapid Fire and Opposite Answers.
- `src/noPropsContent.ts`: separate Easy/Medium/Hard banks, narrative word combinations, category witnesses and stable challenge keys. Topic, persuasion, scenario, truth-inspiration and yes/no banks each contain 32 authored prompts per level; opposite-answer banks contain 32 factual question/answer pairs per level. Debate uses the existing varied dilemma banks; category games and story words reuse validated local libraries.
- `src/noPropsEngine.ts`: shared persisted player rotation, optional scores, prep/speech/response deadlines, manual outcome decisions, rapid-fire sequences, chain turns and fresh-session identities.
- `src/NoPropsSetup.tsx` and `src/NoPropsGame.tsx`: the existing design system, player roster picker, scoreboard controls, sound preference and buzzer, with no player answer entry or physical materials.

Timer expiry never chooses a new challenge or speaker. Preparation expiry waits for the parent to start speaking. Rapid Fire and yes/no question advances retain the active overall timer. Word Association retains the original starting word while the group remembers the actual spoken chain; only parent confirmation rotates the turn. Opposite Answers requires a parent response marker before the expected answer can be revealed. Two Truths and a Lie never generates or stores facts about a player; its examples are clearly labelled templates and its Results action asks the player to reveal the lie verbally. Optional unscored participation integrates with the Clubhouse without inventing winners or raw scores.

`npm test` includes collection integrity and content/state-machine assertions. `node tests/no-props.mjs` exercises all 11 games at all three difficulties, preparation/speaking separation, rapid sequences, spoken-outcome scoring, answer privacy, replay and persisted resume. Run the original game, Clubhouse, timer and offline checks for regressions. Visual/mobile QA remains unverified without the managed browser-control tool.

The timer alert now uses an arena-style sustained horn: two square-wave harmonic families at 120/180 Hz share one normalised periodic oscillator. A strong 12 ms attack, 1.15-second hold and short tail replace the former soft fading tone. Total alert length is 1.28 seconds, with output headroom retained. `src/timerSound.test.ts` checks harmonic construction, envelope, deduplication and mute; actual phone/speaker timbre is not auditioned by the automated tests.

## Parent accounts and private families
The parent-account build supersedes the device-only storage description for signed-in families. Sign in with ChatGPT creates a private parent identity; each family’s profiles, scores, parties and awards are authorised and stored server-side. Anonymous play and the explicitly labelled device-only Clubhouse remain available. See [docs/ACCOUNTS.md](docs/ACCOUNTS.md) for architecture, data privacy, migrations, tests and current commercial scope.
