"use client";

import { Trash2, Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function Step2_Services({
  services,
  addService,
  updateService,
  removeService,
}) {
  const { t, isRTL } = useApp();

  const serviceDurations = [
    { value: 15, label: t("onboarding.step2.duration.15") },
    { value: 30, label: t("onboarding.step2.duration.30") },
    { value: 45, label: t("onboarding.step2.duration.45") },
    { value: 60, label: t("onboarding.step2.duration.60") },
  ];

  // ✅ ONLINE + DIGITAL SERVICE CATEGORIES
  const serviceCategories = [
    { value: "consultation", label: "onboarding.step2.category.consultation" },
    { value: "coaching", label: "onboarding.step2.category.coaching" },
    { value: "design", label: "onboarding.step2.category.design" },
    { value: "development", label: "onboarding.step2.category.development" },
    { value: "marketing", label: "onboarding.step2.category.marketing" },
    { value: "education", label: "onboarding.step2.category.education" },
    { value: "other", label: "onboarding.step2.category.other" },
  ];


  const inputBase =
    "mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm " +
    "text-foreground placeholder:text-foreground/50 " +
    "focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("onboarding.step2.title")}
        </h3>
        <p className="text-foreground/70">
          {t("onboarding.step2.subtitle")}
        </p>
      </div>

      <div className="space-y-5">
        {services.map((service, index) => (
          <div
            key={service.id}
            className="p-6 rounded-2xl border border-border bg-secondary space-y-4"
          >
            {/* SERVICE HEADER */}
            <div
              className={`flex items-center justify-between ${
                isRTL ? "flex-row-reverse" : ""
              }`}
            >
              <h4 className="font-semibold text-foreground">
                {t("onboarding.step2.service")} {index + 1}
              </h4>

              {services.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeService(service.id)}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full
                             bg-destructive/10 text-destructive hover:bg-destructive/20 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* FORM */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* SERVICE NAME */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground">
                  {t("onboarding.step2.serviceName")} *
                </label>
                <input
                  className={inputBase}
                  value={service.name}
                  onChange={(e) =>
                    updateService(service.id, "name", e.target.value)
                  }
                  placeholder={t("onboarding.step2.serviceNamePlaceholder")}
                />
              </div>

              {/* DURATION */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  {t("onboarding.step2.duration")} *
                </label>
                <select
                  className={inputBase}
                  value={service.duration_minutes}
                  onChange={(e) =>
                    updateService(
                      service.id,
                      "duration_minutes",
                      parseInt(e.target.value, 10)
                    )
                  }
                >
                  {serviceDurations.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* PRICE */}
              <div>
                <label className="block text-sm font-medium text-foreground">
                  {t("onboarding.step2.price")} *
                </label>
                <input
                  type="number"
                  className={inputBase}
                  value={service.price}
                  onChange={(e) =>
                    updateService(service.id, "price", e.target.value)
                  }
                  placeholder="0.00"
                />
              </div>

              {/* CATEGORY */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground">
                  {t("onboarding.step2.category")}
                </label>
                <select
                  className={inputBase}
                  value={service.category}
                  onChange={(e) =>
                    updateService(service.id, "category", e.target.value)
                  }
                >
                  {serviceCategories.map((key) => (
                    <option key={key.value} value={key.value}>
                      {t(key.label)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}

        {/* ADD SERVICE */}
        <button
          type="button"
          onClick={addService}
          className="w-full py-4 border-2 border-dashed border-border rounded-2xl
                     text-foreground/70 hover:border-primary hover:text-primary
                     hover:bg-accent transition flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>{t("onboarding.step2.addService")}</span>
        </button>
      </div>
    </div>
  );
}
