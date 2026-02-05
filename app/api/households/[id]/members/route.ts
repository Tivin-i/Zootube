import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { householdService } from "@/lib/services/household.service";
import { householdIdSchema } from "@/lib/validators/household.validator";
import { inviteMemberSchema } from "@/lib/validators/household.validator";

/**
 * POST /api/households/[id]/members - Invite a guardian by email (auth required, must be owner)
 * Body: { email: string }
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, "auth");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const params = await context.params;
    const householdId = householdIdSchema.parse(params.id);

    const body = await request.json();
    const { email } = inviteMemberSchema.parse(body);

    await householdService.inviteMember(householdId, user.id, email);

    return new Response(
      JSON.stringify({ success: true, message: "Guardian invited" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
