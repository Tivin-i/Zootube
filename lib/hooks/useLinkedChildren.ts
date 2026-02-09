"use client";

import { useState, useCallback, useEffect } from "react";

export interface LinkedChild {
  id: string;
  display_name: string | null;
  email: string | null;
  linked_at: string;
}

export function useLinkedChildren(householdId: string | null) {
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/children?household_id=${encodeURIComponent(householdId)}`
      );
      const data = await res.json();
      if (res.ok) {
        setChildren(data.children ?? []);
      } else {
        setChildren([]);
        if (res.status === 401 || res.status === 403) {
          setError("You don't have access to this list.");
        } else {
          setError(data.error ?? "Could not load linked children.");
        }
      }
    } catch {
      setChildren([]);
      setError("Could not load linked children.");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    if (householdId) fetchChildren();
  }, [householdId, fetchChildren]);

  const addChild = useCallback(() => {
    if (!householdId) return;
    window.location.href = `/api/auth/child?household_id=${encodeURIComponent(householdId)}`;
  }, [householdId]);

  const removeChild = useCallback(
    async (childId: string) => {
      if (!householdId || !confirm("Remove this child from the list? They can be added again later."))
        return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
        if (res.ok) {
          setChildren((prev) => prev.filter((c) => c.id !== childId));
        } else {
          const data = await res.json();
          setError(data.error ?? "Could not remove child.");
        }
      } catch {
        setError("Could not remove child.");
      } finally {
        setLoading(false);
      }
    },
    [householdId]
  );

  return {
    children,
    loading,
    error,
    fetchChildren,
    addChild,
    removeChild,
  };
}
