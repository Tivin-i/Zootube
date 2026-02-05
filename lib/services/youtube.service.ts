import { validateYouTubeUrl, getVideoMetadata, extractVideoId } from "@/lib/youtube";
import { YouTubeVideoMetadata } from "@/lib/youtube";
import { youtubeUrlSchema, youtubeVideoIdSchema } from "@/lib/validators/video.validator";

/**
 * YouTube service for video validation and metadata fetching
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
   * Validate and fetch video metadata from YouTube
   */
  async getVideoMetadata(url: string): Promise<YouTubeVideoMetadata | null> {
    // Validate URL format first
    this.validateUrl(url);
    
    // Extract and validate video ID
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      return null;
    }

    // Validate video ID format
    youtubeVideoIdSchema.parse(videoId);

    // Fetch metadata
    return getVideoMetadata(videoId);
  }

  /**
   * Check if video is made for kids
   */
  async isMadeForKids(url: string): Promise<boolean> {
    const metadata = await this.getVideoMetadata(url);
    return metadata?.madeForKids || false;
  }
}

// Export singleton instance
export const youtubeService = new YouTubeService();
