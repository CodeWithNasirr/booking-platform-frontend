export function resolveBackground(bg, options = {}) {
  if (!bg) return {};

  /* ---------------- OBJECT FORMAT ---------------- */
  if (typeof bg === "object") {
    const { type, value } = bg;

    if (!value) return {};

    // Solid or gradient both map to CSS background
    if (type === "solid" || type === "gradient") {
      return { background: value };
    }

    // Image background
    if (type === "image") {
      return {
        backgroundImage: `url(${value})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }

    return {};
  }

  /* ---------------- STRING FORMAT ---------------- */

  // Hex, rgb, hsl, gradients
  if (
    bg.startsWith("#") ||
    bg.startsWith("rgb") ||
    bg.startsWith("hsl") ||
    bg.startsWith("linear-gradient") ||
    bg.startsWith("radial-gradient")
  ) {
    return { background: bg };
  }

  // Theme-based keywords
  const map = {
    primary: "var(--color-primary)",
    secondary: "var(--color-secondary)",
    accent: "var(--color-accent)",
    soft: "var(--color-background-soft)",
    background: "var(--color-background)",
    dark: "#0f172a",
  };

  return { background: map[bg] || bg };
}
