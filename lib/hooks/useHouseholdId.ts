"use client";

import { useState, useEffect } from "react";

export interface DeviceTokenResult {
  householdId: string | null;
  parentId: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearHouseholdId: () => Promise<void>;
}

/**
 * Hook to get household ID (and optional parent ID) from device token via API.
 * Used by child feed and watch pages to load videos for the linked household.
 */
export function useHouseholdId(): DeviceTokenResult {
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/device-token");
      const data = await response.json();

      if (response.ok && data.householdId) {
        setHouseholdId(data.householdId);
        setParentId(data.parentId ?? null);
      } else {
        setHouseholdId(null);
        setParentId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get device link";
      setError(message);
      setHouseholdId(null);
      setParentId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  const clearHouseholdId = async () => {
    try {
      await fetch("/api/device-token", { method: "DELETE" });
      setHouseholdId(null);
      setParentId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlink device";
      setError(message);
    }
  };

  return {
    householdId,
    parentId,
    loading,
    error,
    refetch: fetchToken,
    clearHouseholdId,
  };
}
