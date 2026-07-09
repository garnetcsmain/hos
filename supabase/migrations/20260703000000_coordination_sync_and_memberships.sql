-- Coordination sync + memberships (2026-07-03).
--
-- 1. Backfills the sites columns that landed in code (schema.pg.ts) with the
--    HOS-2026-007-07 import but were never committed as a migration
--    (category/lat/lng — the runtime init() created them; this makes
--    `supabase db push` environments match).
-- 2. Precise need locations, per the human D1 answer (docs/decision-log/
--    2026-07-01-HOS-008-threat-model-operating-posture/human_answer_D1.yaml):
--    coordinator-gated precise lat/lng is permitted; district stays the coarse
--    rollup key and the only grain any public surface may ever show.
-- 3. Sync provenance (source_id/synced_at) for the nightly caracasayuda.com
--    re-import: rows created directly in HOS (source_id IS NULL) are never
--    touched by the sync; imported rows locally edited after synced_at are
--    never overwritten (human precedence rule, 2026-07-03).
-- 4. org_memberships: the user<->org join table HOS-2026-011-D3 requires
--    before org-scoped authorization/RLS can exist. Provisioned now, unused
--    until real per-user auth (HOS-2026-001-08).

ALTER TABLE sites ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'otro';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS synced_at TEXT;

-- Site broadcast (human direction 2026-07-03): a short announcement the
-- responsible party sets on a site ("hoy entregan comida 2-5pm") with an
-- expiry, shown on the map/console while current. Coordinator-set today;
-- moves to the site:<id> capability scope when HOS-2026-011 lands.
ALTER TABLE sites ADD COLUMN IF NOT EXISTS announcement TEXT NOT NULL DEFAULT '';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS announcement_until TEXT;

-- 5. Coverage radius (human direction 2026-07-03): a site can declare an area
--    it covers (meters), so several groups may legitimately share an address
--    or district by covering different zones. NULL = a point, not an area.
ALTER TABLE sites ADD COLUMN IF NOT EXISTS radius_m INTEGER;

-- 7. Site ownership (human direction 2026-07-03: "if someone creates a site,
--    that person becomes the responsable"). Self-signup is open; whoever
--    creates a site owns it and may manage it and delegate it.
ALTER TABLE sites ADD COLUMN IF NOT EXISTS created_by_user_id TEXT;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS created_by_email TEXT;

ALTER TABLE needs ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
ALTER TABLE needs ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
ALTER TABLE needs ADD COLUMN IF NOT EXISTS source_id TEXT;
ALTER TABLE needs ADD COLUMN IF NOT EXISTS synced_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_source ON sites(source_id) WHERE source_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_needs_source ON needs(source_id) WHERE source_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS org_memberships (
  user_id       TEXT NOT NULL,
  org_id        TEXT NOT NULL REFERENCES orgs(id),
  capability_bundle TEXT NOT NULL DEFAULT 'member',
  created_at    TEXT NOT NULL,
  -- 6. Time-boxed delegated access: a responsible party can grant a volunteer
  --    publish-for-my-org rights for hours/days or indefinitely (NULL). UNUSED
  --    until real per-user auth (HOS-2026-001-08) enforces it; see
  --    docs/design/2026-07-03-auth-rls-phase1.md.
  expires_at    TEXT,
  PRIMARY KEY (user_id, org_id)
);
ALTER TABLE org_memberships ADD COLUMN IF NOT EXISTS expires_at TEXT;

-- 8. Peer-delegated site coordination (HOS-2026-011 site:<id> scope): a site's
--    responsable grants another signed-up user the right to modify THAT site,
--    after vetting them onsite. Revocable, optionally time-boxed. The only
--    approval in the system, and it is peer-to-peer (no central approval).
CREATE TABLE IF NOT EXISTS site_grants (
  site_id       TEXT NOT NULL REFERENCES sites(id),
  email         TEXT NOT NULL,
  granted_by    TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL,
  expires_at    TEXT,
  PRIMARY KEY (site_id, email)
);
