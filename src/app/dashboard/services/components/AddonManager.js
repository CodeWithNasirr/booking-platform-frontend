"use client";

import { useApp } from "@/contexts/AppContext";

export function AddonManager({ addons, onChange }) {
  const { t } = useApp();

  const addAddon = () => {
    onChange([
      ...addons,
      {
        name: { en: "" },
        price: 0,
        additional_days: 0,
      },
    ]);
  };

  return (
    <div className="space-y-3 mt-4">
      <h4 className="font-medium text-gray-900">
        {t("addons.title")}
      </h4>

      {addons.map((addon, idx) => (
        <div key={idx} className="flex gap-3 items-start">
          <input
            placeholder={t("addons.namePlaceholder")}
            value={addon.name.en}
            onChange={(e) => {
              const newAddons = [...addons];
              newAddons[idx].name.en = e.target.value;
              onChange(newAddons);
            }}
            className="flex-1 px-3 py-2 border rounded-lg text-sm"
          />

          <input
            type="number"
            placeholder={t("addons.price")}
            value={addon.price}
            onChange={(e) => {
              const newAddons = [...addons];
              newAddons[idx].price = parseFloat(e.target.value) || 0;
              onChange(newAddons);
            }}
            className="w-24 px-3 py-2 border rounded-lg text-sm"
          />

          <input
            type="number"
            placeholder={t("addons.additionalDays")}
            value={addon.additional_days}
            onChange={(e) => {
              const newAddons = [...addons];
              newAddons[idx].additional_days =
                parseInt(e.target.value) || 0;
              onChange(newAddons);
            }}
            className="w-20 px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      ))}

      <button
        onClick={addAddon}
        className="text-sm text-[#8B1E3F] font-medium"
      >
        + {t("addons.add")}
      </button>
    </div>
  );
}
