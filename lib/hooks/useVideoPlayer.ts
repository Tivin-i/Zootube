"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Declare YouTube IFrame API types
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface UseVideoPlayerOptions {
  videoId: string;
  containerId: string;
  onStateChange?: (event: any) => void;
  autoplay?: boolean;
}

interface UseVideoPlayerReturn {
  player: any;
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number) => void;
  getCurrentTime: () => number;
  getPlayerState: () => number;
  isReady: boolean;
}

/**
 * Custom hook for managing YouTube IFrame Player
 * Handles API loading, player initialization, and common operations
 */
export function useVideoPlayer({
  videoId,
  containerId,
  onStateChange,
  autoplay = false,
}: UseVideoPlayerOptions): UseVideoPlayerReturn {
  const [isReady, setIsReady] = useState(false);
  const playerRef = useRef<any>(null);
  const onStateChangeRef = useRef(onStateChange);

  // Keep callback ref updated
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  // Load YouTube IFrame API and initialize player
  useEffect(() => {
    if (!videoId) return;

    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      initializePlayer();
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
    };

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (error) {
          console.error("Error destroying player:", error);
        }
        playerRef.current = null;
      }
    };
  }, [videoId, containerId]);

  const initializePlayer = () => {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with id "${containerId}" not found`);
      return;
    }

    try {
      playerRef.current = new window.YT.Player(containerId, {
        height: "100%",
        width: "100%",
        videoId: videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          color: "white",
          playsinline: 1,
          fs: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            if (onStateChangeRef.current) {
              onStateChangeRef.current(event);
            }
          },
        },
      });
    } catch (error) {
      console.error("Error initializing YouTube player:", error);
    }
  };

  const playVideo = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.playVideo();
      } catch (error) {
        console.error("Error playing video:", error);
      }
    }
  }, [isReady]);

  const pauseVideo = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.pauseVideo();
      } catch (error) {
        console.error("Error pausing video:", error);
      }
    }
  }, [isReady]);

  const stopVideo = useCallback(() => {
    if (playerRef.current && isReady) {
      try {
        playerRef.current.stopVideo();
      } catch (error) {
        console.error("Error stopping video:", error);
      }
    }
  }, [isReady]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (playerRef.current && isReady) {
        try {
          playerRef.current.seekTo(seconds, true);
        } catch (error) {
          console.error("Error seeking video:", error);
        }
      }
    },
    [isReady]
  );

  const getCurrentTime = useCallback((): number => {
    if (playerRef.current && isReady) {
      try {
        return playerRef.current.getCurrentTime();
      } catch (error) {
        console.error("Error getting current time:", error);
      }
    }
    return 0;
  }, [isReady]);

  const getPlayerState = useCallback((): number => {
    if (playerRef.current && isReady) {
      try {
        return playerRef.current.getPlayerState();
      } catch (error) {
        console.error("Error getting player state:", error);
      }
    }
    return -1;
  }, [isReady]);

  return {
    player: playerRef.current,
    playVideo,
    pauseVideo,
    stopVideo,
    seekTo,
    getCurrentTime,
    getPlayerState,
    isReady,
  };
}
