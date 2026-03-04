"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import {
  resolveTranslated,
  resolveTranslatedArray,
} from "../utils/resolveTranslated";

export default function Team({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = propLang || language;

  const {
    title,
    subtitle,
    members = [],
    layout = "grid", // 🔥 aligned with editor
    columns = 3, // optional (safe default)
    show_social = true,
  } = data || {};
  
  // -----------------------------
  // Resolve translations
  // -----------------------------
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedMembers = resolveTranslatedArray(members, lang, [
    "name",
    "role",
    "bio",
  ]);

  // -----------------------------
  // Layout / Columns
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
    <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        {(resolvedTitle || resolvedSubtitle) && (
          <div className="text-center mb-12">
            {resolvedTitle && (
              <h2 className="text-4xl font-bold text-[color:var(--color-text)] mb-4">
                {resolvedTitle}
              </h2>
            )}
            {resolvedSubtitle && (
              <p className="text-xl text-[color:var(--color-text-muted)]">
                {resolvedSubtitle}
              </p>
            )}
          </div>
        )}

        {/* Team */}
        <div className={gridClass}>
          {resolvedMembers.map((member, idx) => (
            <div
              key={member.id || idx}
              className={`group ${
                layout === "list" ? "flex gap-6 items-center" : "text-center"
              }`}
            >
              {/* Photo */}
              <div className="relative overflow-hidden rounded-2xl group">
                {/* Photo */}
                <img
                  src={member.photo}
                  alt={member.name}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* ✅ Social Overlay */}
                {show_social && member.social && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-2xl hover:scale-110 transition-transform"
                      >
                        in
                      </a>
                    )}

                    {member.social.twitter && (
                      <a
                        href={member.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white text-2xl hover:scale-110 transition-transform"
                      >
                        X
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={layout === "list" ? "flex-1" : ""}>
                <h3 className="text-xl font-semibold text-[color:var(--color-text)]">
                  {member.name}
                </h3>

                <p
                  className="font-medium mb-2"
                  style={{ color: "var(--color-primary)" }}
                >
                  {member.role}
                </p>

                {member.bio && (
                  <p className="text-[color:var(--color-text-muted)] text-sm">
                    {member.bio}
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
