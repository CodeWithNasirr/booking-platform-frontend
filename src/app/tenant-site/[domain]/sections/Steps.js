"use client";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated, resolveTranslatedArray } from "../utils/resolveTranslated";

export default function Steps({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const lang = propLang || language;

  const {
    layout = "horizontal",
    title,
    subtitle,
    steps = [],
  } = data || {};

  
  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);
  const resolvedSteps = resolveTranslatedArray(steps, lang, ["title", "description"]);

  const titleClass = "text-[color:var(--color-text)]";
  const subTitleClass = "text-[color:var(--color-text-muted)]";

  // ===================================================================
  // HORIZONTAL
  // ===================================================================
  if (layout === "horizontal") {
    return (
      <section
        className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}
        style={{ backgroundColor: "var(--color-background)" }}
      >
        <div className="max-w-6xl mx-auto">
          {(resolvedTitle || resolvedSubtitle) && (
            <div className="text-center mb-16">
              {resolvedTitle && (
                <h2 className={`text-4xl font-bold mb-4 ${titleClass}`}>
                  {resolvedTitle}
                </h2>
              )}
              {resolvedSubtitle && (
                <p className={`text-xl ${subTitleClass}`}>
                  {resolvedSubtitle}
                </p>
              )}
            </div>
          )}

          <div
            className="grid gap-8 relative"
            style={{ gridTemplateColumns: `repeat(${Math.min(resolvedSteps.length, 4)}, 1fr)` }}
          >
            {resolvedSteps.map((step, idx) => (
              <div key={idx} className="relative text-center">
                {idx < resolvedSteps.length - 1 && (
                  <div
                    className={`hidden md:block absolute top-12 ${
                      isRTL ? "right-[60%]" : "left-[60%]"
                    } w-[80%] h-0.5`}
                    style={{ backgroundColor: "var(--color-border)" }}
                  />
                )}

                <div
                  className="w-24 h-24 mx-auto mb-6 flex items-center justify-center text-3xl font-bold rounded-2xl shadow-lg text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {step.number || step.icon || idx + 1}
                </div>

                <h3 className={`text-xl font-semibold mb-3 ${titleClass}`}>
                  {step.title}
                </h3>
                <p className={subTitleClass}>{step.description}</p>

                {step.duration && (
                  <span
                    className="inline-block mt-3 px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: "var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  >
                    {step.duration}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // VERTICAL
  // ===================================================================
  if (layout === "vertical") {
    return (
      <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-3xl mx-auto">
          {(resolvedTitle || resolvedSubtitle) && (
            <div className="mb-12">
              {resolvedTitle && (
                <h2 className={`text-4xl font-bold mb-4 ${titleClass}`}>
                  {resolvedTitle}
                </h2>
              )}
              {resolvedSubtitle && (
                <p className={`text-xl ${subTitleClass}`}>
                  {resolvedSubtitle}
                </p>
              )}
            </div>
          )}

          <div className="space-y-8">
            {resolvedSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex gap-6 ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center font-bold rounded-xl text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  {idx + 1}
                </div>

                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${titleClass}`}>
                    {step.title}
                  </h3>
                  <p className={subTitleClass}>{step.description}</p>

                  {step.activities && (
                    <ul className="mt-3 space-y-1">
                      {resolveTranslatedArray(step.activities, lang).map((activity, i) => (
                        <li
                          key={i}
                          className={`text-sm flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "var(--color-primary)" }}
                          />
                          {typeof activity === "string"
                            ? activity
                            : activity.text || activity.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ===================================================================
  // TIMELINE
  // ===================================================================
  if (layout === "timeline") {
    return (
      <section className={`px-6 md:px-12 py-20 ${isRTL ? "rtl" : ""}`}>
        <div className="max-w-4xl mx-auto">
          {(resolvedTitle || resolvedSubtitle) && (
            <div className="text-center mb-12">
              {resolvedTitle && (
                <h2 className={`text-4xl font-bold mb-4 ${titleClass}`}>
                  {resolvedTitle}
                </h2>
              )}
              {resolvedSubtitle && (
                <p className={`text-xl ${subTitleClass}`}>
                  {resolvedSubtitle}
                </p>
              )}
            </div>
          )}

          <div className="relative">
            <div
              className={`absolute ${isRTL ? "right-1/2" : "left-1/2"} -translate-x-1/2 h-full w-0.5`}
              style={{ backgroundColor: "var(--color-primary)" }}
            />

            {resolvedSteps.map((step, idx) => (
              <div
                key={idx}
                className={`relative flex items-center mb-8 ${
                  idx % 2 === 0
                    ? isRTL
                      ? "flex-row"
                      : "flex-row-reverse"
                    : isRTL
                    ? "flex-row-reverse"
                    : "flex-row"
                }`}
              >
                <div
                  className="w-5/12 p-6 rounded-xl shadow-lg"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <h3 className={`text-lg font-semibold mb-2 ${titleClass}`}>
                    {step.title}
                  </h3>
                  <p className={`text-sm ${subTitleClass}`}>
                    {step.description}
                  </p>
                </div>

                <div className="w-2/12 flex justify-center">
                  <div
                    className="w-4 h-4 rounded-full border-4 bg-white"
                    style={{ borderColor: "var(--color-primary)" }}
                  />
                </div>

                <div className="w-5/12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
}
