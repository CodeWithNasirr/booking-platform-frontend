"use client";

import { Check, X, Users } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function Step3_Provider({ formData, update }) {
  const { t, isRTL } = useApp();

  const inputBase =
    "mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm " +
    "text-foreground placeholder:text-foreground/50 " +
    "focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("onboarding.step3.title")}
        </h3>
        <p className="text-foreground/70">
          {t("onboarding.step3.subtitle")}
        </p>
      </div>

      <div
        className={`grid md:grid-cols-2 gap-8 ${
          isRTL ? "md:flex-row-reverse" : ""
        }`}
      >
        {/* FORM */}
        <div className="space-y-5">
          {/* NAME */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("onboarding.step3.providerName")} *
            </label>
            <input
              className={inputBase}
              value={formData.providerName}
              onChange={(e) => update("providerName", e.target.value)}
              placeholder={t("onboarding.step3.providerNamePlaceholder")}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("common.email")} *
            </label>
            <input
              type="email"
              className={inputBase}
              value={formData.providerEmail}
              onChange={(e) => update("providerEmail", e.target.value)}
              placeholder={t("onboarding.step3.providerEmailPlaceholder")}
            />
          </div>

          {/* PHONE */}
          <div>
            <label className="block text-sm font-medium text-foreground">
              {t("auth.phone")}
            </label>
            <input
              type="tel"
              className={inputBase}
              value={formData.providerPhone}
              onChange={(e) => update("providerPhone", e.target.value)}
              placeholder={t("onboarding.step3.providerPhonePlaceholder")}
            />
          </div>

          {/* ASSIGN ALL SERVICES */}
          <div
            className={`p-5 bg-accent rounded-2xl border border-border flex items-center justify-between gap-4 ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <div>
              <p className="font-medium text-foreground mb-1">
                {t("onboarding.step3.assignAll")}
              </p>
              <p className="text-sm text-foreground/70">
                {t("onboarding.step3.assignAllHint")}
              </p>
            </div>

           <button
            type="button"
            onClick={() =>
              update("assignAllServices", !formData.assignAllServices)
            }
            className={[
              "relative inline-flex h-7 w-14 items-center rounded-full transition",
              formData.assignAllServices ? "bg-primary" : "bg-border",
            ].join(" ")}
          >
            <span
              className={[
                "inline-flex h-6 w-6 items-center justify-center rounded-full bg-background shadow transition-transform duration-300",

                // 🔥 RTL/LTR FIX
                formData.assignAllServices
                  ? isRTL
                    ? "-translate-x-7" // RTL ON → left
                    : "translate-x-7"  // LTR ON → right
                  : isRTL
                  ? "-translate-x-1"   // RTL OFF → right
                  : "translate-x-1",  // LTR OFF → left
              ].join(" ")}
            >
              {formData.assignAllServices ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <X className="w-4 h-4 text-foreground/40" />
              )}
            </span>
          </button>

          </div>

          {/* NOTE */}
          <div className="p-4 bg-secondary border border-border rounded-2xl">
            <p className="text-sm text-foreground/80">
              <strong>{t("common.note")}:</strong>{" "}
              {t("onboarding.step3.note")}
            </p>
          </div>
        </div>

        {/* ILLUSTRATION */}
        <div className="hidden md:flex items-center justify-center">
          <div className="relative">
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-background shadow-xl flex items-center justify-center">
                <Users className="w-20 h-20 text-primary" />
              </div>
            </div>

            <div className="absolute -top-4 -right-4 w-12 h-12 bg-primary rounded-full opacity-20" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary rounded-full opacity-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
