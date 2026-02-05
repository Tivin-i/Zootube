import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getAdminClientOrNull } from "@/lib/supabase/admin";
import { householdService } from "@/lib/services/household.service";
import { parentIdSchema } from "@/lib/validators/parent.validator";
import { householdIdSchema } from "@/lib/validators/household.validator";
import { NotFoundError } from "@/lib/errors/app-errors";
import {
  DEVICE_TOKEN_COOKIE_NAME,
  PARENT_ID_COOKIE_NAME,
  DEVICE_TOKEN_EXPIRY_DAYS,
  TOKEN_LENGTH,
} from "@/lib/utils/constants";
import crypto from "crypto";

function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export interface ValidateDeviceTokenResult {
  householdId: string;
  parentId: string | null;
}

/**
 * Create a device token for a household: store in DB (if service role is set) and set secure cookie.
 * Caller must ensure parentId is a member of the household. parentId is required for DB insert.
 */
export async function createDeviceToken(householdId: string, parentId: string): Promise<string> {
  const validatedHouseholdId = householdIdSchema.parse(householdId);
  const validatedParentId = parentIdSchema.parse(parentId);

  const supabase = await createClient();
  const { data: household, error } = await supabase
    .from("households")
    .select("id")
    .eq("id", validatedHouseholdId)
    .single();

  if (error || !household) {
    throw new NotFoundError("Household");
  }

  const token = generateToken();
  const cookieStore = await cookies();
  const maxAge = DEVICE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + maxAge * 1000);

  const admin = getAdminClientOrNull();
  if (admin) {
    const tokenHash = hashToken(token);
    const { error: insertError } = await admin.from("device_tokens").insert({
      token_hash: tokenHash,
      household_id: validatedHouseholdId,
      parent_id: validatedParentId,
      expires_at: expiresAt.toISOString(),
    });
    if (insertError) {
      throw new Error(`Failed to store device token: ${insertError.message}`);
    }
    cookieStore.set(DEVICE_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });
    return token;
  }

  cookieStore.set(DEVICE_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
  await setParentIdCookie(validatedParentId);
  return token;
}

/**
 * Validate device token and return household ID (and optional parent ID).
 * Uses DB lookup when service role is set; otherwise falls back to parent_id cookie (dev only).
 * In production, cookie-only fallback is disabled: SUPABASE_SERVICE_ROLE_KEY must be set.
 */
export async function validateDeviceToken(): Promise<ValidateDeviceTokenResult | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEVICE_TOKEN_COOKIE_NAME)?.value;

  const admin = getAdminClientOrNull();
  if (admin && token) {
    const tokenHash = hashToken(token);
    const { data: row, error } = await admin
      .from("device_tokens")
      .select("household_id, parent_id")
      .eq("token_hash", tokenHash)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (!error && row?.household_id) {
      return {
        householdId: row.household_id,
        parentId: row.parent_id ?? null,
      };
    }
    return null;
  }

  // Cookie-only fallback is insecure; allow only in development (service role not set).
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const parentIdCookie = cookieStore.get(PARENT_ID_COOKIE_NAME)?.value;
  if (!parentIdCookie) return null;
  try {
    const validatedParentId = parentIdSchema.parse(parentIdCookie);
    const defaultHouseholdId = await householdService.getDefaultHouseholdId(validatedParentId);
    if (!defaultHouseholdId) return null;
    const supabase = await createClient();
    const { data: parent } = await supabase
      .from("parents")
      .select("id")
      .eq("id", validatedParentId)
      .single();
    if (!parent) return null;
    return {
      householdId: defaultHouseholdId,
      parentId: validatedParentId,
    };
  } catch {
    return null;
  }
}

/**
 * Clear device token (logout): remove from DB if applicable and delete cookies.
 */
export async function clearDeviceToken(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(DEVICE_TOKEN_COOKIE_NAME)?.value;

  const admin = getAdminClientOrNull();
  if (admin && token) {
    const tokenHash = hashToken(token);
    await admin.from("device_tokens").delete().eq("token_hash", tokenHash);
  }

  cookieStore.delete(DEVICE_TOKEN_COOKIE_NAME);
  cookieStore.delete(PARENT_ID_COOKIE_NAME);
}

/**
 * Set parent ID in secure cookie (used in legacy flow when SUPABASE_SERVICE_ROLE_KEY is not set).
 */
export async function setParentIdCookie(parentId: string): Promise<void> {
  const validatedParentId = parentIdSchema.parse(parentId);
  const cookieStore = await cookies();
  const maxAge = DEVICE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
  cookieStore.set(PARENT_ID_COOKIE_NAME, validatedParentId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}
