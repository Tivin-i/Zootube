import { getVideoMetadataWithAccessToken, extractVideoId } from "@/lib/youtube";
import { YouTubeVideoMetadata } from "@/lib/youtube";
import { youtubeUrlSchema, youtubeVideoIdSchema } from "@/lib/validators/video.validator";

/**
 * YouTube service for video validation and metadata fetching.
 * Metadata calls require an OAuth access token (household's connected YouTube account).
 */
export class YouTubeService {
  /**
   * Validate YouTube URL format
   */
  validateUrl(url: string): void {
    youtubeUrlSchema.parse(url);
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url: string): string | null {
    return extractVideoId(url);
  }

  /**
   * Fetch video metadata from YouTube using the household's OAuth access token.
   */
  async getVideoMetadata(url: string, accessToken: string): Promise<YouTubeVideoMetadata | null> {
    this.validateUrl(url);
    const videoId = this.extractVideoId(url);
    if (!videoId) return null;
    youtubeVideoIdSchema.parse(videoId);
    return getVideoMetadataWithAccessToken(accessToken, videoId);
  }

  /**
   * Check if video is made for kids (requires OAuth access token).
   */
  async isMadeForKids(url: string, accessToken: string): Promise<boolean> {
    const metadata = await this.getVideoMetadata(url, accessToken);
    return metadata?.madeForKids || false;
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
