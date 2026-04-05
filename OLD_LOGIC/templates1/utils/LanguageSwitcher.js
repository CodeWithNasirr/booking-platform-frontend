"use client";

import { useTenantLang } from "./TenantLangContext";

const LANGS = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "ur", label: "اردو" },
];

export default function TenantLanguageSwitcher() {
  const { lang, setLang } = useTenantLang();

  return (
    <div className="relative inline-block">
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="border px-3 py-2 rounded-lg"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
