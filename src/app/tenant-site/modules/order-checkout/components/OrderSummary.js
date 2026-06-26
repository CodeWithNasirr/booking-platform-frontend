// src/app/tenant-site/modules/order-checkout/components/OrderSummary.js
"use client";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { formatCurrency } from "@/lib/currency";
export default function OrderSummary({ service, pkg, price, deliveryDays, revisionsAllowed , currency, theme, lang, isRTL}) {
  const title = resolveTranslated(service.name, lang);

  const pkgName = pkg ? resolveTranslated(pkg.name || pkg.title, lang) || pkg.name : null;
  const color = theme.primary_color || "#3B82F6";

  return (
    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
      <h4 className="font-bold text-gray-900">{title}</h4>
      {pkgName && <p className="text-sm text-gray-600">📦 {pkgName}</p>}
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {resolveTranslated({ en: "Delivery", ar: "التسليم", ur: "ڈیلیوری" }, lang)}
        </span>
        <span className="font-medium">
          {deliveryDays} {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">
          {resolveTranslated({ en: "Revisions", ar: "المراجعات", ur: "ریویژنز" }, lang)}
        </span>
        <span className="font-medium">{revisionsAllowed}</span>
      </div>
      <div className="flex justify-between pt-3 border-t">
        <span className="text-lg font-bold text-gray-900">
          {resolveTranslated({ en: "Total", ar: "المجموع", ur: "کل" }, lang)}
        </span>
        <span className="text-2xl font-bold" style={{ color }}>
          {formatCurrency(price, currency)}
        </span>
      </div>
    </div>
  );
}