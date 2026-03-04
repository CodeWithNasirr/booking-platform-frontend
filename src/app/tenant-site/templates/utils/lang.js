"use client";

/**
 * ============================================================================
 * TRANSLATION RESOLUTION UTILITY
 * ============================================================================
 * 
 * Resolves translated content from JSON that may be:
 *   - A plain string: "Hello"
 *   - A translation object: { en: "Hello", ar: "مرحبا", ur: "ہیلو" }
 * 
 * @param {string|object} raw - The value to resolve
 * @param {string} lang - Current language code (en, ar, ur)
 * @returns {string} - Resolved string value
 * 
 * ============================================================================
 */

export function resolveTranslated(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value[lang] || value.en || Object.values(value)[0] || "";
  }
  return "";
}

