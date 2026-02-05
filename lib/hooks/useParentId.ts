"use client";

import { useState, useEffect } from "react";

/**
 * Hook to get parent ID from secure cookie via API
 * Replaces localStorage usage for security
 */
export function useParentId() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParentId();
  }, []);

  const fetchParentId = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/device-token");
      const data = await response.json();

      if (response.ok && data.parentId) {
        setParentId(data.parentId);
      } else {
        setParentId(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to get parent ID";
      setError(message);
      setParentId(null);
    } finally {
      setLoading(false);
    }
  };

  const clearParentId = async () => {
    try {
      await fetch("/api/device-token", { method: "DELETE" });
      setParentId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unlink device";
      setError(message);
    }
  };

  return { parentId, loading, error, refetch: fetchParentId, clearParentId };
}
