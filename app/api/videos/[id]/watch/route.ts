import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/videos/[id]/watch - Track video watch
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First get current watch count
    const { data: currentVideo, error: fetchError } = await supabase
      .from("videos")
      .select("watch_count")
      .eq("id", id)
      .single();

    if (fetchError || !currentVideo) {
      console.error("Error fetching video:", fetchError);
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      );
    }

    // Increment watch_count and update last_watched_at
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
      console.error("Error tracking watch:", error);
      return NextResponse.json(
        { error: "Failed to track watch" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, video: data });
  } catch (error: any) {
    console.error("Error in POST /api/videos/[id]/watch:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
