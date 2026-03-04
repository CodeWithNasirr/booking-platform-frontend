"use client";

import { useApp } from "@/contexts/AppContext";

export function BasicTab({ form, setForm, categories }) {
  const { t } = useApp();

  return (
    <div className="space-y-4">

      {/* Service Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("services.form.name")} *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8B1E3F]"
          placeholder={t("services.form.namePlaceholder")}
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("services.form.category")} *
        </label>
        <select
          value={form.category_id}
          onChange={(e) =>
            setForm({ ...form, category_id: e.target.value })
          }
          className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8B1E3F] bg-white"
        >
          <option value="">
            {t("services.form.selectCategory")}
          </option>

          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name.en}
            </option>
          ))}
        </select>
      </div>

      {/* Duration + Service Type */}
      <div className="grid grid-cols-2 gap-4">

        {/* Duration only for booking services */}
        {form.orderType === "booking" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("services.form.duration")} *
            </label>

            <input
              type="number"
              value={form.duration}
              onChange={(e) =>
                setForm({
                  ...form,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8B1E3F]"
              placeholder={t("services.form.durationExample")}
            />
          </div>
        )}

        {/* Service Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("services.form.serviceType")}
          </label>

          <select
            value={form.serviceType}
            onChange={(e) => {
              const serviceType = e.target.value;

              setForm((prev) => ({
                ...prev,
                serviceType,

                orderType:
                  serviceType === "digital"
                    ? "order"
                    : "booking",

                availability:
                  serviceType === "digital"
                    ? []
                    : prev.availability,
              }));
            }}
            className="w-full px-4 py-3 border rounded-xl bg-white"
          >
            <option value="online">
              {t("serviceType.online")}
            </option>

            <option value="digital">
              {t("serviceType.digital")}
            </option>
          </select>
        </div>
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t("services.form.shortDescription")}
        </label>

        <textarea
          value={form.short_description}
          onChange={(e) =>
            setForm({
              ...form,
              short_description: e.target.value,
            })
          }
          rows={2}
          className="w-full px-4 py-3 border rounded-xl resize-none"
          placeholder={t(
            "services.form.shortDescriptionPlaceholder"
          )}
        />
      </div>

    </div>
  );
}