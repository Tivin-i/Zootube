import { cache, getYouTubeMetadataCacheKey, CACHE_TTL } from "@/lib/utils/cache";
import { youtubeFetchWithAccessToken } from "@/lib/youtube-oauth-api";

export interface YouTubeVideoMetadata {
  id: string;
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
  madeForKids: boolean;
}

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/v/VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parse ISO 8601 duration string to seconds
 * Example: PT1H2M3S -> 3723 seconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video metadata from YouTube Data API using OAuth access token (fetch-only, Workers-safe).
 * Results are cached by videoId. Use for single-video add when household's YouTube is connected.
 */
export async function getVideoMetadataWithAccessToken(
  accessToken: string,
  videoId: string
): Promise<YouTubeVideoMetadata | null> {
  const cacheKey = getYouTubeMetadataCacheKey(videoId);
  const cached = cache.get<YouTubeVideoMetadata>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const data = (await youtubeFetchWithAccessToken(accessToken, "videos", {
      part: "snippet,contentDetails,status",
      id: videoId,
    })) as {
      items?: Array<{
        snippet?: { title?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } } };
        contentDetails?: { duration?: string };
        status?: { madeForKids?: boolean };
      }>;
    };

    const video = data.items?.[0];
    if (!video?.snippet || !video?.contentDetails) {
      return null;
    }

    const metadata: YouTubeVideoMetadata = {
      id: videoId,
      title: video.snippet.title || "Untitled Video",
      thumbnailUrl:
        video.snippet.thumbnails?.high?.url ||
        video.snippet.thumbnails?.medium?.url ||
        video.snippet.thumbnails?.default?.url ||
        "",
      durationSeconds: parseDuration(video.contentDetails.duration || "PT0S"),
      madeForKids: video.status?.madeForKids ?? false,
    };

    cache.set(cacheKey, metadata, CACHE_TTL.YOUTUBE_METADATA);
    return metadata;
  } catch (error) {
    console.error("Error fetching YouTube video metadata (OAuth):", error);
    return null;
  }
}
