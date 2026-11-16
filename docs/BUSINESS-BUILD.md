# Business platform implementation tracker

Authorized scope: business entry, vendor and owner dashboards, locations, approved branding/prompt customization, 24-hour rotating location codes, expiring guest sessions, QR materials, aggregate reports, roles/invitations/audit/support controls. Billing deferred. Defaults: Asia/Riyadh, 06:00 rotation, two-hour guest sessions. Configuration remains editable. Do not require user approvals at intermediate steps.

- [x] Additive PostgreSQL business schema and permission boundary
- [x] Owner allowlist, MFA step-up, customer access controls
- [x] Business/location lifecycle, invitations, access requests and audit
- [x] Draft/published branding, raster logo upload, prompt approval
- [x] Daily codes, rate limits, cookies, session expiry/revocation
- [x] Business/vendor/owner bilingual UI and QR materials
- [x] Venue guest entry and shared-game integration without private-family access
- [x] Metrics with honest definitions; caching/offline restrictions
- [x] PostgreSQL isolation/security/time-window tests and UI journeys
- [ ] Production deployment and live HTTP checks (local build and documentation complete)
- [ ] Owner personally enrolls authenticator and supplies first real venue branding; billing deferred

Billing, real venue brand assets, real-world pilot feedback and user-controlled authenticator setup remain for the end. Real private family data must not appear in vendor reports.

Verification: PostgreSQL API/permission/window/recovery checks, simulated-DOM business flow, real Chromium owner MFA/vendor/mobile guest/Arabic flow, existing 24-game bilingual regression, translation catalogue and production build have passed locally. Full live deployment status will be recorded after Railway SUCCESS.
