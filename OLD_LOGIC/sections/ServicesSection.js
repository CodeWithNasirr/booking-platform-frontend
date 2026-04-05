"use client";

import { resolveTranslated } from "../../src/app/tenant-site/templates/utils/lang";
import { useTenantLang } from "../../src/app/tenant-site/templates/utils/TenantLangContext";

export default function ServicesSection({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { title, subtitle, columns = 3, layout = "cards", services = [], show_cta = false, cta_button } = content;

  const colClass = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[columns] || "md:grid-cols-3";

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-14">
            {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
            {subtitle && <p className="text-lg text-gray-600">{T(subtitle)}</p>}
          </div>
        )}

        <div className={`grid grid-cols-1 ${colClass} gap-10`}>
          {services.map((srv, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition">
              {srv.image && <img src={srv.image} className="w-full h-48 object-cover rounded-xl mb-4" alt="" />}
              {srv.icon && <div className="text-4xl mb-4">{srv.icon}</div>}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{T(srv.title)}</h3>
              {srv.description && <p className="text-gray-600 text-sm mb-4">{T(srv.description)}</p>}
              {srv.price && <div className="text-blue-600 font-semibold">{T(srv.price)}</div>}
            </div>
          ))}
        </div>

        {show_cta && cta_button && (
          <div className="text-center mt-14">
            <a href={cta_button.url || "#"} className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">
              {T(cta_button.text)}
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
