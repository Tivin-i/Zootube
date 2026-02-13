import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Voobi",
  description: "Privacy Policy for Voobi, curated video for kids.",
};

const LAST_UPDATED = "2025-02-13";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 rounded"
        >
          ← Back to Voobi
        </Link>

        <header className="mt-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <main className="mt-10 space-y-10 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">Who we are</h2>
            <p className="mt-3">
              Voobi (“we”, “us”) operates the Voobi service. For the purpose of data protection law, we are the data controller. You can contact us at:{" "}
              <a href="mailto:privacy@voobi.com" className="text-blue-600 hover:text-blue-500 underline">
                privacy@voobi.com
              </a>
              . (Replace with your legal entity name and contact address or email as appropriate.)
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Who this applies to</h2>
            <p className="mt-3">
              This policy applies to parents and guardians who create an account and use Voobi to curate videos, and to the use of the service by children in their care. Voobi is directed at families with children; we do not knowingly collect personal information from children without parental involvement (see “Children” below).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Data we collect</h2>

            <h3 className="mt-4 font-medium text-gray-900">Account data</h3>
            <p className="mt-2">
              When you sign up, we collect your email address and a hashed password. We also store data needed for device linking (e.g. an identifier linking your account or household to a device so the curated feed can be shown). We do not collect demographic data (such as age, gender, or similar) from you or from children.
            </p>

            <h3 className="mt-4 font-medium text-gray-900">Website analytics</h3>
            <p className="mt-2">
              Our website analytics are limited to: <strong>country</strong> (or region), <strong>pages visited</strong>, and <strong>duration of visit</strong>. We do not collect demographic data, gender, or other personal characteristics for analytics. We use this data to understand how the service is used and to improve it.
            </p>

            <h3 className="mt-4 font-medium text-gray-900">Watch and recommendation data</h3>
            <p className="mt-2">
              We may in the future use aggregated watch statistics (e.g. which videos are watched most across households) to improve recommendations for families. If we do, we will update this policy and describe how that data is collected, used, and retained. We will not use such data in a way that identifies you or your children without your consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Purpose and lawful basis</h2>
            <p className="mt-3">
              We use your data to provide and secure the service (e.g. authentication, device linking, showing your curated list), to improve the product, and for limited analytics as described above. Our lawful bases include performance of our contract with you and our legitimate interests in operating and improving the service. Where we process data relating to children, we rely on parental consent and data minimization. We do not collect demographic or gender data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">No sale of data</h2>
            <p className="mt-3">
              We do not sell your personal information to anyone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Retention</h2>
            <p className="mt-3">
              We keep account data for as long as your account is active and for a reasonable period after you close it (e.g. for legal or operational purposes). Analytics data (country, pages, duration) is retained for up to 24 months unless a shorter period is required by law. If we introduce watch or recommendation data in the future, we will specify retention in an updated policy. You can request deletion of your data (see “Your rights” below).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Recipients and subprocessors</h2>
            <p className="mt-3">
              We use the following to operate the service; they process data on our behalf:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                <strong>Supabase</strong> — authentication and database. Their privacy policy:{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 underline">
                  https://supabase.com/privacy
                </a>
              </li>
              <li>
                <strong>Hosting</strong> — our app may be hosted on Vercel, Cloudflare, or similar providers. Their respective privacy policies apply to infrastructure processing.
              </li>
              <li>
                <strong>YouTube (Google)</strong> — we embed YouTube players so you can watch videos. When you or a child watches a video, YouTube may collect data according to Google’s privacy policy. We use privacy-enhanced mode (e.g. youtube-nocookie.com) where possible. Google’s policy:{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 underline">
                  https://policies.google.com/privacy
                </a>
              </li>
            </ul>
            <p className="mt-3">
              If we use a dedicated analytics provider, we will name it here and link to its privacy policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">International transfers</h2>
            <p className="mt-3">
              Your data may be processed in countries outside your residence, including the European Economic Area (EEA). Where we transfer data from the EEA to a country that is not considered to provide adequate protection, we use appropriate safeguards (such as standard contractual clauses approved by the European Commission) to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Your rights</h2>
            <p className="mt-3">
              If you are in the European Economic Area or the UK, you have the right to: access your personal data; have it corrected or erased; restrict or object to processing; data portability; withdraw consent where we rely on it; and lodge a complaint with a supervisory authority. To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@voobi.com" className="text-blue-600 hover:text-blue-500 underline">
                privacy@voobi.com
              </a>
              . We will respond within the time required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Children (COPPA)</h2>
            <p className="mt-3">
              Voobi is directed at families with children. We do not knowingly collect personal information from children under 13 without verifiable parental consent. Parents and guardians create and control the account and decide which videos appear in the curated feed. We follow data minimization: we do not collect demographic or gender data from users. Parents can review the data we hold and request deletion by contacting us at{" "}
              <a href="mailto:privacy@voobi.com" className="text-blue-600 hover:text-blue-500 underline">
                privacy@voobi.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">Changes to this policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. We will post the updated policy on this page and change the “Last updated” date. For material changes, we may also notify you by in-app notice or email. We encourage you to review this policy periodically.
            </p>
          </section>
        </main>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 rounded"
          >
            ← Back to Voobi
          </Link>
        </footer>
      </div>
    </div>
  );
}
