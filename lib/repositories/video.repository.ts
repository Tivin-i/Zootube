import { createClient } from "@/lib/supabase/server";
import { Video } from "@/types/database";
import { Database } from "@/types/database";

type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];

export interface GetVideosOptions {
  householdId: string;
  page?: number;
  limit?: number;
  orderBy?: "watch_count" | "created_at" | "last_watched_at";
  orderDirection?: "asc" | "desc";
}

export interface VideoRepository {
  findByHouseholdId(options: GetVideosOptions): Promise<Video[]>;
  findById(id: string): Promise<Video | null>;
  create(videoData: VideoInsert): Promise<Video>;
  delete(id: string, householdId: string): Promise<void>;
  incrementWatchCount(id: string): Promise<Video>;
  exists(householdId: string, youtubeId: string): Promise<boolean>;
  countByHouseholdId(householdId: string): Promise<number>;
}

/**
 * Supabase implementation of VideoRepository
 */
export class SupabaseVideoRepository implements VideoRepository {
  async findByHouseholdId(options: GetVideosOptions): Promise<Video[]> {
    const supabase = await createClient();
    const { householdId, page = 1, limit, orderBy = "watch_count", orderDirection = "asc" } = options;

    let query = supabase
      .from("videos")
      .select("*")
      .eq("household_id", householdId)
      .order(orderBy, { ascending: orderDirection === "asc" });

    if (limit) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch videos: ${error.message}`);
    }

    return data || [];
  }

  async findById(id: string): Promise<Video | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch video: ${error.message}`);
    }

    return data;
  }

  async create(videoData: VideoInsert): Promise<Video> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("videos")
      .insert(videoData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create video: ${error.message}`);
    }

    if (!data) {
      throw new Error("Video creation returned no data");
    }

    return data;
  }

  async delete(id: string, householdId: string): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("household_id", householdId);

    if (error) {
      throw new Error(`Failed to delete video: ${error.message}`);
    }
  }

  async incrementWatchCount(id: string): Promise<Video> {
    const supabase = await createClient();

    const { data: currentVideo, error: fetchError } = await supabase
      .from("videos")
      .select("watch_count")
      .eq("id", id)
      .single();

    if (fetchError || !currentVideo) {
      throw new Error(`Video not found: ${fetchError?.message || "Unknown error"}`);
    }

    const { data, error } = await supabase
      .from("videos")
      .update({
        watch_count: currentVideo.watch_count + 1,
        last_watched_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to increment watch count: ${error.message}`);
    }

    if (!data) {
      throw new Error("Watch count update returned no data");
    }

    return data;
  }

  async exists(householdId: string, youtubeId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("id")
      .eq("household_id", householdId)
      .eq("youtube_id", youtubeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      throw new Error(`Failed to check video existence: ${error.message}`);
    }

    return !!data;
  }

  async countByHouseholdId(householdId: string): Promise<number> {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("videos")
      .select("*", { count: "exact", head: true })
      .eq("household_id", householdId);

    if (error) {
      throw new Error(`Failed to count videos: ${error.message}`);
    }

    return count || 0;
  }
}

export const videoRepository = new SupabaseVideoRepository();
