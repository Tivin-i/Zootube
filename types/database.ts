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
      videos: {
        Row: {
          id: string;
          parent_id: string;
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
          parent_id: string;
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
          parent_id?: string;
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
    };
  };
}

export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type Parent = Database["public"]["Tables"]["parents"]["Row"];
