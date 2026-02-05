import { NextRequest } from "next/server";
import { videoIdParamSchema } from "@/lib/validators/video.validator";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { videoService } from "@/lib/services/video.service";

// POST /api/videos/[id]/watch - Track video watch
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, "public");

    const params = await context.params;
    const { id } = videoIdParamSchema.parse(params);

    // Use video service to track watch
    const video = await videoService.trackWatch(id);

    return new Response(
      JSON.stringify({ success: true, video }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
