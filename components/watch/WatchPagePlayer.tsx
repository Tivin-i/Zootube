"use client";

import { useRef, useState, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
import Image from "next/image";
import { Video } from "@/types/database";
import { useVideoPlayer } from "@/lib/hooks/useVideoPlayer";
import {
  requestFullscreen,
  addFullscreenChangeListener,
} from "@/lib/utils/fullscreen";

const WATCH_PLAYER_CONTAINER_ID = "youtube-player";

export interface WatchPagePlayerHandle {
  seekTo: (seconds: number) => void;
  reset: () => void;
}

interface WatchPagePlayerProps {
  video: Video;
  onBreakRequested: () => void;
}

const WatchPagePlayer = forwardRef<WatchPagePlayerHandle, WatchPagePlayerProps>(
  function WatchPagePlayer({ video, onBreakRequested }, ref) {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedPlayingRef = useRef(false);
  const [showPlayButton, setShowPlayButton] = useState(true);

  const onStateChange = (event: { data: number }) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (event.data === 0) {
      onBreakRequested();
    } else if (event.data === 2 && isIOS) {
      onBreakRequested();
    }
  };

  const { playVideo, seekTo, isReady } = useVideoPlayer({
    videoId: video.youtube_id,
    containerId: WATCH_PLAYER_CONTAINER_ID,
    onStateChange,
    autoplay: false,
  });

  const reset = useCallback(() => {
    setShowPlayButton(true);
    hasStartedPlayingRef.current = false;
  }, []);
  useImperativeHandle(ref, () => ({ seekTo, reset }), [seekTo, reset]);

  // Listen for fullscreen exit (show break when user exits fullscreen)
  useEffect(() => {
    const unsubscribe = addFullscreenChangeListener(() => {
      if (!document.fullscreenElement && hasStartedPlayingRef.current) {
        onBreakRequested();
      }
    });
    return unsubscribe;
  }, [onBreakRequested]);

  const handlePlayClick = async () => {
    if (!isReady || !playerContainerRef.current) return;
    hasStartedPlayingRef.current = true;
    setShowPlayButton(false);
    playVideo();
    try {
      await requestFullscreen(playerContainerRef.current);
    } catch {
      // Continue playing even if fullscreen fails
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className="relative overflow-hidden rounded-lg bg-black shadow-lg"
      style={{ paddingBottom: "56.25%" }}
    >
      <div
        id={WATCH_PLAYER_CONTAINER_ID}
        className="absolute inset-0 h-full w-full"
      />
      {showPlayButton && video.thumbnail_url && (
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
            className="absolute z-20 flex h-24 w-24 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-all hover:scale-110 hover:bg-red-500 active:scale-95"
            aria-label="Play video in fullscreen"
          >
            <svg
              className="ml-1 h-12 w-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

export default WatchPagePlayer;
