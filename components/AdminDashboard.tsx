"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect, useCallback } from "react";
import { Video } from "@/types/database";
import Image from "next/image";
import { DataTable } from "@/components/ui/data-table";
import { videoColumns } from "@/components/video-columns";

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

  // Video management state
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    try {
      const response = await fetch(`/api/videos?parent_id=${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setVideos(data.videos || []);
      } else {
        console.error("Error fetching videos:", data.error);
      }
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, [user.id]);

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleAddVideo = async (e: React.FormEvent, forceConfirm = false) => {
    e.preventDefault();
    setAddingVideo(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          confirmed: forceConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAddError(data.error || "Failed to add video");
      } else if (data.warning) {
        // Video is not "Made for Kids" - show confirmation dialog
        setAddingVideo(false); // Reset loading state before showing dialog

        const userConfirmed = confirm(
          `⚠️ Warning\n\n${data.message}\n\nVideo: "${data.metadata.title}"`
        );

        if (userConfirmed) {
          // Re-submit with confirmation
          setAddingVideo(true);
          try {
            const confirmResponse = await fetch("/api/videos", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: videoUrl,
                confirmed: true,
              }),
            });

            const confirmData = await confirmResponse.json();

            if (confirmResponse.ok && !confirmData.warning) {
              setAddSuccess("Video added successfully!");
              setVideoUrl("");
              await fetchVideos();
              setTimeout(() => setAddSuccess(null), 3000);
            } else {
              setAddError(confirmData.error || "Failed to add video");
            }
          } catch (error: any) {
            setAddError(error.message || "An error occurred");
          } finally {
            setAddingVideo(false);
          }
        }
        return; // Exit early after handling warning
      } else {
        setAddSuccess("Video added successfully!");
        setVideoUrl("");
        // Refresh video list
        await fetchVideos();
        // Clear success message after 3 seconds
        setTimeout(() => setAddSuccess(null), 3000);
      }
    } catch (error: any) {
      setAddError(error.message || "An error occurred");
    } finally {
      setAddingVideo(false);
    }
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                ZooTube Admin
              </h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
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
                    YouTube's embedded player may show recommendations from the same channel when videos pause or end.
                    We've configured the player with maximum restrictions (rel=0, modestbranding, etc.), but YouTube's ToS
                    doesn't allow completely disabling recommendations. We recommend supervising young children during viewing
                    and only adding videos from trusted, kid-safe channels.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Add Video Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Add YouTube Video
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Paste a YouTube video URL to add it to your child's collection.
            </p>

            <form onSubmit={handleAddVideo} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="block flex-1 rounded-md border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  required
                />
                <button
                  type="submit"
                  disabled={addingVideo}
                  className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addingVideo ? "Adding..." : "Add Video"}
                </button>
              </div>
            </form>

            {/* Error Display */}
            {addError && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
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
              <div className="mt-4 rounded-md bg-green-50 p-4">
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
          </div>

          {/* Video List Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Video Collection
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {videos.length} video{videos.length !== 1 ? "s" : ""} in your
                  collection
                </p>
              </div>
            </div>

            {loadingVideos ? (
              <div className="flex justify-center py-12">
                <div className="text-sm text-gray-500">Loading videos...</div>
              </div>
            ) : videos.length === 0 ? (
              <div className="rounded-md border-2 border-dashed border-gray-300 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No videos yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a YouTube video above.
                </p>
              </div>
            ) : (
              <DataTable
                columns={videoColumns}
                data={videos}
                onDeleteSelected={handleBulkDelete}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
