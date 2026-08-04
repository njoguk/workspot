-- ============================================================================
-- RemoSpot — Community v2, Phase C1
-- Groups + membership + real reactions + comments
--
-- Run this whole file in the Supabase SQL editor (DDL needs the postgres role;
-- the anon key cannot create tables). Idempotent where practical.
-- Source of truth: docs/SCHEMA.md → "Community v2 (Phase C1)".
-- ============================================================================

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  cover_gradient TEXT,
  kind           TEXT NOT NULL DEFAULT 'custom'
                   CHECK (kind IN ('neighbourhood','interest','custom')),
  neighbourhood  TEXT,
  interest_tag   TEXT,
  visibility     TEXT NOT NULL DEFAULT 'public'
                   CHECK (visibility IN ('public','private')),
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  member_count   INTEGER NOT NULL DEFAULT 0,
  is_default     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member'
               CHECK (role IN ('member','moderator','admin')),
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- Polymorphic targets store the underlying row's UUID as text. target_type keeps
-- it disambiguated; no cross-table FK is possible for a polymorphic reference.
CREATE TABLE IF NOT EXISTS reactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('checkin','review','post','comment')),
  target_id    TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'like' CHECK (kind IN ('like','helpful')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id, kind)
);

CREATE TABLE IF NOT EXISTS comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('checkin','review','post')),
  target_id    TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reactions_target     ON reactions (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_target      ON comments (target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user   ON group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group  ON group_members (group_id);

-- ── Triggers ────────────────────────────────────────────────────────────────

-- Keep groups.member_count in sync. SECURITY DEFINER so the count write is not
-- blocked by RLS on the groups table.
CREATE OR REPLACE FUNCTION sync_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_group_member_count ON group_members;
CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION sync_group_member_count();

-- Auto-add the creator of a group as its admin member.
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (group_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_group_creator_admin ON groups;
CREATE TRIGGER trg_group_creator_admin
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_admin();

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments      ENABLE ROW LEVEL SECURITY;

-- Membership check that bypasses RLS (avoids recursive policy evaluation).
CREATE OR REPLACE FUNCTION is_group_member(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members WHERE group_id = gid AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_group_manager(gid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = gid AND user_id = auth.uid() AND role IN ('admin','moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- groups: public readable by all, private only by members; managers update, admins delete
DROP POLICY IF EXISTS "Groups readable" ON groups;
CREATE POLICY "Groups readable" ON groups FOR SELECT
  USING (visibility = 'public' OR is_group_member(id));

DROP POLICY IF EXISTS "Authenticated create groups" ON groups;
CREATE POLICY "Authenticated create groups" ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Managers update groups" ON groups;
CREATE POLICY "Managers update groups" ON groups FOR UPDATE
  USING (is_group_manager(id));

DROP POLICY IF EXISTS "Admins delete groups" ON groups;
CREATE POLICY "Admins delete groups" ON groups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = groups.id AND user_id = auth.uid() AND role = 'admin'
  ));

-- group_members: visible if you can see the group; self join (public groups only) + self leave
DROP POLICY IF EXISTS "Members readable" ON group_members;
CREATE POLICY "Members readable" ON group_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM groups g
    WHERE g.id = group_id AND (g.visibility = 'public' OR is_group_member(g.id))
  ));

-- Self-join is allowed only for public groups. Private-group membership is
-- created by the creator-admin trigger (SECURITY DEFINER, bypasses this) today;
-- an invite flow is a later slice.
DROP POLICY IF EXISTS "Users join public groups" ON group_members;
CREATE POLICY "Users join public groups" ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM groups g WHERE g.id = group_id AND g.visibility = 'public')
  );

DROP POLICY IF EXISTS "Users leave groups" ON group_members;
CREATE POLICY "Users leave groups" ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- reactions: counts are public; own insert/delete
DROP POLICY IF EXISTS "Reactions readable" ON reactions;
CREATE POLICY "Reactions readable" ON reactions FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users add reactions" ON reactions;
CREATE POLICY "Users add reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users remove reactions" ON reactions;
CREATE POLICY "Users remove reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- comments: public read (targets are public check-ins/reviews in C1); own insert/delete
DROP POLICY IF EXISTS "Comments readable" ON comments;
CREATE POLICY "Comments readable" ON comments FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS "Users add comments" ON comments;
CREATE POLICY "Users add comments" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Users delete own comments" ON comments;
CREATE POLICY "Users delete own comments" ON comments FOR DELETE USING (auth.uid() = author_id);

-- ── Realtime ────────────────────────────────────────────────────────────────
-- Add the new interaction tables to the realtime publication (checkins, rsvps
-- were added previously). Ignore errors if a table is already a member.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE comments, reactions, group_members;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- ── Seed: default + neighbourhood + interest groups ─────────────────────────
-- Runs as postgres in the SQL editor, so RLS does not block these system rows
-- (created_by is NULL → no auto-admin, member_count starts at 0).
INSERT INTO groups (slug, name, description, cover_gradient, kind, neighbourhood, interest_tag, is_default)
VALUES
  ('nairobi-remote-workers', 'Nairobi Remote Workers',
   'The main room for every remote worker in Nairobi. Introductions, wins, and where everyone''s working from today.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 90%, black) 0%, var(--color-dark) 100%)',
   'interest', NULL, NULL, TRUE),

  ('westlands', 'Westlands Workers',
   'Cafés, coworking, and hotel lobbies around Westlands.',
   'linear-gradient(135deg, var(--color-primary) 0%, var(--color-dark) 100%)',
   'neighbourhood', 'Westlands', NULL, FALSE),
  ('kilimani', 'Kilimani Workers',
   'The Kilimani remote-work crowd.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-info) 80%, black) 0%, var(--color-dark) 100%)',
   'neighbourhood', 'Kilimani', NULL, FALSE),
  ('karen', 'Karen Workers',
   'Leafy, quiet, deep-work spots around Karen.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 85%, black) 0%, var(--color-dark) 100%)',
   'neighbourhood', 'Karen', NULL, FALSE),
  ('lavington', 'Lavington Workers',
   'Where Lavington gets things done.',
   'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-dark) 100%)',
   'neighbourhood', 'Lavington', NULL, FALSE),
  ('gigiri-runda', 'Gigiri / Runda Workers',
   'The Gigiri and Runda work scene.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-info) 70%, black) 0%, var(--color-dark) 100%)',
   'neighbourhood', 'Gigiri/Runda', NULL, FALSE),
  ('upperhill', 'Upperhill Workers',
   'Upperhill''s coworking and café regulars.',
   'linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-dark) 90%, black) 100%)',
   'neighbourhood', 'Upperhill', NULL, FALSE),
  ('cbd', 'CBD Workers',
   'Working from the heart of the city.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-dark) 70%, black) 0%, var(--color-dark) 100%)',
   'neighbourhood', 'CBD', NULL, FALSE),

  ('founders', 'Founders & Entrepreneurs',
   'For people building companies out of Nairobi''s cafés and coworking spaces.',
   'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
   'interest', NULL, 'Founder/Entrepreneur', FALSE),
  ('designers', 'Designers & Creatives',
   'Designers, writers, and makers who work remote.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-info) 85%, black) 0%, var(--color-primary) 100%)',
   'interest', NULL, 'Design', FALSE),
  ('digital-nomads', 'Digital Nomads in Nairobi',
   'Expats and travelling remote workers passing through or based in Nairobi.',
   'linear-gradient(135deg, color-mix(in srgb, var(--color-success) 80%, black) 0%, var(--color-info) 100%)',
   'interest', NULL, 'Digital Nomad', FALSE)
ON CONFLICT (slug) DO NOTHING;
