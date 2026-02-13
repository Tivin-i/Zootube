import { createClient } from "@/lib/supabase/server";
import { Parent } from "@/types/database";

/** Escape a string for use in ILIKE so % and _ are not treated as wildcards */
function escapeIlikePattern(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export interface ParentRepository {
  findByEmail(email: string): Promise<Parent | null>;
  findById(id: string): Promise<Parent | null>;
}

/**
 * Supabase implementation of ParentRepository
 */
export class SupabaseParentRepository implements ParentRepository {
  async findByEmail(email: string): Promise<Parent | null> {
    const normalized = email.trim();
    if (!normalized) return null;
    const supabase = await createClient();
    // Case-insensitive match: auth.users/parents may store email in original case
    const { data, error } = await supabase
      .from("parents")
      .select("*")
      .ilike("email", escapeIlikePattern(normalized))
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find parent by email: ${error.message}`);
    }

    return data ?? null;
  }

  async findById(id: string): Promise<Parent | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("parents")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find parent by id: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance
export const parentRepository = new SupabaseParentRepository();
