/**
 * Format duration from seconds to MM:SS or HH:MM:SS format
 * @param seconds - Duration in seconds (can be null)
 * @returns Formatted duration string (e.g., "5:30" or "1:05:30")
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format duration from ISO 8601 duration string (PT1H2M3S) to MM:SS or HH:MM:SS format
 * @param isoDuration - ISO 8601 duration string (e.g., "PT1H2M3S")
 * @returns Formatted duration string (e.g., "5:30" or "1:05:30")
 */
export function formatDurationFromISO(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
