export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      parents: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      household_members: {
        Row: {
          household_id: string;
          parent_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          household_id: string;
          parent_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          household_id?: string;
          parent_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      videos: {
        Row: {
          id: string;
          household_id: string;
          added_by: string | null;
          youtube_id: string;
          title: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          made_for_kids: boolean | null;
          watch_count: number;
          last_watched_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          added_by?: string | null;
          youtube_id: string;
          title?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          made_for_kids?: boolean | null;
          watch_count?: number;
          last_watched_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          added_by?: string | null;
          youtube_id?: string;
          title?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          made_for_kids?: boolean | null;
          watch_count?: number;
          last_watched_at?: string | null;
          created_at?: string;
        };
      };
      youtube_connections: {
        Row: {
          id: string;
          household_id: string;
          encrypted_refresh_token: string;
          youtube_channel_id: string | null;
          linked_at: string;
          linked_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          encrypted_refresh_token: string;
          youtube_channel_id?: string | null;
          linked_at?: string;
          linked_by?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          encrypted_refresh_token?: string;
          youtube_channel_id?: string | null;
          linked_at?: string;
          linked_by?: string | null;
        };
      };
      household_children: {
        Row: {
          id: string;
          household_id: string;
          google_sub: string;
          email: string | null;
          display_name: string | null;
          linked_at: string;
          linked_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          google_sub: string;
          email?: string | null;
          display_name?: string | null;
          linked_at?: string;
          linked_by?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          google_sub?: string;
          email?: string | null;
          display_name?: string | null;
          linked_at?: string;
          linked_by?: string | null;
        };
      };
    };
  };
}

export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type Parent = Database["public"]["Tables"]["parents"]["Row"];
export type Household = Database["public"]["Tables"]["households"]["Row"];
export type HouseholdMember = Database["public"]["Tables"]["household_members"]["Row"];
export type YoutubeConnection = Database["public"]["Tables"]["youtube_connections"]["Row"];
export type HouseholdChild = Database["public"]["Tables"]["household_children"]["Row"];
