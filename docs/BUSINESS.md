# Paperclub Business — owner and venue operations

This release extends the existing Railway app. Billing is deliberately deferred. No duplicate Railway app, database or paid email service is required.

## Routes and first use

- `/business`: public introduction, business sign-in and vendor dashboard.
- `/admin`: protected platform-owner console.
- `/business/help`: bilingual venue operating guide.
- `/business/invite#TOKEN`: private, seven-day staff invitation link. Tokens are hashed in the database and accepted only by the matching verified email.
- `/venue/LOCATION-SLUG`: permanent, branded guest page and daily-code entry.

The owner allowlist is supplied through `PLATFORM_OWNER_EMAILS` in Railway Variables. It must contain only the actual platform owner's verified email(s). This is not a first-registrant-admin mechanism. Parent/family accounts stay separate from business permissions.

Sign in, enable an authenticator under Account security, save the recovery codes, then unlock the owner console with a current code. Owner management unlocks last 30 minutes and are tied to the current server session. Google login alone does not unlock management. Recovery codes can be used to sign in and to unlock the console if the authenticator is lost. After unlocking with recovery, use Account security → Replace a lost authenticator; complete new enrollment before owner access resumes. Already-enabled owner-factor changes and secret/recovery retrieval require a current management unlock.

## Onboard a venue

1. The vendor signs in and requests business access, or the owner creates a business and shares its owner invitation link. Invitations are not emailed automatically.
2. Activate the business in the owner console. Set an optional access end date; a blank end date means no scheduled expiry. These are manual access controls, not automated billing.
3. Create each location with its own permanent URL slug.
4. Save branding, a raster logo, English/Arabic welcome messages and enabled games as a draft.
5. Submit selected themed prompts and request publication review.
6. Use the owner review queue to review locations and approve or reject prompts. Approve and publish branding separately.
7. Download a QR code or bilingual printable SVG table card. Display the current daily code separately inside the venue.
8. Test the code, games, languages and expiry on real phones before inviting guests.

Each business can have owners, managers and staff. Owners manage staff invitations; managers edit locations; staff view codes, QR material and aggregate reports. A manager/staff assignment can be limited to one location. Location-scoped managers cannot create branches or read business-wide audit records. While a business is pending, suspended or past its access end date, its users can still sign in and read their dashboard, staff list and audit history, but every change (locations, invitations, drafts, prompts, logos, code replacement, session revocation) is refused with `business_inactive`; only the unlocked platform owner can act. The guest-visible venue name is the published brand's display name, so a manager's edit to the location name reaches guests only after the owner reviews and publishes it. Each business must retain an owner. Platform owners can manage all businesses only after authenticator unlock.

## Branding and selected prompts

The same game engines, rules, timers and scoring serve every venue. Name, logo, accessible colours, welcome messages and game selection are configurable. Logos uploaded for a location (as the dashboard always does) are readable and usable only by that location's team; logos from before `0003_logo_location.sql` stay shared across their business. Logos are limited to 1 MB input, decoded and resized to at most 512×512, stripped of metadata and stored as PNG in PostgreSQL. SVG uploads and remote logo URL fetching are not accepted. Background colours must remain light and readable; contrast is validated server-side.

Brand drafts are private. Publishing copies the reviewed draft into the live snapshot; later edits do not immediately replace the published branding. A vendor can restore published branding into a draft. Code timing settings apply when saved and are labelled separately from publication.

Custom text prompts currently support Speed Drawing, The Impossible Drawing, Invent Something, Table Topics, Convince Us and What Would You Do? Structured word/cipher/puzzle games retain their validated libraries. Prompts are scoped to location, game, English/Arabic and difficulty. Easy/Medium remain for children; Hard remains for adults. Duplicates are rejected. Pending/rejected submissions may be edited; approved material must be revised as a new submission, preserving the existing approved copy until an owner chooses what to approve/reject.

Approved prompts are fetched only after guest access is verified. Eligible text games mix approved custom prompts with standard content. The first themed drawing deck includes matching custom subjects, then retains the existing non-repetition shuffle behavior. No AI service is used.

## Daily codes and guest sessions

Defaults: `Asia/Riyadh`, rotation from **06:00**, new code every **exact 24 hours**. The rotation hour is configurable per location. There is **no play-time limit**: a guest session lasts until the end of the daily code window it was opened in, so access is controlled only by the 24-hour code. (`session_minutes` remains in the database for compatibility but is ignored.) A fixed UTC anchor enforces the exact 24-hour requirement; daylight-saving regions can see their wall-clock hour shift at a seasonal clock change. Riyadh has no DST.

Codes are six random digits (never all-identical or in sequence), with a keyed verifier and encrypted dashboard retrieval. Entries still accepted for a code created before this change (eight characters) end when the dashboard next reads the code, which re-issues it as six digits. Code generation is atomic across concurrent requests. Codes are not placed in permanent QR links, analytics URLs or audit details. Because six digits are easier to guess than eight characters, failed entries are limited per IP, and 300 failed entries across a location within 15 minutes **replace the daily code automatically** (audited as `code.auto_replaced`); guests already playing keep their sessions.

Replacing a leaked code stops new entries with the old code. Existing guest sessions keep their original expiry, including across daily rotation. An explicit End all guest sessions action revokes them. Business suspension, location suspension or expired business access also prevents guest API access.

Failed-entry limits apply per location and hashed edge-provided IP; valid entries do not consume that failed-attempt allowance, so a venue's shared Wi-Fi is not capped at a handful of guests. Guessing is rate-limited. The app trusts Railway's proxy client-IP headers, not arbitrary account identity headers.

Guest cookies are HttpOnly, SameSite Strict, Secure in production, scoped to the relevant venue API path and stored only as random-token hashes in PostgreSQL. Client timers use a monotonic elapsed clock derived from server timestamps, not the editable device wall clock. The guest page revalidates every 30 seconds and on focus/connection return. Expiry, failed revalidation or offline events clear themed content and unmount the game. Administrative revocations become visible by the next revalidation (up to 30 seconds for an already-open screen); API operations are denied immediately.

A daily code can still be shared or re-entered from home until it rotates. This design is not proof of physical presence. Screenshots or content already seen cannot be recalled. Standard public Paperclub games remain a separate public offering; restaurant access restricts its branded experience and venue-only prompts, not the existence of the public game engines.

## Privacy, caching and reports

Guest play uses isolated, in-memory game/roster state. It does not load signed-in family accounts, display saved family profiles or write venue prompts/player names to localStorage. Guest reporting does not collect player names, written answers, family IDs or personal scores.

All business and venue APIs use `private, no-store`. The service worker excludes `/api/`, `/business`, `/admin`, `/venue` and account/auth paths. Cache v3 retires older public caches. A private-API worker handshake runs before business requests. Public offline play remains separate; venue access requires connectivity.

Reports are per authorized location, for 7/30/90 days:

- Page loads are venue entry-page loads, not unique people.
- Sessions are successful code entries creating a guest session, not verified restaurant visits.
- Starts are game runs reported by the client and de-duplicated by run ID.
- Completions are explicit host reports or existing game-finished events, de-duplicated per run. They are not independently adjudicated prizes or scores.
- Failed code entries are aggregate counts.

CSV export contains game labels and aggregate counts only. These numbers do not demonstrate returning customers, revenue uplift or physical presence. Pair them with real pilot feedback. A visit-passport/identified-return-visit system is not included in this release.

Vendor dashboards expose only their business/location data. The owner customer list provides account identity/status and family counts, not private child rosters/results. Suspending a customer blocks private family/business access; public anonymous play remains available. Owner allowlist accounts cannot be suspended from this screen. Account/family hard deletion is not implemented by the business console; fulfill support requests through a reviewed process with the owner.

Important admin actions have actor, business, target and timestamp audit records. Codes, invitation tokens, authenticator secrets and guest tokens are not written to audit details. Team invitations are shared by the authorized user; the system does not silently send external email.

## Schema, operation and recovery

`0002_business.sql` is additive. Keep applied migration checksums immutable. Better Auth's pinned two-factor plugin adds its own additive schema through the existing pre-deploy auth migration runner. The production health endpoint now checks both family and business/auth core tables.

The existing production flow remains:

```sh
npm ci
npm run build:railway
npm run db:migrate:railway
npm start
```

Do not run migrations manually against production merely to test; Railway pre-deploy handles the new release. Back up the existing database before future destructive/schema work. Use Railway's database backup controls and verify restore procedures in an isolated environment. No production dump is stored in this repository and no customer data is seeded by this release.

Housekeeping runs on server startup and daily with an advisory lock. It removes old rate-limit/step-up rows, expired unused invitations, game/guest-access event data beyond the documented 90-day horizon, and unreferenced logos older than 30 days. It never deletes customers, private families, businesses, published content or audit history. It can also run via `npm run maintenance:railway` in the configured service environment. Avoid manually exposing secrets while invoking operational tools.

Server errors return generic responses; production logs omit request bodies, secrets and private records. Health checks, deploy logs and Railway metrics remain the operational monitoring path. Vendor and owner audit screens provide application-level change history.

## Verification and remaining owner work

Run the PostgreSQL suite against a dedicated test database, not production:

```sh
TEST_DATABASE_URL='postgresql://LOCAL_TEST_DATABASE' npm run test:railway
npx tsx tests/business.ts
# After building dist, with Chromium installed and the local test database:
TEST_DATABASE_URL='postgresql://LOCAL_TEST_DATABASE' CHROMIUM_PATH=/usr/bin/chromium npx tsx tests/business-browser.ts
npm test
npm run test:accounts
npx tsx tests/parent-login.ts
npx tsx tests/accounts.ts
npx tsx tests/account-cache.ts
node tests/bilingual.mjs
npx tsx scripts/check-ui.ts
npm run build:railway
```

The business integration suite exercises real verified accounts/TOTP/recovery, owner protections, tenant and staff isolation, draft approval, logo processing, code windows/concurrency/replacement, session expiry/revocation, shared-Wi-Fi valid entries, reports and safe retention. A real Chromium pass additionally exercised owner authenticator enrollment/unlock, vendor daily-code/branding screens, phone-sized guest entry and themed play, Arabic switching and horizontal-width assertions. This caught a Node adapter response-header issue; the server now uses native Request/Response objects so guest cookies survive real HTTP delivery. Screenshots were inspected for the tested desktop and phone viewports. This does not certify physical iOS/Android behavior.

The UI journey suite exercises business second-factor login, vendor draft/prompt workflows, bilingual rendering, themed guest play, report events, private-family isolation and content removal after revocation. Existing engine and bilingual regressions remain applicable.

The owner must personally enroll their authenticator and save recovery codes. Real venue branding/prompt approval, physical QR printing/scanning, real-device visual/audio acceptance, actual restaurant pilot feedback, native Najdi editorial acceptance and product-specific legal/contract review remain owner-led launch steps. Billing/payment-provider integration is intentionally deferred until the end, as requested. Do not claim these human acceptance steps passed from automated tests.


## Organisation defaults, branch inheritance and homepage layout

A business owner can maintain **organisation defaults**: brand colours, shared logo, welcome messages, the game list and the homepage layout (featured game, up to eight tenant-named categories, an optional bilingual promotional message). Defaults are a private draft until the platform owner publishes them, like branch branding.

Each location chooses, per group, whether to **follow** the defaults (colours, logo, welcome messages, game list, homepage layout). Inheritance is resolved when guests load the venue (`effectiveBrand`), so re-publishing the defaults updates every branch that follows them immediately, while branches that do not follow them are untouched. A branch's display name, timing, prompts and QR codes are always its own. Existing locations inherit nothing. The shared logo must be a business-wide asset; branch-specific logos stay private to their branch.

Guests see the optional promotional banner, the featured game and the venue's category chips on the library page; the existing search and filters remain. Categories only list games the venue has enabled.

## Permanent QR identity (one per venue)

Every location gets **one** venue QR automatically when it is created (existing locations get theirs the first time a team member opens Codes & QR). The code is a random 128-bit token resolved at `/q/<token>`: it redirects to the venue page and never contains the slug, so branding, links or domains can change without reprinting. It can be disabled, re-enabled or replaced; a replaced code stops working permanently. Scans are counted per day (aggregate only). Guests still need the daily code to play. The original `/venue/<slug>` link keeps working for anything already printed. Inactive businesses, unpublished or suspended locations and disabled codes show a neutral "not active" page that names no tenant. A location must be **approved and published** before its QR opens. Table-level QR codes are no longer offered in the dashboard; the API still accepts and resolves them so nothing already printed breaks. Organisation-level QR codes that list several branches were not built (a public branch picker would expose the branch list).

## Logo, colours and menu

Uploading a logo saves it to the draft immediately and **chooses the brand colour and a soft background from the logo** (the dominant saturated colour, darkened until it meets the same contrast rules the server enforces; neutral logos fall back to a dark slate). The colours stay editable. The guest page shows the logo centred at the top, above the venue name and welcome message.

Venues enter their **menu** as drinks, food and desserts (one item per line, optional Arabic name after a vertical bar). The menu is part of the branding draft, so it is reviewed and published with it. Guests meet the items mixed into Would You Rather and Take a Side (pairs of the same kind), the 5-Second Challenge (ingredients), Table Topics, Convince Us, Don't Say Yes or No, Word Association, Rapid Fire, Categories Countdown, Doodle Detective and Speed Drawing, about three prompts in ten while a menu exists, never repeating within a session. Menu words stay in the guest's browser memory only. Opposite Answers is not personalised because it needs verified correct answers.

## Consolidated reports

Owners and unscoped team members can compare all branches of their business for 7, 30 or 90 days: page visits, QR scans, code entries, game starts and completions, completion rate, and the most started games, with CSV export. Counts are aggregate and carry no guest, family or answer data. Location-scoped staff and managers keep their per-location report only.

## Tenant isolation

Isolation is enforced in the API on every request (membership, role, location scope and business status) and verified by an automated matrix test that attempts about thirty management operations against another business's resources. Row-level security was evaluated and **not** adopted: the server uses a shared connection pool without a per-request database session, so adding it safely would mean refactoring every query. The matrix test is the guard; revisit RLS if the data layer is moved to per-request transactions.

## Migrations

`0004_org_defaults.sql` and `0005_venue_qr.sql` are additive (new nullable columns and two new tables). Back up PostgreSQL before deploying, as with any schema change.
