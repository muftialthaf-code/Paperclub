# Parent accounts and private families

This build adds real server-backed parent accounts to the existing bilingual React/Vite app. It retains public games and the clearly labelled device-only practice Clubhouse.

## Login and scope

Sites provides **Sign in with ChatGPT**. The app uses normal top-level anchors to `/signin-with-chatgpt` and `/signout-with-chatgpt`, with a same-origin return path. It does not implement OAuth, collect passwords, simulate a production user, or use an email address as the durable user key. Sites dispatch supplies the verified, Site-scoped user ID. Every protected API operation checks that identity and the relevant family membership on the server.

A parent can create a private family/group, rename it, change their display name, and switch among their own families. Children and guests remain player profiles inside the family and need no separate login. Family creation is bounded to ten spaces per parent. Role enforcement includes owner/editor/viewer on the server; this first UI creates an owner membership only. Inviting additional parent accounts is not implemented or presented as available.

Anonymous visitors can play and use the existing device-only Clubhouse. Its banner explicitly explains that anyone using that browser can open it. It is separate from the signed-in family's data. Signing in does not upload local profiles automatically: an empty family offers a backup preview and explicit import confirmation. The original device copy stays unchanged.

## Data and access control

- `parent_accounts`: verified parent identity key, parent display name, optional verified parent email, timestamps.
- `families`: private name, owner and timestamps.
- `family_memberships`: composite user/family key and role.
- `family_clubhouses`: existing validated profiles/results/parties/awards JSON, revision and timestamp, scoped to one family.

`server/api.ts` uses bound SQL parameters. Other parents receive the same not-found response for another family's ID as for an unknown ID. Mutations require same-origin JSON, bounded bodies and valid data. Viewer writes and non-owner family renames are rejected. Each save compares the client's revision with the database revision atomically; stale writes return a conflict instead of overwriting another device.

The client waits for server confirmation before updating family records or saying a result is saved. Failed changes stay available in memory for retry/export. Conflicts offer export plus an explicit discard/reload action. Family switching and sign-out controls are blocked while a save or unresolved draft is pending.

Private family data is held in memory, never in localStorage. Account-linked game settings and unfinished rounds also stay in memory so private player names do not leak into the old device saves. Confirmed results and profiles persist on the server; unfinished private rounds do not resume after a full browser refresh. Public/device-mode rounds retain the existing local save behaviour. Existing local copies remain until the parent chooses to remove them; login does not retroactively make a pre-existing device backup private.

Before requesting parent data, the client checks an offline-worker privacy handshake and upgrades any legacy worker; if that fails it blocks account requests instead of allowing the old cache to store them. API and account responses use `Cache-Control: private, no-store`; the service worker excludes all API and authentication paths and retires older Paperclub caches. Sign-out is handled by Sites and navigates away, clearing in-memory family data. The public `/api/status` endpoint reports database/schema availability only, without names, email addresses, records or counts of families.

## Hosting and migrations

The existing Site ID and public audience are preserved. `.openai/hosting.json` declares logical D1 binding `DB` using the platform's string binding format. The existing Vite frontend is embedded in a standard Worker ESM artifact with the API; the app has not been rebuilt in another frontend framework. `scripts/build-server.mjs` packages the client, fonts and offline assets into `dist/server/index.js` and ships D1 metadata/migrations. No credential or secret is included.

The Drizzle schema lives in `db/schema.ts`. `npm run db:generate` created the initial schema-only migration and metadata in `drizzle/`. Hosted Sites publication applies migrations. Applied migration files must not be edited; future schema changes require a new generated migration. Tables are never created during HTTP requests.

## Verification

- Existing engine and localisation unit tests.
- Six API tests using SQLite with the actual generated migration: anonymous protection, parent/family isolation, forged body IDs, stale-write rejection, same-origin checks, roles, body limits, profile/name persistence and family limits.
- `npx tsx tests/accounts.ts` runs the existing UI against the actual API and a shared SQLite database in simulated browsers: onboarding, explicit import, cross-browser persistence, separate parent families, conflict/reload, failed-save retry, no cloud names in localStorage, Arabic UI and native sign-in/out links.
- Bilingual game launches at all levels, session switching, back navigation, result assignment, Clubhouse and timer regressions.
- `npx tsx tests/account-cache.ts`: a legacy caching worker cannot receive a parent-data request until the privacy contract is upgraded; failed updates send no API request and remain retryable.
- Production Worker artifact and offline asset tests, including exclusion of API/authentication responses from the cache.

The authenticated test identities exist only in the test harness. Production has no development sign-in route, shared password, or fallback identity. Browser OAuth interaction and real-device visual/touch testing remain manual verification steps when browser control is unavailable. The implementation uses the supported Sites identity boundary; tests do not claim to test the hosting platform's internal cookie/header verification.

## Commercial scope

This is the initial account foundation, not a subscription/billing release. Login currently requires a ChatGPT account. Branded email/password, email magic links or Google login would require a supported external identity-provider integration and a separate deployment decision. Account invitations, customer billing, public family leaderboards, cross-family tournaments, full account deletion/self-service family deletion and automatic certificate email are not implemented here. Public exposure of any family's information must remain an explicit future opt-in.
