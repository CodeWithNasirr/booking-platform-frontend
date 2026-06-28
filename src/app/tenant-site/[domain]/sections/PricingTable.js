"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantSite } from "../TenantClientWrapper";
import {
  resolveTranslated,
  resolveTranslatedArray,
} from "../utils/resolveTranslated";
import {
  resolvePricingPlans,
  ensurePricingSource,
} from "@/lib/pricingSources";
import { resolveNavItem } from "@/lib/navigationResolver";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ──────────────────────────────────────────────────────────────────────────
// PricingTable — entry point
// ──────────────────────────────────────────────────────────────────────────

export default function PricingTable({ data, lang: propLang }) {
  const { language, isRTL } = useTenantLang();
  const { domain } = useTenantSite();
  const lang = propLang || language;

  const {
    title,
    subtitle,
    billing_toggle,
    default_billing,
    highlight_recommended = false,
  } = data || {};

  const source = ensurePricingSource(data || {});

  // Lazy-load services only when the source needs them.
  const needsServices = source.type === "services" || source.type === "subscriptions";
  const allServices = useTenantServices(domain, needsServices);

  const plans = useMemo(
    () => resolvePricingPlans(source, { allServices }),
    [source, allServices]
  );

  // Billing toggle visibility rules
  const hasAnyYearly = plans.some((p) => p.price.yearly != null);
  const hasAnyMonthly = plans.some((p) => p.price.monthly != null);
  const showToggle =
    (source.type === "subscriptions" && hasAnyMonthly && hasAnyYearly) ||
    (source.type === "static" && billing_toggle && hasAnyYearly);

  const [isYearly, setIsYearly] = useState(default_billing === "yearly");

  const resolvedTitle = resolveTranslated(title, lang);
  const resolvedSubtitle = resolveTranslated(subtitle, lang);

  return (
    <section
      className={`py-20 px-6 ${isRTL ? "rtl" : ""}`}
      style={{ backgroundColor: "var(--color-background)" }}
    >
      <div className="max-w-7xl mx-auto">
        {(resolvedTitle || resolvedSubtitle) && (
          <PricingHeader title={resolvedTitle} subtitle={resolvedSubtitle} />
        )}

        {showToggle && (
          <BillingToggle
            isYearly={isYearly}
            onChange={setIsYearly}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        <PricingGrid
          plans={plans}
          isYearly={isYearly}
          highlightRecommended={highlight_recommended}
          lang={lang}
          isRTL={isRTL}
        />

        {plans.length === 0 && (
          <p className="text-center text-[color:var(--color-text-muted)] mt-8">
            {resolveTranslated(
              {
                en: "No pricing plans configured yet.",
                ar: "لم يتم إعداد خطط الأسعار بعد.",
                ur: "ابھی تک کوئی قیمت پلانز ترتیب نہیں دیے گئے۔",
              },
              lang
            )}
          </p>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────────────────

function PricingHeader({ title, subtitle }) {
  return (
    <div className="text-center mb-10">
      {title && (
        <h2 className="text-4xl font-bold mb-4 text-[color:var(--color-text)]">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-xl text-[color:var(--color-text-muted)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function BillingToggle({ isYearly, onChange, lang, isRTL }) {
  const monthlyLabel = resolveTranslated(
    { en: "Monthly", ar: "شهري", ur: "ماہانہ" },
    lang
  );
  const yearlyLabel = resolveTranslated(
    { en: "Yearly", ar: "سنوي", ur: "سالانہ" },
    lang
  );

  return (
    <div
      className={`flex justify-center mb-14 ${
        isRTL ? "flex-row-reverse" : ""
      }`}
    >
      <div className="flex items-center gap-2 rounded-full p-1 border border-[color:var(--color-border)]">
        <ToggleButton
          active={!isYearly}
          onClick={() => onChange(false)}
          label={monthlyLabel}
        />
        <ToggleButton
          active={isYearly}
          onClick={() => onChange(true)}
          label={yearlyLabel}
        />
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition ${
        active ? "text-white" : "text-[color:var(--color-text-muted)]"
      }`}
      style={{
        backgroundColor: active ? "var(--color-primary)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}

function PricingGrid({ plans, isYearly, highlightRecommended, lang, isRTL }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <PricingCard
          key={plan.id}
          plan={plan}
          isYearly={isYearly}
          highlightRecommended={highlightRecommended}
          lang={lang}
          isRTL={isRTL}
        />
      ))}
    </div>
  );
}

function PricingCard({ plan, isYearly, highlightRecommended, lang, isRTL }) {
  const isFeatured =
    plan.featured || (highlightRecommended && plan.meta?.source === "static");

  const resolvedName = resolveTranslated(plan.name, lang);
  const resolvedDescription = resolveTranslated(plan.description, lang);
  const features = resolveTranslatedArray(plan.features || [], lang);

  return (
    <div
      className={`relative rounded-2xl p-8 transition-all ${
        isFeatured ? "scale-105" : ""
      }`}
      style={{
        backgroundColor: "var(--color-background)",
        border: isFeatured
          ? "2px solid var(--color-primary)"
          : "1px solid var(--color-border)",
        boxShadow: "var(--shadow)",
      }}
    >
      <PlanBadge badge={plan.badge} isFeatured={isFeatured} lang={lang} />

      <h3 className="text-2xl font-bold mb-3 text-[color:var(--color-text)]">
        {resolvedName}
      </h3>

      {resolvedDescription && (
        <p className="text-sm text-[color:var(--color-text-muted)] mb-4">
          {resolvedDescription}
        </p>
      )}

      <PriceDisplay price={plan.price} isYearly={isYearly} lang={lang} />

      <FeatureList features={features} isRTL={isRTL} />

      <PlanCTA
        cta={plan.cta}
        isFeatured={isFeatured}
        defaultLabel={defaultCtaLabel(plan, lang)}
        lang={lang}
      />
    </div>
  );
}

function PlanBadge({ badge, isFeatured, lang }) {
  if (!badge && !isFeatured) return null;
  const badgeText = badge?.text
    ? resolveTranslated(badge.text, lang)
    : resolveTranslated(
        { en: "Recommended", ar: "موصى به", ur: "تجویز کردہ" },
        lang
      );
  return (
    <div
      className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-sm font-semibold rounded-full"
      style={{ backgroundColor: badge?.color || "var(--color-primary)" }}
    >
      {badgeText}
    </div>
  );
}

function PriceDisplay({ price, isYearly, lang }) {
  if (!price) return null;

  const value = isYearly
    ? price.yearly ?? price.monthly
    : price.monthly ?? price.yearly;

  if (value == null) return null;

  const period = isYearly
    ? resolveTranslated(price.period_yearly, lang)
    : resolveTranslated(price.period_monthly, lang);

  const currency = price.currency || "";
  return (
    <div className="mb-6">
      <span className="text-5xl font-extrabold text-[color:var(--color-text)]">
        {currency && <span className="text-2xl me-1 align-top">{currency}</span>}
        {value}
      </span>
      {period && (
        <span className="ml-2 text-[color:var(--color-text-muted)]">
          {period}
        </span>
      )}
    </div>
  );
}

function FeatureList({ features, isRTL }) {
  if (!features?.length) return null;
  return (
    <ul className="space-y-3 mb-8">
      {features.map((feature, fIdx) => (
        <li
          key={fIdx}
          className={`flex items-center gap-3 ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            style={{ color: "var(--color-primary)" }}
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[color:var(--color-text-muted)]">
            {typeof feature === "string"
              ? feature
              : feature?.label || feature?.text || ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PlanCTA({ cta, isFeatured, defaultLabel, lang }) {
  const nav = resolveNavItem(cta);
  const text = resolveTranslated(cta?.text, lang) || defaultLabel;

  const style = isFeatured
    ? { backgroundColor: "var(--color-primary)", color: "#fff" }
    : {
        border: "2px solid var(--color-primary)",
        color: "var(--color-primary)",
        backgroundColor: "transparent",
      };

  if (!nav.ok) {
    return (
      <button
        type="button"
        className="w-full py-3 px-6 rounded-xl font-semibold transition-all"
        style={style}
      >
        {text}
      </button>
    );
  }

  return (
    <Link
      href={nav.href}
      target={nav.target}
      rel={nav.rel}
      className="block w-full py-3 px-6 rounded-xl font-semibold transition-all text-center"
      style={style}
    >
      {text}
    </Link>
  );
}

function defaultCtaLabel(plan, lang) {
  if (plan.meta?.source === "subscription") {
    return resolveTranslated(
      { en: "Subscribe", ar: "اشترك", ur: "سبسکرائب کریں" },
      lang
    );
  }
  if (plan.meta?.source === "custom_quote") {
    return resolveTranslated(
      { en: "Request Quote", ar: "اطلب عرض سعر", ur: "کوٹ کی درخواست" },
      lang
    );
  }
  return resolveTranslated(
    { en: "Get Started", ar: "ابدأ الآن", ur: "شروع کریں" },
    lang
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Services fetcher (used only when source.type needs the catalog)
// ──────────────────────────────────────────────────────────────────────────

function useTenantServices(domain, enabled) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    if (!enabled || !domain) return;
    let cancelled = false;

    fetch(`${API_BASE}/api/v1/public-services/`, {
      headers: { "Content-Type": "application/json", "X-Tenant": domain },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setServices(data.services || data.results || data || []);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [domain, enabled]);

  return services;
}
