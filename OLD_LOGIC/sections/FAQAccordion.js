"use client";

import { useState } from "react";
import { resolveTranslated } from "../../src/app/tenant-site/templates/utils/lang";
import { useTenantLang } from "../../src/app/tenant-site/templates/utils/TenantLangContext";

export default function FAQAccordion({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { title, subtitle, layout = "two_column", faqs = [] } = content;

  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {title && <h2 className="text-4xl font-bold text-gray-900 text-center mb-6">{T(title)}</h2>}
        {subtitle && <p className="text-center text-gray-600 mb-8">{T(subtitle)}</p>}

        <div className={`grid gap-8 ${layout === "two_column" ? "md:grid-cols-2" : ""}`}>
          {faqs.map((faq, idx) => <FAQItem key={idx} faq={faq} lang={lang} />)}
        </div>
      </div>
    </section>
  );
}

function FAQItem({ faq, lang }) {
  const [open, setOpen] = useState(false);

  const question = resolveTranslated(faq.question || faq.q, lang);
  const answer = resolveTranslated(faq.answer || faq.a, lang);

  return (
    <div className="border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-md transition" onClick={() => setOpen(!open)}>
      <h3 className="text-lg font-semibold text-gray-900 flex justify-between items-center">
        {question}
        <span className="text-blue-600 text-xl">{open ? "−" : "+"}</span>
      </h3>
      {open && <p className="mt-4 text-gray-600 text-sm">{answer}</p>}
    </div>
  );
}
