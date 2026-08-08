-- Site operational-confirmation timestamp (HOS-2026-014-01, Judge D1).
--
-- Adds sites.last_confirmed_at: the moment a steward last EXPLICITLY confirmed
-- the site is still operating ("confirmar operativo"). This is a distinct
-- liveness signal from updated_at — editing a bed count or an announcement bumps
-- updated_at but must NOT count as re-confirming the place is running, so the
-- console's operational freshness badge decays from last_confirmed_at, not from
-- any write. NULL for imported/legacy rows never confirmed inside HOS; those
-- honestly read as needing confirmation (they decay from created_at) rather than
-- borrowing freshness from an unrelated edit. Additive, matches the runtime
-- init() in schema.pg.ts so `supabase db push` environments stay in sync.

ALTER TABLE sites ADD COLUMN IF NOT EXISTS last_confirmed_at TEXT;
