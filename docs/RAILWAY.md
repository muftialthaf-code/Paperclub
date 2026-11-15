# Paperclub on Railway

This branch runs the existing 24-game bilingual app on Node 24 and PostgreSQL. Parent accounts use Better Auth with verified email/password and Google OAuth. Children and guests stay as profiles in a parent's private family; games work without signing in.

## Prepared production resources

- Project: Paperclub (`ef5237e9-2cec-4d35-b20b-9c4770499d92`)
- Environment: production (`428cfd91-c5f2-4416-acce-6f4eafe434f0`)
- Web service: paperclub-web (`b5b0a4fb-2b46-47db-9a7c-1099797404ef`)
- PostgreSQL: Postgres (`6771f689-00dc-4583-b5a8-0e7a8d871e5b`)
- Reserved app origin: https://paperclub-web-production.up.railway.app
- Dashboard: https://railway.com/project/ef5237e9-2cec-4d35-b20b-9c4770499d92

A reserved domain is not proof of deployment. Confirm the web deployment is SUCCESS and `/api/status` responds 200 before sharing it as live.

## Deployment

The root Dockerfile builds the frontend and Node server, installs runtime dependencies, and runs as an unprivileged user. Railway service settings have been configured directly:

| Setting | Value |
| --- | --- |
| Dockerfile | Dockerfile |
| Pre-deploy command | `npm run db:migrate:railway` |
| Start command | `npm start` |
| Health check | `/api/status` |
| Port | 8080 |

Pre-deploy runs checksum-tracked family migrations and the pinned Better Auth schema migration. It refuses changed applied SQL or unsafe auth schema changes. Migrations do not run on an HTTP request. Back up PostgreSQL before future schema upgrades.

Core variables are already set on the web service: `APP_ORIGIN`, `BETTER_AUTH_URL`, `NODE_ENV`, `PORT`, a generated `BETTER_AUTH_SECRET`, and the `DATABASE_URL` reference `${{Postgres.DATABASE_URL}}`. Never rotate the auth secret casually: it protects sessions and encrypted OAuth tokens. Keep database access private.

Deploy this directory with the Railway CLI, targeting these existing resources:

```sh
railway up --project ef5237e9-2cec-4d35-b20b-9c4770499d92 --environment 428cfd91-c5f2-4416-acce-6f4eafe434f0 --service b5b0a4fb-2b46-47db-9a7c-1099797404ef
```

For automatic GitHub deploys, push this branch to a private repository you own and connect that repository to the existing web service. Do not create a duplicate database or paste credentials into the repository.

## Activate sign-in providers (Gmail selected)

Enter secrets directly in the Railway web service's Variables tab. Do not send them in chat or commit an `.env` file. Set each provider's complete set together and deploy.

**Google**: Create a Web application OAuth client in Google Cloud Console, configure consent/publishing for your intended audience, and use:

- Authorized JavaScript origin: `https://paperclub-web-production.up.railway.app`
- Authorized redirect URI: `https://paperclub-web-production.up.railway.app/api/auth/callback/google`
- Railway variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

While Google is in testing mode, add the parents who will test to the consent screen's test users. Reconfigure both Google and APP_ORIGIN if you later add a custom domain.

**Email/password via Gmail SMTP**: Enable Google 2-Step Verification, then create an App Password named Paperclub at https://myaccount.google.com/apppasswords. Set these Railway variables together:

| Variable | Value |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | The Google App Password without spaces |
| `EMAIL_FROM` | `Paperclub <youraddress@gmail.com>` |

Do not use your normal Google password. Gmail has provider sending limits and account-dependent App Password availability. No separate paid email sender is required for this setup. Google OAuth sign-in and Gmail SMTP are separate configurations.

Email/password remains disabled until a complete mail transport is configured. Google remains disabled until both Google credentials exist. The UI never offers a provider that is not configured. Credentials alone do not prove delivery: test signup, verify the message reaches an inbox, follow verification, sign in, reset the password, and sign out. No external emails are sent by the automated tests. Certificate email remains a user-controlled draft, separate from authentication mail.

## Existing data and cutover

The old Sites app has not been removed or redirected. A read-only audit on 2026-11-15 found all four original cloud tables empty: parent_accounts, families, family_memberships, family_clubhouses. Recheck before final cutover if anyone uses the old cloud accounts in the meantime. Do not automatically match old ChatGPT identities to new accounts by display name or email.

Device-only Clubhouse saves are tied to the old website's browser origin. On the old site, use **Backup & restore → Export backup**. Open the new site, restore the backup into its device-only Clubhouse, then sign in, create a family, and use **Import from this device**. Confirm the players and scores before abandoning the old site. The original device copy is preserved by the family import. Never overwrite a populated private family without exporting its current records first.

## Verification

```sh
npm ci
npm run build:railway
npm test
npm run test:accounts
TEST_DATABASE_URL=postgresql://your-local-test-db npm run test:railway
npx tsx tests/parent-login.ts
npx tsx tests/accounts.ts
npx tsx tests/account-cache.ts
node tests/bilingual.mjs
npx tsx scripts/check-ui.ts
```

PostgreSQL integration tests use an isolated random schema and remove only that test schema. They exercise real verification and reset tokens with an injected mailer, session revocation, forged identity headers, cross-family access, conflicting writes, transaction rollback, migrations and Google redirect construction. A real Google account login and real mail delivery require configured providers and a live deployment.

For local startup, use `.env.example` as a variable checklist and inject environment variables in your shell or process manager; the server does not load dotenv files automatically. Run migrations, then `npm start` from the repository root. Local HTTP requires NODE_ENV other than production and an HTTP APP_ORIGIN. Never use local test credentials in production.

## First-time provider setup, step by step

You can prepare providers before deployment. Google sign-in can work before email delivery is ready. Use the exact app origin above for the first deployment.

### Google

1. Open https://console.cloud.google.com/ and create or select a project named Paperclub.
2. Open Google Auth Platform. Complete Branding with app name **Paperclub**, your support email and your developer contact email. Choose **External** audience so parents outside your Google organization can use it.
3. While the app is in Testing, add your Google email under Audience → Test users.
4. Open Clients → Create client → **Web application**. Name it **Paperclub Railway**.
5. Add this Authorized JavaScript origin: `https://paperclub-web-production.up.railway.app`
6. Add this Authorized redirect URI: `https://paperclub-web-production.up.railway.app/api/auth/callback/google`
7. Save the client. In Railway → Paperclub → paperclub-web → Variables, add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` together using the two values Google provides. Do not put them in GitHub or chat.
8. After code is deployed, use Continue with Google and your listed test user. For a public launch, complete Google's production audience/publishing requirements and provide your actual product privacy information.

### Verification and password-reset email with Gmail

Use the Gmail SMTP values in the provider section above. Enter the App Password only in Railway. After deployment, create a parent account and follow its email verification link; also test password reset and sign-out. A successful SMTP configuration check does not prove inbox delivery, so complete this with your real inbox before inviting other families.

### What to share back

Tell the assistant **Google variables added** and/or **Gmail variables added**. If something fails, share the error message, not the client secret, API key, password, verification URL or reset token. Once GitHub is connected and the code is published, the assistant can deploy the existing service and verify its public health and enabled-provider flags. Real inbox delivery and real Google consent still need a parent to complete the browser flows.
