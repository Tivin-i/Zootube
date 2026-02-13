import Link from "next/link";
import Image from "next/image";
import MarketingFAQ from "@/components/marketing/MarketingFAQ";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-600"
      >
        Skip to main content
      </a>

      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6" aria-label="Main">
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 rounded"
          >
            <Image src="/voobi-logo.png" alt="" width={40} height={40} className="h-10 w-10" />
            <span className="font-chewy text-xl text-gray-900 sm:text-2xl">Voobi</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 rounded px-2 py-1"
            >
              Sign in
            </Link>
            <Link
              href="/link-device"
              className="rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2"
            >
              Set up device
            </Link>
          </div>
        </nav>
      </header>

      <main id="main-content" className="scroll-mt-4" tabIndex={-1}>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24" aria-labelledby="hero-heading">
          <h1 id="hero-heading" className="font-chewy text-4xl text-gray-900 sm:text-5xl md:text-6xl" style={{ textWrap: "balance" }}>
            Voobi
          </h1>
          <p className="mt-4 text-xl font-semibold text-gray-800 sm:text-2xl" style={{ textWrap: "balance" }}>
            YouTube they&apos;ll love. Only what you approve.
          </p>
          <p className="mt-4 text-base text-gray-600 sm:text-lg max-w-2xl mx-auto">
            Whitelist channels and videos. Kids get a focused feed—nothing else.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/admin/signup"
              className="w-full rounded-md bg-amber-500 px-6 py-3 text-center text-sm font-semibold text-gray-900 hover:bg-amber-600 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              Get started
            </Link>
            <Link
              href="/link-device"
              className="w-full rounded-md border-2 border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              Set up your child&apos;s device
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="how-heading">
          <div className="mx-auto max-w-4xl">
            <h2 id="how-heading" className="text-center text-2xl font-semibold text-gray-900 sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3">
              <li className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-amber-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800" aria-hidden>
                  1
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Add videos</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Sign up and add YouTube videos or whole channels to your list. Only you choose what goes in.
                </p>
              </li>
              <li className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-amber-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800" aria-hidden>
                  2
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Link the device</h3>
                <p className="mt-2 text-sm text-gray-600">
                  On your child&apos;s phone or tablet, open Voobi and enter your email to connect their device to your list.
                </p>
              </li>
              <li className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-amber-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800" aria-hidden>
                  3
                </span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">Kids watch safely</h3>
                <p className="mt-2 text-sm text-gray-600">
                  They see only your curated feed and recommendations from that list—no random or unapproved videos.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* Why Voobi */}
        <section className="border-t border-gray-200 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="why-heading">
          <div className="mx-auto max-w-4xl">
            <h2 id="why-heading" className="text-center text-2xl font-semibold text-gray-900 sm:text-3xl">
              Why Voobi
            </h2>
            <ul className="mt-10 grid gap-8 sm:grid-cols-3">
              <li className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">You're in control</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Every video and channel is chosen by you. No algorithm pushing content you didn&apos;t approve.
                </p>
              </li>
              <li className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Familiar experience</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Kids get a YouTube-like grid and player they already understand—just with your list only.
                </p>
              </li>
              <li className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">No surprises</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Recommendations come only from your whitelist, so they never land on unapproved content.
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <MarketingFAQ />
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">Voobi — Curated video for kids.</p>
          <nav className="flex gap-6" aria-label="Footer">
            <Link
              href="/admin/login"
              className="text-sm text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 rounded"
            >
              Sign in
            </Link>
            <Link
              href="/link-device"
              className="text-sm text-gray-600 hover:text-gray-900 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 rounded"
            >
              Set up device
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
