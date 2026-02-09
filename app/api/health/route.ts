import { NextResponse } from "next/server";

/**
 * Health check endpoint for Docker and monitoring.
 * Returns 200 OK and supabase_configured so you can verify env (e.g. in Docker).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase_configured =
    !!url &&
    !!key &&
    url !== "https://placeholder.supabase.co" &&
    key !== "placeholder";

  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      supabase_configured,
    },
    { status: 200 }
  );
}
