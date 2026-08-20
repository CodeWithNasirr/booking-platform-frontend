// src/app/tenant-site/modules/order-checkout/components/PackageCard.js
"use client";

import { Check, Truck, RefreshCw } from "lucide-react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { formatCurrency } from "@/lib/currency";

export default function PackageCard({ pkg, selected, onSelect, theme, lang, currency }) {
  const name = resolveTranslated(pkg.name || pkg.title, lang) || pkg.name;
  const desc = resolveTranslated(pkg.description, lang);

  return (
    <button
      onClick={onSelect}
      className={`p-5 rounded-xl border text-start transition-all hover:shadow-sm w-full ${
        selected ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex justify-between items-start gap-3 mb-2">
        <h4 className="font-bold text-foreground">{name}</h4>
        <span className="text-lg font-bold text-primary tabular-nums shrink-0">
          {formatCurrency(pkg.price, currency)}
        </span>
      </div>
      {desc && <p className="text-sm text-muted-foreground mb-3">{desc}</p>}
      <div className="flex gap-4 text-xs text-muted-foreground">
        {pkg.delivery_days && (
          <span className="inline-flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" /> {pkg.delivery_days}{" "}
            {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
          </span>
        )}
        {pkg.revisions != null && (
          <span className="inline-flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" /> {pkg.revisions}{" "}
            {resolveTranslated({ en: "revisions", ar: "مراجعات", ur: "ریویژنز" }, lang)}
          </span>
        )}
      </div>
      {pkg.features?.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {pkg.features.map((f, i) => (
            <li key={i} className="text-sm text-foreground flex items-center gap-2">
              <Check className="w-4 h-4 text-success shrink-0" />
              {resolveTranslated(f, lang) || f}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
