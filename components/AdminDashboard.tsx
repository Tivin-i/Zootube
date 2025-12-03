"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useState } from "react";

interface AdminDashboardProps {
  user: User;
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const router = useRouter();
  const supabase = createClient();
  const [testUrl, setTestUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleTestYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const response = await fetch("/api/test-youtube", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: testUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        setTestError(data.error || "Failed to fetch video metadata");
      } else {
        setTestResult(data.metadata);
      }
    } catch (error: any) {
      setTestError(error.message || "An error occurred");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                SafeTube Admin
              </h1>
              <p className="mt-1 text-sm text-gray-500">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome to SafeTube!
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your admin dashboard is set up successfully. Video management
              features are coming in Phase 3 of development.
            </p>

            <div className="mt-6 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-800">
                    Setup Complete
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-inside list-disc space-y-1">
                      <li>Authentication working correctly</li>
                      <li>Database connected</li>
                      <li>Ready for Phase 3 development</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* YouTube API Test Section */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">
              Test YouTube API Connection
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Paste a YouTube video URL to test if the API is configured
              correctly.
            </p>

            <form onSubmit={handleTestYouTube} className="mt-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="block flex-1 rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  required
                />
                <button
                  type="submit"
                  disabled={testing}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {testing ? "Testing..." : "Test"}
                </button>
              </div>
            </form>

            {/* Error Display */}
            {testError && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
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
                    <div className="mt-2 text-sm text-red-700">{testError}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Display */}
            {testResult && (
              <div className="mt-4 rounded-md bg-green-50 p-4">
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
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-green-800">
                      Success! YouTube API is working
                    </h3>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start gap-4">
                        {testResult.thumbnailUrl && (
                          <img
                            src={testResult.thumbnailUrl}
                            alt={testResult.title}
                            className="h-24 w-auto rounded-md"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {testResult.title}
                          </p>
                          <dl className="mt-2 space-y-1 text-xs text-gray-600">
                            <div>
                              <dt className="inline font-medium">Video ID: </dt>
                              <dd className="inline">{testResult.id}</dd>
                            </div>
                            <div>
                              <dt className="inline font-medium">Duration: </dt>
                              <dd className="inline">
                                {Math.floor(testResult.durationSeconds / 60)}:
                                {(testResult.durationSeconds % 60)
                                  .toString()
                                  .padStart(2, "0")}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline font-medium">
                                Made for Kids:{" "}
                              </dt>
                              <dd className="inline">
                                {testResult.madeForKids ? "Yes" : "No"}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
