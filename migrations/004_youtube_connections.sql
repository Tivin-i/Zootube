-- Migration: YouTube OAuth connections per household
-- One YouTube account (refresh token) per household; tokens encrypted at rest in app layer.

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

CREATE POLICY "Household members can read youtube_connections"
  ON public.youtube_connections FOR SELECT
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

CREATE POLICY "Household members can insert youtube_connections"
  ON public.youtube_connections FOR INSERT
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

CREATE POLICY "Household members can update youtube_connections"
  ON public.youtube_connections FOR UPDATE
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  )
  WITH CHECK (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

CREATE POLICY "Household members can delete youtube_connections"
  ON public.youtube_connections FOR DELETE
  USING (
    household_id IN (SELECT household_id FROM public.household_members WHERE parent_id = auth.uid())
  );

COMMENT ON TABLE public.youtube_connections IS 'Stores encrypted YouTube OAuth refresh tokens; one connection per household.';
