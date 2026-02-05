"use client";

import type { YoutubeConnectionStatus } from "@/lib/hooks/useYoutubeConnection";

interface YouTubeConnectionBlockProps {
  householdId: string | null;
  status: YoutubeConnectionStatus;
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  toast?: "connected" | "error" | null;
}

export default function YouTubeConnectionBlock({
  householdId,
  status,
  loading,
  error,
  onConnect,
  onDisconnect,
  toast,
}: YouTubeConnectionBlockProps) {
  if (!householdId) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">YouTube account</h2>
      <p className="mt-1 text-sm text-gray-500">
        Sign in with the YouTube account you want to link (e.g. your child's).
        One account per list.
      </p>
      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {loading ? (
          <span className="text-sm text-gray-500">Loading…</span>
        ) : status.connected ? (
          <>
            <span className="inline-flex items-center rounded-md bg-green-50 px-2.5 py-1 text-sm font-medium text-green-800">
              YouTube connected
              {status.channelId && (
                <span className="ml-1.5 text-green-600">
                  ({status.channelId})
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              disabled={loading}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Disconnect
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
            aria-label="Connect YouTube account for this list"
          >
            Connect YouTube
          </button>
        )}
      </div>
      {toast && (
        <div
          className={`mt-4 rounded-lg border p-4 ${
            toast === "connected"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role="status"
        >
          {toast === "connected"
            ? "YouTube account connected successfully."
            : "Could not connect YouTube. Please try again."}
        </div>
      )}
    </div>
  );
}
