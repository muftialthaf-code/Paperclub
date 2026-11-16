-- Organisation-level brand defaults that branches can inherit field by field.
-- Existing locations inherit nothing ('{}'), so published venues are unchanged.
ALTER TABLE businesses ADD COLUMN defaults_draft JSONB;
ALTER TABLE businesses ADD COLUMN defaults_published JSONB;
ALTER TABLE businesses ADD COLUMN defaults_revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE businesses ADD COLUMN defaults_review_requested BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE venue_locations ADD COLUMN inherit JSONB NOT NULL DEFAULT '{}';
