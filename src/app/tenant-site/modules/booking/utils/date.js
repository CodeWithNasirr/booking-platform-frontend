// utils/date.js
export function formatDate(date, lang = "en") {
  return new Date(date).toLocaleDateString(
    lang === "ar" ? "ar-SA" : "en-US",
    { weekday: "short", month: "short", day: "numeric" }
  );
}
