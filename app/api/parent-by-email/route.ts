import { NextRequest } from "next/server";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { parentService } from "@/lib/services/parent.service";
import { householdService } from "@/lib/services/household.service";
import { parentByEmailQuerySchema } from "@/lib/validators/parent.validator";
import { NotFoundError } from "@/lib/errors/app-errors";

/**
 * GET /api/parent-by-email?email=...
 * Look up parent by email and return parentId plus list of households (for device linking).
 * Returns minimal data (parentId and households) for link-device flow.
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, "public");

    const searchParams = request.nextUrl.searchParams;
    const query = parentByEmailQuerySchema.parse({
      email: searchParams.get("email"),
    });

    let parentId: string;
    try {
      parentId = await parentService.findParentByEmail(query.email);
    } catch (err) {
      if (err instanceof NotFoundError) {
        // Try with admin client (bypasses RLS in case anon can't read parents)
        const adminId = await parentService.findParentByEmailWithAdmin(query.email);
        if (adminId) {
          parentId = adminId;
        } else {
          // Backfill from auth.users if parent exists there but not in public.parents
          const backfilledId = await parentService.ensureParentFromAuthByEmail(query.email);
          if (backfilledId) {
            parentId = backfilledId;
          } else {
            return new Response(
              JSON.stringify({ error: "Parent account not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      } else {
        throw err;
      }
    }

    let households = await householdService.getHouseholdsForParent(parentId);
    if (households.length === 0) {
      // Ensure default household exists (e.g. parent was created before household backfill)
      await parentService.ensureParentFromAuthByEmail(query.email);
      households = await householdService.getHouseholdsForParent(parentId);
    }
    if (households.length === 0) {
      return new Response(
        JSON.stringify({ error: "No household found for this account" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        parentId,
        households: households.map((h) => ({ id: h.id, name: h.name })),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
