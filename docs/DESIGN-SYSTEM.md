# Paperclub design system

The single reference for visual design, layout and UX. Update it whenever a token or pattern is added.

## Character

Warm, calm, paper-and-pen. A family should feel invited, never rushed. Big readable type, generous spacing, soft colour accents, one clear action per screen. Adult content (Hard) is the same visual language, never a different "serious" skin. Everything works one-handed on a phone around a table.

## Tokens (`src/style.css`, `:root`)

| Token | Value | Use |
|---|---|---|
| `--paper` | `#faf9f6` | page background |
| `--surface` | `#ffffff` | cards, inputs |
| `--ink` | `#24365b` | text, primary buttons |
| `--muted` | `#626d82` | secondary text (paragraphs) |
| `--line` | `#dfe3ec` | borders, dividers |
| `--coral` | `#bc4d3a` | brand accent, selected, hearts |
| `--teal` | `#146b68` | focus rings, positive accents |
| `--mint` `--lavender` `--peach` `--butter` | `#e0f2ee` `#ece7fb` `#ffe3d8` `#fff0c7` | soft category and banner fills |

Type: Georgia (serif) for headings and the wordmark, Arial for body, Tajawal for Arabic (`src/fonts`). Buttons: `.primary` (ink fill), `.secondary` (white, outlined), `.text-button`. Pills and chips are rounded. Cards use `--line` borders with minimal shadow.

Breakpoints already in use: 1450, 1050/1000, 900, 700/650 and 360 px. Mobile is the primary target; test 390 × 844 first.

## Non-negotiables

1. **Mobile first, no horizontal scroll.** `document.documentElement.scrollWidth` must not exceed the viewport at 360, 390, 768 and 1440 px.
2. **Bilingual and RTL.** English and Saudi Arabic are first-class. Use logical properties (`margin-inline`, `padding-inline-start`, `text-align:start`) rather than left/right. Check every change with `dir="rtl"`. Arabic text can be 20–30% longer; never fix widths to English copy.
3. **Every visible string is bilingual.** Use `tx("…")` with a pair in `src/i18n/uiPairs.ts`, or `b('English','العربية')` in the business area. `node tests/bilingual.mjs` must report zero missing catalogue entries.
4. **Accessible.** Text contrast at least 4.5:1 (3:1 for large text and UI boundaries). Visible focus (`outline-color: var(--teal)`). Touch targets at least 44 × 44 px. Real buttons and labels, ARIA only where HTML cannot express it. Respect `prefers-reduced-motion` (already global).
5. **Tenant theming through variables only.** Venues set `--venue-primary` and `--venue-background` (validated for contrast on the server). Never hard-code a venue's colours, names or logo into shared components. Fall back to the Paperclub tokens when the variables are absent.
6. **No decorative controls.** A button, toggle or setting must do something real. Do not add placeholder UI.
7. **Children first.** Plain language, large targets, no dark patterns, no countdown pressure outside actual game timers.

## Where things live

| Area | Files |
|---|---|
| Global styles and tokens | `src/style.css` |
| Business, admin and venue styles | `src/business/business.css` |
| Guest venue experience | `src/business/VenueExperience.tsx`, `VenueHome.tsx` |
| Vendor dashboard | `src/business/BusinessApp.tsx`, `LocationPanel.tsx`, `DefaultsPanel.tsx`, `ChainReport.tsx`, `LayoutEditor.tsx` |
| Games and setup screens | `src/main.tsx`, `NoPropsSetup.tsx`, `NoPropsGame.tsx`, `Scattergories.tsx`, `SpeedDrawing.tsx` |
| Clubhouse and accounts | `src/Clubhouse.tsx`, `FamilyAccounts.tsx`, `ParentLogin.tsx` |
| Translations | `src/i18n/uiPairs.ts`, `src/i18n/translate.ts` |

The JSX is dense (long single lines). Make small, targeted edits.

## Verifying a design change

```bash
npm run build:railway                       # type-check and build
npm test && node tests/bilingual.mjs        # unit and translation checks
TEST_DATABASE_URL=… BROWSER_OUTPUT_DIR=/some/dir CHROMIUM_PATH=/opt/pw-browsers/chromium \
  npx tsx tests/venue-home-browser.ts       # real Chromium, mobile + Arabic screenshots
```

Browser tests need a dedicated local PostgreSQL (never the production database). Take screenshots at 390 × 844 (mobile), 768 × 1024 (tablet) and 1440 × 900 (desktop), in English and Arabic, before and after.
