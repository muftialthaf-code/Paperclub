# Game content and family mix

## Family mix (spoken games)

In the setup of every No Props game, **Family mix** lets parents mark which players are adults. Kids keep the chosen level (Easy or Medium); adult turns use Hard. The level is fixed when a round starts (`NoPropsState.level`) and shown in the turn header. Choosing Hard for everyone switches Family mix off. Paper games where everyone plays at once are unchanged.

## Content libraries

Large libraries are assembled deterministically from curated lists and wording templates, so prompt keys (their index) stay stable and sessions can resume. Original hand-written prompts stay first in each pool.

| Area | English | Arabic (Saudi Najdi) |
|---|---|---|
| Don't Say Yes or No | `src/content/yesnoExpansion.ts` | `src/arabic/yesnoExpansion.ts` |
| Topics, Convince, Scenario, Truths, Opposite | `src/content/spokenExpansion.ts` | `src/arabic/spokenExpansion.ts` |
| Countdown, Rapid Fire, 5-Second categories | `src/content/categoryExpansion.ts` | `src/arabic/categoryExpansion.ts` |
| Would You Rather, Take a Side, Invent | `src/content/dilemmaExpansion.ts` | `src/arabic/dilemmaExpansion.ts` |
| Drawing and concept pools | `src/content/drawingExpansion.ts` | `src/arabic/vocabularyExpansion.ts` |
| Anagram Race, Secret Code Easy | `src/content/anagramExpansion.ts`, `codeWordsExpansion.ts` | tiles from `scripts/generate-arabic-tiles.ts` |

Run `npx tsx scripts/content-counts.ts` to refresh `docs/CONTENT-LIBRARIES.md`. After adding Arabic anagram words, run `npx tsx scripts/generate-arabic-tiles.ts`.

## Review notes

- Arabic additions use templates chosen to avoid gender-agreement mistakes, but they have **not** had native editorial review.
- Arithmetic answers are computed; capitals, units and science facts are hand-entered and deserve a spot-check.
- Anagram answers are checked against letter-set collisions within the curated material only; hosts still judge alternates.
