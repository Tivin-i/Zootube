"use client";

import { useState } from "react";
import VideoSelector from "@/components/VideoSelector";

interface VideoPreview {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  madeForKids: boolean;
}

interface VideoAddFormProps {
  householdId: string;
  onVideoAdded: () => void;
  onError: (error: string | null) => void;
  onSuccess: (message: string) => void;
}

export default function VideoAddForm({
  householdId,
  onVideoAdded,
  onError,
  onSuccess,
}: VideoAddFormProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [inputMode, setInputMode] = useState<"single" | "batch">("single");
  const [batchVideos, setBatchVideos] = useState<VideoPreview[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<VideoPreview[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [batchType, setBatchType] = useState<
    "video" | "channel" | "playlist" | null
  >(null);

  const handleAddVideo = async (e: React.FormEvent, forceConfirm = false) => {
    e.preventDefault();
    setAddingVideo(true);
    onError(null);

    try {
      const response = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          household_id: householdId,
          confirmed: forceConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.code === "YOUTUBE_CONNECTION_REQUIRED") {
          onError("Connect the child's YouTube account for this list before adding videos or channels.");
        } else {
          onError(data.error || "Failed to add video");
        }
      } else if (data.warning) {
        // Video is not "Made for Kids" - show confirmation dialog
        setAddingVideo(false);

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
                household_id: householdId,
                confirmed: true,
              }),
            });

            const confirmData = await confirmResponse.json();

            if (confirmResponse.ok && !confirmData.warning) {
              onSuccess("Video added successfully!");
              setVideoUrl("");
              onVideoAdded();
              setTimeout(() => onSuccess(""), 3000);
            } else {
              onError(confirmData.error || "Failed to add video");
            }
          } catch (error: any) {
            onError(error.message || "An error occurred");
          } finally {
            setAddingVideo(false);
          }
        }
        return;
      } else {
        onSuccess("Video added successfully!");
        setVideoUrl("");
        onVideoAdded();
        setTimeout(() => onSuccess(""), 3000);
      }
    } catch (error: any) {
      onError(error.message || "An error occurred");
    } finally {
      setAddingVideo(false);
    }
  };

  const handleFetchBatch = async (pageToken?: string) => {
    setLoadingBatch(true);
    onError(null);

    try {
      const response = await fetch("/api/youtube-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: videoUrl,
          household_id: householdId,
          pageToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const msg = data.error || "Failed to fetch videos";
        if (response.status === 403 && data.code === "YOUTUBE_CONNECTION_REQUIRED") {
          onError(
            "Connect the child's YouTube account for this list before adding videos or channels."
          );
        } else {
          onError(msg);
        }
        setInputMode("single");
        return;
      }

      setBatchType(data.type);

      if (data.type === "video") {
        // Single video - just add it
        setInputMode("single");
        await handleAddVideo(new Event("submit") as any);
      } else {
        // Channel or playlist - show selection UI
        setInputMode("batch");
        setBatchVideos((prev) => [...prev, ...data.videos]);
        setNextPageToken(data.nextPageToken || null);
      }
    } catch (error: any) {
      onError(error.message || "An error occurred");
      setInputMode("single");
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleBulkAdd = async () => {
    if (selectedVideos.length === 0) {
      onError("Please select at least one video");
      return;
    }

    setAddingVideo(true);
    onError(null as any);

    try {
      // Add all selected videos in parallel
      const addPromises = selectedVideos.map((video) =>
        fetch("/api/videos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: `https://www.youtube.com/watch?v=${video.videoId}`,
            household_id: householdId,
            confirmed: true,
          }),
        })
      );

      const results = await Promise.all(addPromises);
      const failures = results.filter((r) => !r.ok);

      if (failures.length > 0) {
        onError(
          `Added ${results.length - failures.length} videos, ${failures.length} failed`
        );
      } else {
        onSuccess(`Successfully added ${results.length} videos!`);
      }

      // Reset batch state
      setVideoUrl("");
      setBatchVideos([]);
      setSelectedVideos([]);
      setNextPageToken(null);
      setInputMode("single");

      onVideoAdded();
      setTimeout(() => onSuccess(""), 3000);
    } catch (error: any) {
      onError(error.message || "An error occurred");
    } finally {
      setAddingVideo(false);
    }
  };

  const handleCancelBatch = () => {
    setBatchVideos([]);
    setSelectedVideos([]);
    setNextPageToken(null);
    setInputMode("single");
    setVideoUrl("");
    onError(null);
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900">
        Add YouTube Videos
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Paste a YouTube video, channel, or playlist URL. Channels and playlists
        allow you to preview and select videos.
      </p>

      {inputMode === "single" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetchBatch();
          }}
          className="mt-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="Video: youtube.com/watch?v=... | Channel: youtube.com/@... | Playlist: youtube.com/playlist?list=..."
              className="block flex-1 rounded-md border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              required
            />
            <button
              type="submit"
              disabled={addingVideo || loadingBatch}
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingBatch ? "Loading..." : addingVideo ? "Adding..." : "Fetch"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Batch Mode Header */}
          <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
            <div>
              <p className="text-sm font-medium text-blue-900">
                {batchType === "channel" ? "Channel" : "Playlist"} Preview
              </p>
              <p className="text-xs text-blue-700">{videoUrl}</p>
            </div>
            <button
              onClick={handleCancelBatch}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Cancel
            </button>
          </div>

          {/* Video Selector */}
          <VideoSelector
            videos={batchVideos}
            onSelectionChange={setSelectedVideos}
            onLoadMore={() => handleFetchBatch(nextPageToken || undefined)}
            hasMore={!!nextPageToken}
            loading={loadingBatch}
            totalLoaded={batchVideos.length}
          />

          {/* Add Selected Button */}
          <button
            onClick={handleBulkAdd}
            disabled={selectedVideos.length === 0 || addingVideo}
            className="w-full rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingVideo
              ? "Adding..."
              : `Add ${selectedVideos.length} Selected Video${selectedVideos.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
