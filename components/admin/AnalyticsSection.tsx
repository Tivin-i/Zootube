"use client";

import Image from "next/image";
import { Video } from "@/types/database";

interface AnalyticsSectionProps {
  videos: Video[];
  loading: boolean;
}

export default function AnalyticsSection({
  videos,
  loading,
}: AnalyticsSectionProps) {
  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">
            Watch statistics for your video collection
          </p>
        </div>
        <div className="flex justify-center py-8">
          <div className="text-sm text-gray-500">Loading analytics...</div>
        </div>
      </div>
    );
  }

  const totalWatches = videos.reduce((sum, v) => sum + v.watch_count, 0);
  const videosWatched = videos.filter((v) => v.watch_count > 0).length;
  const unwatchedCount = videos.filter((v) => v.watch_count === 0).length;

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
        <p className="mt-1 text-sm text-gray-600">
          Watch statistics for your video collection
        </p>
      </div>

      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4">
            <div className="text-sm font-medium text-blue-600">
              Total Videos
            </div>
            <div className="mt-1 text-2xl font-semibold text-blue-900">
              {videos.length}
            </div>
          </div>
          <div className="rounded-lg bg-green-50 p-4">
            <div className="text-sm font-medium text-green-600">
              Total Watches
            </div>
            <div className="mt-1 text-2xl font-semibold text-green-900">
              {totalWatches}
            </div>
          </div>
          <div className="rounded-lg bg-purple-50 p-4">
            <div className="text-sm font-medium text-purple-600">
              Videos Watched
            </div>
            <div className="mt-1 text-2xl font-semibold text-purple-900">
              {videosWatched}
            </div>
          </div>
        </div>

        {/* Top Watched Videos */}
        {videosWatched > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Most Watched Videos
            </h3>
            <div className="space-y-2">
              {videos
                .filter((v) => v.watch_count > 0)
                .sort((a, b) => b.watch_count - a.watch_count)
                .slice(0, 5)
                .map((video) => (
                  <div
                    key={video.id}
                    className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {video.thumbnail_url && (
                        <div className="relative h-12 w-20 flex-shrink-0">
                          <Image
                            src={video.thumbnail_url}
                            alt={video.title || "Video thumbnail"}
                            fill
                            className="rounded object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {video.title || "Untitled Video"}
                        </p>
                        {video.last_watched_at && (
                          <p className="text-xs text-gray-500">
                            Last watched:{" "}
                            {new Date(
                              video.last_watched_at
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {video.watch_count}
                      </div>
                      <div className="text-xs text-gray-500">
                        watch{video.watch_count !== 1 ? "es" : ""}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Unwatched Videos */}
        {unwatchedCount > 0 && (
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              Unwatched Videos ({unwatchedCount})
            </h3>
            <p className="text-sm text-gray-600">
              These videos haven't been watched yet. They'll appear first in
              your child's feed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
