import { NextRequest, NextResponse } from "next/server";
import { validateYouTubeUrl } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const metadata = await validateYouTubeUrl(url);

    if (!metadata) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or video not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata,
    });
  } catch (error: any) {
    console.error("YouTube API test error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch video metadata" },
      { status: 500 }
    );
  }
}
