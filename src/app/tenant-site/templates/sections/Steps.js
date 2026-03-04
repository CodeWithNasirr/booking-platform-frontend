"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";

export default function Steps({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { variant = "horizontal", title, subtitle, steps = [] } = content;

  if (variant === "horizontal") {
    return (
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {(title || subtitle) && (
            <div className="text-center mb-16">
              {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
              {subtitle && <p className="text-xl text-gray-600">{T(subtitle)}</p>}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                {idx < steps.length - 1 && <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gray-300" />}
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold shadow-lg">
                    {step.number || idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{T(step.title)}</h3>
                  <p className="text-gray-600">{T(step.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (variant === "vertical") {
    return (
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          {(title || subtitle) && (
            <div className="mb-12">
              {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
              {subtitle && <p className="text-xl text-gray-600">{T(subtitle)}</p>}
            </div>
          )}

          <div className="space-y-8">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold shrink-0">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{T(step.title)}</h3>
                  <p className="text-gray-600">{T(step.description)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
