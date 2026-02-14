"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Privacy Policy to continue.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const validateRes = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      });
      const validateData = await validateRes.json().catch(() => ({}));
      if (!validateRes.ok || validateData.valid !== true) {
        setError(validateData.error ?? "Invalid invite code");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;

      if (data.user) {
        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          setError("This email is already registered. Please log in instead.");
        } else {
          setMessage(
            "Account created successfully! Please check your email to confirm your account."
          );
          // Redirect to admin after a short delay
          setTimeout(() => {
            router.push("/admin");
          }, 2000);
        }
      }
    } catch (err: any) {
      const message = err?.message ?? "An error occurred during signup";
      if (message === "Failed to fetch" || message.toLowerCase().includes("failed to fetch")) {
        setError(
          "Could not reach the authentication server. Check your internet connection and ensure Supabase is configured (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env or .env.local). Restart the dev server after changing env files."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create Parent Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign up to manage your Voobi videos
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mt-1 text-center text-xs text-amber-600" title="Only visible in development">
              Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "URL set" : "URL not set"} · {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "key set" : "key not set"}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSignup}>
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="invite-code" className="sr-only">
                Invite code
              </label>
              <input
                id="invite-code"
                name="invite-code"
                type="text"
                autoComplete="off"
                className="relative block w-full rounded-t-md border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                data-testid="admin-signup-invite-code"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="relative block w-full rounded-b-md border-0 px-4 py-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              id="agree-terms"
              name="agree-terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              data-testid="admin-signup-agree-terms"
            />
            <label htmlFor="agree-terms" className="text-sm text-gray-600">
              I agree to the{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500 underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </Link>
              .
            </label>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4" role="alert" aria-live="polite">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {message && (
            <div className="rounded-md bg-green-50 p-4" role="status" aria-live="polite">
              <p className="text-sm text-green-800">{message}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/admin/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Log in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
