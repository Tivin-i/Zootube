import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { ValidationError } from "@/lib/errors/app-errors";
import { childConnectionService } from "@/lib/services/child-connection.service";
import { z } from "zod";

const childIdParamSchema = z.object({ id: z.string().uuid("Invalid child ID") });

/**
 * DELETE /api/children/[id]
 * Removes a linked child from the household. Auth + membership (child must belong to user's household) required.
 */
export async function DELETE(
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
    const parsed = childIdParamSchema.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError("Valid child ID is required");
    }

    await childConnectionService.deleteChild(parsed.data.id, user.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
