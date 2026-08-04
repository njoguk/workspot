# WorkSpot Nairobi — Database Schema

Complete Supabase schema. Read this before any database work.
Run migrations in the Supabase SQL Editor, in the order listed.

---

## Authentication

Use Supabase Auth with:
- Email + password
- Google OAuth (enable in Supabase Dashboard → Authentication → Providers)
- On signup: a database trigger auto-creates a `profiles` row

---

## Tables

### profiles
Extends auth.users. Created automatically on signup via trigger.

```sql
CREATE TABLE profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            TEXT,
  handle                  TEXT UNIQUE,
  avatar_url              TEXT,
  role                    TEXT CHECK (role IN ('freelancer','remote_employee','founder','nomad')),
  interests               TEXT[] DEFAULT '{}',
  neighbourhoods          TEXT[] DEFAULT '{}',
  workscore_contributions INTEGER DEFAULT 0,
  check_in_streak         INTEGER DEFAULT 0,
  longest_streak          INTEGER DEFAULT 0,
  last_checkin_date       DATE,
  is_workpass             BOOLEAN DEFAULT FALSE,
  workpass_expires_at     TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, handle)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '_', 'g'))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### spots
Core listing table. Supports both WorkSpot and future CreativeSpot via
space_family + type_attributes JSONB.

```sql
CREATE TABLE spots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  neighbourhood       TEXT,
  type                TEXT CHECK (type IN ('cafe','cowork','hotel','garden','photography','recording','podcast','maker','gallery')),
  space_family        TEXT DEFAULT 'remote_work' CHECK (space_family IN ('remote_work','creative')),
  score_label         TEXT DEFAULT 'WorkScore',
  address             TEXT,
  maps_url            TEXT,
  cover_gradient      TEXT,
  cover_image_url     TEXT,
  description         TEXT,
  type_attributes     JSONB DEFAULT '{}',
  vibe_tags           TEXT[] DEFAULT '{}',
  best_times          TEXT[] DEFAULT '{}',
  work_score          NUMERIC(3,1) DEFAULT 0,
  review_count        INTEGER DEFAULT 0,
  is_premium_listing  BOOLEAN DEFAULT FALSE,
  is_featured_listing BOOLEAN DEFAULT FALSE,
  price_entry         TEXT,
  price_type          TEXT CHECK (price_type IN ('free','paid')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### checkins
Tracks who is at which spot and when.

```sql
CREATE TABLE checkins (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spot_id             UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  checked_in_at       TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at      TIMESTAMPTZ,
  wifi_speed_tested   INTEGER,
  noise_reported      INTEGER CHECK (noise_reported IN (1,2,3)),
  session_note        TEXT
);
```

### review_schemas
Config table that defines review categories per space type.
This is what makes the review flow config-driven rather than hardcoded.
Seed data is provided below.

```sql
CREATE TABLE review_schemas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_type            TEXT UNIQUE NOT NULL,
  score_label           TEXT DEFAULT 'WorkScore',
  primary_metric_key    TEXT,
  primary_metric_label  TEXT,
  primary_metric_unit   TEXT,
  primary_metric_avg_label TEXT,
  categories            JSONB NOT NULL,
  quick_tags            JSONB NOT NULL
);
```

### reviews
One review per user per spot. Stores structured ratings + free text.

```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spot_id         UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  space_type      TEXT NOT NULL,
  ratings         JSONB NOT NULL DEFAULT '{}',
  overall_score   NUMERIC(3,1),
  primary_metric_value INTEGER,
  comment         TEXT,
  quick_tags      TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, spot_id)
);
```

### events
Workcation events and any other WorkSpot-organised events.

```sql
CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  spot_id         UUID REFERENCES spots(id) ON DELETE SET NULL,
  event_date      DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME,
  max_attendees   INTEGER,
  is_free         BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### rsvps
Users RSVPing to events. One row per user per event.

```sql
CREATE TABLE rsvps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id    UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);
```

### bookings
WorkPass slot bookings. Tracks payment status and M-Pesa reference.

```sql
CREATE TABLE bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  spot_id             UUID NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  slot_date           DATE NOT NULL,
  slot_start          TIME NOT NULL,
  slot_end            TIME NOT NULL,
  price_paid          INTEGER NOT NULL,
  standard_price      INTEGER,
  workpass_discount   INTEGER DEFAULT 0,
  payment_method      TEXT CHECK (payment_method IN ('paystack','workpass_credit')),
  paystack_reference  TEXT,      -- Paystack transaction reference
  paystack_access_code TEXT,     -- Paystack access code for popup
  status              TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','payment_failed','cancelled','completed')),
  booking_code        TEXT UNIQUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate booking code
CREATE OR REPLACE FUNCTION generate_booking_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_code := 'WS-NBO-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_code
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_code();
```

### venue_settings
Stores booking configuration set by venue owners in the Partner Portal.

```sql
CREATE TABLE venue_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id               UUID UNIQUE NOT NULL REFERENCES spots(id) ON DELETE CASCADE,
  owner_user_id         UUID REFERENCES profiles(id),
  workpass_discount_pct INTEGER DEFAULT 30,
  max_seats_per_slot    INTEGER DEFAULT 30,
  slot_duration_hours   INTEGER DEFAULT 4,
  advance_booking_days  INTEGER DEFAULT 7,
  available_slots       JSONB DEFAULT '["8am-12pm","12pm-3pm","2pm-5pm"]',
  payout_mpesa_number   TEXT,
  total_earned_kes      INTEGER DEFAULT 0,
  pending_payout_kes    INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Row Level Security Policies

Enable RLS on all tables, then apply these policies:

```sql
-- Enable RLS
ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE spots           ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schemas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews         ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_settings  ENABLE ROW LEVEL SECURITY;

-- profiles: public read, own write
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users update own profile"     ON profiles FOR UPDATE USING (auth.uid() = id);

-- spots: public read, authenticated insert (admin only via service role in practice)
CREATE POLICY "Spots are public"    ON spots FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated insert spots" ON spots FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Owners update spots" ON spots FOR UPDATE USING (
  EXISTS (SELECT 1 FROM venue_settings WHERE spot_id = spots.id AND owner_user_id = auth.uid())
);

-- checkins: public read (for live counts), own insert/update
CREATE POLICY "Checkins public read"   ON checkins FOR SELECT USING (TRUE);
CREATE POLICY "Users insert checkins"  ON checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update checkins"  ON checkins FOR UPDATE USING (auth.uid() = user_id);

-- review_schemas: public read only
CREATE POLICY "Review schemas public" ON review_schemas FOR SELECT USING (TRUE);

-- reviews: public read, own insert
CREATE POLICY "Reviews public read"  ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Users insert reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- events: public read, authenticated insert
CREATE POLICY "Events public read"   ON events FOR SELECT USING (TRUE);
CREATE POLICY "Auth insert events"   ON events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- rsvps: public read, own insert/delete
CREATE POLICY "RSVPs public read"    ON rsvps FOR SELECT USING (TRUE);
CREATE POLICY "Users insert rsvps"   ON rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete rsvps"   ON rsvps FOR DELETE USING (auth.uid() = user_id);

-- bookings: own read/insert only
CREATE POLICY "Users see own bookings"   ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert bookings"    ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update bookings"    ON bookings FOR UPDATE USING (auth.uid() = user_id);

-- venue_settings: owner read/write
CREATE POLICY "Owners see own settings" ON venue_settings FOR SELECT USING (auth.uid() = owner_user_id);
CREATE POLICY "Owners update settings"  ON venue_settings FOR ALL USING (auth.uid() = owner_user_id);
```

---

## Seed Data: review_schemas

Run this after creating the review_schemas table.
This defines what appears in the review flow for each spot type.

```sql
INSERT INTO review_schemas (space_type, score_label, primary_metric_key, primary_metric_label, primary_metric_unit, primary_metric_avg_label, categories, quick_tags)
VALUES
(
  'cafe', 'WorkScore', 'wifi_speed_tested', 'WiFi Speed Test', 'Mbps',
  'Average speed at this café',
  '[
    {"key":"wifi_rating","label":"WiFi & Connectivity","icon":"📡","weight":0.35},
    {"key":"noise_rating","label":"Noise Level","icon":"🔇","weight":0.25},
    {"key":"power_rating","label":"Power Sockets","icon":"🔌","weight":0.20},
    {"key":"value_rating","label":"Value for Money","icon":"💳","weight":0.20}
  ]',
  '{
    "conditions":["🤫 Quiet today","☀️ Good light","🌧 AC was cold","🔌 Sockets free","🐕 Dogs present","📵 Patchy WiFi"],
    "vibe":["👩‍💻 Productive crowd","☕ Great coffee today","🎵 Good music","😊 Friendly staff","🧘 Calm energy"]
  }'
),
(
  'cowork', 'WorkScore', 'wifi_speed_tested', 'WiFi Speed Test', 'Mbps',
  'Average speed at this coworking space',
  '[
    {"key":"wifi_rating","label":"WiFi & Connectivity","icon":"📡","weight":0.35},
    {"key":"noise_rating","label":"Noise Level","icon":"🔇","weight":0.25},
    {"key":"power_rating","label":"Power Sockets","icon":"🔌","weight":0.20},
    {"key":"value_rating","label":"Value for Money","icon":"💳","weight":0.20}
  ]',
  '{
    "conditions":["🤫 Quiet zones available","📞 Call booths free","🔌 All sockets working","🌡 Good AC","☕ Good coffee"],
    "vibe":["💻 Serious work crowd","🤝 Networking happened","🎉 Good events","👶 Good for beginners","🏆 Professional"]
  }'
),
(
  'hotel', 'WorkScore', 'wifi_speed_tested', 'WiFi Speed Test', 'Mbps',
  'Average speed at this hotel',
  '[
    {"key":"wifi_rating","label":"WiFi & Connectivity","icon":"📡","weight":0.35},
    {"key":"noise_rating","label":"Noise Level","icon":"🔇","weight":0.25},
    {"key":"power_rating","label":"Power Sockets","icon":"🔌","weight":0.20},
    {"key":"value_rating","label":"Value for Money","icon":"💳","weight":0.20}
  ]',
  '{
    "conditions":["🤫 Lobby quiet","🎩 Professional atmosphere","🔌 Good power access","🛎 Attentive staff"],
    "vibe":["💼 Business crowd","🌍 International guests","☕ Excellent coffee","🏨 Great for client meetings"]
  }'
),
(
  'garden', 'WorkScore', 'wifi_speed_tested', 'WiFi Speed Test', 'Mbps',
  'Average speed at this outdoor spot',
  '[
    {"key":"wifi_rating","label":"WiFi & Connectivity","icon":"📡","weight":0.35},
    {"key":"noise_rating","label":"Noise Level","icon":"🔇","weight":0.25},
    {"key":"power_rating","label":"Power Sockets","icon":"🔌","weight":0.20},
    {"key":"value_rating","label":"Value for Money","icon":"💳","weight":0.20}
  ]',
  '{
    "conditions":["🌤 Good shade","🌿 Beautiful setting","🔌 Extension leads available","🌦 Good weather today","🌬 Breezy"],
    "vibe":["🎨 Creative crowd","🐕 Dog friendly","👨‍👩‍👧 Families here","🧘 Relaxed energy","🌍 Mix of locals and expats"]
  }'
);
```

---

## Work Score Calculation

Recalculate after every new review:

```sql
-- Run this after inserting a review
CREATE OR REPLACE FUNCTION update_spot_work_score(spot_uuid UUID)
RETURNS VOID AS $$
DECLARE
  new_score NUMERIC(3,1);
  new_count INTEGER;
BEGIN
  SELECT
    ROUND(AVG(overall_score)::NUMERIC, 1),
    COUNT(*)
  INTO new_score, new_count
  FROM reviews
  WHERE spot_id = spot_uuid;

  UPDATE spots
  SET work_score = COALESCE(new_score, 0),
      review_count = new_count
  WHERE id = spot_uuid;
END;
$$ LANGUAGE plpgsql;
```

The `overall_score` in reviews is calculated client-side before insert:
```typescript
const schema = // loaded from review_schemas
const overall = schema.categories.reduce((sum, cat) => {
  return sum + (ratings[cat.key] || 0) * cat.weight;
}, 0) * 2; // scale 1-5 ratings to 0-10
```

---

## Enable Realtime

Enable realtime for live occupancy counts:

```sql
-- In Supabase Dashboard → Database → Replication → Add table
-- Or via SQL:
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE checkins, rsvps;
COMMIT;
```

---

## Community v2 (Phase C1)

Turns the community section from a read-only aggregation into a real, interactive,
multi-group social layer. Runnable migration: **`docs/community-migration.sql`**
(run it in the Supabase SQL editor — DDL needs the postgres role).

```sql
-- Groups (aka "communities"). Seeded neighbourhood/interest groups + user-created.
CREATE TABLE groups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT,
  cover_gradient TEXT,                       -- CSS gradient string (may use var() tokens)
  kind           TEXT DEFAULT 'custom' CHECK (kind IN ('neighbourhood','interest','custom')),
  neighbourhood  TEXT,                       -- set when kind = 'neighbourhood'
  interest_tag   TEXT,                       -- set when kind = 'interest'
  visibility     TEXT DEFAULT 'public' CHECK (visibility IN ('public','private')),
  created_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL = system group
  member_count   INTEGER DEFAULT 0,          -- kept in sync by trigger
  is_default     BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      TEXT DEFAULT 'member' CHECK (role IN ('member','moderator','admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

-- Real reactions (replaces the localStorage 👍 store in src/lib/reactions.ts).
-- Polymorphic: target_id is the underlying row UUID as text, disambiguated by target_type.
CREATE TABLE reactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('checkin','review','post','comment')),
  target_id   TEXT NOT NULL,
  kind        TEXT DEFAULT 'like' CHECK (kind IN ('like','helpful')),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id, kind)
);

-- Comment threads on activity items (and posts, from Phase C2).
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('checkin','review','post')),
  target_id   TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

**Triggers:** `sync_group_member_count` (maintains `groups.member_count` on join/leave)
and `add_group_creator_as_admin` (creator becomes an `admin` member). Both `SECURITY DEFINER`.

**RLS (see the migration file for exact policies):** public groups are world-readable,
private groups only by members (via the `is_group_member(gid)` SECURITY DEFINER helper);
any authenticated user can create a group (`created_by = auth.uid()`); self-join is allowed
for **public** groups only (private membership is creator/invite-managed — invites are a later
slice); managers (`admin`/`moderator`) update, admins delete. `reactions` and `comments` are
world-readable with own-row insert/delete (their C1 targets — check-ins/reviews — are public).

**Realtime:** `comments`, `reactions`, `group_members` are added to the `supabase_realtime`
publication (extends the earlier `checkins, rsvps`).

Phase C2 adds `posts`, `follows`, `notifications`, `reports`; Phase C3 (deferred) adds
`conversations`/`messages` for real-time chat.

---

## Environment Variables

These go in Vercel (and locally in `.env.local`):

```
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[your-anon-key]
VITE_PAYSTACK_PUBLIC_KEY=pk_test_[your-paystack-public-key]
```

These go ONLY in Supabase Edge Function secrets (never in frontend code):
```
PAYSTACK_SECRET_KEY=sk_test_[your-paystack-secret-key]
```

Paystack test keys: available immediately after creating a Paystack account.
Switch to live keys (pk_live_... / sk_live_...) after Paystack approves your business account.
