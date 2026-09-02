// src/lib/currency.js
//
// One place to format money. Always pass the record's OWN persisted currency
// code (ISO 4217). We never assume USD: if the currency is missing we format the
// bare number rather than inventing a symbol, so legacy/undefined data is
// visible rather than silently mislabelled.

export function formatCurrency(amount, currency, locale = undefined) {
  const value = Number(amount) || 0;
  const code = typeof currency === "string" ? currency.trim().toUpperCase() : "";

  if (!code) {
    // No currency on the record — show the number, not a guessed symbol.
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    // Unknown/invalid ISO code — fall back to "CODE 1,234.00" (never a wrong $).
    const n = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${code} ${n}`;
  }
}

// Map a UI language to a sensible locale for number grouping (currency symbol is
// driven by the ISO code, not the locale). RTL-safe: Intl positions the symbol.
export function localeForLanguage(lang) {
  switch (lang) {
    case "ar": return "ar";
    case "ur": return "ur";
    default: return "en";
  }
}
