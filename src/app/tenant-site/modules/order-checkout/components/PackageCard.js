// src/app/tenant-site/modules/order-checkout/components/PackageCard.js
"use client";

import { resolveTranslated } from "../../../[domain]/utils/resolveTranslated";
import { formatCurrency } from "@/lib/currency";
export default function PackageCard({ pkg, selected, onSelect, theme, lang , currency}) {
  console.log(currency,"currency")
  const name = resolveTranslated(pkg.name || pkg.title, lang) || pkg.name;
  const desc = resolveTranslated(pkg.description, lang);
  const color = theme.primary_color || "#3B82F6";

  return (
    <button
      onClick={onSelect}
      className={`p-5 rounded-xl border-2 text-left transition-all hover:shadow-md w-full ${
        selected ? "bg-blue-50" : "border-gray-200 hover:border-gray-300"
      }`}
      style={{ borderColor: selected ? color : undefined }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-gray-900">{name}</h4>
        <span className="text-xl font-bold" style={{ color }}>
          {formatCurrency(pkg.price, currency)}
        </span>
      </div>
      {desc && <p className="text-sm text-gray-500 mb-3">{desc}</p>}
      <div className="flex gap-4 text-xs text-gray-500">
        {pkg.delivery_days && (
          <span>
            🚀 {pkg.delivery_days}{" "}
            {resolveTranslated({ en: "days", ar: "أيام", ur: "دن" }, lang)}
          </span>
        )}
        {pkg.revisions != null && (
          <span>
            🔄 {pkg.revisions}{" "}
            {resolveTranslated({ en: "revisions", ar: "مراجعات", ur: "ریویژنز" }, lang)}
          </span>
        )}
      </div>
      {pkg.features?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {pkg.features.map((f, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {resolveTranslated(f, lang) || f}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}