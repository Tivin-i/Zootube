"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Video } from "@/types/database";
import KidsHeader from "@/components/KidsHeader";
import WatchPagePlayer, { WatchPagePlayerHandle } from "@/components/watch/WatchPagePlayer";
import BreakModal from "@/components/video/BreakModal";
import DoneModal from "@/components/video/DoneModal";
import { MAX_RECOMMENDATIONS } from "@/lib/utils/constants";

export default function WatchPage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.id as string;
  const playerRef = useRef<WatchPagePlayerHandle>(null);

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [householdIdLoading, setHouseholdIdLoading] = useState(true);

  useEffect(() => {
    fetch("/api/device-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.householdId) {
          setHouseholdId(data.householdId);
        } else {
          router.push("/link-device");
        }
      })
      .catch(() => {
        router.push("/link-device");
      })
      .finally(() => {
        setHouseholdIdLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (householdIdLoading || !householdId) return;
    fetchVideoAndRecommendations(householdId);
  }, [videoId, router, householdId, householdIdLoading]);

  const fetchVideoAndRecommendations = async (householdId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/videos?household_id=${householdId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch videos");
      }
      const allVideos = data.videos || [];
      const currentVideo = allVideos.find((v: Video) => v.id === videoId);
      if (!currentVideo) {
        setError("Video not found");
        setLoading(false);
        return;
      }
      setVideo(currentVideo);
      trackWatch(videoId);
      fetchRecommendations(householdId, videoId);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (
    householdId: string,
    currentVideoId: string
  ) => {
    setRecommendationsLoading(true);
    try {
      const response = await fetch(`/api/videos?household_id=${householdId}`);
      const data = await response.json();
      if (response.ok && data.videos) {
        const otherVideos = data.videos
          .filter((v: Video) => v.id !== currentVideoId)
          .slice(0, MAX_RECOMMENDATIONS);
        setRecommendations(otherVideos);
      }
    } catch (error) {
      console.error("Failed to fetch recommendations:", error);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const trackWatch = async (id: string) => {
    try {
      await fetch(`/api/videos/${id}/watch`, { method: "POST" });
    } catch (error) {
      console.error("Failed to track watch:", error);
    }
  };

  const handleBackToVideo = () => {
    setShowBreakModal(false);
    setIsDone(false);
    playerRef.current?.seekTo(0);
    playerRef.current?.reset();
  };

  const handleDone = () => setIsDone(true);

  const handleWatchOtherVideo = () => router.push("/feed");

  const handleRecommendationClick = (recommendedVideo: Video) => {
    router.push(`/watch/${recommendedVideo.id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center" data-testid="loading-state">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" data-testid="loading-spinner" aria-hidden="true" />
          <p className="text-lg text-gray-600" aria-live="polite">Loading video…</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4" data-testid="watch-error-state">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">
            {error || "Video not found"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Go back home to pick another video, or try again.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            {householdId && (
              <button
                type="button"
                onClick={() => fetchVideoAndRecommendations(householdId)}
                className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Try again
              </button>
            )}
            <a
              href="/feed"
              className="rounded-md bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 focus-visible:outline focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
            >
              Go Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <KidsHeader showBackButton={true} showUserMenu={false} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="sr-only" data-testid="video-title">{video.title}</h2>
        <div className="space-y-8">
          <WatchPagePlayer
            ref={playerRef}
            video={video}
            onBreakRequested={() => setShowBreakModal(true)}
          />
        </div>
      </main>

      {showBreakModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-600 to-purple-600 p-6">
          {!isDone ? (
            <BreakModal
              video={video}
              recommendations={recommendations}
              onBackToVideo={handleBackToVideo}
              onDone={handleDone}
              onWatchOtherVideo={handleWatchOtherVideo}
              onRecommendationClick={handleRecommendationClick}
            />
          ) : (
            <DoneModal onWatchOtherVideo={handleWatchOtherVideo} />
          )}
        </div>
      )}
    </div>
  );
}
