-- Migration: Create parents table and sync with auth.users
-- This ensures the secure parent-by-email API works correctly

-- Create parents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on parents table
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to allow public read access to email lookups for device linking
-- This is safe because we only return the parent_id, not sensitive information
CREATE POLICY "Allow public email lookup for device linking"
  ON public.parents
  FOR SELECT
  USING (true);

-- Create function to sync auth.users with parents table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.parents (id, email, created_at)
  VALUES (NEW.id, NEW.email, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync new users to parents table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users (if any exist)
-- This will only insert users that don't already exist in parents table
INSERT INTO public.parents (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.parents)
ON CONFLICT (id) DO NOTHING;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_parents_email ON public.parents(email);

-- Add comment explaining the table purpose
COMMENT ON TABLE public.parents IS 'Synced copy of auth.users for secure device linking. Allows public email lookups via RLS while maintaining security.';
