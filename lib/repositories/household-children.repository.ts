import { createClient } from "@/lib/supabase/server";
import { HouseholdChild } from "@/types/database";

export interface HouseholdChildrenRepository {
  findByHouseholdId(householdId: string): Promise<HouseholdChild[]>;
  upsert(params: {
    household_id: string;
    google_sub: string;
    email?: string | null;
    display_name?: string | null;
    linked_by?: string | null;
  }): Promise<HouseholdChild>;
  findById(id: string): Promise<HouseholdChild | null>;
  deleteById(id: string): Promise<void>;
}

export class SupabaseHouseholdChildrenRepository implements HouseholdChildrenRepository {
  async findByHouseholdId(householdId: string): Promise<HouseholdChild[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("household_children")
      .select("id, household_id, google_sub, email, display_name, linked_at, linked_by")
      .eq("household_id", householdId)
      .order("linked_at", { ascending: true });

    if (error) throw new Error(`Failed to fetch household children: ${error.message}`);
    return data ?? [];
  }

  async upsert(params: {
    household_id: string;
    google_sub: string;
    email?: string | null;
    display_name?: string | null;
    linked_by?: string | null;
  }): Promise<HouseholdChild> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("household_children")
      .upsert(
        {
          household_id: params.household_id,
          google_sub: params.google_sub,
          email: params.email ?? null,
          display_name: params.display_name ?? null,
          linked_by: params.linked_by ?? null,
          linked_at: new Date().toISOString(),
        },
        { onConflict: "household_id,google_sub", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert household child: ${error.message}`);
    if (!data) throw new Error("Upsert returned no data");
    return data;
  }

  async findById(id: string): Promise<HouseholdChild | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("household_children")
      .select("id, household_id, google_sub, email, display_name, linked_at, linked_by")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch household child: ${error.message}`);
    }
    return data;
  }

  async deleteById(id: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.from("household_children").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete household child: ${error.message}`);
  }
}

export const householdChildrenRepository = new SupabaseHouseholdChildrenRepository();
