"use client";

import { useState } from "react";
import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";

export default function FAQAccordion({ data }) {
  const { lang } = useTenantLang();
  const content = data?.content || data || {};
  const T = (v) => resolveTranslated(v, lang);

  const {
    title,
    subtitle,
    layout = "two_column",
    faqs = [],
    show_search = false,
    background = "background",
  } = content;

  /* ---------------- THEME ---------------- */
  const bgStyle = resolveBackground(
    typeof background === "object" ? background.value : background
  );

  const textStyle = resolveTextColor(
    background === "dark" ? "inverse" : "default"
  );

  const mutedText = resolveTextColor("muted");

  return (
    <section
      className="py-20 px-6"
      style={{
        ...bgStyle,
        color: "var(--text-color)",
      }}
    >
      <div className="max-w-5xl mx-auto">

        {/* TITLE */}
        {title && (
          <h2 className="text-4xl font-bold text-center mb-6">
            {T(title)}
          </h2>
        )}

        {subtitle && (
          <p
            className="text-center mb-10"
            style={{
              ...mutedText,
              color: "var(--text-color)",
            }}
          >
            {T(subtitle)}
          </p>
        )}

        {/* SEARCH */}
        {show_search && (
          <div className="mb-10 flex justify-center">
            <input
              type="text"
              placeholder={
                lang === "ar"
                  ? "ابحث في الأسئلة..."
                  : lang === "ur"
                  ? "عمومی سوالات تلاش کریں..."
                  : "Search FAQs..."
              }
              className="w-full md:w-2/3 px-4 py-3 rounded-xl outline-none"
              style={{
                background: "var(--color-background)",
                border: "1px solid var(--color-border, #e5e7eb)",
                color: "var(--color-text)",
              }}
            />
          </div>
        )}

        {/* FAQ GRID */}
        <div
          className={`grid gap-8 ${
            layout === "two_column" ? "md:grid-cols-2" : ""
          }`}
        >
          {faqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} lang={lang} />
          ))}
        </div>

      </div>
    </section>
  );
}

/* ======================================================
   FAQ ITEM
====================================================== */
function FAQItem({ faq, lang }) {
  const [open, setOpen] = useState(false);

  const question = resolveTranslated(faq.question || faq.q, lang);
  const answer = resolveTranslated(faq.answer || faq.a, lang);

  return (
    <div
      onClick={() => setOpen(!open)}
      className="rounded-xl p-6 cursor-pointer transition-all"
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border, #e5e7eb)",
      }}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {question}
        </h3>

        <span
          className="text-xl font-bold"
          style={{ color: "var(--color-primary)" }}
        >
          {open ? "−" : "+"}
        </span>
      </div>

      {open && (
        <p
          className="mt-4 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {answer}
        </p>
      )}
    </div>
  );
}
