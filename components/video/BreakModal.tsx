"use client";

import Image from "next/image";
import { Video } from "@/types/database";
import RecommendationsGrid from "@/components/watch/RecommendationsGrid";

interface BreakModalProps {
  video: Video;
  recommendations?: Video[];
  onBackToVideo: () => void;
  onDone: () => void;
  onWatchOtherVideo: () => void;
  onRecommendationClick?: (video: Video) => void;
}

export default function BreakModal({
  video,
  recommendations = [],
  onBackToVideo,
  onDone,
  onWatchOtherVideo,
  onRecommendationClick,
}: BreakModalProps) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-between p-4 sm:p-6">
      {/* Top section - Video thumbnail */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
          Take a Break?
        </h2>

        {/* Video Thumbnail - Clickable to resume */}
        <button
          onClick={onBackToVideo}
          className="group relative overflow-hidden rounded-2xl shadow-2xl transition-all active:scale-95 sm:hover:scale-105"
          aria-label="Continue watching this video"
        >
          {video?.thumbnail_url && (
            <div className="relative h-48 w-80 sm:h-56 sm:w-96 md:h-64 md:w-[32rem]">
              <Image
                src={video.thumbnail_url}
                alt={video.title || "Video thumbnail"}
                fill
                className="object-cover"
                unoptimized
              />
              {/* Play Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all group-hover:bg-black/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-xl transition-all sm:h-20 sm:w-20 sm:group-hover:scale-110">
                  <svg
                    className="ml-1 h-8 w-8 text-blue-600 sm:h-10 sm:w-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Hint text */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-center text-sm font-semibold text-white">
                  👆 Tap to continue watching
                </p>
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Recommendations Section */}
      {recommendations.length > 0 && onRecommendationClick && (
        <RecommendationsGrid
          recommendations={recommendations}
          onSelect={onRecommendationClick}
        />
      )}

      {/* Bottom section - Action buttons */}
      <div className="w-full max-w-md space-y-3 sm:space-y-4">
        {/* I'm Done - Primary CTA */}
        <button
          onClick={onDone}
          className="w-full rounded-full bg-green-500 px-6 py-4 text-xl font-bold text-white shadow-2xl transition-all active:scale-95 sm:px-8 sm:py-5 sm:text-2xl sm:hover:scale-105 sm:hover:bg-green-400"
        >
          ✓ I'm Done!
        </button>

        {/* Watch Other Video - Secondary */}
        <button
          onClick={onWatchOtherVideo}
          className="w-full rounded-full bg-white/20 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all active:scale-95 sm:px-6 sm:hover:bg-white/30"
        >
          Watch Other Video
        </button>
      </div>
    </div>
  );
}
