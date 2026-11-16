-- Logos uploaded for a specific location are only usable and readable there.
-- Existing rows keep NULL and remain shared across the business.
ALTER TABLE venue_assets ADD COLUMN location_id TEXT REFERENCES venue_locations(id);
