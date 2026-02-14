import { NextRequest, NextResponse } from "next/server";
import { youtubeBatchSchema } from "@/lib/validators/youtube.validator";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { createClient } from "@/lib/supabase/server";

/** YouTube Data API v3 via fetch (Workers-safe; googleapis uses Node http). */
function youtubeApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  return key;
}

async function youtubeFetch(path: string, params: Record<string, string>): Promise<unknown> {
  const key = youtubeApiKey();
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  url.searchParams.set("key", key);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  return res.json();
}

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
      const data = (await youtubeFetch("videos", {
        part: "snippet,contentDetails,status",
        id: parsed.id,
      })) as { items?: Array<{
        id?: string;
        snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } };
        contentDetails?: { duration?: string };
        status?: { madeForKids?: boolean };
      }> };

      const video = data.items?.[0];
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
              madeForKids: video.status?.madeForKids ?? false,
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
      const listParams: Record<string, string> = {
        part: "snippet,contentDetails",
        playlistId: parsed.id,
        maxResults: "20",
      };
      if (validated.pageToken) listParams.pageToken = validated.pageToken;
      const listData = (await youtubeFetch("playlistItems", listParams)) as {
        items?: Array<{ contentDetails?: { videoId?: string } }>;
        nextPageToken?: string;
        pageInfo?: { totalResults?: number };
      };

      const videoIds = (listData.items?.map((item) => item.contentDetails?.videoId).filter(Boolean) ?? []) as string[];
      if (videoIds.length === 0) {
        return new Response(
          JSON.stringify({
            type: "playlist",
            videos: [],
            nextPageToken: listData.nextPageToken,
            totalResults: listData.pageInfo?.totalResults ?? 0,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const videosData = (await youtubeFetch("videos", {
        part: "snippet,contentDetails,status",
        id: videoIds.join(","),
      })) as { items?: Array<{
        id?: string;
        snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } };
        contentDetails?: { duration?: string };
        status?: { madeForKids?: boolean };
      }> };

      const videos = (videosData.items ?? []).map((video) => ({
        videoId: video.id,
        title: video.snippet?.title,
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
        duration: video.contentDetails?.duration,
        madeForKids: video.status?.madeForKids ?? false,
      }));

      return new Response(
        JSON.stringify({
          type: "playlist",
          videos,
          nextPageToken: listData.nextPageToken,
          totalResults: listData.pageInfo?.totalResults,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle channel
    if (parsed.type === "channel") {
      let channelId = parsed.id;

      // If it's a username or handle, resolve to channel ID
      if (!channelId.startsWith("UC")) {
        const channelParams: Record<string, string> = { part: "id" };
        if (parsed.id.startsWith("@")) {
          channelParams.forHandle = parsed.id.slice(1);
        } else {
          channelParams.forUsername = parsed.id;
        }
        const channelData = (await youtubeFetch("channels", channelParams)) as {
          items?: Array<{ id?: string }>;
        };
        channelId = channelData.items?.[0]?.id ?? channelId;
      }

      // Get uploads playlist ID
      const channelDetails = (await youtubeFetch("channels", {
        part: "contentDetails",
        id: channelId,
      })) as { items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }> };

      const uploadsPlaylistId = channelDetails.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsPlaylistId) {
        return NextResponse.json(
          { error: "Channel not found or has no videos" },
          { status: 404 }
        );
      }

      // Get videos from uploads playlist
      const listParams: Record<string, string> = {
        part: "snippet,contentDetails",
        playlistId: uploadsPlaylistId,
        maxResults: "20",
      };
      if (validated.pageToken) listParams.pageToken = validated.pageToken;
      const listData = (await youtubeFetch("playlistItems", listParams)) as {
        items?: Array<{ contentDetails?: { videoId?: string } }>;
        nextPageToken?: string;
        pageInfo?: { totalResults?: number };
      };

      const videoIds = (listData.items?.map((item) => item.contentDetails?.videoId).filter(Boolean) ?? []) as string[];
      if (videoIds.length === 0) {
        return new Response(
          JSON.stringify({
            type: "channel",
            videos: [],
            nextPageToken: listData.nextPageToken,
            totalResults: listData.pageInfo?.totalResults ?? 0,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      const videosData = (await youtubeFetch("videos", {
        part: "snippet,contentDetails,status",
        id: videoIds.join(","),
      })) as { items?: Array<{
        id?: string;
        snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } };
        contentDetails?: { duration?: string };
        status?: { madeForKids?: boolean };
      }> };

      const videos = (videosData.items ?? []).map((video) => ({
        videoId: video.id,
        title: video.snippet?.title,
        thumbnailUrl: video.snippet?.thumbnails?.medium?.url,
        duration: video.contentDetails?.duration,
        madeForKids: video.status?.madeForKids ?? false,
      }));

      return new Response(
        JSON.stringify({
          type: "channel",
          videos,
          nextPageToken: listData.nextPageToken,
          totalResults: listData.pageInfo?.totalResults,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return handleApiError(new Error("Unsupported URL type"));
  } catch (error) {
    return handleApiError(error);
  }
}
