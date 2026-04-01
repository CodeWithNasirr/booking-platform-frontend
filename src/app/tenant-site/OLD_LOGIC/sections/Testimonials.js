"use client";

import { resolveTranslated } from "../../templates/utils/lang";
import { useTenantLang } from "../../templates/utils/TenantLangContext";

export default function Testimonials({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { title, subtitle, testimonials = [], show_photos = true, show_ratings = true } = content;

  return (
    <section className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
            {subtitle && <p className="text-xl text-gray-600">{T(subtitle)}</p>}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-8">
              {show_ratings && t.rating && (
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < t.rating ? "text-yellow-400" : "text-gray-300"}>★</span>
                  ))}
                </div>
              )}
              <p className="text-gray-700 mb-6 italic">"{T(t.text || t.quote)}"</p>
              <div className="flex items-center gap-3">
                {show_photos && t.photo && <img src={t.photo} alt="" className="w-12 h-12 rounded-full object-cover" />}
                <div>
                  <div className="font-semibold text-gray-900">{T(t.name || t.author)}</div>
                  {t.company && <div className="text-sm text-gray-500">{T(t.company || t.role)}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
