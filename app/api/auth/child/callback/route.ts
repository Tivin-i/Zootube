import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { childConnectionService } from "@/lib/services/child-connection.service";
import { getAppUrl } from "@/lib/utils/app-url";

function adminRedirect(status: "connected" | "error"): Response {
  const url = `${getAppUrl()}/admin?child=${status}`;
  return Response.redirect(url);
}

/**
 * GET /api/auth/child/callback?code=xxx&state=xxx
 * Exchanges code for userinfo, upserts household_children, redirects to admin.
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

    await childConnectionService.linkFromState(state, code, user.id);
    return adminRedirect("connected");
  } catch (err) {
    console.error("[child/callback] OAuth error:", err instanceof Error ? err.message : "unknown");
    return adminRedirect("error");
  }
}
