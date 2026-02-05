"use client";

import { useState, useCallback, useEffect } from "react";

export interface YoutubeConnectionStatus {
  connected: boolean;
  channelId?: string | null;
}

export function useYoutubeConnection(householdId: string | null) {
  const [status, setStatus] = useState<YoutubeConnectionStatus>({
    connected: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube-connection?household_id=${encodeURIComponent(householdId)}`
      );
      const data = await res.json();
      if (res.ok) {
        setStatus({
          connected: data.connected ?? false,
          channelId: data.channelId ?? null,
        });
      } else {
        setStatus({ connected: false });
        if (res.status === 401 || res.status === 403) {
          setError("You don't have access to this list.");
        } else {
          setError(data.error ?? "Could not load YouTube connection.");
        }
      }
    } catch {
      setStatus({ connected: false });
      setError("Could not load YouTube connection.");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (householdId) fetchStatus();
  }, [householdId, fetchStatus]);

  const connect = useCallback(() => {
    if (!householdId) return;
    window.location.href = `/api/auth/youtube?household_id=${encodeURIComponent(householdId)}`;
  }, [householdId]);

  const disconnect = useCallback(async () => {
    if (!householdId || !confirm("Disconnect YouTube from this list? You can connect again later."))
      return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/youtube-connection?household_id=${encodeURIComponent(householdId)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setStatus({ connected: false });
      } else {
        const data = await res.json();
        setError(data.error ?? "Could not disconnect.");
      }
    } catch {
      setError("Could not disconnect.");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  return {
    status,
    loading,
    error,
    fetchStatus,
    connect,
    disconnect,
  };
}
