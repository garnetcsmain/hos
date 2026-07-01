-- HOS initial schema (HOS-2026-001-07). Mirrors apps/web/app/lib/db/schema.pg.ts
-- exactly. The Postgres backend also applies this idempotently on cold start
-- (advisory-locked), so this file is for the managed migration path
-- (`supabase db push` / CI) — pre-applying it makes the runtime init a no-op.
--
-- Column shapes are identical to the SQLite schema (db/schema.ts) so the row
-- mappers are backend-agnostic: JSON stays TEXT, booleans stay INTEGER 1/0.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS missing_reports (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  given_name    TEXT NOT NULL DEFAULT '',
  age           INTEGER,
  sex           TEXT NOT NULL DEFAULT 'U',
  last_seen_location TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  last_seen_at  TEXT,
  description   TEXT NOT NULL DEFAULT '',
  sensitive_notes TEXT NOT NULL DEFAULT '',
  reporter_name TEXT NOT NULL DEFAULT '',
  reporter_relationship TEXT NOT NULL DEFAULT '',
  reporter_contact TEXT NOT NULL DEFAULT '',
  consent       INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'open',
  source        TEXT NOT NULL DEFAULT 'family_web',
  photo_url     TEXT
);

CREATE TABLE IF NOT EXISTS found_reports (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  given_name    TEXT NOT NULL DEFAULT '',
  age           INTEGER,
  sex           TEXT NOT NULL DEFAULT 'U',
  found_location TEXT NOT NULL DEFAULT '',
  city          TEXT NOT NULL DEFAULT '',
  found_at      TEXT,
  condition     TEXT NOT NULL DEFAULT 'unknown',
  description   TEXT NOT NULL DEFAULT '',
  reporter_org  TEXT NOT NULL DEFAULT '',
  reporter_name TEXT NOT NULL DEFAULT '',
  reporter_contact TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'open',
  source        TEXT NOT NULL DEFAULT 'volunteer',
  photo_url     TEXT
);

CREATE TABLE IF NOT EXISTS match_candidates (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  missing_id    TEXT NOT NULL REFERENCES missing_reports(id),
  found_id      TEXT NOT NULL REFERENCES found_reports(id),
  score         INTEGER NOT NULL,
  factors       TEXT NOT NULL DEFAULT '[]',
  status        TEXT NOT NULL DEFAULT 'pending',
  model         TEXT NOT NULL,
  UNIQUE(missing_id, found_id)
);

CREATE TABLE IF NOT EXISTS verifications (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  candidate_id  TEXT NOT NULL REFERENCES match_candidates(id),
  decision      TEXT NOT NULL,
  verifier_org  TEXT NOT NULL,
  verifier_name TEXT NOT NULL DEFAULT '',
  evidence      TEXT NOT NULL DEFAULT '',
  confidence    INTEGER
);

CREATE TABLE IF NOT EXISTS notifications (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  missing_id    TEXT NOT NULL REFERENCES missing_reports(id),
  candidate_id  TEXT REFERENCES match_candidates(id),
  channel       TEXT NOT NULL DEFAULT 'in_app',
  recipient     TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'queued',
  subject       TEXT NOT NULL DEFAULT '',
  body          TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS orgs (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'other'
);

CREATE TABLE IF NOT EXISTS sites (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  name          TEXT NOT NULL,
  org_id        TEXT NOT NULL REFERENCES orgs(id),
  district      TEXT NOT NULL DEFAULT '',
  beds_total    INTEGER NOT NULL DEFAULT 0,
  beds_free     INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'active',
  notes         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS needs (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  org_id        TEXT NOT NULL REFERENCES orgs(id),
  site_id       TEXT REFERENCES sites(id),
  district      TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'other',
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit          TEXT NOT NULL DEFAULT '',
  urgency       TEXT NOT NULL DEFAULT 'normal',
  status        TEXT NOT NULL DEFAULT 'open',
  claimed_by_org_id TEXT REFERENCES orgs(id),
  notes         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS offers (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  org_id        TEXT NOT NULL REFERENCES orgs(id),
  district      TEXT NOT NULL DEFAULT '',
  category      TEXT NOT NULL DEFAULT 'other',
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit          TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'available',
  notes         TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS events (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  occurred_at   TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  type          TEXT NOT NULL,
  actor         TEXT NOT NULL,
  payload       TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS match_embeddings (
  id            TEXT PRIMARY KEY,
  created_at    TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'face',
  embedding     vector(512)
);

CREATE INDEX IF NOT EXISTS idx_missing_status ON missing_reports(status);
CREATE INDEX IF NOT EXISTS idx_found_status ON found_reports(status);
CREATE INDEX IF NOT EXISTS idx_candidates_missing ON match_candidates(missing_id);
CREATE INDEX IF NOT EXISTS idx_candidates_found ON match_candidates(found_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON match_candidates(status);
CREATE INDEX IF NOT EXISTS idx_events_entity ON events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_missing ON notifications(missing_id);
CREATE INDEX IF NOT EXISTS idx_sites_org ON sites(org_id);
CREATE INDEX IF NOT EXISTS idx_needs_status ON needs(status);
CREATE INDEX IF NOT EXISTS idx_needs_district ON needs(district);
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);
CREATE INDEX IF NOT EXISTS idx_embeddings_entity ON match_embeddings(entity_type, entity_id);
