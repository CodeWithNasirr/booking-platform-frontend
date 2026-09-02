// src/lib/tenantFonts.js
//
// Build a Google Fonts stylesheet URL for the tenant's selected font families so
// a chosen font is actually LOADED (setting font-family alone does nothing if the
// webfont isn't fetched). Mirrors the backend Branding SAFE_FONTS whitelist.

// Families available on the Google Fonts css2 API. "System UI" needs no load.
const LOADABLE = new Set([
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins",
  "Raleway", "Nunito", "Work Sans", "Playfair Display", "Merriweather",
  "Source Sans Pro", "PT Sans", "Cairo", "Tajawal", "Almarai", "IBM Plex Sans",
  "Noto Sans", "Noto Kufi Arabic",
]);

// A few families are named differently on the css2 API.
const CSS2_NAME = { "Source Sans Pro": "Source Sans 3" };

/** First real family from a stack ("Poppins, system-ui" → "Poppins"). */
export function primaryFamily(stack) {
  if (!stack || typeof stack !== "string") return "";
  return stack.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
}

/** Google Fonts href for the given families, or null if none are loadable. */
export function googleFontsHref(families) {
  const names = [
    ...new Set(
      (families || [])
        .map(primaryFamily)
        .filter((f) => f && LOADABLE.has(f))
    ),
  ];
  if (!names.length) return null;
  const params = names
    .map((n) => `family=${(CSS2_NAME[n] || n).replace(/ /g, "+")}:wght@400;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
