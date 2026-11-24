# English / Saudi Najdi Arabic build — implementation handover

15 November 2026. Existing branding and English content retained. Existing public Site and device-local data model retained; no login or new dependency added.

## What is implemented

- Central `en` / `ar-SA` locale state with a single persistent top-right language control, available on pages, game screens and modals.
- Immediate interface switching; document language/direction; Arabic search, navigation, setup, rules, accessibility labels, scoring, results, Clubhouse, awards, certificate preview/download and parent email drafts.
- Explicit render-time translation catalogue and parameterized display strings. Internal enum values remain English stable IDs so translated options cannot corrupt state. User-authored names/messages remain literal, with bidirectional isolation.
- Shared game screens, timers, parent-controlled judging and scoring. Arabic prompt libraries are separate from English. No DOM translation observer or external translation API.
- English retains `pc-session`; Arabic uses `pc-session-ar-SA`. Question favourites have independent language slots. Existing English saved games need no destructive migration. Profiles, parties, results and awards remain shared device-local records.
- Mid-game switching asks the host to save and leave the round. Cancel keeps it running. Confirm saves the exact paused timer before switching to the other language's library. Each language resumes its own round. Storage failure blocks switching and leaves the current game open.
- RTL logical spacing/alignment, direction-aware arrows, isolated numbers/timers/code sequences and unchanged Battleship coordinate geometry. Arabic uses locally bundled Tajawal regular/medium/bold under the SIL Open Font License; English fonts remain unchanged. Fonts join the existing offline cache.

## Game coverage and Arabic mechanics

All 13 Paper & Pen and 11 No Props Needed games have Arabic names, descriptions, rules and independent Easy/Medium/Hard content. The complete inventory, classifications and source map are in [BILINGUAL-AUDIT.md](BILINGUAL-AUDIT.md).

Dedicated Arabic mechanics:

- Secret Code: 28-letter numeric key, explicit alef/maqsura/ta-marbuta conventions, validated round-trip solutions, numeric-only adult challenges. Unsupported standalone hamza spellings are excluded from the curated cipher vocabulary instead of producing invalid zero codes.
- Scattergories: registry of all 28 letters; productive difficulty pools; 10/12 selected categories only when witnessed answers exist. Not every letter is enabled at every level. Parent judgement still accepts legitimate alternatives.
- Word Ladder: curated Arabic lexemes and verified graph paths. Easy/Medium replace one letter at fixed length; Hard may add/delete a single letter. Displayed route is a suggested valid route, not a claim of global optimality outside the curated dictionary.
- Anagram Race: 205 curated Arabic words with three prevalidated separated-letter arrangements per word. NFC spelling is preserved and optional diacritics are removed in the vocabulary. Alternate legitimate words using the same letters/category are explicitly accepted by the host.
- Escape Room: independent Arabic arithmetic, sequence, logic, clock and cipher locks. Arabic/Western numerals, common alef variants and optional diacritics normalize for submitted answers. The ordering lock uses first/next/last semantics to avoid left/right ambiguity in Arabic.
- Word Association / storytelling: original Arabic vocabulary pools, including adult abstract concepts. The spoken chain stays off-screen and host judged.
- Don’t Say Yes or No: exact banned words are نعم، لا، إيه. Other everyday alternatives stay allowed. No speech recording or automatic speech validation.
- Opposite Answers: original Arabic factual questions; expected answers stay hidden until the player has responded.

## Content and writing review

Original Arabic writing uses a consistent conversational Saudi voice: وش، خلّوا، يلا، اختاروا، قولوا ليه. Children receive familiar ideas; adults receive constraints, competing priorities, reasoning and abstract ideas. No personal facts are generated for Two Truths and a Lie.

[CONTENT-LIBRARIES.md](CONTENT-LIBRARIES.md) and [content-counts.json](content-counts.json) enumerate every game in both languages. Authored banks, combinations, verified dictionary paths and procedural puzzles are distinguished. Counts are per level; minimum prompt targets are totals across a game's levels, not claims of 100 manually written prompts at every level.

Arabic examples: 830 drawing cards across levels; 205 anagram words; 360 invention combinations; 108 balanced dilemmas; 216 category challenges; 216 forbidden-word questions; 216 opposite-answer questions; 540 rapid-fire questions. Discussion, conviction, personal-topic inspiration and scenario banks each contain 108 entries. Story openings have 120 combinations per theme per level. Ladder counts are verified endpoint paths over the curated dictionary, not thousands of hand-written puzzles.

Content was authored and self-reviewed for style, family suitability and playability, with mechanical validation. An independent native Najdi editorial review has **not** been performed.

## Validation and status

The implementation includes these reproducible checks:

- `npm test`: **59 tests passed**, including existing English engine tests plus Arabic ciphers, dictionary paths, exact anagram tile multisets, duplicates, pool sizes, non-repetition, category witnesses, shared timer behaviour, Arabic SVG/mailto output and mixed-script technical symbols.
- 500 Arabic escape adventures per difficulty (1,500 total), answers recomputed independently; the ordering puzzle is exhaustively checked for a unique solution.
- `node tests/bilingual.mjs`: all 26 games × three levels × two languages (156 launches), interface/rules/setup, timer controls, manual scores, hidden answers, result screens and Clubhouse navigation; zero missing catalogue entries on exercised paths.
- `node tests/bilingual-sessions.mjs`: cancel/confirm language change, exact paused times, storage failure, independent English/Arabic session identity, refresh, Arabic title search, literal mixed-language profile names and Arabic awards/certificates.
- Existing journeys, adult games, spoken games, four added paper games, Scattergories, Clubhouse, result assignment, timer buzzer, back navigation and offline regression scripts.
- `npx tsx scripts/check-ui.ts`: all literal render-catalogue entries resolved.
- `npx tsx scripts/content-counts.ts`: regenerate the two-language inventory of library sizes.
- `npm run build`: TypeScript and production build.

Audit and functional implementation gates are covered by automated checks. Visual acceptance is **not certified**: this environment has no supported browser/desktop tool, so desktop/mobile layout, actual Arabic shaping, font appearance and wrapping need a real-browser review. Tajawal is implemented as a complementary Arabic font choice, not presented as visually validated here. The compiled main bundle is approximately 230 KB gzip plus locally hosted fonts; Vite emits its standard uncompressed chunk-size advisory.

## Milestone status

0: audit complete. 1: architecture and session tests passed. 2: language/RTL implementation and DOM checks passed; visual acceptance outstanding. 3: writing standards applied and self-reviewed; native editorial review outstanding. 4–5: all 24 game implementations exercised in both languages at all three levels. 6: library counts and mechanical validation passed. 7: automated functional/regression checks passed; visual/device checks outstanding. 8: handover supplied with these limits; full human/visual acceptance is not claimed.

## Remaining acceptance review

1. Native Saudi Najdi reader: read prompts aloud and review nuance, age calibration, vocabulary and dictionary paths.
2. Desktop and mobile browser: inspect RTL/LTR, toggle placement, modals, text wrapping, letter tiles, timers, certificate rendering and mixed Arabic/English names.
3. Review on representative iOS/Android devices, including offline Arabic font availability after caching.

These are outstanding human/visual acceptance checks. The build must not be described as having passed them. Cross-device accounts, shared family/tournament services and automatic certificate email remain outside this localisation build and are unchanged.
