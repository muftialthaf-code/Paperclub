CREATE TABLE businesses (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','suspended')),
 contact_email TEXT NOT NULL, access_until TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE business_memberships (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), user_id TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','manager','staff')), location_id TEXT,
 UNIQUE(business_id,user_id)
);
CREATE INDEX business_members_user_idx ON business_memberships(user_id);
CREATE TABLE venue_locations (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), slug TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','suspended')),
 timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh', rotation_hour INTEGER NOT NULL DEFAULT 6 CHECK(rotation_hour BETWEEN 0 AND 23),
 session_minutes INTEGER NOT NULL DEFAULT 120 CHECK(session_minutes BETWEEN 15 AND 240),
 draft JSONB NOT NULL, published JSONB, revision INTEGER NOT NULL DEFAULT 0,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE business_memberships ADD CONSTRAINT business_location_fk FOREIGN KEY(location_id) REFERENCES venue_locations(id);
CREATE TABLE venue_assets (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), content BYTEA NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE venue_prompts (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), location_id TEXT NOT NULL REFERENCES venue_locations(id),
 game_id TEXT NOT NULL, locale TEXT NOT NULL CHECK(locale IN ('en','ar-SA')), difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy','Medium','Hard')),
 text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 reviewer_id TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX venue_prompts_location_idx ON venue_prompts(location_id,status);
CREATE TABLE venue_daily_codes (
 id TEXT PRIMARY KEY, location_id TEXT NOT NULL REFERENCES venue_locations(id),
 starts_at TIMESTAMPTZ NOT NULL, expires_at TIMESTAMPTZ NOT NULL, verifier TEXT NOT NULL, ciphertext TEXT NOT NULL,
 replaced_at TIMESTAMPTZ, created_by TEXT, UNIQUE(location_id,starts_at)
);
CREATE TABLE venue_guest_sessions (
 id TEXT PRIMARY KEY, location_id TEXT NOT NULL REFERENCES venue_locations(id), token_hash TEXT NOT NULL UNIQUE,
 code_id TEXT NOT NULL REFERENCES venue_daily_codes(id), expires_at TIMESTAMPTZ NOT NULL,
 revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX venue_sessions_location_idx ON venue_guest_sessions(location_id,created_at);
CREATE TABLE business_invitations (
 id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), email TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('owner','manager','staff')), location_id TEXT REFERENCES venue_locations(id),
 token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, accepted_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ,
 created_by TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE business_audit (
 id TEXT PRIMARY KEY, business_id TEXT REFERENCES businesses(id), actor_id TEXT NOT NULL,
 action TEXT NOT NULL, target_id TEXT, detail JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX business_audit_business_idx ON business_audit(business_id,created_at DESC);
CREATE TABLE business_customer_controls (
 user_id TEXT PRIMARY KEY, suspended BOOLEAN NOT NULL DEFAULT FALSE, updated_by TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE business_admin_stepup (
 session_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE venue_rate_limits (
 key TEXT PRIMARY KEY, window_at TIMESTAMPTZ NOT NULL, attempts INTEGER NOT NULL
);
CREATE TABLE venue_game_runs (
 id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES venue_guest_sessions(id), location_id TEXT NOT NULL REFERENCES venue_locations(id),
 game_id TEXT NOT NULL, started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), completed_at TIMESTAMPTZ
);
CREATE INDEX venue_runs_location_idx ON venue_game_runs(location_id,started_at);
CREATE TABLE venue_page_visits (
 location_id TEXT NOT NULL REFERENCES venue_locations(id), day DATE NOT NULL, visits INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(location_id,day)
);
ALTER TABLE venue_locations ADD COLUMN rotation_anchor TIMESTAMPTZ NOT NULL DEFAULT '2026-01-01T03:00:00Z';
ALTER TABLE venue_locations ADD COLUMN review_requested BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE venue_failed_entries (
 location_id TEXT NOT NULL REFERENCES venue_locations(id), day DATE NOT NULL, attempts INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(location_id,day)
);
CREATE UNIQUE INDEX venue_prompt_unique ON venue_prompts(location_id,game_id,locale,difficulty,lower(text));
