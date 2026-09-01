"use client";

import { useApp } from "@/contexts/AppContext";
import { ServiceMediaManager } from "../ServiceMediaManager";

export function AdvancedTab({ form, setForm, slug }) {
  const { t, isRTL, activeTenant } = useApp();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("advanced.fullDescription")}
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 border rounded-xl resize-none"
        />
      </div>

      {/* Real file upload → backend → R2. No URL entry. */}
      <ServiceMediaManager
        slug={slug}
        tenantId={activeTenant}
        form={form}
        setForm={setForm}
      />

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <label className="block text-sm font-medium">
            {t("advanced.activeStatus")}
          </label>
          <p className="text-xs text-gray-500">{t("advanced.activeHint")}</p>
        </div>

        <button
          onClick={() => setForm({ ...form, isActive: !form.isActive })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.isActive ? "bg-[#8B1E3F]" : "bg-gray-300"
          }`}
        >
          <span
            className={`
      inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
      ${
        form.isActive
          ? isRTL
            ? "-translate-x-7" // RTL ON → left
            : "translate-x-7" // LTR ON → right
          : isRTL
            ? "-translate-x-1" // ✅ RTL OFF → RIGHT
            : "translate-x-1" // ✅ LTR OFF → LEFT
      }
    `}
          />
        </button>
      </div>
    </div>
  );
}
