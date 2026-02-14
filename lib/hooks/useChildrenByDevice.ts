"use client";

import { useState, useCallback, useEffect } from "react";

export interface ChildByDevice {
  id: string;
  display_name: string | null;
  email: string | null;
  linked_at: string;
}

/**
 * Fetches the list of linked children for the household identified by the current device token.
 * Used on the kid-facing feed; no parent auth required.
 */
export function useChildrenByDevice() {
  const [children, setChildren] = useState<ChildByDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/children/by-device");
      const data = await res.json();
      if (res.ok) {
        setChildren(data.children ?? []);
      } else {
        setChildren([]);
        setError(data.error ?? "Could not load profiles.");
      }
    } catch {
      setChildren([]);
      setError("Could not load profiles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  return { children, loading, error, refetch: fetchChildren };
}
