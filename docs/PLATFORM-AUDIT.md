# Platform audit against the white-label hospitality brief

Audit date: 16 November 2026. The brief assumed a new build; most of it already existed. This table records what was found and what was done.

| Brief requirement | Status before | Decision and result |
|---|---|---|
| Multi-tenant platform, one shared engine | Built (businesses, locations, roles, shared game engine) | Kept. |
| Tenant isolation in backend and database | API-level checks and tests | Added a systematic cross-tenant matrix test (`tenant-isolation.test.ts`). Row-level security evaluated and deferred (see `BUSINESS.md`). |
| Organisation to branch hierarchy with central branding and overrides | Two levels only; every branch configured separately | **Built:** organisation defaults with per-group inheritance. |
| Branch-scoped users | Built (location-scoped managers and staff) | Kept. |
| Consolidated analytics and branch comparison | Per-location reports only | **Built:** consolidated report with CSV. |
| Anonymous play, no accounts | Built | Kept; the daily code still gates venue play by design. |
| Permanent QR identifiers, table QR codes, status management, regeneration | Slug-based link QR only | **Built:** opaque tokens, table labels, disable/enable/replace, scan counts. Legacy links still work. |
| Organisation-level QR | None | Not built; needs a branch-picker design. |
| Configurable homepage, featured game, categories, search and filters | Game selection; search and filters existed | **Built:** featured game, tenant categories, promo banner. Seasonal collections can be modelled as categories. |
| Branding, welcome, language | Built (English and Saudi Arabic) | Kept. |
| AI-generated games / AI services | None; the product uses no AI | Declined for now: child-safety, moderation, cost and privacy design are undefined. |
| Billing, pricing, subscriptions | Deferred by the owner | Out of scope. |
| Monitoring, integration management, support tooling | Partial (health check, audit log) | Not expanded; no requirement was specific enough to build without inventing features. |
