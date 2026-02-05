import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { youtubeConnectionService } from "@/lib/services/youtube-connection.service";

function adminRedirect(status: "connected" | "error"): Response {
  const base = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}/admin?youtube=${status}`;
  return Response.redirect(url);
}

/**
 * GET /api/auth/youtube/callback?code=xxx&state=xxx
 * Exchanges code for tokens, stores connection, redirects to admin.
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, "auth");

    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code || !state) {
      return adminRedirect("error");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return adminRedirect("error");
    }

    await youtubeConnectionService.linkConnectionFromState(state, code, user.id);
    return adminRedirect("connected");
  } catch {
    return adminRedirect("error");
  }
}
