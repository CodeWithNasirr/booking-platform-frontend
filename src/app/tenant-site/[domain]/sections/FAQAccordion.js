"use client";

import { useState } from "react";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function FAQAccordion({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const lang = propLang || language;
  const [openIndex, setOpenIndex] = useState(0);

  const {
    title,
    subtitle,
    faqs = [],
    layout = "single", // single | two-column
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedFaqs = resolveTranslatedArray(faqs, lang, ["question", "answer"]);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  const FAQItem = ({ faq, index }) => {
    const isOpen = openIndex === index;

    return (
      <div
        className="border-b last:border-b-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        <button
          onClick={() => toggleFaq(index)}
          className={`w-full py-5 flex items-center justify-between text-left ${
            isRTL ? "flex-row-reverse text-right" : ""
          }`}
        >
          <span className="font-semibold text-[color:var(--color-text)] pr-4">
            {faq.question}
          </span>

          <svg
            className={`w-5 h-5 flex-shrink-0 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            style={{ color: "var(--color-primary)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-96 pb-5" : "max-h-0"
          }`}
        >
          <p className="leading-relaxed text-[color:var(--color-text-muted)]">
            {faq.answer}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold text-[color:var(--color-text)] mb-4">
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-[color:var(--color-text-muted)]">
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* FAQ List */}
        {layout === "two-column" ? (
          <div className="grid md:grid-cols-2 gap-8">
            <FAQCard>
              {resolvedFaqs
                .slice(0, Math.ceil(resolvedFaqs.length / 2))
                .map((faq, idx) => (
                  <FAQItem key={faq.id || idx} faq={faq} index={idx} />
                ))}
            </FAQCard>

            <FAQCard>
              {resolvedFaqs
                .slice(Math.ceil(resolvedFaqs.length / 2))
                .map((faq, idx) => (
                  <FAQItem
                    key={faq.id || idx}
                    faq={faq}
                    index={idx + Math.ceil(resolvedFaqs.length / 2)}
                  />
                ))}
            </FAQCard>
          </div>
        ) : (
          <FAQCard>
            {resolvedFaqs.map((faq, idx) => (
              <FAQItem key={faq.id || idx} faq={faq} index={idx} />
            ))}
          </FAQCard>
        )}

        {/* Empty State */}
        {resolvedFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[color:var(--color-text-muted)]">
              No FAQs available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================
   Shared Card Wrapper
   ========================= */

function FAQCard({ children }) {
  return (
    <div
      className="rounded-xl shadow-sm p-6"
      style={{
        backgroundColor: "var(--color-background)",
        border: "1px solid var(--color-border)",
      }}
    >
      {children}
    </div>
  );
}
