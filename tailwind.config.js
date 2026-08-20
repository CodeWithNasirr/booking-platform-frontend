/** @type {import('tailwindcss').Config} */

// Semantic color mapped to an HSL channel token, so opacity
// modifiers (bg-primary/10) keep working.
const t = (name) => `hsl(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@radix-ui/**/*",
  ],
  theme: {
    extend: {
      colors: {
        border: t("border"),
        input: t("input"),
        "input-background": t("input-background"),
        ring: t("ring"),
        background: t("background"),
        foreground: t("foreground"),

        surface: {
          DEFAULT: t("surface"),
          foreground: t("surface-foreground"),
        },
        card: {
          DEFAULT: t("card"),
          foreground: t("card-foreground"),
        },
        popover: {
          DEFAULT: t("popover"),
          foreground: t("popover-foreground"),
        },
        primary: {
          DEFAULT: t("primary"),
          foreground: t("primary-foreground"),
        },
        secondary: {
          DEFAULT: t("secondary"),
          foreground: t("secondary-foreground"),
        },
        muted: {
          DEFAULT: t("muted"),
          foreground: t("muted-foreground"),
        },
        accent: {
          DEFAULT: t("accent"),
          foreground: t("accent-foreground"),
        },

        /* Semantic status — constant across tenants */
        success: {
          DEFAULT: t("success"),
          foreground: t("success-foreground"),
          soft: t("success-soft"),
          "soft-foreground": t("success-soft-foreground"),
        },
        warning: {
          DEFAULT: t("warning"),
          foreground: t("warning-foreground"),
          soft: t("warning-soft"),
          "soft-foreground": t("warning-soft-foreground"),
        },
        danger: {
          DEFAULT: t("danger"),
          foreground: t("danger-foreground"),
          soft: t("danger-soft"),
          "soft-foreground": t("danger-soft-foreground"),
        },
        destructive: {
          DEFAULT: t("destructive"),
          foreground: t("destructive-foreground"),
        },
        info: {
          DEFAULT: t("info"),
          foreground: t("info-foreground"),
          soft: t("info-soft"),
          "soft-foreground": t("info-soft-foreground"),
        },
      },
      borderRadius: {
        // Token-driven scale for shadcn-style primitives. xl/2xl are
        // intentionally left at Tailwind defaults so the many existing
        // rounded-xl / rounded-2xl cards keep their current shape.
        lg: "var(--radius)",
        md: "calc(var(--radius) - 0.25rem)",
        sm: "calc(var(--radius) - 0.375rem)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(16 24 40 / 0.04)",
        sm: "0 1px 3px 0 rgb(16 24 40 / 0.08), 0 1px 2px -1px rgb(16 24 40 / 0.06)",
        DEFAULT: "0 4px 12px -2px rgb(16 24 40 / 0.08), 0 2px 6px -2px rgb(16 24 40 / 0.05)",
        md: "0 8px 20px -4px rgb(16 24 40 / 0.10), 0 4px 8px -4px rgb(16 24 40 / 0.06)",
        lg: "0 16px 32px -8px rgb(16 24 40 / 0.14), 0 6px 12px -6px rgb(16 24 40 / 0.08)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "scale-in": {
          from: { opacity: 0, transform: "scale(0.96)" },
          to: { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
