import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { householdIdSchema } from "@/lib/validators/household.validator";
import { ValidationError } from "@/lib/errors/app-errors";
import { childConnectionService } from "@/lib/services/child-connection.service";

/**
 * GET /api/children?household_id=xxx
 * Returns list of linked children for the household. Auth + membership required.
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

    const children = await childConnectionService.list(parsed.data, user.id);

    return new Response(
      JSON.stringify({
        children: children.map((c) => ({
          id: c.id,
          display_name: c.display_name,
          email: c.email,
          linked_at: c.linked_at,
        })),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
