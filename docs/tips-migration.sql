-- ============================================================================
-- RemoSpot — First-class Tips (feedback round, Phase 2)
--
-- Run this whole file in the Supabase SQL editor (DDL needs the postgres role;
-- the anon key cannot create tables). Idempotent where practical.
-- Depends on: profiles, spots, groups (see docs/community-migration.sql).
-- ============================================================================

-- ── Table ───────────────────────────────────────────────────────────────────
-- A tip is a short, first-class piece of advice. It may be attached to a spot
-- (tips about a spot), to a group (tips posted in a community group), or both.
CREATE TABLE IF NOT EXISTS tips (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spot_id    UUID REFERENCES spots(id)  ON DELETE CASCADE,   -- nullable: group-only tip
  group_id   UUID REFERENCES groups(id) ON DELETE SET NULL,  -- nullable: spot-only tip
  body       TEXT NOT NULL,
  tag        TEXT CHECK (tag IN ('wifi','food','quiet','vibe','general')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tips_spot  ON tips (spot_id);
CREATE INDEX IF NOT EXISTS idx_tips_group ON tips (group_id);
CREATE INDEX IF NOT EXISTS idx_tips_user  ON tips (user_id);

-- ── Row Level Security ──────────────────────────────────────────────────────
-- Tips are public (like reviews); own-row insert/delete.
ALTER TABLE tips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tips readable" ON tips;
CREATE POLICY "Tips readable" ON tips FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Users add tips" ON tips;
CREATE POLICY "Users add tips" ON tips FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own tips" ON tips;
CREATE POLICY "Users delete own tips" ON tips FOR DELETE USING (auth.uid() = user_id);

-- ── Let reactions & comments target a tip ───────────────────────────────────
-- The polymorphic tables gate target_type with a CHECK; widen it to allow 'tip'.
-- (Inline column checks are auto-named <table>_<column>_check.)
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_target_type_check;
ALTER TABLE reactions ADD  CONSTRAINT reactions_target_type_check
  CHECK (target_type IN ('checkin','review','post','comment','tip'));

ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_target_type_check;
ALTER TABLE comments ADD  CONSTRAINT comments_target_type_check
  CHECK (target_type IN ('checkin','review','post','tip'));

-- ── Realtime ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tips;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
