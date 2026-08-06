-- ============================================================================
-- RemoSpot — Member vs Partner account type (feedback round, Phase 4)
--
-- Run in the Supabase SQL editor. Adds profiles.account_type and teaches the
-- signup trigger to read it from the signup metadata. Ownership of a venue is
-- still data-driven (venue_settings.owner_user_id); account_type only tailors
-- the signup routing / nav.
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'member'
  CHECK (account_type IN ('member', 'partner'));

-- Recreate the signup trigger function to also seed account_type from metadata.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, handle, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '_', 'g')),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
