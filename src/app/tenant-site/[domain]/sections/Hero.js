// "use client";

// import { useTenantLang } from "../../contexts/TenantLangContext";
// import { useTenantTheme } from "../../contexts/TenantThemeContext";
// import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

// export default function Hero({ data, lang: propLang }) {
//   const { language, isRTL } = useTenantLang();
//   const theme = useTenantTheme();
//   const lang = propLang || language;
//   // console.log("Rendering Hero with data:", data);
//   const {
//   variant = "centered",
//   alignment = "center",
//   title,
//   subtitle,
//   description,
//   primary_cta,
//   primary_cta_url = "#book",
//   secondary_cta,
//   secondary_cta_url = "#",
//   overlay_opacity = 0.5,
//   text_color = "white",
//   trust_badges = [],
//   features_list = [],
//   stats = [],
//   show_availability = false,
//   floating_card = null,
//   } = data || {};


//   const background = data?.background || {};
//   const backgroundType = background.type || "gradient";
//   const backgroundValue = background.value || null;

//   // Resolve translations
//   const resolvedTitle = resolveTranslated(title, lang);
//   const resolvedSubtitle = resolveTranslated(subtitle, lang);
//   const resolvedDescription = resolveTranslated(description, lang);
//   const resolvedPrimaryCtaText = resolveTranslated(primary_cta?.text, lang);
//   const resolvedPrimaryCtaUrl = primary_cta?.url || primary_cta_url;

//   const resolvedSecondaryCtaText = resolveTranslated(secondary_cta?.text, lang);
//   const resolvedSecondaryCtaUrl = secondary_cta?.url || secondary_cta_url;

//   const resolvedTrustBadges = resolveTranslatedArray(trust_badges, lang);
//   const resolvedFeatures = resolveTranslatedArray(features_list, lang);
//   const resolvedStats = resolveTranslatedArray(stats, lang, ["label"]);

//   const textColorClass = "text-[color:var(--color-text)]";
//   const subTextColorClass = "text-[color:var(--color-text-muted)]";

//   const textColorClassMap = {
//     white: "text-white",
//     black: "text-black",
//     primary: "text-[color:var(--color-primary)]",
//     secondary: "text-[color:var(--color-secondary)]",
//   };

//   const resolvedTextColorClass =
//     textColorClassMap[text_color] || "text-[color:var(--color-text)]";


  
//   // Use theme primary color for CTA buttons
//   const primaryButtonStyle = {
//     backgroundColor: "var(--color-primary)",
//   };

//   const secondaryButtonStyle = {
//     backgroundColor: "var(--color-secondary)",
//   };


//   // console.log(theme)

//   // ============================================================
//   // CENTERED HERO
//   // ============================================================
//   if (variant === "centered" ) {
//     return (
//       <section className="relative min-h-screen z-0 flex items-center justify-center px-6 py-24 md:py-32">
//         <Background type={backgroundType} value={backgroundValue} theme={theme} />
        
//         {/* <Background type={background_type} image={background_image} video={background_video} theme={theme} /> */}
//         <Overlay opacity={overlay_opacity} />

//         <div className={`relative z-10 max-w-4xl mx-auto text-center animate-fade-in ${isRTL ? "rtl" : ""}`}>
//           {resolvedTitle && (
//             <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight mb-6 ${resolvedTextColorClass}`}>
//               {resolvedTitle}
//             </h1>
//           )}

//           {resolvedSubtitle && (
//             <p className={`text-xl md:text-2xl mb-10 leading-relaxed ${subTextColorClass}`}>
//               {resolvedSubtitle}
//             </p>
//           )}

//           <CTAButtons 
//             primary={resolvedPrimaryCtaText}
//             primaryUrl={resolvedPrimaryCtaUrl}
//             secondary={resolvedSecondaryCtaText}
//             secondaryUrl={resolvedSecondaryCtaUrl}
//             alignment="center"
//             primaryStyle={primaryButtonStyle}
//             secondaryStyle={secondaryButtonStyle}
//             isRTL={isRTL}
//           />

//           {resolvedTrustBadges.length > 0 && (
//             <div className="mt-14">
//               <TrustBadges badges={resolvedTrustBadges} />
//             </div>
//           )}
//         </div>
//       </section>
//     );
//   }

//   // ============================================================
//   // SPLIT HERO
//   // ============================================================
//   if (variant === "split" ) {
//     return (
//       <section className={`relative grid md:grid-cols-2 gap-16 items-center px-6 md:px-12 py-28 ${isRTL ? "rtl" : ""}`}>
        
//         <div className={alignment === "right" ? "md:order-2" : ""}>
//           {resolvedTitle && (
//             <h1 className={`text-5xl md:text-6xl font-extrabold ${resolvedTextColorClass} mb-6 leading-tight`}>
//               {resolvedTitle}
//             </h1>
//           )}

//           {resolvedSubtitle && (
//             <p className={`text-xl ${subTextColorClass} mb-8 leading-relaxed`}>
//               {resolvedSubtitle}
//             </p>
//           )}

//           {resolvedFeatures.length > 0 && (
//             <ul className="space-y-4 mb-10">
//               {resolvedFeatures.map((feature, idx) => (
//                 <li key={idx} className="flex items-start gap-3">
//                   <CheckIcon color={"var(--color-primary)"} />
//                   <span className="text-gray-700 text-lg">
//                     {typeof feature === "string" ? feature : feature.title || feature.text}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           )}

//           {resolvedTrustBadges.length > 0 && (
//             <div className="mb-8">
//               <TrustBadges badges={resolvedTrustBadges} dark />
//             </div>
//           )}

//           <CTAButtons 
//             primary={resolvedPrimaryCtaText}
//             primaryUrl={resolvedPrimaryCtaUrl}
//             secondary={resolvedSecondaryCtaText}
//             secondaryUrl={resolvedSecondaryCtaUrl}
//             alignment="left"
//             primaryStyle={primaryButtonStyle}
//             secondaryStyle={secondaryButtonStyle}
//             isRTL={isRTL}
//           />
//         </div>

//         <div className={alignment === "right" ? "" : "md:order-2"}>
//           <div className="relative group">
//             {backgroundType === "image" && backgroundValue && (
//               <img
//                 src={backgroundValue}
//                 alt="Hero"
//                 className="w-full rounded-3xl shadow-2xl transform transition-all group-hover:scale-[1.02]"
//               />
//             )}
//           </div>
//         </div>
//       </section>
//     );
//   }

//   // ============================================================
//   // FULLSCREEN HERO
//   // ============================================================
//   if (variant === "fullscreen") {
//     return (
//       <section className={`relative h-screen flex items-center justify-center px-6 ${isRTL ? "rtl" : ""}`}>
//         {/* <Background type={background_type} image={background_image} video={background_video} theme={theme} /> */}
//         <Background type={backgroundType} value={backgroundValue} theme={theme} />

//         <Overlay opacity={overlay_opacity} />

//         <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-soft">
//           {resolvedTitle && (
//             <h1 className={`text-6xl md:text-8xl font-extrabold ${resolvedTextColorClass} mb-8 leading-[1.05] tracking-tight drop-shadow-xl`}>
//               {resolvedTitle}
//             </h1>
//           )}

//           {resolvedSubtitle && (
//             <p className={`text-2xl mb-14 max-w-3xl mx-auto leading-relaxed ${subTextColorClass}`}>
//               {resolvedSubtitle}
//             </p>
//           )}

//           <CTAButtons 
//              primary={resolvedPrimaryCtaText}
//             primaryUrl={resolvedPrimaryCtaUrl}
//             secondary={resolvedSecondaryCtaText}
//             secondaryUrl={resolvedSecondaryCtaUrl}
//             alignment="center"
//             size="large"
//             primaryStyle={primaryButtonStyle}
//             secondaryStyle={secondaryButtonStyle}
//             isRTL={isRTL}
//           />

//           {resolvedStats.length > 0 && (
//             <div className="flex flex-wrap justify-center gap-12 mt-16">
//               {resolvedStats.map((stat, i) => (
//                 <div key={i} className="text-center">
//                   <div className="text-4xl md:text-5xl font-bold text-white drop-shadow">
//                     {stat.number || stat.value}
//                   </div>
//                   <div className="text-white/80 mt-2 text-sm md:text-base">
//                     {stat.label}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </section>
//     );
//   }

//   return null;
// }

// // ============================================================================
// // SUPPORT COMPONENTS
// // ============================================================================

// function Background({ type, value, theme }) {
  
//   if (type === "solid") {
//     return (
//       <div
//         className="absolute inset-0"
//         style={{ background: value || "var(--color-primary)" }}
//       />
//     );
//   }


//   if (type === "image" && value) {
//     return (
//       <div
//         className="absolute inset-0 bg-cover bg-center"
//         style={{ backgroundImage: `url(${value})` }}
//       />
//     );
//   }

//   if (type === "video" && value) {
//     return (
//       <video
//         autoPlay
//         loop
//         muted
//         playsInline
//         className="absolute inset-0 w-full h-full object-cover"
//       >
//         <source src={value} type="video/mp4" />
//       </video>
//     );
//   }

//   // gradient fallback
//   // const primary = theme.colors.primary || "#3B82F6";
//   // const secondary = theme.colors.secondary || "#8B5CF6";

//   return (
//     <div
//       className="absolute inset-0"
//       style={{
//       background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
//       }}
//     />
//   );
// }


// function Overlay({ opacity }) {
//   if (!opacity) return null;
//   return (
//     <div className="absolute inset-0 bg-black" style={{ opacity }} />
//   );
// }

// function CTAButtons({ primary, primaryUrl, secondary, secondaryUrl, alignment = "left", size = "default", primaryStyle, secondaryStyle, isRTL }) {
//   const alignClass = {
//     left: "justify-start",
//     center: "justify-center",
//     right: "justify-end",
//   }[alignment];

//   const sizeClass = size === "large" ? "px-10 py-5 text-lg" : "px-6 py-3 text-base";

//   return (
//     <div className={`flex flex-wrap gap-4 ${alignClass} ${isRTL ? "flex-row-reverse" : ""}`}>
//       {primary && (
//         <a 
//           href={primaryUrl}
//           className={`${sizeClass} text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all`}
//           style={primaryStyle}
//         >
//           {primary}
//         </a>
//       )}
//       {secondary && (
//         <a 
//           href={secondaryUrl}
//           className={`${sizeClass} bg-white/20 backdrop-blur text-white border hover:text-white/50 border-white/30 rounded-xl font-semibold transition-all`}
//           style={secondaryStyle}
//         >
//           {secondary}
//         </a>
//       )}
//     </div>
//   );
// }

// function TrustBadges({ badges, dark = false }) {
//   return (
//     <div className="flex flex-wrap justify-center gap-4">
//       {badges.map((badge, idx) => {
//         const text = typeof badge === "string" ? badge : badge.text || badge.title;
//         return (
//           <span
//             key={idx}
//             className={`px-4 py-2 rounded-lg text-sm font-medium ${
//               dark
//                 ? "bg-gray-100 text-gray-700"
//                 : "bg-white/10 backdrop-blur-sm border border-white/20 text-white"
//             }`}
//           >
//             {text}
//           </span>
//         );
//       })}
//     </div>
//   );
// }

// function CheckIcon({ color = "#10B981" }) {
//   return (
//     <svg
//       className="w-6 h-6 flex-shrink-0 mt-1"
//       fill={color}
//       viewBox="0 0 20 20"
//     >
//       <path
//         fillRule="evenodd"
//         d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//         clipRule="evenodd"
//       />
//     </svg>
//   );
// }
"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Hero({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = propLang || language;
  // console.log("Rendering Hero with data:", data);
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
  overlay_opacity = 0.5,
  text_color = "white",
  trust_badges = [],
  features_list = [],
  stats = [],
  show_availability = false,
  floating_card = null,
  } = data || {};


  const background = data?.background || {};
  const backgroundType = background.type || "gradient";
  const backgroundValue = background.value || null;

  // Resolve translations
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedDescription = resolveTranslated(description, lang);
  const resolvedPrimaryCtaText = resolveTranslated(primary_cta?.text, lang);
  const resolvedPrimaryCtaUrl = primary_cta?.url || primary_cta_url;

  const resolvedSecondaryCtaText = resolveTranslated(secondary_cta?.text, lang);
  const resolvedSecondaryCtaUrl = secondary_cta?.url || secondary_cta_url;

  const resolvedTrustBadges = resolveTranslatedArray(trust_badges, lang);
  const resolvedFeatures = resolveTranslatedArray(features_list, lang);
  const resolvedStats = resolveTranslatedArray(stats, lang, ["label"]);

  const textColorClass = "text-[color:var(--color-text)]";
  const subTextColorClass = "text-[color:var(--color-text-muted)]";

  const textColorClassMap = {
    white: "text-white",
    black: "text-black",
    primary: "text-[color:var(--color-primary)]",
    secondary: "text-[color:var(--color-secondary)]",
  };

  const resolvedTextColorClass =
    textColorClassMap[text_color] || "text-[color:var(--color-text)]";


  
  // Use theme primary color for CTA buttons
  const primaryButtonStyle = {
    backgroundColor: "var(--color-primary)",
  };

  const secondaryButtonStyle = {
    backgroundColor: "var(--color-secondary)",
  };


  // console.log(theme)

  // ============================================================
  // CENTERED HERO
  // ============================================================
  if (variant === "centered" ) {
    return (
      <section className="relative min-h-screen z-0 flex items-center justify-center px-4 sm:px-6 py-16 sm:py-24 md:py-32">
        <Background type={backgroundType} value={backgroundValue} theme={theme} />
        
        {/* <Background type={background_type} image={background_image} video={background_video} theme={theme} /> */}
        <Overlay opacity={overlay_opacity} />

        <div className={`relative z-10 max-w-4xl mx-auto text-center animate-fade-in ${isRTL ? "rtl" : ""}`}>
          {resolvedTitle && (
            <h1 className={`text-3xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 ${resolvedTextColorClass}`}>
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p className={`text-base sm:text-xl md:text-2xl mb-6 sm:mb-10 leading-relaxed ${subTextColorClass}`}>
              {resolvedSubtitle}
            </p>
          )}

          <CTAButtons 
            primary={resolvedPrimaryCtaText}
            primaryUrl={resolvedPrimaryCtaUrl}
            secondary={resolvedSecondaryCtaText}
            secondaryUrl={resolvedSecondaryCtaUrl}
            alignment="center"
            primaryStyle={primaryButtonStyle}
            secondaryStyle={secondaryButtonStyle}
            isRTL={isRTL}
          />

          {resolvedTrustBadges.length > 0 && (
            <div className="mt-8 sm:mt-14">
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
  if (variant === "split" ) {
    return (
      <section className={`relative grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center px-4 sm:px-6 md:px-12 py-16 sm:py-28 ${isRTL ? "rtl" : ""}`}>
        
        <div className={alignment === "right" ? "md:order-2" : ""}>
          {resolvedTitle && (
            <h1 className={`text-3xl sm:text-5xl md:text-6xl font-extrabold ${resolvedTextColorClass} mb-4 sm:mb-6 leading-tight`}>
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p className={`text-base sm:text-xl ${subTextColorClass} mb-6 sm:mb-8 leading-relaxed`}>
              {resolvedSubtitle}
            </p>
          )}

          {resolvedFeatures.length > 0 && (
            <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-10">
              {resolvedFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <CheckIcon color={"var(--color-primary)"} />
                  <span className="text-gray-700 text-base sm:text-lg">
                    {typeof feature === "string" ? feature : feature.title || feature.text}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {resolvedTrustBadges.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <TrustBadges badges={resolvedTrustBadges} dark />
            </div>
          )}

          <CTAButtons 
            primary={resolvedPrimaryCtaText}
            primaryUrl={resolvedPrimaryCtaUrl}
            secondary={resolvedSecondaryCtaText}
            secondaryUrl={resolvedSecondaryCtaUrl}
            alignment="left"
            primaryStyle={primaryButtonStyle}
            secondaryStyle={secondaryButtonStyle}
            isRTL={isRTL}
          />
        </div>

        <div className={alignment === "right" ? "" : "md:order-2"}>
          <div className="relative group">
            {backgroundType === "image" && backgroundValue && (
              <img
                src={backgroundValue}
                alt="Hero"
                className="w-full rounded-2xl sm:rounded-3xl shadow-2xl transform transition-all group-hover:scale-[1.02]"
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
      <section className={`relative h-screen flex items-center justify-center px-4 sm:px-6 ${isRTL ? "rtl" : ""}`}>
        {/* <Background type={background_type} image={background_image} video={background_video} theme={theme} /> */}
        <Background type={backgroundType} value={backgroundValue} theme={theme} />

        <Overlay opacity={overlay_opacity} />

        <div className="relative z-10 max-w-5xl mx-auto text-center animate-fade-in-soft px-2 sm:px-0">
          {resolvedTitle && (
            <h1 className={`text-4xl sm:text-6xl md:text-8xl font-extrabold ${resolvedTextColorClass} mb-4 sm:mb-8 leading-[1.1] sm:leading-[1.05] tracking-tight drop-shadow-xl`}>
              {resolvedTitle}
            </h1>
          )}

          {resolvedSubtitle && (
            <p className={`text-lg sm:text-2xl mb-8 sm:mb-14 max-w-3xl mx-auto leading-relaxed ${subTextColorClass}`}>
              {resolvedSubtitle}
            </p>
          )}

          <CTAButtons 
             primary={resolvedPrimaryCtaText}
            primaryUrl={resolvedPrimaryCtaUrl}
            secondary={resolvedSecondaryCtaText}
            secondaryUrl={resolvedSecondaryCtaUrl}
            alignment="center"
            size="large"
            primaryStyle={primaryButtonStyle}
            secondaryStyle={secondaryButtonStyle}
            isRTL={isRTL}
          />

          {resolvedStats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 sm:gap-12 mt-10 sm:mt-16">
              {resolvedStats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow">
                    {stat.number || stat.value}
                  </div>
                  <div className="text-white/80 mt-1 sm:mt-2 text-xs sm:text-sm md:text-base">
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

  return null;
}

// ============================================================================
// SUPPORT COMPONENTS
// ============================================================================

function Background({ type, value, theme }) {
  
  if (type === "solid") {
    return (
      <div
        className="absolute inset-0"
        style={{ background: value || "var(--color-primary)" }}
      />
    );
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

  // gradient fallback
  // const primary = theme.colors.primary || "#3B82F6";
  // const secondary = theme.colors.secondary || "#8B5CF6";

  return (
    <div
      className="absolute inset-0"
      style={{
      background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
      }}
    />
  );
}


function Overlay({ opacity }) {
  if (!opacity) return null;
  return (
    <div className="absolute inset-0 bg-black" style={{ opacity }} />
  );
}

function CTAButtons({ primary, primaryUrl, secondary, secondaryUrl, alignment = "left", size = "default", primaryStyle, secondaryStyle, isRTL }) {
  const alignClass = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }[alignment];

  const sizeClass = size === "large" ? "px-6 sm:px-10 py-3 sm:py-5 text-base sm:text-lg" : "px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base";

  return (
    <div className={`flex flex-wrap gap-3 sm:gap-4 ${alignClass} ${isRTL ? "flex-row-reverse" : ""}`}>
      {primary && (
        <a 
          href={primaryUrl}
          className={`${sizeClass} text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl hover:opacity-90 transition-all`}
          style={primaryStyle}
        >
          {primary}
        </a>
      )}
      {secondary && (
        <a 
          href={secondaryUrl}
          className={`${sizeClass} bg-white/20 backdrop-blur text-white border hover:text-white/50 border-white/30 rounded-lg sm:rounded-xl font-semibold transition-all`}
          style={secondaryStyle}
        >
          {secondary}
        </a>
      )}
    </div>
  );
}

function TrustBadges({ badges, dark = false }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
      {badges.map((badge, idx) => {
        const text = typeof badge === "string" ? badge : badge.text || badge.title;
        return (
          <span
            key={idx}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium ${
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
      className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-1"
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