import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { videoIdParamSchema } from "@/lib/validators/video.validator";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { videoService } from "@/lib/services/video.service";
import { householdService } from "@/lib/services/household.service";

// DELETE /api/videos/[id] - Delete a video (requires auth and household membership)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await applyRateLimit(request, "public");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const params = await context.params;
    const { id } = videoIdParamSchema.parse(params);

    const video = await videoService.getVideoById(id);
    await householdService.ensureMember(video.household_id, user.id);

    await videoService.deleteVideo(id, video.household_id, user.id);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
