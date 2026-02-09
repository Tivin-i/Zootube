"use client";

import type { LinkedChild } from "@/lib/hooks/useLinkedChildren";

interface LinkedChildrenBlockProps {
  householdId: string | null;
  children: LinkedChild[];
  loading: boolean;
  error: string | null;
  onAddChild: () => void;
  onRemoveChild: (childId: string) => void;
  toast?: "connected" | "error" | null;
}

function formatLinkedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function LinkedChildrenBlock({
  householdId,
  children,
  loading,
  error,
  onAddChild,
  onRemoveChild,
  toast,
}: LinkedChildrenBlockProps) {
  if (!householdId) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Linked children</h2>
      <p className="mt-1 text-sm text-gray-500">
        Link a child&apos;s Google account to this list. Sign in with their Google account when prompted.
      </p>
      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {loading && !children.length ? (
          <span className="text-sm text-gray-500">Loading…</span>
        ) : (
          <>
            <button
              type="button"
              onClick={onAddChild}
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              aria-label="Add child account for this list"
            >
              Add child
            </button>
          </>
        )}
      </div>
      {children.length > 0 && (
        <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4">
          {children.map((child) => (
            <li
              key={child.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0">
                <span className="font-medium text-gray-900">
                  {child.display_name || "Unnamed"}
                </span>
                {child.email && (
                  <span className="ml-2 text-sm text-gray-500">{child.email}</span>
                )}
                <span className="ml-2 text-xs text-gray-400">
                  Linked {formatLinkedAt(child.linked_at)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemoveChild(child.id)}
                disabled={loading}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
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
            ? "Child account linked successfully."
            : "Could not link child account. Please try again."}
        </div>
      )}
    </div>
  );
}
