"use client";

import { useTenantLang } from "../../../src/app/tenant-site/contexts/TenantLangContext";
import { useTenantTheme } from "../../../src/app/tenant-site/contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Team({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    title,
    subtitle,
    members = [],
    columns = 3,
    show_social = true,
  } = data || {};

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedMembers = resolveTranslatedArray(members, lang, ["name", "role", "bio"]);

  const colClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  }[columns] || "md:grid-cols-3";

  return (
    <section className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}>
      <div className="max-w-7xl mx-auto">
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

        {/* Team Grid */}
        <div className={`grid ${colClass} gap-8`}>
          {resolvedMembers.map((member, idx) => (
            <div key={member.id || idx} className="text-center group">
              {/* Photo */}
              <div className="relative mb-4 overflow-hidden rounded-2xl">
                {member.photo || member.image ? (
                  <img
                    src={member.photo || member.image}
                    alt={member.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div 
                    className="w-full aspect-square flex items-center justify-center text-white text-4xl font-bold"
                    style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                  >
                    {member.name?.charAt(0) || "?"}
                  </div>
                )}
                
                {/* Social Links Overlay */}
                {show_social && member.social && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    {member.social.linkedin && (
                      <a href={member.social.linkedin} className="text-white hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    )}
                    {member.social.twitter && (
                      <a href={member.social.twitter} className="text-white hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
              <p 
                className="font-medium mb-2"
                style={{ color: theme.primary_color || "#3B82F6" }}
              >
                {member.role}
              </p>
              {member.bio && (
                <p className="text-gray-600 text-sm">{member.bio}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
