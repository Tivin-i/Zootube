import { createClient, SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder";

/**
 * Server-only Supabase client with service role key.
 * Bypasses RLS – use only for server-side operations (e.g. device_tokens).
 * Never expose this client or the service role key to the browser.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not set or URL/key are placeholders (app falls back to legacy cookie-only flow in dev).
 */
export function getAdminClientOrNull(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || url === PLACEHOLDER_URL || serviceRoleKey === PLACEHOLDER_KEY) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
