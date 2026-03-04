"use client";

import { Package, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export function PackageManager({ packages, onChange }) {
  const { t } = useApp();

  const addPackage = () => {
    onChange([
      ...packages,
      {
        name: { en: "" },
        price: 0,
        delivery_days: 7,
        revisions: 1,
        features: [],
        is_popular: false,
        is_active: true,
      },
    ]);
  };

  const removePackage = (idx) =>
    onChange(packages.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-gray-900">
            {t("packages.title")}
          </h4>
          <p className="text-xs text-gray-500">
            {t("packages.subtitle")}
          </p>
        </div>

        <button
          onClick={addPackage}
          className="px-3 py-1.5 bg-[#8B1E3F] text-white rounded-lg text-sm hover:opacity-90"
        >
          + {t("packages.addTier")}
        </button>
      </div>

      {packages.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
          <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {t("packages.empty")}
          </p>
        </div>
      )}

      {packages.map((pkg, idx) => (
        <div
          key={idx}
          className="border rounded-xl p-4 bg-gray-50 relative group"
        >
          <button
            onClick={() => removePackage(idx)}
            className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <input
              placeholder={t("packages.namePlaceholder")}
              value={pkg.name.en}
              onChange={(e) => {
                const newPkgs = [...packages];
                newPkgs[idx].name.en = e.target.value;
                onChange(newPkgs);
              }}
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="number"
              placeholder={t("packages.price")}
              value={pkg.price}
              onChange={(e) => {
                const newPkgs = [...packages];
                newPkgs[idx].price = parseFloat(e.target.value) || 0;
                onChange(newPkgs);
              }}
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <input
              type="number"
              placeholder={t("packages.deliveryDays")}
              value={pkg.delivery_days}
              onChange={(e) => {
                const newPkgs = [...packages];
                newPkgs[idx].delivery_days =
                  parseInt(e.target.value) || 0;
                onChange(newPkgs);
              }}
              className="px-3 py-2 border rounded-lg"
            />

            <input
              type="number"
              placeholder={t("packages.revisions")}
              value={pkg.revisions}
              onChange={(e) => {
                const newPkgs = [...packages];
                newPkgs[idx].revisions =
                  parseInt(e.target.value) || 0;
                onChange(newPkgs);
              }}
              className="px-3 py-2 border rounded-lg"
            />
          </div>

          <textarea
            placeholder={t("packages.features")}
            value={Array.isArray(pkg.features) ? pkg.features.join("\n") : ""}
            onChange={(e) => {
              const newPkgs = [...packages];
              newPkgs[idx].features = e.target.value
                .split("\n")
                .filter((f) => f.trim());
              onChange(newPkgs);
            }}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            rows={3}
          />

          <label className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              checked={pkg.is_popular}
              onChange={(e) => {
                const newPkgs = packages.map((p, i) => ({
                  ...p,
                  is_popular: i === idx ? e.target.checked : false,
                }));
                onChange(newPkgs);
              }}
              className="rounded text-[#8B1E3F]"
            />
            <span className="text-sm font-medium">
              {t("packages.mostPopular")}
            </span>
          </label>
        </div>
      ))}
    </div>
  );
}
