-- ============================================================================
-- RemoSpot — Hubs & branches (feedback round, Phase 5)
--
-- Run in the Supabase SQL editor. A "hub" is one physical place (a building,
-- mall, or campus) that contains multiple distinct workable spots — e.g. a
-- hotel's lobby, its garden, and its co-working floor are three spots at one
-- hub. "Branches" are hubs that share a `brand` (e.g. every Java House).
-- ============================================================================

CREATE TABLE IF NOT EXISTS hubs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  brand          TEXT,                       -- shared across branches (nullable)
  neighbourhood  TEXT,
  address        TEXT,
  latitude       NUMERIC(9,6),
  longitude      NUMERIC(9,6),
  description    TEXT,
  cover_gradient TEXT,
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- A spot may belong to at most one hub.
ALTER TABLE spots ADD COLUMN IF NOT EXISTS hub_id UUID REFERENCES hubs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_spots_hub  ON spots (hub_id);
CREATE INDEX IF NOT EXISTS idx_hubs_brand ON hubs (brand);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Public read (hubs are directory data); any authenticated user can create a
-- hub (as themselves); the creator can update it.
ALTER TABLE hubs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hubs public read" ON hubs;
CREATE POLICY "Hubs public read" ON hubs FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Auth insert hubs" ON hubs;
CREATE POLICY "Auth insert hubs" ON hubs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Creator update hubs" ON hubs;
CREATE POLICY "Creator update hubs" ON hubs FOR UPDATE USING (auth.uid() = created_by);
