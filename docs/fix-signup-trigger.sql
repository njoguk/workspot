-- ============================================================================
-- RemoSpot — DEFINITIVE fix for "sign-up returns HTTP 500 / {} error"
--
-- Symptom: supabase.auth.signUp() resolves with
--   { error: { name: 'AuthRetryableFetchError', status: 500, message: '{}' } }
-- and no user/session is created. The UI shows a "{}" error banner.
--
-- Root cause: the on_auth_user_created trigger runs handle_new_user() as a
-- SECURITY DEFINER function. docs/account-type-migration.sql recreated it with
-- an UNQUALIFIED `INSERT INTO profiles (...)` and no explicit search_path,
-- silently reverting the earlier docs/fix-auth-trigger.sql fix. When GoTrue
-- runs the trigger the function's search_path does not include `public`, so
-- `profiles` fails to resolve, the trigger raises, the auth.users INSERT rolls
-- back, and GoTrue returns a 500 (empty body -> "{}" on the client).
--
-- A second, independent failure: profiles.handle is UNIQUE. Two signups whose
-- email local-part is identical (info@a.com / info@b.com) collide and 500 the
-- same way. This version de-duplicates the handle.
--
-- This migration is idempotent — safe to run any number of times.
-- Paste into the Supabase SQL editor and Run.
-- ============================================================================

-- Ensure the account_type column exists (no-op if account-type-migration ran).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'member'
  CHECK (account_type IN ('member', 'partner'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_handle TEXT;
  final_handle TEXT;
  suffix INT := 0;
BEGIN
  base_handle := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-z0-9]', '_', 'g'));
  IF base_handle = '' OR base_handle IS NULL THEN
    base_handle := 'user';
  END IF;

  -- Ensure handle uniqueness: fall back to base_1, base_2, ... on collision.
  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle) LOOP
    suffix := suffix + 1;
    final_handle := base_handle || '_' || suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, display_name, handle, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'member')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
