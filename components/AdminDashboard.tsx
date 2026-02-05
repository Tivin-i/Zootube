"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect, useCallback } from "react";
import { Video } from "@/types/database";
import VideoAddForm from "@/components/admin/VideoAddForm";
import AnalyticsSection from "@/components/admin/AnalyticsSection";
import VideoListSection from "@/components/admin/VideoListSection";
import YouTubeConnectionBlock from "@/components/admin/YouTubeConnectionBlock";
import { useYoutubeConnection } from "@/lib/hooks/useYoutubeConnection";

interface HouseholdOption {
  id: string;
  name: string;
}

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

  const [households, setHouseholds] = useState<HouseholdOption[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [loadingHouseholds, setLoadingHouseholds] = useState(true);

  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [youtubeToast, setYoutubeToast] = useState<"connected" | "error" | null>(null);
  const searchParams = useSearchParams();

  const {
    status: youtubeStatus,
    loading: youtubeLoading,
    error: youtubeError,
    fetchStatus: fetchYoutubeStatus,
    connect: handleConnectYouTube,
    disconnect: handleDisconnectYouTube,
  } = useYoutubeConnection(selectedHouseholdId);

  useEffect(() => {
    const youtube = searchParams.get("youtube");
    if (youtube === "connected" || youtube === "error") {
      setYoutubeToast(youtube);
      router.replace("/admin", { scroll: false });
      if (youtube === "connected") fetchYoutubeStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchYoutubeStatus runs after URL replace; avoid deps loop
  }, [searchParams]);


  useEffect(() => {
    if (youtubeToast) {
      const t = setTimeout(() => setYoutubeToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [youtubeToast]);

  useEffect(() => {
    (async () => {
      setLoadingHouseholds(true);
      try {
        const res = await fetch("/api/households");
        const data = await res.json();
        if (res.ok && data.households?.length > 0) {
          setHouseholds(data.households);
          setSelectedHouseholdId((prev) => prev ?? data.households[0].id);
        }
      } catch (error) {
        console.error("Error fetching households:", error);
      } finally {
        setLoadingHouseholds(false);
      }
    })();
  }, []);

  const fetchVideos = useCallback(async (page: number = currentPage) => {
    if (!selectedHouseholdId) return;
    setLoadingVideos(true);
    try {
      const response = await fetch(
        `/api/videos?household_id=${selectedHouseholdId}&page=${page}&limit=${pageSize}`
      );
      const data = await response.json();

      if (response.ok) {
        setVideos(data.videos || []);
        if (data.pagination) {
          setTotalVideos(data.pagination.total);
          setTotalPages(data.pagination.totalPages);
          setCurrentPage(data.pagination.page);
        }
      } else {
        console.error("Error fetching videos:", data.error);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [selectedHouseholdId, pageSize, currentPage]);

  useEffect(() => {
    if (selectedHouseholdId) fetchVideos();
  }, [selectedHouseholdId, fetchVideos]);

  const handleBulkDelete = async (videosToDelete: Video[]) => {
    const count = videosToDelete.length;
    if (
      !confirm(
        `Are you sure you want to remove ${count} video${count > 1 ? "s" : ""}?`
      )
    ) {
      return;
    }

    setDeletingVideoId("bulk");

    try {
      // Delete all videos in parallel
      const deletePromises = videosToDelete.map((video) =>
        fetch(`/api/videos/${video.id}`, {
          method: "DELETE",
        })
      );

      const results = await Promise.all(deletePromises);

      // Check for any failures
      const failures = results.filter((r) => !r.ok);
      if (failures.length > 0) {
        alert(
          `Failed to delete ${failures.length} video${failures.length > 1 ? "s" : ""}`
        );
      }

      // Refresh the video list
      await fetchVideos();
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      alert(error.message || "An error occurred during bulk delete");
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                ZooTube Admin
              </h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
            {households.length > 1 && (
              <div className="flex items-center gap-2">
                <label htmlFor="household-select" className="text-sm font-medium text-gray-700">
                  Video list:
                </label>
                <select
                  id="household-select"
                  className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-600"
                  value={selectedHouseholdId ?? ""}
                  onChange={(e) => setSelectedHouseholdId(e.target.value)}
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              aria-label="Logout from admin account"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Safety Notice */}
          <div className="rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important: Supervise Viewing
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    YouTube's embedded player may show recommendations from the
                    same channel when videos pause or end. We've configured the
                    player with maximum restrictions (rel=0, modestbranding,
                    etc.), but YouTube's ToS doesn't allow completely disabling
                    recommendations. We recommend supervising young children
                    during viewing and only adding videos from trusted,
                    kid-safe channels.
                  </p>
                </div>
          </div>
          </div>
        </div>

          {/* YouTube connection */}
          <YouTubeConnectionBlock
            householdId={selectedHouseholdId}
            status={youtubeStatus}
            loading={youtubeLoading}
            error={youtubeError}
            onConnect={handleConnectYouTube}
            onDisconnect={handleDisconnectYouTube}
            toast={youtubeToast}
          />

          {/* Add Video Section */}
          {selectedHouseholdId && (
          <VideoAddForm
            householdId={selectedHouseholdId}
            onVideoAdded={fetchVideos}
            onError={(error) => {
              setAddError(error);
              setTimeout(() => setAddError(null), 5000);
            }}
            onSuccess={(message) => {
              setAddSuccess(message);
              setTimeout(() => setAddSuccess(null), 3000);
            }}
          />
          )}

          {/* Error Display */}
          {addError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{addError}</div>
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {addSuccess && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    {addSuccess}
                  </h3>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          <AnalyticsSection videos={videos} loading={loadingVideos} />

          {/* Video List Section */}
          <VideoListSection
            videos={videos}
            loading={loadingVideos}
            onBulkDelete={handleBulkDelete}
            pagination={{
              currentPage,
              totalPages,
              totalVideos,
              pageSize,
              onPageChange: (page: number) => {
                setCurrentPage(page);
                fetchVideos(page);
              },
            }}
          />
        </div>
      </main>
    </div>
  );
}
