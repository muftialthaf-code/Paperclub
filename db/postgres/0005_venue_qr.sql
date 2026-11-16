-- Opaque, stable QR identities. A printed QR holds only a random token; the destination (venue slug,
-- branding, domain) can change without reprinting, and a code can be disabled or replaced individually.
CREATE TABLE venue_qr_codes (
 id TEXT PRIMARY KEY,
 public_token TEXT NOT NULL UNIQUE,
 location_id TEXT NOT NULL REFERENCES venue_locations(id),
 business_id TEXT NOT NULL REFERENCES businesses(id),
 kind TEXT NOT NULL CHECK(kind IN ('location','table')),
 label TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','disabled','replaced')),
 replaced_by TEXT REFERENCES venue_qr_codes(id),
 created_by TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX venue_qr_location_idx ON venue_qr_codes(location_id,status);
CREATE UNIQUE INDEX venue_qr_table_label_idx ON venue_qr_codes(location_id,lower(label)) WHERE kind='table' AND status<>'replaced';
CREATE TABLE venue_qr_scans (
 qr_id TEXT NOT NULL REFERENCES venue_qr_codes(id),
 day DATE NOT NULL,
 scans INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(qr_id,day)
);
