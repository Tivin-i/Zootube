-- Single migration: full schema for Voobi (parents, households, videos, device tokens, YouTube, children).
-- Squashed from 001–004. Run once in Supabase SQL Editor. Idempotent: safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS where applicable).

-- =============================================================================
-- 1. Parents (synced with auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public email lookup for device linking" ON public.parents;
CREATE POLICY "Allow public email lookup for device linking"
  ON public.parents FOR SELECT
  USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.parents (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.parents (id, email, created_at)
SELECT id, email, created_at FROM auth.users
WHERE id NOT IN (SELECT id FROM public.parents)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_parents_email ON public.parents(email);
COMMENT ON TABLE public.parents IS 'Synced copy of auth.users for secure device linking. Allows public email lookups via RLS while maintaining security.';

-- =============================================================================
-- 2. Device tokens (parent_id only here; household_id added after households)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_token_hash ON public.device_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_device_tokens_expires_at ON public.device_tokens(expires_at);
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.device_tokens IS 'Stores hashed device tokens for linking kids devices to a parent. Server-only access via service role.';

-- =============================================================================
-- 3. Households and household_members
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My list',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.household_members (
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (household_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_parent_id ON public.household_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);

INSERT INTO public.households (id, name, created_at)
SELECT id, 'My list', created_at FROM public.parents
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.household_members (household_id, parent_id, role, joined_at)
SELECT id, id, 'owner', NOW() FROM public.parents
ON CONFLICT (household_id, parent_id) DO NOTHING;

-- =============================================================================
-- 4. Videos (create if missing, or migrate from parent_id to household_id)
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'videos') THEN
    CREATE TABLE public.videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
      added_by UUID REFERENCES public.parents(id) ON DELETE SET NULL,
      youtube_id TEXT NOT NULL,
      title TEXT,
      thumbnail_url TEXT,
      duration_seconds INTEGER,
      made_for_kids BOOLEAN,
      watch_count INTEGER NOT NULL DEFAULT 0,
      last_watched_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS videos_household_id_youtube_id_key ON public.videos(household_id, youtube_id);
    CREATE INDEX IF NOT EXISTS idx_videos_household_id ON public.videos(household_id);
  ELSE
    ALTER TABLE public.videos
      ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES public.parents(id) ON DELETE SET NULL;
    -- Backfill from parent_id only if that column still exists (e.g. first migration from old schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'videos' AND column_name = 'parent_id') THEN
      UPDATE public.videos SET household_id = parent_id, added_by = parent_id WHERE household_id IS NULL;
      ALTER TABLE public.videos DROP COLUMN IF EXISTS parent_id;
    END IF;
    ALTER TABLE public.videos ALTER COLUMN household_id SET NOT NULL;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'videos_parent_id_youtube_id_key' AND conrelid = 'public.videos'::regclass) THEN
      ALTER TABLE public.videos DROP CONSTRAINT videos_parent_id_youtube_id_key;
    END IF;
    ALTER TABLE public.videos ADD CONSTRAINT videos_household_id_youtube_id_key UNIQUE (household_id, youtube_id);
  END IF;
END $$;

-- =============================================================================
-- 5. Add household_id to device_tokens (backfill from parent_id)
-- =============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'device_tokens') THEN
    ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'device_tokens' AND column_name = 'parent_id') THEN
      UPDATE public.device_tokens SET household_id = parent_id WHERE household_id IS NULL;
    END IF;
    ALTER TABLE public.device_tokens ALTER COLUMN household_id SET NOT NULL;
  END IF;
END $$;

-- =============================================================================
-- 5b. RLS helpers: current user household IDs (avoids recursion on household_members)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.current_user_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.household_members WHERE parent_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.current_user_owner_household_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.household_members WHERE parent_id = auth.uid() AND role = 'owner';
$$;

-- Ensure parent and default household exist from auth.users (for device linking when trigger missed)
CREATE OR REPLACE FUNCTION public.ensure_parent_from_auth_email(lookup_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(lookup_email)) LIMIT 1;
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.parents (id, email, created_at)
  SELECT id, email, created_at FROM auth.users WHERE id = uid
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.households (id, name, created_at)
  VALUES (uid, 'My list', NOW())
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.household_members (household_id, parent_id, role, joined_at)
  VALUES (uid, uid, 'owner', NOW())
  ON CONFLICT (household_id, parent_id) DO NOTHING;
  RETURN uid;
END;
$$;
COMMENT ON FUNCTION public.ensure_parent_from_auth_email(text) IS 'Backfill parent and default household from auth.users for device linking; returns parent id or null.';

-- =============================================================================
-- 6. RLS: households
-- =============================================================================
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members can read household" ON public.households;
CREATE POLICY "Household members can read household"
  ON public.households FOR SELECT
  USING (id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Authenticated users can create household" ON public.households;
CREATE POLICY "Authenticated users can create household"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Household owners can update household" ON public.households;
CREATE POLICY "Household owners can update household"
  ON public.households FOR UPDATE
  USING (id IN (SELECT public.current_user_owner_household_ids()));

-- =============================================================================
-- 7. RLS: household_members
-- =============================================================================
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members can read members" ON public.household_members;
CREATE POLICY "Household members can read members"
  ON public.household_members FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household owners can insert members" ON public.household_members;
CREATE POLICY "Household owners can insert members"
  ON public.household_members FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_owner_household_ids()));

DROP POLICY IF EXISTS "Household owners can delete members" ON public.household_members;
CREATE POLICY "Household owners can delete members"
  ON public.household_members FOR DELETE
  USING (household_id IN (SELECT public.current_user_owner_household_ids()));

-- =============================================================================
-- 8. RLS: videos
-- =============================================================================
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents manage own videos" ON public.videos;
DROP POLICY IF EXISTS "Household members can manage videos" ON public.videos;
CREATE POLICY "Household members can manage videos"
  ON public.videos FOR ALL
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

COMMENT ON TABLE public.households IS 'Shared video list; multiple parents can be members.';
COMMENT ON TABLE public.household_members IS 'Parents who can manage a household and its videos.';

-- =============================================================================
-- 9. YouTube connections (one per household)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.youtube_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  encrypted_refresh_token TEXT NOT NULL,
  youtube_channel_id TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  CONSTRAINT youtube_connections_household_id_key UNIQUE (household_id)
);

CREATE INDEX IF NOT EXISTS idx_youtube_connections_household_id ON public.youtube_connections(household_id);
ALTER TABLE public.youtube_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members can read youtube_connections" ON public.youtube_connections;
CREATE POLICY "Household members can read youtube_connections"
  ON public.youtube_connections FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household members can insert youtube_connections" ON public.youtube_connections;
CREATE POLICY "Household members can insert youtube_connections"
  ON public.youtube_connections FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household members can update youtube_connections" ON public.youtube_connections;
CREATE POLICY "Household members can update youtube_connections"
  ON public.youtube_connections FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household members can delete youtube_connections" ON public.youtube_connections;
CREATE POLICY "Household members can delete youtube_connections"
  ON public.youtube_connections FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

COMMENT ON TABLE public.youtube_connections IS 'Stores encrypted YouTube OAuth refresh tokens; one connection per household.';

-- =============================================================================
-- 10. Household children (linked Google accounts per household)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.household_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  google_sub TEXT NOT NULL,
  email TEXT,
  display_name TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  linked_by UUID REFERENCES public.parents(id) ON DELETE SET NULL,
  CONSTRAINT household_children_household_google_sub_key UNIQUE (household_id, google_sub)
);

CREATE INDEX IF NOT EXISTS idx_household_children_household_id ON public.household_children(household_id);
ALTER TABLE public.household_children ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Household members can read household_children" ON public.household_children;
CREATE POLICY "Household members can read household_children"
  ON public.household_children FOR SELECT
  USING (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household members can insert household_children" ON public.household_children;
CREATE POLICY "Household members can insert household_children"
  ON public.household_children FOR INSERT
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household members can update household_children" ON public.household_children;
CREATE POLICY "Household members can update household_children"
  ON public.household_children FOR UPDATE
  USING (household_id IN (SELECT public.current_user_household_ids()))
  WITH CHECK (household_id IN (SELECT public.current_user_household_ids()));

DROP POLICY IF EXISTS "Household members can delete household_children" ON public.household_children;
CREATE POLICY "Household members can delete household_children"
  ON public.household_children FOR DELETE
  USING (household_id IN (SELECT public.current_user_household_ids()));

COMMENT ON TABLE public.household_children IS 'Child Google accounts linked to a household via OAuth (identity only).';

-- =============================================================================
-- Grants for API roles (RLS still enforces row-level access)
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.parents TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.youtube_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_children TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;

GRANT EXECUTE ON FUNCTION public.current_user_household_ids() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_user_owner_household_ids() TO authenticated, anon;

-- Service role (SUPABASE_SERVICE_ROLE_KEY): used server-side to create households,
-- add household_members, and manage device_tokens; bypasses RLS but needs table grants.
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.households TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.household_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_household_ids() TO service_role;
GRANT EXECUTE ON FUNCTION public.current_user_owner_household_ids() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_parent_from_auth_email(text) TO service_role;
-- Admin fallback (parent lookup/backfill without RPC)
GRANT SELECT, INSERT, UPDATE ON public.parents TO service_role;
