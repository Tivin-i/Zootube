import { createClient } from "@/lib/supabase/server";
import { YoutubeConnection } from "@/types/database";

export interface YoutubeConnectionRepository {
  findByHouseholdId(householdId: string): Promise<YoutubeConnection | null>;
  upsert(params: {
    household_id: string;
    encrypted_refresh_token: string;
    youtube_channel_id?: string | null;
    linked_by?: string | null;
  }): Promise<YoutubeConnection>;
  deleteByHouseholdId(householdId: string): Promise<void>;
}

export class SupabaseYoutubeConnectionRepository implements YoutubeConnectionRepository {
  async findByHouseholdId(householdId: string): Promise<YoutubeConnection | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("youtube_connections")
      .select("id, household_id, encrypted_refresh_token, youtube_channel_id, linked_at, linked_by")
      .eq("household_id", householdId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to fetch YouTube connection: ${error.message}`);
    }
    return data;
  }

  async upsert(params: {
    household_id: string;
    encrypted_refresh_token: string;
    youtube_channel_id?: string | null;
    linked_by?: string | null;
  }): Promise<YoutubeConnection> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("youtube_connections")
      .upsert(
        {
          household_id: params.household_id,
          encrypted_refresh_token: params.encrypted_refresh_token,
          youtube_channel_id: params.youtube_channel_id ?? null,
          linked_by: params.linked_by ?? null,
          linked_at: new Date().toISOString(),
        },
        { onConflict: "household_id", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert YouTube connection: ${error.message}`);
    if (!data) throw new Error("Upsert returned no data");
    return data;
  }

  async deleteByHouseholdId(householdId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("youtube_connections")
      .delete()
      .eq("household_id", householdId);

    if (error) throw new Error(`Failed to delete YouTube connection: ${error.message}`);
  }
}

export const youtubeConnectionRepository = new SupabaseYoutubeConnectionRepository();
