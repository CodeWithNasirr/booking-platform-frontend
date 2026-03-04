"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

export default function Step1_Business({ formData, update }) {
  const { t, isRTL } = useApp();

  const [options, setOptions] = useState({
    business_types: [],
    timezones: [],
    currencies: [],
  });

  const inputBase =
    "mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm " +
    "text-foreground placeholder:text-foreground/50 " +
    "focus:outline-none focus:ring-2 focus:ring-ring";

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/onboarding/options/`)
      .then((res) => res.json())
      .then(setOptions)
      .catch(() => {
        setOptions({
          business_types: [],
          timezones: [],
          currencies: [],
        });
      });
  }, []);

  return (
    <div className="space-y-8 relative">
      {/* LANGUAGE SWITCHER */}
      {/* <div className={`absolute top-4 ${isRTL ? "left-4" : "right-4"}`}>
        <LanguageSwitcher />
      </div> */}

      {/* HEADER */}
      <div>
        <h3 className="text-xl font-semibold text-foreground">
          {t("onboarding.step1.title")}
        </h3>
        <p className="text-sm text-foreground/70 mt-1">
          {t("onboarding.step1.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BUSINESS NAME */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground">
            {t("onboarding.step1.businessName")} *
          </label>
          <input
            required
            className={inputBase}
            value={formData.businessName || ""}
            onChange={(e) => update("businessName", e.target.value)}
            placeholder={t("onboarding.step1.businessNamePlaceholder")}
          />
        </div>

        {/* BUSINESS TYPE */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("onboarding.step1.businessType")} *
          </label>
          <select
            className={inputBase}
            value={formData.business_type || ""}
            onChange={(e) => update("business_type", e.target.value)}
          >
            <option value="">
              {t("onboarding.step1.selectBusinessType")}
            </option>
            {options.business_types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* TIMEZONE */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("onboarding.step1.timezone")} *
          </label>
          <select
            className={inputBase}
            value={formData.timezone || ""}
            onChange={(e) => update("timezone", e.target.value)}
          >
            <option value="">
              {t("onboarding.step1.selectTimezone")}
            </option>
            {options.timezones.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* CURRENCY */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("onboarding.step1.currency")} *
          </label>
          <select
            className={inputBase}
            value={formData.currency || ""}
            onChange={(e) => update("currency", e.target.value)}
          >
            <option value="">
              {t("onboarding.step1.selectCurrency")}
            </option>
            {options.currencies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* TENANT MODE */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground">
            {t("onboarding.step1.operate")} *
          </label>

          <div
            className={`mt-3 flex flex-col sm:flex-row gap-4 ${
              isRTL ? "sm:flex-row-reverse" : ""
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tenant_mode"
                value="individual"
                checked={formData.tenant_mode === "individual"}
                onChange={(e) => update("tenant_mode", e.target.value)}
              />
              <span>{t("onboarding.step1.individual")}</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tenant_mode"
                value="business"
                checked={formData.tenant_mode === "business"}
                onChange={(e) => update("tenant_mode", e.target.value)}
              />
              <span>{t("onboarding.step1.business")}</span>
            </label>
          </div>
        </div>

        {/* BUSINESS DOCUMENT */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground">
            {t("onboarding.step1.document")}
          </label>

          <input
            required
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) =>
              update("business_document", e.target.files?.[0] || null)
            }
            className="mt-2 block w-full text-sm"
          />

          <p className="text-xs text-foreground/60 mt-1">
            {t("onboarding.step1.documentHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
