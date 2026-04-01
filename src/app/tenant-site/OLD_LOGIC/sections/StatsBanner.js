"use client";

import { resolveTranslated } from "../../templates/utils/lang";
import { useTenantLang } from "../../templates/utils/TenantLangContext";

export default function StatsBanner({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const { background = "gradient", stats = [] } = data || {};

  const bgClass = {
    gradient: "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
    solid: "bg-gray-900 text-white",
    light: "bg-gray-100 text-gray-900"
  }[background] || "bg-gray-100 text-gray-900";

  return (
    <section className={`${bgClass} py-16 px-6`}>
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
        {stats.map((stat, idx) => (
          <div key={idx}>
            <div className="text-4xl md:text-5xl font-extrabold">{T(stat.number)}</div>
            <p className="text-sm md:text-base mt-2 opacity-90">{T(stat.label)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
