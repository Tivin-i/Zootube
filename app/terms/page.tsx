import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions — Voobi",
  description: "Terms and Conditions for Voobi, curated video for kids.",
};

const LAST_UPDATED = "2025-02-13";

export default function TermsPage() {
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
            Terms and Conditions
          </h1>
          <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>
        </header>

        <main className="mt-10 space-y-10 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold text-gray-900">1. Definitions</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Voobi</strong> (“we”, “us”, “our”) means the Voobi service and this website.
              </li>
              <li>
                <strong>You</strong> means the parent or guardian who creates an account and uses Voobi to curate content for children.
              </li>
              <li>
                <strong>Child</strong> means the minor(s) who use the curated video feed under your supervision.
              </li>
              <li>
                <strong>Curated content</strong> means the YouTube videos you add to your list for your household.
              </li>
              <li>
                <strong>Service</strong> means the Voobi application, including the parent dashboard, device linking, and the child-facing video feed.
              </li>
              <li>
                <strong>Account</strong> means your parent/guardian account used to manage the service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">2. Eligibility and parent responsibility</h2>
            <p className="mt-3">
              You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. By using Voobi, you represent that you are a parent or guardian and that you are responsible for how the service is used and for what content children can access. You are responsible for keeping your account credentials secure and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">3. Account and device linking</h2>
            <p className="mt-3">
              You create an account to manage your curated video list. You may link one or more devices (e.g. a child’s tablet) to your account or household so that the curated feed is available on those devices. You are responsible for keeping your login details and linked devices secure. Do not share your password with others.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">4. License to use</h2>
            <p className="mt-3">
              We grant you a limited, non-exclusive, non-transferable right to use Voobi for personal, non-commercial use in accordance with these Terms. You may not resell, sublicense, or use the service for any commercial purpose without our written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">5. Content</h2>
            <p className="mt-3">
              Videos shown in Voobi are provided by YouTube (Google). We do not own or host that content. You are responsible for the videos you add to your list. YouTube’s terms of service and policies apply to the embedded content. We may use YouTube’s “Made for Kids” status where available to help you curate. We do not claim any ownership over third-party content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">6. Acceptable use</h2>
            <p className="mt-3">
              You agree not to misuse the service, circumvent parental controls, or use Voobi for any illegal or harmful purpose. We may suspend or terminate your account if we reasonably believe you have violated these Terms or applicable law. We may also issue a warning before taking action where appropriate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">7. Termination</h2>
            <p className="mt-3">
              You may stop using the service at any time. You may close your account by contacting us or through account settings if we make that available. We may terminate or suspend your access for breach of these Terms, abuse, or operational reasons. Upon termination, your right to use the service ends. What happens to your data is described in our{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">8. Disclaimers</h2>
            <p className="mt-3">
              The service is provided “as is” and “as available”. To the fullest extent permitted by law, we disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose. We do not guarantee that the service will be uninterrupted or error-free. Our liability is limited to the extent permitted by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">9. Changes to these terms</h2>
            <p className="mt-3">
              We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on this page and updating the “Last updated” date, or by other reasonable means (e.g. in-app notice or email). Your continued use of the service after the changes take effect constitutes acceptance of the updated Terms. If you do not agree, you must stop using the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900">10. General</h2>
            <p className="mt-3">
              These Terms constitute the entire agreement between you and Voobi regarding the service. If any part of these Terms is held invalid, the rest remains in effect. Our failure to enforce any right does not waive that right. For questions or contact regarding these Terms, please use the contact details in our{" "}
              <Link href="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </Link>
              .
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
