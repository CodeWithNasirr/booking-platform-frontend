// src/app/tenant-site/modules/order-checkout/components/OrderSummary.js
"use client";

import { Package } from "lucide-react";
import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { formatCurrency } from "@/lib/currency";

export default function OrderSummary({ service, pkg, price, deliveryDays, revisionsAllowed, currency, theme, lang, isRTL }) {
  const title = resolveTranslated(service.name, lang);
  const pkgName = pkg ? resolveTranslated(pkg.name || pkg.title, lang) || pkg.name : null;

  return (
    <div className="bg-muted rounded-xl border border-border p-5 space-y-3">
      <h4 className="font-bold text-foreground">{title}</h4>
      {pkgName && (
        <p className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
          <Package className="w-4 h-4" /> {pkgName}
        </p>
      )}
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {resolveTranslated({ en: "Delivery", ar: "التسليم", ur: "ڈیلیوری" }, lang)}
        </span>
        <span className="font-medium text-foreground">
          {deliveryDays} {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {resolveTranslated({ en: "Revisions", ar: "المراجعات", ur: "ریویژنز" }, lang)}
        </span>
        <span className="font-medium text-foreground">{revisionsAllowed}</span>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="text-base font-bold text-foreground">
          {resolveTranslated({ en: "Total", ar: "المجموع", ur: "کل" }, lang)}
        </span>
        <span className="text-xl font-bold text-primary tabular-nums">
          {formatCurrency(price, currency)}
        </span>
      </div>
    </div>
  );
}
