"use client";

import { useState, useEffect, useCallback } from "react";

interface MemberRow {
  parent_id: string;
  email: string | null;
  role: string;
  joined_at: string;
}

interface HouseholdGuardiansBlockProps {
  householdId: string;
  currentUserId: string;
}

function formatJoinedAt(iso: string): string {
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

export default function HouseholdGuardiansBlock({
  householdId,
  currentUserId,
}: HouseholdGuardiansBlockProps) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const fetchMembers = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/households/${householdId}/members`, {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members ?? []);
      } else {
        setError(data.error ?? "Failed to load guardians");
      }
    } catch (err) {
      console.error("Fetch members error:", err);
      setError("Failed to load guardians");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const isOwner = members.some(
    (m) => m.parent_id === currentUserId && m.role === "owner"
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = inviteEmail.trim();
    if (!email) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(false);
    try {
      const res = await fetch(`/api/households/${householdId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteEmail("");
        setInviteSuccess(true);
        await fetchMembers();
        setTimeout(() => setInviteSuccess(false), 4000);
      } else {
        setInviteError(data.error ?? "Failed to invite guardian");
      }
    } catch (err) {
      console.error("Invite error:", err);
      setInviteError("Failed to invite guardian");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">Guardians</h2>
      <p className="mt-1 text-sm text-gray-500">
        People who can manage this video list. Only the owner can invite others.
      </p>
      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {loading && members.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-2 border-t border-gray-200 pt-4">
          {members.map((m) => (
            <li
              key={m.parent_id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
            >
              <div className="min-w-0">
                <span className="font-medium text-gray-900">
                  {m.email ?? "Unknown"}
                </span>
                <span
                  className={`ml-2 rounded px-1.5 py-0.5 text-xs font-medium ${
                    m.role === "owner"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {m.role === "owner" ? "Owner" : "Member"}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  Joined {formatJoinedAt(m.joined_at)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {isOwner && (
        <form onSubmit={handleInvite} className="mt-4 border-t border-gray-200 pt-4">
          <label htmlFor="guardian-email" className="block text-sm font-medium text-gray-700">
            Invite another guardian by email
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              id="guardian-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                setInviteError(null);
              }}
              placeholder="guardian@example.com"
              disabled={inviting}
              className="min-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:opacity-50"
              aria-describedby="invite-error invite-success"
            />
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
            >
              {inviting ? "Inviting…" : "Invite"}
            </button>
          </div>
          {inviteError && (
            <p id="invite-error" className="mt-2 text-sm text-red-600">
              {inviteError}
            </p>
          )}
          {inviteSuccess && (
            <p id="invite-success" className="mt-2 text-sm text-green-600">
              Guardian invited. They can now manage this list.
            </p>
          )}
        </form>
      )}
    </div>
  );
}
