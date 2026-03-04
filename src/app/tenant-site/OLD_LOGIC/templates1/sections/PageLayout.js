// ============================================================================
// FILE: app/tenant-site/sections/PageLayout.js
// Universal Page Layout - Global settings (fonts, colors, breakpoints)
// ============================================================================
"use client";

export default function PageLayout({ data, children, isEditor = false }) {
  const {
    // Typography
    font_family = "inter", // inter, roboto, poppins, playfair, monospace
    heading_font = null,
    body_font = null,
    font_size_base = "16px",

    // Colors (CSS Variables)
    colors = {
      primary: "#3B82F6",
      secondary: "#1E293B",
      accent: "#10B981",
      background: "#FFFFFF",
      text: "#111827",
    },

    // Spacing
    spacing_scale = "default", // tight, default, loose

    // Border Radius
    border_radius = "default", // none, sm, default, lg, xl

    // Animations
    enable_animations = true,

    // Custom CSS
    custom_css = "",
  } = data || {};

  // Font classes
  const fontClasses = {
    inter: "font-sans",
    roboto: "font-sans",
    poppins: "font-sans",
    playfair: "font-serif",
    monospace: "font-mono",
  };

  // Border radius variables
  const borderRadiusValues = {
    none: "0",
    sm: "0.25rem",
    default: "0.5rem",
    lg: "1rem",
    xl: "1.5rem",
  };

  return (
    <>
      {/* Global Styles */}
      <style jsx global>{`
        :root {
          --color-primary: ${colors.primary};
          --color-secondary: ${colors.secondary};
          --color-accent: ${colors.accent};
          --color-background: ${colors.background};
          --color-text: ${colors.text};
          --border-radius: ${borderRadiusValues[border_radius]};
          --font-size-base: ${font_size_base};
        }

        ${!enable_animations ? "* { animation: none !important; transition: none !important; }" : ""}
        
        ${custom_css}
      `}</style>

      {/* Page Wrapper */}
      <div className={`${fontClasses[font_family]} antialiased`}>
        {children}
      </div>
    </>
  );
}