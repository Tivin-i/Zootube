import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { youtubeBatchSchema } from "@/lib/validators/youtube.validator";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { createClient } from "@/lib/supabase/server";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Helper to extract IDs from URLs
function parseYouTubeUrl(url: string): {
  type: "video" | "channel" | "playlist" | null;
  id: string | null;
} {
  try {
    const urlObj = new URL(url);

    // Check for playlist
    if (urlObj.searchParams.has("list")) {
      return {
        type: "playlist",
        id: urlObj.searchParams.get("list"),
      };
    }

    // Check for channel (various formats)
    if (
      urlObj.pathname.startsWith("/channel/") ||
      urlObj.pathname.startsWith("/@") ||
      urlObj.pathname.startsWith("/c/")
    ) {
      const pathParts = urlObj.pathname.split("/").filter((p) => p);
      return {
        type: "channel",
        id: pathParts[pathParts.length - 1],
      };
    }

    // Check for video
    if (
      urlObj.searchParams.has("v") ||
      urlObj.hostname === "youtu.be"
    ) {
      return {
        type: "video",
        id: urlObj.searchParams.get("v") || urlObj.pathname.slice(1),
      };
    }

    return { type: null, id: null };
  } catch {
    return { type: null, id: null };
  }
}

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, "videoAdd");

    // Check authentication
    let user: { id: string } | null = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (err) {
      // Supabase unreachable (e.g. DNS EAI_AGAIN, network) — don't report as 401
      return NextResponse.json(
        {
          error: "Authentication service temporarily unavailable. Please try again.",
        },
        { status: 503 }
      );
    }

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const body = await request.json();
    const { pageToken } = body;

    // Validate input
    const validated = youtubeBatchSchema.parse({
      url: body.url,
      parent_id: user.id,
      pageToken: body.pageToken,
    });

    const parsed = parseYouTubeUrl(validated.url);

    if (!parsed.type || !parsed.id) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Handle single video
    if (parsed.type === "video") {
      const response = await youtube.videos.list({
        part: ["snippet", "contentDetails"],
        id: [parsed.id],
      });

      const video = response.data.items?.[0];
      if (!video) {
        return NextResponse.json({ error: "Video not found" }, { status: 404 });
      }

      return new Response(
        JSON.stringify({
          type: "video",
          videos: [
            {
              videoId: video.id,
              title: video.snippet?.title,
              thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
              duration: video.contentDetails?.duration,
              madeForKids: video.status?.madeForKids || false,
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle playlist
    if (parsed.type === "playlist") {
      const response = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: parsed.id,
        maxResults: 20,
        pageToken: validated.pageToken || undefined,
      });

      const videoIds = response.data.items?.map(
        (item) => item.contentDetails?.videoId
      ).filter(Boolean) as string[];

      // Get detailed info for all videos
      const videosResponse = await youtube.videos.list({
        part: ["snippet", "contentDetails", "status"],
        id: videoIds,
      });

      const videos = videosResponse.data.items?.map((video) => ({
        videoId: video.id,
        title: video.snippet?.title,
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
        duration: video.contentDetails?.duration,
        madeForKids: video.status?.madeForKids || false,
      }));

      return new Response(
        JSON.stringify({
          type: "playlist",
          videos,
          nextPageToken: response.data.nextPageToken,
          totalResults: response.data.pageInfo?.totalResults,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle channel
    if (parsed.type === "channel") {
      let channelId = parsed.id;

      // If it's a username or handle, resolve to channel ID
      if (!channelId.startsWith("UC")) {
        const channelResponse = await youtube.channels.list({
          part: ["id"],
          forHandle: parsed.id.startsWith("@") ? parsed.id.slice(1) : undefined,
          forUsername: !parsed.id.startsWith("@") ? parsed.id : undefined,
        });

        channelId = channelResponse.data.items?.[0]?.id || channelId;
      }

      // Get uploads playlist ID
      const channelResponse = await youtube.channels.list({
        part: ["contentDetails"],
        id: [channelId],
      });

      const uploadsPlaylistId =
        channelResponse.data.items?.[0]?.contentDetails?.relatedPlaylists
          ?.uploads;

      if (!uploadsPlaylistId) {
        return NextResponse.json(
          { error: "Channel not found or has no videos" },
          { status: 404 }
        );
      }

      // Get videos from uploads playlist
      const response = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId: uploadsPlaylistId,
        maxResults: 20,
        pageToken: validated.pageToken || undefined,
      });

      const videoIds = response.data.items?.map(
        (item) => item.contentDetails?.videoId
      ).filter(Boolean) as string[];

      // Get detailed info for all videos
      const videosResponse = await youtube.videos.list({
        part: ["snippet", "contentDetails", "status"],
        id: videoIds,
      });

      const videos = videosResponse.data.items?.map((video) => ({
        videoId: video.id,
        title: video.snippet?.title,
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
        duration: video.contentDetails?.duration,
        madeForKids: video.status?.madeForKids || false,
      }));

      return new Response(
        JSON.stringify({
          type: "channel",
          videos,
          nextPageToken: response.data.nextPageToken,
          totalResults: response.data.pageInfo?.totalResults,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return handleApiError(new Error("Unsupported URL type"));
  } catch (error) {
    return handleApiError(error);
  }
}
