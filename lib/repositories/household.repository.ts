import { createClient } from "@/lib/supabase/server";
import { getAdminClientOrNull } from "@/lib/supabase/admin";
import { Household, HouseholdMember } from "@/types/database";
import { Database } from "@/types/database";

type HouseholdInsert = Database["public"]["Tables"]["households"]["Insert"];
type HouseholdMemberInsert = Database["public"]["Tables"]["household_members"]["Insert"];

export interface HouseholdRepository {
  create(data: HouseholdInsert): Promise<Household>;
  findById(id: string): Promise<Household | null>;
  findMembersByHouseholdId(householdId: string): Promise<HouseholdMember[]>;
  findHouseholdsByParentId(parentId: string): Promise<Household[]>;
  addMember(data: HouseholdMemberInsert): Promise<void>;
  removeMember(householdId: string, parentId: string): Promise<void>;
  isMember(householdId: string, parentId: string): Promise<boolean>;
}

export class SupabaseHouseholdRepository implements HouseholdRepository {
  async create(data: HouseholdInsert): Promise<Household> {
    const supabase = await createClient();
    const { data: row, error } = await supabase
      .from("households")
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create household: ${error.message}`);
    }
    if (!row) {
      throw new Error("Household creation returned no data");
    }
    return row;
  }

  async findById(id: string): Promise<Household | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("households")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch household: ${error.message}`);
    }
    return data;
  }

  async findMembersByHouseholdId(householdId: string): Promise<HouseholdMember[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("household_members")
      .select("*")
      .eq("household_id", householdId);

    if (error) {
      throw new Error(`Failed to fetch household members: ${error.message}`);
    }
    return data || [];
  }

  async findHouseholdsByParentId(parentId: string): Promise<Household[]> {
    const supabase = await createClient();
    const { data: members, error: membersError } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("parent_id", parentId)
      .order("joined_at", { ascending: true });

    if (membersError) {
      throw new Error(`Failed to fetch household members: ${membersError.message}`);
    }
    if (!members?.length) return [];

    const ids = members.map((m) => m.household_id);
    const { data: households, error: householdsError } = await supabase
      .from("households")
      .select("*")
      .in("id", ids);

    if (householdsError) {
      throw new Error(`Failed to fetch households: ${householdsError.message}`);
    }
    return (households || []).sort(
      (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)
    );
  }

  async addMember(data: HouseholdMemberInsert): Promise<void> {
    const admin = getAdminClientOrNull();
    if (!admin) {
      throw new Error("Service role required to add household member");
    }
    const { error } = await admin.from("household_members").insert(data);
    if (error) {
      throw new Error(`Failed to add household member: ${error.message}`);
    }
  }

  async removeMember(householdId: string, parentId: string): Promise<void> {
    const admin = getAdminClientOrNull();
    if (!admin) {
      throw new Error("Service role required to remove household member");
    }
    const { error } = await admin
      .from("household_members")
      .delete()
      .eq("household_id", householdId)
      .eq("parent_id", parentId);
    if (error) {
      throw new Error(`Failed to remove household member: ${error.message}`);
    }
  }

  async isMember(householdId: string, parentId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("household_members")
      .select("household_id")
      .eq("household_id", householdId)
      .eq("parent_id", parentId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return false;
      throw new Error(`Failed to check membership: ${error.message}`);
    }
    return !!data;
  }
}

export const householdRepository = new SupabaseHouseholdRepository();
