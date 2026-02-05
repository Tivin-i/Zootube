import { NextRequest } from "next/server";
import { youtubeService } from "@/lib/services/youtube.service";
import { handleApiError } from "@/lib/utils/error-handler";
import { youtubeUrlSchema } from "@/lib/validators/video.validator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return handleApiError(new Error("YouTube URL is required"));
    }

    // Validate URL format
    youtubeUrlSchema.parse(url);

    // Get metadata using service
    const metadata = await youtubeService.getVideoMetadata(url);

    if (!metadata) {
      return handleApiError(new Error("Invalid YouTube URL or video not found"));
    }

    return new Response(
      JSON.stringify({
        success: true,
        metadata,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
