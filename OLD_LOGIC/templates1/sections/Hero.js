"use client";

import { resolveTranslated } from "../utils/lang";
import { useTenantLang } from "../utils/TenantLangContext";
import { resolveBackground } from "../utils/resolveBackground";
import { resolveTextColor } from "../utils/resolveTextColor";


/**
 * UNIVERSAL HERO COMPONENT
 * Fully design-system compliant
 */
export default function Hero({ data, isEditor = false }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  /* ---------------- NORMALIZE JSON ---------------- */
  const content = data?.content || data || {};

  /* ---------------- BACKGROUND NORMALIZATION ---------------- */
  let bgType = content.background?.type || "gradient";
  let bgValue = content.background?.value || null;

  // Legacy support
  if (content.background_type) bgType = content.background_type;
  if (content.background_image) bgValue = content.background_image;
  if (content.background_video) bgValue = content.background_video;

  // Split hero image
  if (content.image) bgValue = content.image;

  /* ---------------- CTA NORMALIZATION ---------------- */
  const primaryCTA = content.primary_cta || content.cta_primary || null;
  const secondaryCTA = content.secondary_cta || content.cta_secondary || null;
  // console.log(secondaryCTA,"ADA")
  /* ---------------- COMMON FIELDS ---------------- */
  const {
    variant = "centered",
    title,
    subtitle,
    alignment = "center",
    overlay_opacity = 0.5,
    text_color = "white",
    trust_badges = [],
    features_list = [],
    stats = [],
    padding,
  } = content;


  const titleStyle = resolveTextColor(
    text_color === "white" ? "inverse" : "default"
  );

  const subtitleStyle = resolveTextColor(
    text_color === "white" ? "inverse" : "muted"
  );


  /* ---------------- SECTION BACKGROUND ---------------- */
  const sectionBgStyle =
    bgType === "solid"
      ? resolveBackground(bgValue)
      : undefined;

  /* ======================================================
     MINIMAL CENTER
  ====================================================== */
  if (variant === "minimal_center") {
    return (
      <section
        className="relative text-center px-6 py-20"
        style={{ ...sectionBgStyle, padding }}
      >
        <Background type={bgType} value={bgValue} />
        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-3xl mx-auto">
          {title && (
            <h1 style={titleStyle} className={`text-4xl md:text-6xl font-extrabold mb-6 `}>
              {T(title)}
            </h1>
          )}

          {subtitle && (
            <p style={subtitleStyle} className={`text-lg md:text-xl mb-8 `}>
              {T(subtitle)}
            </p>
          )}

          <CTAButtons
            primary={primaryCTA}
            secondary={secondaryCTA}
            T={T}
            alignment="center"
          />
        </div>
      </section>
    );
  }

  /* ======================================================
     CENTERED
  ====================================================== */
  if (variant === "centered") {
    return (
      <section
        className="relative min-h-screen flex items-center justify-center px-6 py-24 md:py-32"
        style={sectionBgStyle}
      >
        <Background type={bgType} value={bgValue} />
        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {title && (
            <h1 style={titleStyle} className={`text-5xl md:text-7xl font-extrabold mb-6 `}>
              {T(title)}
            </h1>
          )}

          {subtitle && (
            <p style={subtitleStyle} className={`text-xl md:text-2xl mb-10`}>
              {T(subtitle)}
            </p>
          )}

          <CTAButtons
            primary={primaryCTA}
            secondary={secondaryCTA}
            T={T}
            alignment="center"
          />

          {trust_badges.length > 0 && (
            <div className="mt-14">
              <TrustBadges badges={trust_badges} T={T} />
            </div>
          )}
        </div>
      </section>
    );
  }

  /* ======================================================
     SPLIT
  ====================================================== */
  if (variant === "split") {
    const isRight = alignment === "right";

    return (
      <section
        className="relative grid md:grid-cols-2 gap-16 items-center px-6 md:px-12 py-28"
        style={sectionBgStyle}
      >
        <div className={isRight ? "md:order-2" : ""}>
          {title && (
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6">
              {T(title)}
            </h1>
          )}

          {subtitle && (
            <p className="text-xl text-gray-600 mb-8">{T(subtitle)}</p>
          )}

          {features_list.length > 0 && (
            <ul className="space-y-4 mb-10">
              {features_list.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="text-gray-700 text-lg">
                    {T(feature)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <CTAButtons
            primary={primaryCTA}
            secondary={secondaryCTA}
            T={T}
            alignment="left"
          />
        </div>

        <div className={!isRight ? "md:order-2" : ""}>
          <img
            src={bgValue}
            alt="Hero"
            className="w-full rounded-3xl shadow-xl"
          />
        </div>
      </section>
    );
  }

  /* ======================================================
     FULLSCREEN
  ====================================================== */
  if (variant === "fullscreen") {
    return (
      <section
        className="relative h-screen flex items-center justify-center px-6"
        style={sectionBgStyle}
      >
        <Background type={bgType} value={bgValue} />
        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {title && (
            <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-8">
              {T(title)}
            </h1>
          )}

          {subtitle && (
            <p className="text-2xl text-white/90 mb-14">
              {T(subtitle)}
            </p>
          )}

          <CTAButtons
            primary={primaryCTA}
            secondary={secondaryCTA}
            T={T}
            alignment="center"
            size="large"
          />

          {stats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-12 mt-16">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-5xl font-bold text-white">
                    {stat.number}
                  </div>
                  <div className="text-white/80 mt-2">
                    {T(stat.label)}
                  </div>
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

/* ======================================================
   BACKGROUND (NON-SOLID ONLY)
====================================================== */
function Background({ type, value }) {
  if (type === "image") {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${value})` }}
      />
    );
  }

  if (type === "video") {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={value} type="video/mp4" />
      </video>
    );
  }

  // gradient fallback only
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600" />
  );
}

function Overlay({ opacity }) {
  if (!opacity) return null;
  return (
    <div className="absolute inset-0 bg-black" style={{ opacity }} />
  );
}

/* ======================================================
   CTA BUTTONS (THEME SAFE)
====================================================== */
function CTAButtons({ primary, secondary, alignment, size = "default", T }) {
  if (!primary && !secondary) return null;

  const align =
    alignment === "center"
      ? "justify-center"
      : alignment === "right"
      ? "justify-end"
      : "justify-start";

  const sizeClass =
    size === "large" ? "px-10 py-5 text-lg" : "px-6 py-3";

  return (
    <div className={`flex flex-wrap gap-4 ${align}`}>
      {primary && (
        <a
          href={primary.url || "#"}
          className={`${sizeClass} font-semibold shadow-lg`}
          style={{
            background: "var(--color-primary)",
            color: "white",
            borderRadius: "var(--radius)",
          }}
        >
          {T(primary.text)}
        </a>
      )}

      {secondary && (
        <a
          href={secondary.url || "#"}
          className={`${sizeClass} font-semibold`}
          style={{
            background: "var(--color-primary)",
            color: "white",
            borderRadius: "var(--radius)",
          }}
        >
          {T(secondary.text)}
        </a>
      )}
    </div>
  );
}

/* ====================================================== */
function TrustBadges({ badges, T }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {badges.map((b, i) => (
        <span
          key={i}
          className="px-4 py-2 rounded-lg text-sm"
          style={{
            background: "rgba(255,255,255,0.15)",
            color: "white",
          }}
        >
          {T(b)}
        </span>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-6 h-6 text-green-500"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 10-1.4-1.4l-3 3-1.3-1.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
