import { videoRepository, GetVideosOptions } from "@/lib/repositories/video.repository";
import { householdService } from "@/lib/services/household.service";
import { youtubeConnectionRepository } from "@/lib/repositories/youtube-connection.repository";
import { getAccessTokenFromRefreshToken } from "@/lib/services/youtube-oauth.service";
import { extractVideoId, getVideoMetadataWithAccessToken } from "@/lib/youtube";
import { Video } from "@/types/database";
import { NotFoundError, YouTubeConnectionRequiredError } from "@/lib/errors/app-errors";
import { Database } from "@/types/database";
import { cache, getVideoListCacheKey, CACHE_TTL } from "@/lib/utils/cache";

type VideoInsert = Database["public"]["Tables"]["videos"]["Insert"];

export interface AddVideoOptions {
  url: string;
  householdId: string;
  addedByParentId: string;
  confirmed?: boolean;
}

export interface AddVideoResult {
  video?: Video;
  warning?: {
    message: string;
    metadata: {
      title: string;
      madeForKids: boolean;
    };
  };
}

/**
 * Video service for business logic related to videos
 */
export class VideoService {
  async getVideosWithPagination(options: GetVideosOptions & { page: number; limit: number }): Promise<{
    videos: Video[];
    total: number;
    totalPages: number;
  }> {
    const { page, limit, householdId } = options;

    const [videos, total] = await Promise.all([
      this.getVideos(options),
      videoRepository.countByHouseholdId(householdId),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      videos,
      total,
      totalPages,
    };
  }

  async getVideos(options: GetVideosOptions): Promise<Video[]> {
    const cacheKey = getVideoListCacheKey(
      options.householdId,
      options.page,
      options.limit
    );
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const videos = await videoRepository.findByHouseholdId(options);

    let sortedVideos: Video[] = videos;
    if (videos.length > 0) {
      const grouped = videos.reduce((acc, video) => {
        const count = video.watch_count;
        if (!acc[count]) {
          acc[count] = [];
        }
        acc[count].push(video);
        return acc;
      }, {} as Record<number, typeof videos>);

      sortedVideos = Object.keys(grouped)
        .sort((a, b) => Number(a) - Number(b))
        .flatMap((count) => {
          const group = grouped[Number(count)];
          for (let i = group.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [group[i], group[j]] = [group[j], group[i]];
          }
          return group;
        });
    }

    cache.set(cacheKey, sortedVideos, CACHE_TTL.VIDEO_LIST);

    return sortedVideos;
  }

  async getVideoById(id: string): Promise<Video> {
    const video = await videoRepository.findById(id);
    if (!video) {
      throw new NotFoundError("Video");
    }
    return video;
  }

  private invalidateVideoListCache(householdId: string): void {
    for (let page = 1; page <= 10; page++) {
      for (const limit of [20, 50, 100, undefined]) {
        const cacheKey = getVideoListCacheKey(householdId, page, limit);
        cache.delete(cacheKey);
      }
    }
  }

  async addVideo(options: AddVideoOptions): Promise<AddVideoResult> {
    const { url, householdId, addedByParentId, confirmed = false } = options;

    await householdService.ensureMember(householdId, addedByParentId);

    const connection = await youtubeConnectionRepository.findByHouseholdId(householdId);
    if (!connection) {
      throw new YouTubeConnectionRequiredError();
    }

    const { access_token } = await getAccessTokenFromRefreshToken(connection.encrypted_refresh_token);

    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new NotFoundError("YouTube video");
    }

    const metadata = await getVideoMetadataWithAccessToken(access_token, videoId);
    if (!metadata) {
      throw new NotFoundError("YouTube video");
    }

    if (!metadata.madeForKids && !confirmed) {
      return {
        warning: {
          message:
            "This video is not marked as 'Made for Kids'. Are you sure you want to add it to your child's collection?",
          metadata: {
            title: metadata.title,
            madeForKids: metadata.madeForKids,
          },
        },
      };
    }

    const exists = await videoRepository.exists(householdId, metadata.id);
    if (exists) {
      throw new Error("This video is already in your collection");
    }

    const videoData: VideoInsert = {
      household_id: householdId,
      added_by: addedByParentId,
      youtube_id: metadata.id,
      title: metadata.title,
      thumbnail_url: metadata.thumbnailUrl,
      duration_seconds: metadata.durationSeconds,
      made_for_kids: metadata.madeForKids,
    };

    const video = await videoRepository.create(videoData);

    this.invalidateVideoListCache(householdId);

    return { video };
  }

  async deleteVideo(id: string, householdId: string, parentId: string): Promise<void> {
    await householdService.ensureMember(householdId, parentId);

    const video = await videoRepository.findById(id);
    if (!video) {
      throw new NotFoundError("Video");
    }

    if (video.household_id !== householdId) {
      throw new NotFoundError("Video");
    }

    await videoRepository.delete(id, householdId);

    this.invalidateVideoListCache(householdId);
  }

  async trackWatch(id: string): Promise<Video> {
    const video = await videoRepository.findById(id);
    if (!video) {
      throw new NotFoundError("Video");
    }

    return videoRepository.incrementWatchCount(id);
  }

  async getRecommendations(
    videoId: string,
    householdId: string,
    limit: number = 10
  ): Promise<Video[]> {
    const videos = await videoRepository.findByHouseholdId({
      householdId,
      orderBy: "watch_count",
      orderDirection: "asc",
    });

    return videos
      .filter((v) => v.id !== videoId)
      .slice(0, limit);
  }
}

export const videoService = new VideoService();
