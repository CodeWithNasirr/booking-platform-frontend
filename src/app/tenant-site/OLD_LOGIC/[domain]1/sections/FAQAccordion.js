"use client";

import { useState } from "react";
import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function FAQAccordion({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;
  const [openIndex, setOpenIndex] = useState(0);

  const {
    title,
    subtitle,
    faqs = [],
    layout = "single", // single or two-column
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
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleFaq(index)}
          className={`w-full py-5 flex items-center justify-between text-left ${isRTL ? "flex-row-reverse text-right" : ""}`}
        >
          <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
          <svg
            className={`w-5 h-5 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
            style={{ color: theme.primary_color || "#3B82F6" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? "max-h-96 pb-5" : "max-h-0"
          }`}
        >
          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
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
              <h2 className="text-4xl font-bold text-gray-900 mb-4">{resolvedTitle}</h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-gray-600">{resolvedSubtitle}</p>
            )}
          </div>
        )}

        {/* FAQ List */}
        {layout === "two-column" ? (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              {resolvedFaqs.slice(0, Math.ceil(resolvedFaqs.length / 2)).map((faq, idx) => (
                <FAQItem key={faq.id || idx} faq={faq} index={idx} />
              ))}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              {resolvedFaqs.slice(Math.ceil(resolvedFaqs.length / 2)).map((faq, idx) => (
                <FAQItem 
                  key={faq.id || idx} 
                  faq={faq} 
                  index={idx + Math.ceil(resolvedFaqs.length / 2)} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {resolvedFaqs.map((faq, idx) => (
              <FAQItem key={faq.id || idx} faq={faq} index={idx} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {resolvedFaqs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No FAQs available.</p>
          </div>
        )}
      </div>
    </section>
  );
}
