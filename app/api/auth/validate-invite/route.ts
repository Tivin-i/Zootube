import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";

const validateInviteBodySchema = z.object({
  code: z.string(),
});

/**
 * POST /api/auth/validate-invite - Validate beta invite code (no auth required)
 * Body: { code: string }
 * When BETA_INVITE_CODE (or comma-separated BETA_INVITE_CODES) is not set, returns valid: true (open signup).
 * When set, returns valid: true only if the submitted code matches (trimmed, case-sensitive).
 */
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, "auth");

    const body = await request.json();
    const { code } = validateInviteBodySchema.parse(body);

    const raw = process.env.BETA_INVITE_CODE;
    const envCode = typeof raw === "string" ? raw.trim() : "";
    const envCodes = process.env.BETA_INVITE_CODES?.split(",").map((c) => c.trim()).filter(Boolean) ?? [];

    const allowedCodes = envCode ? [envCode, ...envCodes] : envCodes;

    if (allowedCodes.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[validate-invite] BETA_INVITE_CODE is empty or unset – signup is open. Restart the dev server after setting BETA_INVITE_CODE in .env or .env.local."
        );
      }
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    const trimmed = code.trim();
    const valid = allowedCodes.includes(trimmed);

    if (valid) {
      return NextResponse.json({ valid: true }, { status: 200 });
    }

    return NextResponse.json(
      { valid: false, error: "Invalid invite code" },
      { status: 403 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
