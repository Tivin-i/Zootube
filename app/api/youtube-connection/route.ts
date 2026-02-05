import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { householdIdSchema } from "@/lib/validators/household.validator";
import { ValidationError } from "@/lib/errors/app-errors";
import { youtubeConnectionService } from "@/lib/services/youtube-connection.service";

/**
 * GET /api/youtube-connection?household_id=xxx
 * Returns connection status for the household. Auth + membership required.
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

    const status = await youtubeConnectionService.getStatus(parsed.data, user.id);

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/youtube-connection?household_id=xxx
 * Unlinks YouTube connection for the household. Auth + membership required.
 */
export async function DELETE(request: NextRequest) {
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

    await youtubeConnectionService.unlink(parsed.data, user.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
