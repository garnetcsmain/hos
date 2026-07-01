// Database schema for HOS Phase 0. One SQLite system holds relational state,
// the append-only event store (audit log), and all trust metadata — the same
// "one Postgres system" philosophy from the thesis, kept self-contained for
// local/offline operation. The path to Postgres + PostGIS + pgvector is open;
// the repository layer above this is the only thing that would change.
//
// Conventions:
//  - Timestamps are ISO-8601 UTC strings.
//  - `events` is append-only: code only ever INSERTs into it.
//  - Sensitive PII columns are commented; the repository layer is responsible
//    for never projecting them into public views.

export const SCHEMA_SQL = /* sql */ `
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
  sensitive_notes TEXT NOT NULL DEFAULT '',   -- never public
  reporter_name TEXT NOT NULL DEFAULT '',
  reporter_relationship TEXT NOT NULL DEFAULT '',
  reporter_contact TEXT NOT NULL DEFAULT '',  -- sensitive PII
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
  found_location TEXT NOT NULL DEFAULT '',    -- sensitive (precise place)
  city          TEXT NOT NULL DEFAULT '',
  found_at      TEXT,
  condition     TEXT NOT NULL DEFAULT 'unknown',
  description   TEXT NOT NULL DEFAULT '',
  reporter_org  TEXT NOT NULL DEFAULT '',     -- provenance
  reporter_name TEXT NOT NULL DEFAULT '',
  reporter_contact TEXT NOT NULL DEFAULT '',  -- sensitive PII
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
  factors       TEXT NOT NULL DEFAULT '[]',   -- JSON evidence chain
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

-- Coordination epic (HOS-2026-007). Sites/needs/supplies share the same
-- append-only event store and repository philosophy. Location is coarse
-- (district), never a precise address; org/actor is a first-class entity.
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
  district      TEXT NOT NULL DEFAULT '',   -- coarse only; never precise address
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

-- Append-only event store / audit log. Never UPDATEd or DELETEd by app code.
CREATE TABLE IF NOT EXISTS events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  occurred_at   TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  type          TEXT NOT NULL,
  actor         TEXT NOT NULL,
  payload       TEXT NOT NULL DEFAULT '{}'
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
`;
