import { parentRepository } from "@/lib/repositories/parent.repository";
import { NotFoundError } from "@/lib/errors/app-errors";
import { getAdminClientOrNull } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseUuid(data: unknown): string | null {
  if (typeof data === "string" && UUID_REGEX.test(data)) return data;
  if (Array.isArray(data) && data[0] != null && typeof data[0] === "string" && UUID_REGEX.test(data[0])) return data[0];
  if (data && typeof data === "object" && "id" in data && typeof (data as { id: unknown }).id === "string") {
    const id = (data as { id: string }).id;
    if (UUID_REGEX.test(id)) return id;
  }
  return null;
}

/**
 * Parent service for business logic related to parents
 */
export class ParentService {
  /**
   * Find parent by email (for device linking)
   * Returns only parent ID for security
   */
  async findParentByEmail(email: string): Promise<string> {
    const parent = await parentRepository.findByEmail(email);
    if (!parent) {
      throw new NotFoundError("Parent account");
    }
    return parent.id;
  }

  /**
   * Look up parent by email using service role (bypasses RLS). Use when anon lookup may fail.
   */
  async findParentByEmailWithAdmin(email: string): Promise<string | null> {
    const admin = getAdminClientOrNull();
    if (!admin) return null;
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;
    const { data } = await admin
      .from("parents")
      .select("id")
      .ilike("email", normalized.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_"))
      .maybeSingle();
    return data?.id ?? null;
  }

  /**
   * If parent is missing from public.parents but exists in auth.users, backfill and return parent id.
   * Tries RPC first, then Auth Admin listUsers + direct inserts as fallback (no migration required).
   */
  async ensureParentFromAuthByEmail(email: string): Promise<string | null> {
    const admin = getAdminClientOrNull();
    if (!admin) return null;
    const normalized = email.trim().toLowerCase();
    if (!normalized) return null;

    // 1) Try RPC (requires migrations/003_ensure_parent_from_auth.sql)
    const { data: rpcData, error: rpcError } = await admin.rpc("ensure_parent_from_auth_email", {
      lookup_email: normalized,
    });
    if (!rpcError && rpcData != null) {
      const id = parseUuid(rpcData);
      if (id) return id;
    }

    // 2) Fallback: Auth Admin listUsers + direct inserts (works without RPC).
    // Note: listUsers returns at most 1000 users; if the target user is not in the first page, fallback returns null.
    const { data: listData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = listData?.users ?? [];
    const authUser = users.find((u) => u.email?.toLowerCase() === normalized);
    if (!authUser?.id || !authUser.email) return null;

    const uid = authUser.id;
    const now = new Date().toISOString();

    try {
      await admin.from("parents").upsert({ id: uid, email: authUser.email, created_at: now }, { onConflict: "id" });
      await admin.from("households").upsert({ id: uid, name: "My list", created_at: now }, { onConflict: "id" });
      await admin
        .from("household_members")
        .upsert(
          { household_id: uid, parent_id: uid, role: "owner", joined_at: now },
          { onConflict: "household_id,parent_id" }
        );
    } catch {
      return null;
    }

    return uid;
  }

  /**
   * Verify parent exists by ID
   */
  async verifyParentExists(parentId: string): Promise<boolean> {
    const parent = await parentRepository.findById(parentId);
    return !!parent;
  }
}

// Export singleton instance
export const parentService = new ParentService();
