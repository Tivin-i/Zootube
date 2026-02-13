"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    id: "faq-free",
    question: "Is Voobi free?",
    answer:
      "Yes. Parents can sign up and curate a video list at no cost. You manage which videos and channels your child can see.",
  },
  {
    id: "faq-devices",
    question: "What devices work?",
    answer:
      "Voobi runs in the browser on phones, tablets, and computers. You can add it to your child's home screen for an app-like experience.",
  },
  {
    id: "faq-add-videos",
    question: "How do I add videos?",
    answer:
      "Sign up or sign in, then paste YouTube video or playlist URLs into your dashboard. Only videos you add will appear in your child's feed.",
  },
] as const;

export default function MarketingFAQ() {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-2xl">
      <h2 id="faq-heading" className="text-2xl font-semibold text-gray-900 sm:text-3xl">
        Frequently asked questions
      </h2>
      <ul className="mt-6 space-y-3">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          return (
            <li key={item.id}>
              <div className="rounded-lg border border-gray-200 bg-white">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-inset"
                    aria-expanded={isOpen}
                    aria-controls={`${item.id}-answer`}
                    id={`${item.id}-question`}
                  >
                    {item.question}
                    <span
                      className={`ml-2 shrink-0 text-gray-500 transition-transform duration-200 motion-reduce:transition-none ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  id={`${item.id}-answer`}
                  role="region"
                  aria-labelledby={`${item.id}-question`}
                  hidden={!isOpen}
                  className="border-t border-gray-200 px-4 py-3"
                >
                  <p className="text-sm text-gray-600">{item.answer}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
