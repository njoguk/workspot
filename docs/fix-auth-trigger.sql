-- Fix: sign-up returns HTTP 500 {"msg":"Database error saving new user"}
--
-- Cause: the on_auth_user_created trigger runs handle_new_user() as a
-- SECURITY DEFINER function. As written in docs/SCHEMA.md it does an
-- unqualified `INSERT INTO profiles (...)`, which fails when the function's
-- search_path does not include the public schema — so the whole auth.users
-- insert rolls back and GoTrue returns a 500.
--
-- This recreates the function schema-qualified (public.profiles) with an
-- explicit search_path, and re-attaches the trigger. Idempotent — safe to run.
-- Paste into the Supabase SQL editor and Run.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, handle)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '_', 'g'))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
