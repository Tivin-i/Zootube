/**
 * Cross-browser fullscreen utility functions
 */

/**
 * Request fullscreen for an element (cross-browser compatible)
 */
export async function requestFullscreen(element: HTMLElement): Promise<void> {
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if ((element as any).webkitRequestFullscreen) {
      await (element as any).webkitRequestFullscreen();
    } else if ((element as any).mozRequestFullScreen) {
      await (element as any).mozRequestFullScreen();
    } else if ((element as any).msRequestFullscreen) {
      await (element as any).msRequestFullscreen();
    }
  } catch (error) {
    console.error("Failed to enter fullscreen:", error);
    throw error;
  }
}

/**
 * Exit fullscreen (cross-browser compatible)
 */
export async function exitFullscreen(): Promise<void> {
  try {
    if (document.exitFullscreen) {
      await document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      await (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      await (document as any).msExitFullscreen();
    }
  } catch (error) {
    console.error("Failed to exit fullscreen:", error);
    throw error;
  }
}

/**
 * Check if an element is in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).mozFullScreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Add fullscreen change event listener (cross-browser compatible)
 */
export function addFullscreenChangeListener(
  callback: () => void
): () => void {
  document.addEventListener("fullscreenchange", callback);
  document.addEventListener("webkitfullscreenchange", callback);
  document.addEventListener("mozfullscreenchange", callback);
  document.addEventListener("MSFullscreenChange", callback);

  // Return cleanup function
  return () => {
    document.removeEventListener("fullscreenchange", callback);
    document.removeEventListener("webkitfullscreenchange", callback);
    document.removeEventListener("mozfullscreenchange", callback);
    document.removeEventListener("MSFullscreenChange", callback);
  };
}
