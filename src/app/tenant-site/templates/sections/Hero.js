"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";

/**
 * HERO SECTION - Universal component supporting multiple variants:
 * - centered
 * - split
 * - fullscreen
 * - minimal_center
 */
export default function Hero({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};

  // Normalize background
  let bgType = "gradient";
  let bgValue = null;

  if (content.background?.type) {
    bgType = content.background.type;
    bgValue = content.background.value;
  }
  if (content.background_type) bgType = content.background_type;
  if (content.background_image) bgValue = content.background_image;
  if (content.image) bgValue = content.image;

  // Normalize CTAs
  const primaryCTA = content.primary_cta || content.cta_primary || null;
  const secondaryCTA = content.secondary_cta || content.cta_secondary || null;

  const {
    variant = "centered",
    title,
    subtitle,
    overlay_opacity = 0.5,
    text_color = "white",
    features_list = [],
    stats = [],
  } = content;

  const sectionPadding = content.padding || "6rem 0";

  const isDarkText = text_color === "dark";
  const textColor = isDarkText ? "text-gray-900" : "text-white";
  const subTextColor = isDarkText ? "text-gray-600" : "text-white/80";


  // ============ CENTERED ============
  if (variant === "centered" ) {
    return (
      <section className="relative min-h-[80vh] flex items-center justify-center px-6 py-24">
        <Background type={bgType} value={bgValue} />
        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {title && (
            <h1 className={`text-5xl md:text-7xl font-extrabold mb-6 ${textColor}`}>
              {T(title)}
            </h1>
          )}
          {subtitle && (
            <p className={`text-xl md:text-2xl mb-10 ${subTextColor}`}>
              {T(subtitle)}
            </p>
          )}
          <CTAButtons primary={primaryCTA} secondary={secondaryCTA} T={T} />
        </div>
      </section>
    );
  }


// ============ MINIMAL CENTER ============
  if (variant === "minimal_center") {
    return (
      <section
        className="relative flex items-center justify-center text-center px-6"
        style={{ padding: sectionPadding }}
      >
        <Background type={bgType} value={bgValue} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {title && (
            <h1 className={`text-4xl md:text-5xl font-semibold mb-4 ${textColor}`}>
              {T(title)}
            </h1>
          )}

          {subtitle && (
            <p className={`text-lg md:text-xl mb-8 ${subTextColor}`}>
              {T(subtitle)}
            </p>
          )}

          <CTAButtons
            primary={primaryCTA}
            secondary={null}
            T={T}
            alignment="center"
            variant="minimal"
          />
        </div>
      </section>
    );
  }



  // ============ SPLIT ============
  if (variant === "split") {
    return (
      <section className="grid md:grid-cols-2 gap-16 items-center px-6 md:px-12 py-24">
        <div>
          {title && (
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              {T(title)}
            </h1>
          )}
          {subtitle && (
            <p className="text-xl text-gray-600 mb-8">{T(subtitle)}</p>
          )}
          {features_list.length > 0 && (
            <ul className="space-y-3 mb-10">
              {features_list.map((f, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700">
                  <span className="text-green-500">✓</span>
                  {T(f)}
                </li>
              ))}
            </ul>
          )}
          <CTAButtons primary={primaryCTA} secondary={secondaryCTA} T={T} alignment="left" />
        </div>
        <div>
          {bgValue && (
            <img src={bgValue} alt="" className="w-full rounded-2xl shadow-xl" />
          )}
        </div>
      </section>
    );
  }

  // ============ FULLSCREEN ============
  if (variant === "fullscreen") {
    return (
      <section className="relative h-screen flex items-center justify-center px-6">
        <Background type={bgType} value={bgValue} />
        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {title && (
            <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-8">
              {T(title)}
            </h1>
          )}
          {subtitle && (
            <p className="text-2xl text-white/90 mb-12">{T(subtitle)}</p>
          )}
          <CTAButtons primary={primaryCTA} secondary={secondaryCTA} T={T} size="large" />

          {stats.length > 0 && (
            <div className="flex justify-center gap-12 mt-16">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-5xl font-bold text-white">{s.number}</div>
                  <div className="text-white/80 mt-2">{T(s.label)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  return null;
}

// Background renderer
function Background({ type, value }) {
  if (type === "solid") {
    return <div className="absolute inset-0" style={{ background: value }} />;
  }
  if (type === "image" && value) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${value})` }}
      />
    );
  }
  if (type === "video" && value) {
    return (
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src={value} type="video/mp4" />
      </video>
    );
  }
  return <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />;
}

function Overlay({ opacity }) {
  if (!opacity) return null;
  return <div className="absolute inset-0 bg-black" style={{ opacity }} />;
}

function CTAButtons({ primary, secondary, alignment = "center", size = "default", T }) {
  if (!primary && !secondary) return null;

  const alignClass = alignment === "center" ? "justify-center" : "justify-start";
  const sizeClass = size === "large" ? "px-10 py-5 text-lg" : "px-6 py-3";

  return (
    <div className={`flex flex-wrap gap-4 ${alignClass}`}>
      {primary && (
        <a
          href={primary.url || "#"}
          className={`${sizeClass} bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700`}
        >
          {T(primary.text)}
        </a>
      )}
      {secondary && (
        <a
          href={secondary.url || "#"}
          className={`${sizeClass} bg-white/20 border border-white/30 text-white rounded-xl backdrop-blur-sm`}
        >
          {T(secondary.text)}
        </a>
      )}
    </div>
  );
}
