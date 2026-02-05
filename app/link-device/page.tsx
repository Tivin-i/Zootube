"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type HouseholdOption = { id: string; name: string };

export default function LinkDevicePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"email" | "household">("email");
  const [households, setHouseholds] = useState<HouseholdOption[]>([]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const lookupResponse = await fetch(
        `/api/parent-by-email?email=${encodeURIComponent(email)}`
      );
      const lookupData = await lookupResponse.json();

      if (!lookupResponse.ok) {
        if (lookupResponse.status === 404) {
          setError(
            "No account found with this email. Please check the email address or ask your parent to create an account."
          );
        } else if (lookupResponse.status === 429) {
          setError(
            "Too many requests. Please wait a moment and try again."
          );
        } else if (lookupResponse.status === 400) {
          setError(
            "Please enter a valid email address."
          );
        } else {
          setError(lookupData.error || "Failed to find parent account. Please try again.");
        }
        return;
      }

      const householdList = lookupData.households || [];
      setHouseholds(householdList);
      setParentId(lookupData.parentId);

      if (householdList.length === 1) {
        setSelectedHouseholdId(householdList[0].id);
        await linkDevice(householdList[0].id, lookupData.parentId);
      } else {
        setSelectedHouseholdId(householdList[0]?.id ?? null);
        setStep("household");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const linkDevice = async (householdId: string, parentIdValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const tokenResponse = await fetch("/api/device-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ householdId, parentId: parentIdValue }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        setError(tokenData.error || "Failed to link device. Please try again.");
        return;
      }

      // Show success message before redirecting
      setSuccess(true);
      
      // Redirect to home feed after a brief delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleHouseholdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseholdId || !parentId) return;
    await linkDevice(selectedHouseholdId, parentId);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-600">
            <svg
              className="h-12 w-12 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome to ZooTube
          </h2>
          <p className="mt-3 text-lg text-gray-600">
            Enter your parent's email to link this device
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg">
          {step === "email" ? (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Parent's Email Address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  data-testid="link-device-email"
                  className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="polite" data-testid="link-device-error">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4" role="status" aria-live="polite" data-testid="link-device-success">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-green-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Device Linked Successfully!
                    </h3>
                    <p className="mt-1 text-sm text-green-700">
                      Redirecting to your video collection...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || success}
                data-testid="link-device-submit"
                className="flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Linking device…
                  </>
                ) : success ? (
                  "✓ Linked!"
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </form>
          ) : (
          <form onSubmit={handleHouseholdSubmit} className="space-y-6">
            <div>
              <label htmlFor="household" className="block text-sm font-medium text-gray-700">
                Which video list?
              </label>
              <div className="mt-2">
                <select
                  id="household"
                  name="household"
                  required
                  className="block w-full rounded-md border-0 px-4 py-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  value={selectedHouseholdId ?? ""}
                  onChange={(e) => setSelectedHouseholdId(e.target.value)}
                >
                  {households.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="polite" data-testid="link-device-error">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setStep("email"); setError(null); }}
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading || success}
                data-testid="link-device-submit"
                className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
              >
                {loading ? "Linking…" : success ? "✓ Linked!" : "Link Device"}
              </button>
            </div>
          </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              Don't have a ZooTube account?
              <br />
              Ask your parent to create one at{" "}
              <a
                href="/admin/signup"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                /admin/signup
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
