# Bilingual build — milestone 0 audit

Audited 15 November 2026, against a21a176. No application changes during audit.

## Architecture and design
React 19 + TypeScript, Vite 6 static build, existing React/lucide dependencies; no router, backend or translation service. `main.tsx` owns Home, Library, Favourites, How to Play, Clubhouse and game/setup navigation. `engine.ts` registers 13 paper games and imports 11 spoken games from `noPropsCatalog.ts`. Four shells: generic paper, SpeedDrawing, Scattergories, NoPropsGame. Recent back-navigation uses browser history and paused setup with explicit restart.

Warm ivory/navy/coral/teal/lilac styling in `style.css`; Arial body and Georgia headings. Keep all English styling. Responsive grids and modal setup already exist. Add Arabic font and direction rules only. No locale or RTL support exists.

Generic sessions, settings, favourites, sound and recent games persist in localStorage. ClubContext stores device-local profiles, parties, confirmed results and awards separately. Timers use deadlines and remaining time; host controls all scoring, guesses and spoken answers. No child login, speech recognition or automatic answer judging. Clubhouse rankings are local; email is a mailto draft. Preserve these boundaries.

## Complete game inventory
All games have Easy/Medium for children and Hard for adults. A = content localisation; B = content + gameplay adaptation; C = separate language logic. Complexity includes curated content and verification.

| ID / English title | Collection / category | Mechanics / sources | Arabic adaptation | Class / complexity |
|---|---|---|---|---|
| speed / Speed Drawing | Paper / Creativity | 16 hidden cards; drawingDeck shuffle bag; reveal/reset | Independent Arabic drawing decks, retain 16 cards and reveal state | A / medium |
| impossible / The Impossible Drawing | Paper / Creativity | Timed imaginative drawings; engine/adultGames | Saudi scenarios and adult drawing constraints | A / medium |
| detective / Doodle Detective | Paper / Deduction | Hidden artist prompt, 3 clue guesses; engine/adultGames | Concrete Arabic subjects / adult abstract concepts | A / medium |
| story / Story Builders | Paper / Imagination | Shared paper story, three turns each; engine/adultGames | Original openings, twists and adult constraints | A / medium |
| code / Secret Code | Paper / Logic | Hidden key + solution; secretCode | Arabic 28-letter numbered key; orthographic normalization; hard numbers only | C / high |
| five / The 5-Second Challenge | Paper / Quick thinking | Name 2/3 things, five seconds; engine/adultGames | Arabic productive categories calibrated by age | A / medium |
| battle / Paper Battleship | Paper / Strategy | 5/7/9 grids, paper coordinates, manual hit/miss; adultGames | Arabic instructions/status, retain LTR coordinate geometry | B / medium |
| escape / Paper Escape Room | Paper / Mystery | Sequential validated locks, shared timer, parent hints; engine/adultGames | Independent Arabic puzzles, normalized Arabic/numeric answers | C / high |
| scatter / Scattergories | Paper / Quick thinking | Letter bag, 10/12 categories, timers, manual classic/house scoring; scatterEngine | 28-letter alphabet registry, curated productive pools and witnessed category/letter pairs | C / high |
| ladder / Word Ladder | Paper / Logic | One-letter path, validated dictionary graph; wordGames/newGames | Curated Arabic dictionary graph; exact one-letter substitution; accepted inflections documented | C / high |
| anagram / Anagram Race | Paper / Quick thinking | One continuous timer, multiple words, category/answer; wordGames | Curated Arabic words, separated letter tiles, orthographic handling, manual alternative answers | C / high |
| invent / Invent Something | Paper / Creativity | Drawing/presentation/voting; creativeGames | Original everyday Saudi problems and adult constraints | A / medium |
| rather / Would You Rather? | Paper / Imagination | Balanced choices, speaker/favourites; creativeGames | Arabic dilemmas, independent history | A / medium |
| np-topics / Table Topics | No props / Speaking | Preparation + speech; noPropsContent/Engine | Original discussion banks | A / medium |
| np-story60 / Story in 60 Seconds | No props / Imagination | 3 words (4/5 adult), speech timer | Arabic combination pools | B / medium |
| np-convince / Convince Us | No props / Speaking | Prep, defend proposition, audience questions | Original propositions by age | A / medium |
| np-side / Take a Side | No props / Speaking | Choose/defend A or B, same debate next speaker | Balanced Saudi discussion dilemmas | A / medium |
| np-countdown / Categories Countdown | No props / Quick thinking | Name 3/5/7 things with response timer | Original broad Arabic categories | A / medium |
| np-association / Word Association | No props / Quick thinking | Group spoken chain, response timer, repeats judged by host | Dedicated Arabic starting words and repeat/association rules | B / medium |
| np-truths / Two Truths and a Lie | No props / Deduction | Players author personal statements, host reveal | Local instructions/inspiration, never generate personal facts | A / low |
| np-scenario / What Would You Do? | No props / Imagination | Explain response, optional preparation/timer | Original scenarios with adult reasoning | A / medium |
| np-yesno / Don’t Say Yes or No | No props / Speaking | Interviewer reads questions, host judges forbidden words | Exact banned set نعم، لا، إيه; alternatives allowed; original questions | B / high |
| np-rapid / Rapid Fire | No props / Quick thinking | 10/20 question sequence, one timer, manual scoring | 200+ original short questions / categories | A / medium |
| np-opposite / Opposite Answers | No props / Quick thinking | Wrong factual answer goal; correct answer hidden | Arabic factual QA bank with verified numeric subset | B / high |

## Localisation problems
English strings are embedded in every TSX screen and engines, including accessibility labels, errors, awards, certificates and email exports. `option` elements sometimes derive values from visible English labels: translation must preserve original enum values. ASCII uppercasing/letter filters and English-specific migration logic cannot run on Arabic sessions. Generated story/battle status strings use templates. Saved question favourites need locale metadata. Session history must never contain the other language's content. CSS contains physical margins, absolute positions, serif headings and letter spacing unsuitable for Arabic. Coordinate boards, timers and code sequences need explicit bidi isolation. Existing SVG certificate generation assumes English text and dates.

## Proposed bilingual architecture
Lightweight central locale store + React provider (`en`, `ar-SA`) and one fixed top-right toggle. Explicit render-time translation helpers, central UI dictionary and parameterized templates; no DOM rewriting or external translator. Keep stable English internal enum values and identifiers. Content modules expose Arabic game metadata, rules, independent per-level banks and language-specific generators; engines select locale content while reusing timers/scoring. Arabic text NFC/hamza/diacritic/numeral normalization is explicit for puzzle input only. Persist sessions and question favourites by locale, migrate existing English slots safely. Mid-game switching pauses and asks the host to safely leave the round; never translate a live state. Clubhouse user-authored names and records remain shared and unchanged.

## Sequence and validation gates
0. This inventory and architecture audit.
1. Locale state, independent session persistence and engine extension points; baseline English tests.
2. UI catalogue, one toggle, RTL, bidi isolation and Arabic typography; DOM checks, browser visual checks if available.
3. Najdi writing conventions and level calibration documented with content.
4. Arabic paper engines/content, validated ciphers, escape solutions, ladder paths, scramble letter inventories and category witnesses.
5. Arabic spoken banks using existing host-controlled engines.
6. Automated coverage/duplicate/pool-count/solution checks; document actual sizes, not inferred claims.
7. Both-language game journeys, timer/score/resume/switch tests, complete existing English regression suite.
8. Report exact completion, any native-language/visual review limitations; publish existing public Site.

## Risks / dependencies
No browser tooling currently available: cannot honestly certify visual mobile/desktop QA or select a font based on visual testing. Use appropriate Arabic font metrics with fallback and report outstanding visual review. No independent native Saudi reviewer is available: author and self-review natural Najdi, validate mechanics automatically, disclose native review outstanding. Arabic word transformations are restricted to a curated lexical graph, not a claim to recognize all Arabic words; the host accepts valid alternatives. Avoid invented filler to meet counts. No new packages required; bundle a licensed Arabic font if available. Preserve all existing English content and device data, including backup compatibility.
