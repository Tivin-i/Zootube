-- Migration: Device tokens table for secure device linking
-- Validates token server-side instead of trusting only cookies.
-- Access: use SUPABASE_SERVICE_ROLE_KEY in the app (bypasses RLS).

-- Create device_tokens table
CREATE TABLE IF NOT EXISTS public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Unique constraint for token lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_device_tokens_token_hash ON public.device_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_device_tokens_expires_at ON public.device_tokens(expires_at);

-- RLS: enable but no policies for anon. Service role bypasses RLS for server-side validation.
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- No policies = anon/key cannot read/write. Only service_role can.
COMMENT ON TABLE public.device_tokens IS 'Stores hashed device tokens for linking kids devices to a parent. Server-only access via service role.';
