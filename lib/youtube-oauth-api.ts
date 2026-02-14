/**
 * YouTube Data API v3 client using OAuth access token (Bearer).
 * No API key; Workers-safe (fetch only).
 */

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Call YouTube Data API v3 with Bearer token. Same semantics as key-based calls
 * (videos, playlistItems, channels) but uses the household's connected account.
 */
export async function youtubeFetchWithAccessToken(
  accessToken: string,
  path: string,
  params: Record<string, string>
): Promise<unknown> {
  const url = new URL(`${YOUTUBE_API_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`YouTube API ${res.status}: ${await res.text()}`);
  return res.json();
}
