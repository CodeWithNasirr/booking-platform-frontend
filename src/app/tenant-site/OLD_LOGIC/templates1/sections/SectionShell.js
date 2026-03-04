// ============================================================================
// FILE: app/tenant-site/sections/SectionShell.js
// Universal Section Shell - Handles padding, container, backgrounds, spacing
// ============================================================================
"use client";

export default function SectionShell({ data, children, isEditor = false }) {
  const {
    // Spacing
    padding_top = "normal", // none, tight, normal, loose, xl
    padding_bottom = "normal",
    margin_top = "none",
    margin_bottom = "none",

    // Container
    container = "contained", // contained, full_width, narrow, wide
    max_width = "7xl", // 3xl, 4xl, 5xl, 6xl, 7xl

    // Background
    background_type = "solid", // solid, gradient, image, pattern
    background_color = "transparent",
    background_gradient,
    background_image,
    overlay_opacity = 0,

    // Border & Shadow
    border_top = false,
    border_bottom = false,
    shadow = "none", // none, sm, md, lg, xl

    // Advanced
    custom_class = "",
  } = data || {};

  // Spacing classes
  const paddingClasses = {
    none: "py-0",
    tight: "py-8",
    normal: "py-16",
    loose: "py-24",
    xl: "py-32",
  };

  const marginClasses = {
    none: "my-0",
    tight: "my-8",
    normal: "my-16",
    loose: "my-24",
  };

  // Container classes
  const containerClasses = {
    contained: "container mx-auto px-6 lg:px-8",
    full_width: "w-full",
    narrow: "max-w-4xl mx-auto px-6",
    wide: "max-w-screen-2xl mx-auto px-6",
  };

  // Background classes
  const getBackgroundClass = () => {
    if (background_type === "solid" && background_color !== "transparent") {
      return `bg-${background_color}`;
    }
    if (background_type === "gradient" && background_gradient) {
      return background_gradient;
    }
    return "";
  };

  // Shadow classes
  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
  };

  return (
    <section
      className={`
        relative
        ${paddingClasses[padding_top]}
        ${paddingClasses[padding_bottom]}
        ${marginClasses[margin_top]}
        ${marginClasses[margin_bottom]}
        ${getBackgroundClass()}
        ${border_top ? "border-t border-gray-200" : ""}
        ${border_bottom ? "border-b border-gray-200" : ""}
        ${shadowClasses[shadow]}
        ${custom_class}
      `.trim()}
      style={{
        backgroundImage:
          background_type === "image" && background_image
            ? `url(${background_image})`
            : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      {overlay_opacity > 0 && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlay_opacity }}
        />
      )}

      {/* Content */}
      <div className={`relative z-10 ${containerClasses[container]}`}>
        {children}
      </div>
    </section>
  );
}