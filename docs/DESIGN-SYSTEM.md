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

### Type scale and targets (added in the design polish)

Root font size is 16px. Nothing renders below **12px** (labels, eyebrows, tags and card metadata are 12–13px; card descriptions and helper text 14px; body 15–16px). Arabic body text is at least 15px in cards. Interactive targets are at least 44 × 44px: the favourite heart keeps a 32px visual circle inside a 44px hit area, the language switch buttons, tab-bar buttons, score steppers and close buttons are all 44px or more. Extra tokens: `--coral-deep` (hover for the coral call to action) and `--band-lavender` / `--band-peach` (full-bleed section bands).

### Patterns added

| Pattern | Where | Notes |
|---|---|---|
| Coral call to action | `.hero-buttons .primary`, `.quick-banner .primary` | One per screen; white on `--coral` is 4.9:1. Everything else stays ink. |
| Section bands | `.collection-entry`, `.how-preview` | Full-bleed via a 100vw `::before`; keeps `scrollWidth` equal to the viewport. |
| Game glyph | `src/GameGlyph.tsx`, `.game-glyph` | One lucide icon per game id, top-start of the card art. Add a line to the map when a game is added. |
| Phone card | `.game-card` at 560px and below | One card per row: art column on the left (start side), text on the right, heart at the top end. |
| Bottom tab bar | `src/TabBar.tsx`, `.tab-bar` | Phones only (700px and below). Uses existing translated labels. Guest venues get Game Library, Quick Play, How to Play. Business and Host sign in live in the hamburger menu on phones. |
| Language bar | `.language-toggle` | A slim 44px bar at the top of the page (absolute, not floating). Content sits at the inline end. |
| Sticky start button | `.setup-modal .primary.wide` | Stays visible at the bottom of the setup dialog while the form scrolls. |
| Compact accordions | `details.business-card` | Collapsed dashboard sections are one row with the marker visible. |

Motion is limited to a card fade-in, a card lift on hover (devices with hover), a twinkling star and a pop on the finish icon. All are disabled under `prefers-reduced-motion`.

Breakpoints already in use: 1450, 1050/1000, 900, 700/650 and 360 px. Mobile is the primary target; test 390 × 844 first.

## Non-negotiables

1. **Mobile first, no horizontal scroll.** `document.documentElement.scrollWidth` must not exceed the viewport at 360, 390, 768 and 1440 px.
2. **Bilingual and RTL.** English and Saudi Arabic are first-class. Use logical properties (`margin-inline`, `padding-inline-start`, `text-align:start`) rather than left/right. Check every change with `dir="rtl"`. Arabic text can be 20–30% longer; never fix widths to English copy.
3. **Every visible string is bilingual.** Use `tx("…")` with a pair in `src/i18n/uiPairs.ts`, or `b('English','العربية')` in the business area. `node tests/bilingual.mjs` must report zero missing catalogue entries.
4. **Accessible.** Text contrast at least 4.5:1 (3:1 for large text and UI boundaries). Visible focus (`outline-color: var(--teal)`). Touch targets at least 44 × 44 px. Real buttons and labels, ARIA only where HTML cannot express it. Respect `prefers-reduced-motion` (already global).
5. **Tenant theming through variables only.** Venues set `--venue-primary` and `--venue-background` (validated for contrast on the server). Never hard-code a venue's colours, names or logo into shared components. Fall back to the Paperclub tokens when the variables are absent.
6. **No decorative controls.** A button, toggle or setting must do something real. Do not add placeholder UI.
7. **Children first.** Plain language, large targets, no dark patterns, no countdown pressure outside actual game timers.

## Printable venue card (QR card)

Venues print this and put it on every table, so it is the product's sales pitch. Code: `src/business/qrCard.ts` (generator), `src/business/QrCardPanel.tsx` (preview and downloads), shown inside `QrItem` in `LocationPanel.tsx`. Test: `tests/qr-card-browser.ts`.

- **Sizes:** A5 portrait (table card, 148 × 210 mm) and A4 portrait (poster). One layout drawn in millimetres on an A5 canvas and scaled for A4. The colour card sits 4 mm inside a white page, so a home printer's unprintable edge never cuts the design; all content is at least 8 mm from the paper edge.
- **Venue brand leads:** `primary` and `background` from the published brand (else the draft), the logo when there is one (fetched with the dashboard session and embedded as a data URL), otherwise the venue name set large in Georgia. Arabic names switch to Tajawal bold and right-to-left. Never hard-code a venue's colours or name.
- **The QR is sacred:** dark modules (`#111827`) on a flat white panel with a 4-module quiet zone, error correction Q, drawn as vector paths, at least 4 cm wide on A5 (about 5.6 cm in practice). No gradient, tint, logo or doodle ever touches the panel. It encodes `location.origin + '/q/' + token`.
- **Copy:** fixed, bilingual, equal prominence. Headline "Make room for play." / "خلّونا نلعب مع بعض." and three steps (scan, ask the team for today's six-digit code, play together, no app, no account). Each language has its own direction. It never prints the daily code and makes no price, prize or data claims. The Arabic needs a native reader's review.
- **Playful cues, restrained:** a hand-drawn underline, four-point sparkles, a dashed paper-cut frame and the Paperclub asterisk. They use coral when it has 3:1 contrast on the venue background, otherwise the venue's primary colour.
- **Type:** nothing below 9 pt at A5 (3.2 mm). Georgia for headings, Arial for body, Tajawal for Arabic. Tajawal is embedded in the SVG so the PNG export renders with the real shapes.
- **Downloads:** self-contained SVG (fonts and logo embedded, no external references), PNG at 300 DPI (1748 × 2480 px A5, 2480 × 3508 px A4, stamped with 300 DPI metadata), and a browser "Print or save as PDF" action at exact paper size.
- **Disabled QR:** a red warning and a greyed, outlined preview in the dashboard. The card itself never shows the state.

## Where things live

| Area | Files |
|---|---|
| Global styles and tokens | `src/style.css` |
| Business, admin and venue styles | `src/business/business.css` |
| Guest venue experience | `src/business/VenueExperience.tsx`, `VenueHome.tsx` |
| Vendor dashboard | `src/business/BusinessApp.tsx`, `LocationPanel.tsx`, `DefaultsPanel.tsx`, `ChainReport.tsx`, `LayoutEditor.tsx` |
| Games and setup screens | `src/main.tsx`, `src/GameGlyph.tsx`, `src/TabBar.tsx`, `NoPropsSetup.tsx`, `NoPropsGame.tsx`, `Scattergories.tsx`, `SpeedDrawing.tsx` |
| Vendor dashboard | `src/business/BusinessApp.tsx`, `QrCardPanel.tsx`, `qrCard.ts`, `LocationPanel.tsx`, `DefaultsPanel.tsx`, `ChainReport.tsx`, `LayoutEditor.tsx` |
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

## Terminology

The person running a game, or owning a family account, is the **host**: they may be a parent, a friend, a grandparent or a café guest. Say "host" in gameplay, rules, guides and account screens (Arabic: المضيف). Only the certificate email, which is addressed to a child's parent or guardian, says "parent or guardian" (ولي الأمر). `src/wording.test.ts` guards gameplay text.
