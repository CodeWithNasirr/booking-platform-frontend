"use client";

import { useTenantLang } from "../../templates/utils/TenantLangContext";
import { resolveTranslated } from "../../templates/utils/lang";

export default function Team({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  // ✅ SAME AS HERO
  const content = data?.content || data || {};

  const {
    title,
    subtitle,
    members = [],
    layout = "grid",
    columns = 3,
    show_social = true,
  } = content;

  // -----------------------------
  // Layout
  // -----------------------------
  const colsClass =
    {
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
    }[columns] || "md:grid-cols-3";

  const gridClass =
    layout === "list"
      ? "grid grid-cols-1 gap-6"
      : `grid grid-cols-1 ${colsClass} gap-8`;

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-4xl font-bold mb-4">
                {T(title)}
              </h2>
            )}
            {subtitle && (
              <p className="text-xl text-gray-600">
                {T(subtitle)}
              </p>
            )}
          </div>
        )}

        {/* Team */}
        <div className={gridClass}>
          {members.map((member, idx) => (
            <div
              key={member.id || idx}
              className={`group ${
                layout === "list" ? "flex gap-6 items-center" : "text-center"
              }`}
            >
              {/* Photo */}
              <div className="relative overflow-hidden rounded-2xl">
                <img
                  src={member.photo}
                  alt={T(member.name)}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition"
                />

                {/* Social */}
                {show_social && member.social && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition">
                    {member.social.linkedin && (
                      <a href={member.social.linkedin} className="text-white">
                        in
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="text-white">
                        X
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={layout === "list" ? "flex-1" : ""}>
                <h3 className="text-xl font-semibold">
                  {T(member.name)}
                </h3>

                <p className="text-blue-600 font-medium mb-2">
                  {T(member.role)}
                </p>

                {member.bio && (
                  <p className="text-gray-600 text-sm">
                    {T(member.bio)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}