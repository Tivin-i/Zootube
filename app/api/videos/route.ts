import { NextRequest } from "next/server";
import { videoQuerySchema, createVideoSchema } from "@/lib/validators/video.validator";
import { handleApiError } from "@/lib/utils/error-handler";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { UnauthorizedError } from "@/lib/errors/app-errors";
import { videoService } from "@/lib/services/video.service";
import { createClient } from "@/lib/supabase/server";
import { householdService } from "@/lib/services/household.service";
import { DEFAULT_PAGE_SIZE } from "@/lib/utils/constants";

// GET /api/videos?household_id=xxx - Get all videos for a household
export async function GET(request: NextRequest) {
  try {
    await applyRateLimit(request, "public");

    const searchParams = request.nextUrl.searchParams;
    const query = videoQuerySchema.parse({
      household_id: searchParams.get("household_id"),
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    });

    const page = query.page || 1;
    const limit = query.limit || DEFAULT_PAGE_SIZE;

    const { videos, total, totalPages } = await videoService.getVideosWithPagination({
      householdId: query.household_id,
      page,
      limit,
    });

    return new Response(
      JSON.stringify({
        videos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/videos - Add a new video (requires auth and household membership)
export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, "videoAdd");

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError("Authentication required");
    }

    const body = await request.json();
    const { confirmed } = body;

    const validated = createVideoSchema.parse({
      url: body.url,
      household_id: body.household_id,
    });

    await householdService.ensureMember(validated.household_id, user.id);

    const result = await videoService.addVideo({
      url: validated.url,
      householdId: validated.household_id,
      addedByParentId: user.id,
      confirmed: confirmed || false,
    });

    if (result.warning) {
      return new Response(
        JSON.stringify({
          warning: true,
          message: result.warning.message,
          metadata: result.warning.metadata,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ video: result.video }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
