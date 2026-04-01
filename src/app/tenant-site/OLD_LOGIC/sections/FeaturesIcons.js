"use client";

import { resolveTranslated } from "../../templates/utils/lang";
import { useTenantLang } from "../../templates/utils/TenantLangContext";

export default function FeaturesIcons({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { title, subtitle, layout = "icons_4col", items = [] } = content;

  const colClass = layout === "icons_4col" ? "md:grid-cols-4" : "md:grid-cols-3";

  const iconMap = { video: "🎥", calendar: "📅", chart: "📊", file: "📄", check: "✅", star: "⭐" };

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center max-w-3xl mx-auto mb-12">
            {title && <h2 className="text-4xl font-bold text-gray-900 mb-3">{T(title)}</h2>}
            {subtitle && <p className="text-gray-600 text-lg">{T(subtitle)}</p>}
          </div>
        )}

        <div className={`grid grid-cols-2 ${colClass} gap-12`}>
          {items.map((item, idx) => (
            <div key={idx} className="text-center p-6 hover:scale-105 transition-transform">
              <div className="text-blue-600 text-5xl mb-4">{iconMap[item.icon] || "✨"}</div>
              <h3 className="font-semibold text-xl text-gray-900 mb-2">{T(item.title)}</h3>
              <p className="text-gray-600 text-sm">{T(item.description)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
