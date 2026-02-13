"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Video } from "@/types/database";
import { useVideoPlayer } from "@/lib/hooks/useVideoPlayer";
import {
  requestFullscreen,
  addFullscreenChangeListener,
} from "@/lib/utils/fullscreen";

const MODAL_PLAYER_CONTAINER_ID = "youtube-player-modal";

interface VideoModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
}

type PlayMode = "playing" | "break" | "done";

export default function VideoModal({ video, isOpen, onClose }: VideoModalProps) {
  const [playMode, setPlayMode] = useState<PlayMode>("playing");
  const [showPlayButton, setShowPlayButton] = useState(true);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const videoId = isOpen && video ? video.youtube_id : "";
  const getPlayerStateRef = useRef<() => number>(() => -1);

  const {
    playVideo,
    pauseVideo,
    stopVideo,
    seekTo,
    getCurrentTime,
    getPlayerState,
    isReady,
  } = useVideoPlayer({
    videoId,
    containerId: MODAL_PLAYER_CONTAINER_ID,
    onStateChange: useCallback((event: { data: number }) => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (event.data === 0) {
        setPlayMode("break");
        setShowPlayButton(true);
      } else if (event.data === 2 && isIOS) {
        setTimeout(() => {
          if (getPlayerStateRef.current() === 2) {
            setPlayMode("break");
            setShowPlayButton(true);
          }
        }, 1500);
      }
    }, []),
    autoplay: false,
  });

  getPlayerStateRef.current = getPlayerState;

  // Reset state when video changes or modal opens
  useEffect(() => {
    if (isOpen && video) {
      setPlayMode("playing");
      setShowPlayButton(true);
    }
  }, [isOpen, video]);

  // Listen for fullscreen exit
  useEffect(() => {
    const unsubscribe = addFullscreenChangeListener(() => {
      if (!document.fullscreenElement && playMode === "playing") {
        setPlayMode("break");
        setShowPlayButton(true);
        pauseVideo();
      }
    });
    return unsubscribe;
  }, [playMode, pauseVideo]);

  const handlePlayClick = async () => {
    if (!isReady || !playerContainerRef.current) return;
    setShowPlayButton(false);
    setPlayMode("playing");
    playVideo();
    try {
      await requestFullscreen(playerContainerRef.current);
    } catch {
      // Continue playing even if fullscreen fails (iOS will use native player)
    }
  };

  const handleBackToVideo = async () => {
    if (!isReady) return;
    setPlayMode("playing");
    setShowPlayButton(false);
    try {
      const currentTime = getCurrentTime();
      seekTo(Math.max(0, currentTime - 3));
      playVideo();
      if (playerContainerRef.current) {
        await requestFullscreen(playerContainerRef.current);
      }
    } catch (error) {
      console.error("Error in handleBackToVideo:", error);
    }
  };

  const handleDone = () => {
    setPlayMode("done");
    pauseVideo();
  };

  const handleWatchOtherVideo = () => {
    stopVideo();
    onClose();
  };

  const handleModalClose = () => {
    stopVideo();
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleModalClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  if (!isOpen || !video) return null;

  return (
    <div
      ref={modalRef}
      className={`fixed inset-0 z-50 ${
        playMode === "playing"
          ? "bg-black"
          : "bg-gradient-to-br from-blue-600 to-purple-600"
      }`}
    >
      <div
        className={`flex items-center justify-center ${
          playMode === "playing"
            ? "h-full w-full"
            : "absolute opacity-0 pointer-events-none"
        }`}
      >
        <div
          ref={playerContainerRef}
          className={`relative bg-black ${
            showPlayButton ? "w-[90%] aspect-video" : "h-full w-full"
          }`}
        >
          <div id={MODAL_PLAYER_CONTAINER_ID} className="h-full w-full" />

          {playMode === "playing" && showPlayButton && video.thumbnail_url && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
              <Image
                src={video.thumbnail_url}
                alt={video.title || "Video thumbnail"}
                fill
                className="object-cover"
                unoptimized
              />
              <button
                onClick={handlePlayClick}
                className="absolute z-20 flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-all active:scale-95 sm:h-24 sm:w-24 sm:hover:scale-110 sm:hover:bg-red-500"
                aria-label="Play video"
              >
                <svg
                  className="ml-1 h-10 w-10 text-white sm:h-12 sm:w-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Break Mode - Redesigned per safetube mockup */}
      {playMode === "break" && (
        <div className="flex h-full w-full flex-col landscape:flex-row">
          {/* Top Section (Portrait) / Left Section (Landscape) - White Background */}
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-white p-6 sm:gap-6 sm:p-8">
            <Image
              src="/img/giraffe_break.png"
              alt="Giraffe on bike"
              width={600}
              height={628}
              className="w-48 sm:w-64 landscape:w-56"
              priority
            />
            <h2 className="text-center font-chewy text-2xl font-bold text-gray-800 sm:text-3xl landscape:text-2xl">
              Time to take a break?
            </h2>
            <button
              onClick={handleDone}
              className="w-full max-w-xs rounded-full px-6 py-3 font-chewy text-xl font-bold text-white shadow-xl transition-all active:scale-95 sm:max-w-sm sm:px-8 sm:py-4 sm:text-2xl sm:hover:scale-105 landscape:max-w-xs landscape:text-lg"
              style={{ backgroundColor: "var(--color-btn-primary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-btn-primary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-btn-primary)")
              }
            >
              Ok, I&apos;m done!
            </button>
          </div>
          {/* Bottom Section (Portrait) / Right Section (Landscape) - Blue Background */}
          <div
            className="flex flex-1 flex-col items-center justify-center gap-4 p-6 sm:gap-6 sm:p-8"
            style={{ backgroundColor: "var(--color-primary-blue)" }}
          >
            <p className="text-center text-base font-medium text-white sm:text-lg">
              Back to my video
            </p>
            <button
              onClick={handleBackToVideo}
              className="group relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl transition-all active:scale-95 sm:hover:scale-105 landscape:max-w-md"
              aria-label="Back to my video"
            >
              {video?.thumbnail_url && (
                <div className="relative aspect-video w-full">
                  <Image
                    src={video.thumbnail_url}
                    alt={video.title || "Video thumbnail"}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 transition-all group-hover:scale-110 sm:h-20 sm:w-20">
                      <svg
                        className="ml-1 h-8 w-8 text-white sm:h-10 sm:w-10"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={handleWatchOtherVideo}
              className="text-center text-sm font-medium text-white transition-all active:opacity-80 sm:text-base sm:hover:underline"
            >
              Watch something else
            </button>
          </div>
        </div>
      )}

      {/* Done Mode - Celebration screen (safetube design) */}
      {playMode === "done" && (
        <div className="flex h-full w-full flex-col items-center justify-center bg-white landscape:flex-row">
          <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
            <Image
              src="/img/giraffe_celerate.png"
              alt="Celebrating giraffe"
              width={600}
              height={628}
              className="w-48 sm:w-64 landscape:w-56"
              priority
            />
          </div>
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-4 text-center sm:space-y-6 sm:p-6">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="font-chewy text-3xl font-bold text-gray-800 sm:text-4xl landscape:text-3xl">
                Well done!
              </h2>
              <p className="text-lg text-gray-600 sm:text-xl landscape:text-lg">
                See you next time
              </p>
            </div>
            <button
              onClick={handleWatchOtherVideo}
              className="rounded-full px-8 py-3 text-base font-medium text-gray-700 shadow-lg transition-all active:scale-95 sm:px-10 sm:py-3 sm:text-lg sm:hover:scale-105"
              style={{ backgroundColor: "var(--color-btn-secondary)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-btn-secondary-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  "var(--color-btn-secondary)")
              }
            >
              Watch something else
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
