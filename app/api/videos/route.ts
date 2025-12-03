import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateYouTubeUrl } from "@/lib/youtube";

// GET /api/videos?parent_id=xxx - Get all videos for a parent
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const parentId = searchParams.get("parent_id");

    if (!parentId) {
      return NextResponse.json(
        { error: "parent_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: videos, error } = await supabase
      .from("videos")
      .select("*")
      .eq("parent_id", parentId)
      .order("watch_count", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      return NextResponse.json(
        { error: "Failed to fetch videos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error("Error in GET /api/videos:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/videos - Add a new video
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    // Validate YouTube URL and fetch metadata
    const metadata = await validateYouTubeUrl(url);

    if (!metadata) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or video not found" },
        { status: 404 }
      );
    }

    // Check if video already exists for this parent
    const { data: existingVideo } = await supabase
      .from("videos")
      .select("id")
      .eq("parent_id", user.id)
      .eq("youtube_id", metadata.id)
      .single();

    if (existingVideo) {
      return NextResponse.json(
        { error: "This video is already in your collection" },
        { status: 409 }
      );
    }

    // Insert video into database
    const { data: video, error } = await supabase
      .from("videos")
      .insert({
        parent_id: user.id,
        youtube_id: metadata.id,
        title: metadata.title,
        thumbnail_url: metadata.thumbnailUrl,
        duration_seconds: metadata.durationSeconds,
        made_for_kids: metadata.madeForKids,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting video:", error);
      return NextResponse.json(
        { error: "Failed to add video" },
        { status: 500 }
      );
    }

    return NextResponse.json({ video }, { status: 201 });
  } catch (error: any) {
    console.error("Error in POST /api/videos:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
