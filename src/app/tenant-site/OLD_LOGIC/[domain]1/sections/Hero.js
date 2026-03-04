"use client";

import { useTenantLang } from "../../../contexts/TenantLangContext";
import { useTenantTheme } from "../../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Hero({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  
  const lang = propLang || language;

  const {
    variant = "centered",
    alignment = "center",
    title,
    subtitle,
    description,
    primary_cta,
    primary_cta_url = "#book",
    secondary_cta,
    secondary_cta_url = "#",
    background_type = "gradient",
    background_image,
    background_video,
    overlay_opacity = 0.5,
    text_color = "white",
    trust_badges = [],
    features_list = [],
    stats = [],
    show_availability = false,
    floating_card = null,
  } = data || {};
  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedDescription = resolveTranslated(description, lang);
  const resolvedPrimaryCta = resolveTranslated(primary_cta, lang);
  const resolvedSecondaryCta = resolveTranslated(secondary_cta, lang);
  const resolvedTrustBadges = resolveTranslatedArray(trust_badges, lang);
  const resolvedFeatures = resolveTranslatedArray(features_list, lang);
  const resolvedStats = resolveTranslatedArray(stats, lang, ["label"]);

  const normalizedPrimaryCta =
  typeof primary_cta === "object"
    ? {
        text: resolveTranslated(primary_cta.text, lang),
        url: primary_cta.url,
      }
    : {
        text: resolveTranslated(primary_cta, lang),
        url: primary_cta_url,
      };

  const backgroundType = data?.background?.type || background_type;
  const backgroundValue = data?.background?.value;
  const sectionPadding = data?.padding || "6rem 0";

  const textColorClass = text_color === "white" ? "text-white" : "text-gray-900";
  const subTextColorClass = text_color === "white" ? "text-white/80" : "text-gray-600";

  // Use theme primary color for CTA buttons
  const primaryButtonStyle = {
    backgroundColor: theme.primary_color || "#3B82F6",
  };

  // ============================================================
  // CENTERED HERO
  // ============================================================
  if (variant === "centered") {
    return (
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24 md:py-32">
        <Background type={background_type} image={background_image} video={background_video} theme={theme} />
        <Overlay opacity={overlay_opacity} />

        <div className={`relative z-10 max-w-4xl mx-auto text-center animate-fade-in ${isRTL ? "rtl" : ""}`}>
          {resolvedTitle && (
            <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight mb-6 ${textColorClass}`}>
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p className={`text-xl md:text-2xl mb-10 leading-relaxed ${subTextColorClass}`}>
              {resolvedSubtitle}
            </p>
          )}

          <CTAButtons 
            primary={resolvedPrimaryCta}
            primaryUrl={primary_cta_url}
            secondary={resolvedSecondaryCta}
            secondaryUrl={secondary_cta_url}
            alignment="center"
            primaryStyle={primaryButtonStyle}
            isRTL={isRTL}
          />

          {resolvedTrustBadges.length > 0 && (
            <div className="mt-14">
              <TrustBadges badges={resolvedTrustBadges} />
            </div>
          )}
        </div>
      </section>
    );
  }

  // ============================================================
  // SPLIT HERO
  // ============================================================
  if (variant === "split") {
    return (
      <section className={`relative grid md:grid-cols-2 gap-16 items-center px-6 md:px-12 py-28 ${isRTL ? "rtl" : ""}`}>
        <div className={alignment === "right" ? "md:order-2" : ""}>
          {resolvedTitle && (
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {resolvedSubtitle}
            </p>
          )}

          {resolvedFeatures.length > 0 && (
            <ul className="space-y-4 mb-10">
              {resolvedFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckIcon color={theme.primary_color} />
                  <span className="text-gray-700 text-lg">
                    {typeof feature === "string" ? feature : feature.title || feature.text}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {resolvedTrustBadges.length > 0 && (
            <div className="mb-8">
              <TrustBadges badges={resolvedTrustBadges} dark />
            </div>
          )}

          <CTAButtons 
            primary={resolvedPrimaryCta}
            primaryUrl={primary_cta_url}
            secondary={resolvedSecondaryCta}
            secondaryUrl={secondary_cta_url}
            alignment="left"
            primaryStyle={primaryButtonStyle}
            isRTL={isRTL}
          />
        </div>

        <div className={alignment === "right" ? "" : "md:order-2"}>
          <div className="relative group">
            {background_image && (
              <img
                src={background_image}
                alt="Hero"
                className="w-full rounded-3xl shadow-2xl transform transition-all group-hover:scale-[1.02]"
              />
            )}
          </div>
        </div>
      </section>
    );
  }

  // ============================================================
  // FULLSCREEN HERO
  // ============================================================
  if (variant === "fullscreen") {
    return (
      <section className={`relative h-screen flex items-center justify-center px-6 ${isRTL ? "rtl" : ""}`}>
        <Background type={background_type} image={background_image} video={background_video} theme={theme} />
        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-soft">
          {resolvedTitle && (
            <h1 className="text-6xl md:text-8xl font-extrabold text-white mb-8 leading-[1.05] tracking-tight drop-shadow-xl">
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p className="text-2xl text-white/90 mb-14 max-w-3xl mx-auto leading-relaxed">
              {resolvedSubtitle}
            </p>
          )}

          <CTAButtons 
            primary={resolvedPrimaryCta}
            primaryUrl={primary_cta_url}
            secondary={resolvedSecondaryCta}
            secondaryUrl={secondary_cta_url}
            alignment="center"
            size="large"
            primaryStyle={primaryButtonStyle}
            isRTL={isRTL}
          />

          {resolvedStats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-12 mt-16">
              {resolvedStats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-white drop-shadow">
                    {stat.number || stat.value}
                  </div>
                  <div className="text-white/80 mt-2 text-sm md:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }


  // ============================================================
// MINIMAL CENTER HERO
// ============================================================
  if (variant === "minimal_center") {
    return (
      <section
        className={`relative flex items-center justify-center text-center ${isRTL ? "rtl" : ""}`}
        style={{ padding: sectionPadding }}
      >
        <Background
          type={backgroundType}
          image={background_image}
          video={background_video}
          theme={{
            ...theme,
            background_color: backgroundValue,
          }}
        />


        <div className="relative z-10 max-w-3xl mx-auto px-6 animate-fade-in">
          {resolvedTitle && (
            <h1
              className={`text-4xl md:text-5xl font-semibold tracking-tight mb-4 ${
                text_color === "dark" ? "text-gray-900" : "text-white"
              }`}
            >
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p
              className={`text-lg md:text-xl mb-8 ${
                text_color === "dark" ? "text-gray-600" : "text-white/80"
              }`}
            >
              {resolvedSubtitle}
            </p>
          )}

          {normalizedPrimaryCta?.text && (
            <a
              href={normalizedPrimaryCta.url}
              className="inline-block px-8 py-4 rounded-xl font-medium transition-all"
              style={{
                backgroundColor: theme.primary_color || "#111827",
                color: "#fff",
              }}
            >
              {normalizedPrimaryCta.text}
            </a>
          )}
        </div>
      </section>
    );
  }


  return null;
}

// ============================================================================
// SUPPORT COMPONENTS
// ============================================================================

function Background({ type, image, video, theme }) {
  if (type === "video" && video) {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src={video} type="video/mp4" />
      </video>
    );
  }

  if (type === "image" && image) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${image})` }}
      />
    );
  }

  if (type === "gradient") {
    const primaryColor = theme?.primary_color || "#3B82F6";
    const secondaryColor = theme?.secondary_color || "#8B5CF6";
    
    return (
      <div 
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
        }}
      />
    );
  }

  if (type === "solid") {
  return (
    <div
      className="absolute inset-0"
      style={{ backgroundColor: theme?.background_color || "#111827" }}
    />
  );
}


  return null;
}

function Overlay({ opacity }) {
  if (!opacity) return null;
  return (
    <div className="absolute inset-0 bg-black" style={{ opacity }} />
  );
}

function CTAButtons({ primary, primaryUrl, secondary, secondaryUrl, alignment = "left", size = "default", primaryStyle, isRTL }) {
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[alignment];

  const sizeClass = size === "large" ? "px-10 py-5 text-lg" : "px-6 py-3 text-base";

  return (
    <div className={`flex flex-wrap gap-4 ${alignClass} ${isRTL ? "flex-row-reverse" : ""}`}>
      {primary && (
        <a 
          href={primaryUrl}
          className={`${sizeClass} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all`}
          style={primaryStyle}
        >
          {primary}
        </a>
      )}
      {secondary && (
        <a 
          href={secondaryUrl}
          className={`${sizeClass} bg-white/20 backdrop-blur text-white border border-white/30 rounded-xl font-semibold hover:bg-white/30 transition-all`}
        >
          {secondary}
        </a>
      )}
    </div>
  );
}

function TrustBadges({ badges, dark = false }) {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {badges.map((badge, idx) => {
        const text = typeof badge === "string" ? badge : badge.text || badge.title;
        return (
          <span
            key={idx}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              dark
                ? "bg-gray-100 text-gray-700"
                : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
            }`}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}

function CheckIcon({ color = "#10B981" }) {
  return (
    <svg
      className="w-6 h-6 flex-shrink-0 mt-1"
      fill={color}
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
