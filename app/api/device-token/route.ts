import { NextRequest } from "next/server";
import { createDeviceToken, validateDeviceToken, clearDeviceToken } from "@/lib/services/device-token.service";
import { householdService } from "@/lib/services/household.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { householdIdSchema } from "@/lib/validators/household.validator";
import { parentIdSchema } from "@/lib/validators/parent.validator";
import { ValidationError } from "@/lib/errors/app-errors";

/**
 * POST /api/device-token
 * Create a device token for device linking (DB-backed when SUPABASE_SERVICE_ROLE_KEY is set).
 * Body: { householdId: string, parentId: string }
 * Caller must ensure parentId is a member of the household.
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, "auth");

    const body = await request.json();
    const { householdId, parentId } = body;

    if (!householdId) {
      throw new ValidationError("householdId is required");
    }
    if (!parentId) {
      throw new ValidationError("parentId is required");
    }

    const validatedHouseholdId = householdIdSchema.parse(householdId);
    const validatedParentId = parentIdSchema.parse(parentId);

    await householdService.ensureMember(validatedHouseholdId, validatedParentId);

    const token = await createDeviceToken(validatedHouseholdId, validatedParentId);

    return new Response(
      JSON.stringify({ success: true, token }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/device-token
 * Validate current device token and return household ID (and optional parent ID)
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, "public");

    const result = await validateDeviceToken();

    if (!result) {
      return new Response(
        JSON.stringify({ householdId: null, parentId: null }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        householdId: result.householdId,
        parentId: result.parentId,
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

/**
 * DELETE /api/device-token
 * Clear device token (logout)
 */
export async function DELETE(request: NextRequest) {
  try {
    await applyRateLimit(request, "public");

    await clearDeviceToken();

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
