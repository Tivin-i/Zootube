-- Migration: Households and multi-parent video sharing
-- Enables multiple parents to share one whitelist; videos and device_tokens keyed by household.

-- 1. Create households table
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My list',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create household_members junction table
CREATE TABLE IF NOT EXISTS public.household_members (
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (household_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_parent_id ON public.household_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);

-- 3. Backfill: one household per parent (use parent id as household id for 1:1 legacy mapping)
INSERT INTO public.households (id, name, created_at)
SELECT id, 'My list', created_at FROM public.parents
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.household_members (household_id, parent_id, role, joined_at)
SELECT id, id, 'owner', NOW() FROM public.parents
ON CONFLICT (household_id, parent_id) DO NOTHING;

-- 4. Add household columns to videos; keep parent_id briefly for backfill
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS added_by UUID REFERENCES public.parents(id) ON DELETE SET NULL;

UPDATE public.videos SET household_id = parent_id, added_by = parent_id WHERE household_id IS NULL;

ALTER TABLE public.videos ALTER COLUMN household_id SET NOT NULL;

-- Drop old unique constraint (name may vary by env)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'videos_parent_id_youtube_id_key' AND conrelid = 'public.videos'::regclass
  ) THEN
    ALTER TABLE public.videos DROP CONSTRAINT videos_parent_id_youtube_id_key;
  END IF;
END $$;

ALTER TABLE public.videos ADD CONSTRAINT videos_household_id_youtube_id_key UNIQUE (household_id, youtube_id);

ALTER TABLE public.videos DROP COLUMN IF EXISTS parent_id;

-- 5. Add household_id to device_tokens
ALTER TABLE public.device_tokens ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id) ON DELETE CASCADE;

UPDATE public.device_tokens SET household_id = parent_id WHERE household_id IS NULL;

ALTER TABLE public.device_tokens ALTER COLUMN household_id SET NOT NULL;

-- 6. RLS for households
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can read household"
  ON public.households FOR SELECT
  USING (
    id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create household"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Household owners can update household"
  ON public.households FOR UPDATE
  USING (
    id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid() AND role = 'owner')
  );

-- 7. RLS for household_members
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Household members can read members"
  ON public.household_members FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

CREATE POLICY "Household owners can insert members"
  ON public.household_members FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Household owners can delete members"
  ON public.household_members FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid() AND role = 'owner')
  );

-- 8. Videos: keep public read for child feed; restrict write to household members (enforced in app via service role / API)
-- Existing policy "Parents manage own videos" referred to parent_id which is dropped; add policy for household members
DROP POLICY IF EXISTS "Parents manage own videos" ON public.videos;

CREATE POLICY "Household members can manage videos"
  ON public.videos FOR ALL
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

COMMENT ON TABLE public.households IS 'Shared video list; multiple parents can be members.';
COMMENT ON TABLE public.household_members IS 'Parents who can manage a household and its videos.';
