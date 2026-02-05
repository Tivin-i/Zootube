import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { householdService } from "@/lib/services/household.service";
import { createHouseholdSchema } from "@/lib/validators/household.validator";

/**
 * GET /api/households - List households for the current user (auth required)
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

    const households = await householdService.getHouseholdsForParent(user.id);

    return new Response(
      JSON.stringify({ households }),
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
 * POST /api/households - Create a new household (auth required)
 * Body: { name: string }
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, "auth");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const body = await request.json();
    const validated = createHouseholdSchema.parse(body);

    const household = await householdService.createHousehold(user.id, validated.name);

    return new Response(
      JSON.stringify({ household }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
