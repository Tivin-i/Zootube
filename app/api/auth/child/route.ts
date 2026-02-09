import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { householdService } from "@/lib/services/household.service";
import { createChildAuthUrl, createSignedChildState } from "@/lib/services/child-oauth.service";
import { householdIdSchema } from "@/lib/validators/household.validator";
import { ValidationError } from "@/lib/errors/app-errors";
import crypto from "crypto";

/**
 * GET /api/auth/child?household_id=xxx
 * Redirects to Google OAuth (openid, email, profile). Caller must be authenticated and a member of the household.
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, "auth");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const householdId = request.nextUrl.searchParams.get("household_id");
    const parsed = householdIdSchema.safeParse(householdId);
    if (!parsed.success) {
      throw new ValidationError("Valid household_id is required");
    }

    await householdService.ensureMember(parsed.data, user.id);

    const state = createSignedChildState({
      householdId: parsed.data,
      parentId: user.id,
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    const authUrl = createChildAuthUrl(state);

    return Response.redirect(authUrl);
  } catch (error) {
    return handleApiError(error);
  }
}
