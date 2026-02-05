import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env or .env.local (see .env.example). Restart the dev server after changing env files."
    );
  }
  if (supabaseUrl === "https://placeholder.supabase.co" || supabaseAnonKey === "placeholder") {
    throw new Error(
      "Supabase is using placeholder values. Replace them with your real project URL and anon key from the Supabase dashboard. " +
      "If running locally: edit .env. If running in Docker: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env, then rebuild the image (docker compose build --no-cache)."
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
