"use client";

import { useEffect, useState, useRef } from "react";
import { Video } from "@/types/database";

interface VideoModalProps {
  video: Video;
  isOpen: boolean;
  onClose: () => void;
}

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  const [showBreakModal, setShowBreakModal] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const apiLoadedRef = useRef(false);
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track watch on mount
  useEffect(() => {
    if (isOpen && video) {
      trackWatch(video.id);
    }
  }, [isOpen, video]);

  const trackWatch = async (id: string) => {
    try {
      await fetch(`/api/videos/${id}/watch`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to track watch:", error);
    }
  };

  // Load YouTube IFrame API
  useEffect(() => {
    if (!isOpen || apiLoadedRef.current) return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
      apiLoadedRef.current = true;
      return;
    }

    // Load the IFrame Player API code asynchronously
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    // Create player when API is ready
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
      apiLoadedRef.current = true;
    };
  }, [isOpen]);

  const initializePlayer = () => {
    if (!playerContainerRef.current || !video) return;

    // Clear existing player
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player(playerContainerRef.current, {
      videoId: video.youtube_id,
      playerVars: {
        autoplay: 1, // Auto-play when ready
        controls: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1, // Important for iOS
        enablejsapi: 1,
      },
      events: {
        onReady: (event: any) => {
          // Auto-play and request fullscreen on iOS
          event.target.playVideo();

          // Request fullscreen (works better on iOS than native fullscreen API)
          const iframe = event.target.getIframe();
          if (iframe.requestFullscreen) {
            iframe.requestFullscreen().catch(() => {
              // Fullscreen denied, continue anyway
            });
          } else if (iframe.webkitRequestFullscreen) {
            // iOS Safari fallback
            iframe.webkitRequestFullscreen();
          }

          // Set up break timer (30 minutes)
          breakTimerRef.current = setTimeout(() => {
            handleTakeBreak();
          }, 30 * 60 * 1000);
        },
        onStateChange: (event: any) => {
          // Handle video end
          if (event.data === window.YT.PlayerState.ENDED) {
            handleVideoEnd();
          }
        },
      },
    });
  };

  const handleTakeBreak = () => {
    if (playerRef.current) {
      // Save current playback position
      const currentTime = playerRef.current.getCurrentTime();
      setSavedPosition(currentTime);

      // Pause the video
      playerRef.current.pauseVideo();
    }

    setShowBreakModal(true);

    // Clear the break timer
    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }
  };

  const handleContinueWatching = () => {
    setShowBreakModal(false);

    if (playerRef.current && savedPosition > 0) {
      // Resume from saved position
      playerRef.current.seekTo(savedPosition, true);
      playerRef.current.playVideo();

      // Restart break timer
      breakTimerRef.current = setTimeout(() => {
        handleTakeBreak();
      }, 30 * 60 * 1000);
    }
  };

  const handleVideoEnd = () => {
    // Close modal when video ends
    handleClose();
  };

  const handleClose = () => {
    // Clean up
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    if (breakTimerRef.current) {
      clearTimeout(breakTimerRef.current);
      breakTimerRef.current = null;
    }

    setSavedPosition(0);
    setShowBreakModal(false);
    onClose();
  };

  // Handle ESC key and body scroll lock
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Unlock body scroll
      document.body.style.overflow = "";
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !showBreakModal) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, showBreakModal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      if (breakTimerRef.current) {
        clearTimeout(breakTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* Video Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-3 text-white hover:bg-black/70"
          aria-label="Close video"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Video Container */}
        <div className="h-full w-full">
          <div
            ref={playerContainerRef}
            className="h-full w-full"
            id="youtube-player"
          />
        </div>
      </div>

      {/* Take a Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
          <div className="mx-4 max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <svg
                className="h-8 w-8 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 font-chewy text-2xl text-gray-900">
              Time for a Break!
            </h2>
            <p className="mb-6 text-gray-600">
              You've been watching for a while. Take a break and stretch!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleClose}
                className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-500"
              >
                Watch Other Videos
              </button>
              <button
                onClick={handleContinueWatching}
                className="rounded-lg border-2 border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >
                Continue This Video
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
