"use client";

import Image from "next/image";
import { Video } from "@/types/database";
import { formatDuration } from "@/lib/utils/duration";

interface RecommendationsGridProps {
  recommendations: Video[];
  onSelect: (video: Video) => void;
  title?: string;
}

export default function RecommendationsGrid({
  recommendations,
  onSelect,
  title = "More Videos for You",
}: RecommendationsGridProps) {
  if (recommendations.length === 0) return null;

  return (
    <div className="w-full max-w-4xl space-y-4 px-4">
      <h3 className="text-center text-xl font-bold text-white">{title}</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {recommendations.map((rec) => (
          <button
            key={rec.id}
            onClick={() => onSelect(rec)}
            className="group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
            aria-label={`Watch ${rec.title}`}
          >
            {rec.thumbnail_url && (
              <div className="relative aspect-video w-full">
                <Image
                  src={rec.thumbnail_url}
                  alt={rec.title || "Video thumbnail"}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90">
                    <svg
                      className="ml-1 h-6 w-6 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {rec.duration_seconds != null && (
                  <div className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                    {formatDuration(rec.duration_seconds)}
                  </div>
                )}
              </div>
            )}
            {rec.title && (
              <div className="p-2">
                <p className="line-clamp-2 text-left text-xs font-medium text-white">
                  {rec.title}
                </p>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
