import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { youtubeConnectionService } from "@/lib/services/youtube-connection.service";
import { getAppUrl } from "@/lib/utils/app-url";
import { verifyAndDecodeState } from "@/lib/services/youtube-oauth.service";

function adminRedirect(status: "connected" | "error", origin?: string): Response {
  const base = origin ?? getAppUrl();
  const url = `${base.replace(/\/$/, "")}/admin?youtube=${status}`;
  return Response.redirect(url);
}

/**
 * GET /api/auth/youtube/callback?code=xxx&state=xxx
 * Exchanges code for tokens, stores connection, redirects to admin.
 */
export async function GET(request: NextRequest) {
  let redirectOrigin: string | undefined;
  try {
    await applyRateLimit(request, "auth");

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return adminRedirect("error");
    }

    try {
      const payload = verifyAndDecodeState(state);
      redirectOrigin = payload.redirectOrigin;
    } catch {
      // state invalid or expired; still try to redirect to admin with request origin
      redirectOrigin = new URL(request.url).origin;
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return adminRedirect("error", redirectOrigin);
    }

    await youtubeConnectionService.linkConnectionFromState(state, code, user.id);
    return adminRedirect("connected", redirectOrigin);
  } catch (err) {
    console.error("[youtube/callback] OAuth error:", err instanceof Error ? err.message : "unknown");
    const fallbackOrigin = redirectOrigin ?? new URL(request.url).origin;
    return adminRedirect("error", fallbackOrigin);
  }
}
