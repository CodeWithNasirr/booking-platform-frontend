"use client";

import { resolveTranslated } from "../../templates/utils/lang";
import { useTenantLang } from "../../templates/utils/TenantLangContext";

export default function Grid({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { variant = "cards", columns = 3, title, subtitle, items = [], show_cta = true, cta_text } = content;

  const colsClass = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns];

  return (
    <section className="px-6 py-20">
      {(title || subtitle) && (
        <div className="max-w-3xl mx-auto text-center mb-12">
          {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
          {subtitle && <p className="text-xl text-gray-600">{T(subtitle)}</p>}
        </div>
      )}

      <div className={`grid ${colsClass} gap-6 max-w-7xl mx-auto`}>
        {items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition">
            {item.image && <img src={item.image} alt="" className="w-full h-56 object-cover" />}
            <div className="p-6">
              {item.icon && <div className="text-4xl mb-3">{item.icon}</div>}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{T(item.title)}</h3>
              {item.description && <p className="text-gray-600 text-sm mb-4">{T(item.description)}</p>}
              {item.price && <div className="text-blue-600 font-semibold mb-4">{T(item.price)}</div>}
              {show_cta && cta_text && (
                <button className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">{T(cta_text)}</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
