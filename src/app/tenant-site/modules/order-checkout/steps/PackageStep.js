// src/app/tenant-site/modules/order-checkout/steps/PackageStep.js
"use client";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import PackageCard from "../components/PackageCard";
import RequirementsForm from "../components/RequirementsForm";
import { formatCurrency } from "@/lib/currency";

export default function PackageStep({
  service,
  selectedPackage,
  requirements,
  onSelectPackage,
  onChangeRequirements,
  onContinue,
  currentPrice,
  currency,
  deliveryDays,
  theme,
  lang,
  isRTL,
}) {
  const title = resolveTranslated(service.name, lang);
  const desc = resolveTranslated(service.description || service.short_description, lang);

  return (
    <div className="mt-6 space-y-6">
      {/* Service Header */}
      <div className="flex gap-4">
        {service.image && (
          <img
            src={service.image}
            alt={title}
            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
          {desc && <p className="text-muted-foreground text-sm line-clamp-3">{desc}</p>}
        </div>
      </div>

      {/* Packages */}
      {service.packages?.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">
            {resolveTranslated({ en: "Choose a Package", ar: "اختر باقة", ur: "پیکج منتخب کریں" }, lang)}
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {service.packages.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                selected={selectedPackage?.id === pkg.id}
                onSelect={() => onSelectPackage(pkg)}
                currency={currency}
                theme={theme}
                lang={lang}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-muted rounded-xl border border-border text-center">
          <p className="text-2xl font-bold text-primary tabular-nums">
            {formatCurrency(currentPrice, currency)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {resolveTranslated({ en: "Delivery in", ar: "التسليم خلال", ur: "ڈیلیوری" }, lang)}{" "}
            {deliveryDays}{" "}
            {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
          </p>
        </div>
      )}

      {/* Requirements */}
      {service.requirements_schema?.length > 0 && (
        <RequirementsForm
          schema={service.requirements_schema}
          values={requirements}
          onChange={onChangeRequirements}
          lang={lang}
          isRTL={isRTL}
        />
      )}

      {/* Continue */}
      <button
        onClick={onContinue}
        className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-semibold hover:brightness-110 transition"
      >
        {resolveTranslated({ en: "Continue", ar: "متابعة", ur: "جاری رکھیں" }, lang)} — {formatCurrency(currentPrice, currency)}
      </button>
    </div>
  );
}
