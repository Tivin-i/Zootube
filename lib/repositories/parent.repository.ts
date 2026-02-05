import { createClient } from "@/lib/supabase/server";
import { Parent } from "@/types/database";

export interface ParentRepository {
  findByEmail(email: string): Promise<Parent | null>;
  findById(id: string): Promise<Parent | null>;
}

/**
 * Supabase implementation of ParentRepository
 */
export class SupabaseParentRepository implements ParentRepository {
  async findByEmail(email: string): Promise<Parent | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("parents")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      throw new Error(`Failed to find parent by email: ${error.message}`);
    }

    return data;
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
