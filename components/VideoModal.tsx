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

      {playMode === "break" && (
        <div className="flex h-full w-full flex-col items-center justify-between p-4 sm:p-6">
          <div className="flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6">
            <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
              Take a Break?
            </h2>
            <button
              onClick={handleBackToVideo}
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
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-center text-sm font-semibold text-white">
                      👆 Tap to continue watching
                    </p>
                  </div>
                </div>
              )}
            </button>
          </div>
          <div className="w-full max-w-md space-y-3 sm:space-y-4">
            <button
              onClick={handleDone}
              className="w-full rounded-full bg-green-500 px-6 py-4 text-xl font-bold text-white shadow-2xl transition-all active:scale-95 sm:px-8 sm:py-5 sm:text-2xl sm:hover:scale-105 sm:hover:bg-green-400"
            >
              ✓ I'm Done!
            </button>
            <button
              onClick={handleWatchOtherVideo}
              className="w-full rounded-full bg-white/20 px-5 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all active:scale-95 sm:px-6 sm:hover:bg-white/30"
            >
              Watch Other Video
            </button>
          </div>
        </div>
      )}

      {playMode === "done" && (
        <div className="flex h-full w-full flex-col items-center justify-center space-y-6 bg-gradient-to-br from-blue-600 to-purple-600 p-4 text-center sm:space-y-8 sm:p-6">
          <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-yellow-400 shadow-2xl sm:h-40 sm:w-40">
            <svg
              className="h-20 w-20 text-white sm:h-24 sm:w-24"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Well Done!
            </h2>
            <p className="text-xl text-white/90 sm:text-2xl">
              See you next time! 👋
            </p>
          </div>
          <button
            onClick={handleWatchOtherVideo}
            className="rounded-full bg-white px-10 py-3 text-base font-bold text-blue-600 shadow-2xl transition-all active:scale-95 sm:px-12 sm:py-4 sm:text-lg sm:hover:scale-105"
          >
            Watch Other Video
          </button>
        </div>
      )}
    </div>
  );
}
