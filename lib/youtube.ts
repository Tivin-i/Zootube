import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

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
 * Fetch video metadata from YouTube Data API
 */
export async function getVideoMetadata(
  videoId: string
): Promise<YouTubeVideoMetadata | null> {
  try {
    const response = await youtube.videos.list({
      part: ["snippet", "contentDetails", "status"],
      id: [videoId],
    });

    const video = response.data.items?.[0];
    if (!video) {
      return null;
    }

    const snippet = video.snippet;
    const contentDetails = video.contentDetails;
    const status = video.status;

    if (!snippet || !contentDetails) {
      return null;
    }

    return {
      id: videoId,
      title: snippet.title || "Untitled Video",
      thumbnailUrl:
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        "",
      durationSeconds: parseDuration(contentDetails.duration || "PT0S"),
      madeForKids: status?.madeForKids || false,
    };
  } catch (error) {
    console.error("Error fetching YouTube video metadata:", error);
    return null;
  }
}

/**
 * Validate YouTube URL and return metadata if valid
 */
export async function validateYouTubeUrl(
  url: string
): Promise<YouTubeVideoMetadata | null> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    return null;
  }

  return getVideoMetadata(videoId);
}
