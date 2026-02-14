import { NextRequest } from "next/server";
import { validateDeviceToken } from "@/lib/services/device-token.service";
import { getAdminClientOrNull } from "@/lib/supabase/admin";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";

/**
 * GET /api/children/by-device
 * Returns linked children for the household identified by the current device token (cookie).
 * Used on the kid-facing feed so the device can show a child picker or redirect to add children.
 * No parent auth required; authorization is by valid device token.
 */
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, "public");

    const result = await validateDeviceToken();
    if (!result?.householdId) {
      return new Response(
        JSON.stringify({ children: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const admin = getAdminClientOrNull();
    if (!admin) {
      return new Response(
        JSON.stringify({ children: [] }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: rows, error } = await admin
      .from("household_children")
      .select("id, display_name, email, linked_at")
      .eq("household_id", result.householdId)
      .order("linked_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch children: ${error.message}`);
    }

    const children = (rows ?? []).map((c) => ({
      id: c.id,
      display_name: c.display_name ?? null,
      email: c.email ?? null,
      linked_at: c.linked_at,
    }));

    return new Response(
      JSON.stringify({ children }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
