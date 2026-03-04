"use client";


export function resolveTranslated(raw, lang = "en") {
  if (!raw) return "";
  if (typeof raw === "object") {
    return raw[lang] || raw.en || "";
  }
  return raw;
}