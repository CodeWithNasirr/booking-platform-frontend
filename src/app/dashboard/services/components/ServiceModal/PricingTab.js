"use client";

import { Calendar, Box, Repeat, Plus, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export function PricingTab({ form, setForm }) {
  const { t } = useApp();

  // 🔹 Order Types (Backend Supported Only)
  const orderTypes = [
    {
      id: "booking",
      label: t("order.booking"),
      desc: "Scheduled appointment with calendar availability",
      icon: Calendar,
    },
    {
      id: "order",
      label: t("order.order"),
      desc: "Fixed delivery service without scheduling",
      icon: Box,
    },
  ];

  // 🔹 Pricing Types
  const pricingTypes = [
    { id: "fixed", label: "Fixed Price", desc: "Single flat price" },
    { id: "hourly", label: "Hourly", desc: "Charged per hour" },
    { id: "package", label: "Package", desc: "Tier-based pricing" },
    { id: "custom", label: "Custom Quote", desc: "Customer requests price" },
  ];

  // 🔹 Billing Cadence — independent of pricing model. Drives whether
  // this service is a one-time charge or a recurring subscription.
  const billingTypes = [
    { id: "one_time", label: "One-Time", desc: "Single payment per purchase" },
    { id: "monthly", label: "Monthly Subscription", desc: "Customer billed every month" },
    { id: "yearly", label: "Yearly Subscription", desc: "Customer billed every year" },
  ];

  const isSubscription = ["monthly", "yearly"].includes(form.billingType);

  // 🔹 Disable logic
  const isOrderTypeDisabled = (typeId) => {
    if (form.serviceType === "online") return typeId !== "booking";
    if (form.serviceType === "digital") return typeId !== "order";
    return false;
  };

  const isPricingDisabled = (typeId) => {
    // Disable hourly for digital orders (if no time tracking)
    if (form.orderType === "order" && typeId === "hourly") return true;
    // Subscription services don't make sense as hourly or package; nudge
    // toward fixed pricing for clear monthly/yearly amounts.
    if (isSubscription && (typeId === "hourly" || typeId === "package")) return true;
    return false;
  };

  const handlePricingChange = (type) => {
    setForm((prev) => ({
      ...prev,
      pricingType: type,
      price: type === "custom" ? 0 : prev.price,
      packages: type === "package" ? prev.packages : [],
    }));
  };

  const handleBillingChange = (billingType) => {
    setForm((prev) => {
      // Switching away from subscription clears subscription-only fields
      // so we don't leave stale prices around. Switching INTO subscription
      // pre-fills the matching field from base_price when sensible.
      const next = { ...prev, billingType };
      if (billingType === "one_time") {
        next.priceMonthly = null;
        next.priceYearly = null;
        next.trialDays = 0;
        next.autoRenewDefault = true;
        next.planFeatures = [];
      } else if (billingType === "monthly" && !prev.priceMonthly) {
        next.priceMonthly = prev.price || null;
      } else if (billingType === "yearly" && !prev.priceYearly) {
        next.priceYearly = prev.price || null;
      }
      return next;
    });
  };

  const addFeature = () => {
    setForm((prev) => ({
      ...prev,
      planFeatures: [...(prev.planFeatures || []), ""],
    }));
  };

  const updateFeature = (idx, value) => {
    setForm((prev) => ({
      ...prev,
      planFeatures: (prev.planFeatures || []).map((f, i) => (i === idx ? value : f)),
    }));
  };

  const removeFeature = (idx) => {
    setForm((prev) => ({
      ...prev,
      planFeatures: (prev.planFeatures || []).filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="space-y-8">

      {/* ================= ORDER TYPE ================= */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {t("services.pricing.orderType")} *
        </label>

        <div className="grid grid-cols-2 gap-4">
          {orderTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = form.orderType === type.id;
            const isDisabled = isOrderTypeDisabled(type.id);

            return (
              <button
                key={type.id}
                disabled={isDisabled}
                onClick={() =>
                  !isDisabled &&
                  setForm({ ...form, orderType: type.id })
                }
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#8B1E3F] bg-rose-50"
                    : isDisabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mb-2 ${
                    isSelected ? "text-[#8B1E3F]" : "text-gray-400"
                  }`}
                />
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {type.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PRICING MODEL ================= */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Pricing Model *
        </label>

        <div className="grid grid-cols-2 gap-4">
          {pricingTypes.map((type) => {
            const isSelected = form.pricingType === type.id;
            const disabled = isPricingDisabled(type.id);

            return (
              <button
                key={type.id}
                disabled={disabled}
                onClick={() => !disabled && handlePricingChange(type.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#8B1E3F] bg-rose-50"
                    : disabled
                    ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {type.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PRICE INPUT ================= */}
      {(form.pricingType === "fixed" ||
        form.pricingType === "hourly") && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {form.pricingType === "hourly"
              ? "Hourly Rate"
              : "Base Price"}{" "}
            *
          </label>

          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({
                ...form,
                price: parseFloat(e.target.value) || 0,
              })
            }
            className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#8B1E3F]"
            placeholder="0.00"
          />
        </div>
      )}

      {/* ================= CUSTOM QUOTE INFO ================= */}
      {form.pricingType === "custom" && (
        <div className="p-4 bg-yellow-50 rounded-xl text-sm text-yellow-800 space-y-1">
          <p className="font-medium">Custom Quote</p>
          <p>
            Customers won't see a fixed price. The "Request Quote" button on
            the published site routes them to your Request a Service page
            where they describe what they need. You can then send a quote and
            convert the accepted quote into an order.
          </p>
        </div>
      )}

      {/* ================= BILLING CADENCE ================= */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          <span className="inline-flex items-center gap-2">
            <Repeat className="w-4 h-4" /> Billing Cadence *
          </span>
        </label>

        <div className="grid grid-cols-3 gap-3">
          {billingTypes.map((bt) => {
            const isSelected = (form.billingType || "one_time") === bt.id;
            return (
              <button
                key={bt.id}
                type="button"
                onClick={() => handleBillingChange(bt.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? "border-[#8B1E3F] bg-rose-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium text-sm">{bt.label}</div>
                <div className="text-xs text-gray-500 mt-1">{bt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SUBSCRIPTION PRICING ================= */}
      {isSubscription && form.pricingType !== "custom" && (
        <div className="border-2 border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-4">
          <div className="text-sm text-indigo-900 font-medium">
            Subscription pricing
          </div>

          {/* Both monthly and yearly prices so the PricingTable's
              toggle can switch between them. Tenant can leave one
              empty to offer a single cadence. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Monthly price {form.billingType === "monthly" ? "*" : "(optional)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.priceMonthly ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priceMonthly: e.target.value === "" ? null : parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B1E3F]"
                placeholder="29.00"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Yearly price {form.billingType === "yearly" ? "*" : "(optional)"}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.priceYearly ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    priceYearly: e.target.value === "" ? null : parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B1E3F]"
                placeholder="290.00"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Set both prices to let customers toggle between monthly and yearly
            on the Pricing Table. The "Billing Cadence" above picks the
            default that's pre-selected when the customer lands on the page.
          </p>

          {/* Trial + auto-renew */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Trial days
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={form.trialDays ?? 0}
                onChange={(e) =>
                  setForm({ ...form, trialDays: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#8B1E3F]"
                placeholder="0"
              />
              <p className="text-xs text-gray-400 mt-1">
                0 = no trial. Trial logic ships in a later phase; you can set
                the field now so it's ready.
              </p>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.autoRenewDefault !== false}
                  onChange={(e) =>
                    setForm({ ...form, autoRenewDefault: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span>Auto-renew by default</span>
              </label>
            </div>
          </div>

          {/* Plan features */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-700">
                Plan features (bullets shown on the Pricing Table card)
              </label>
              <button
                type="button"
                onClick={addFeature}
                className="inline-flex items-center gap-1 text-xs text-[#8B1E3F] hover:underline"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            <div className="space-y-2">
              {(form.planFeatures || []).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={typeof feature === "string" ? feature : (feature?.en || "")}
                    onChange={(e) => updateFeature(idx, e.target.value)}
                    placeholder="e.g. Unlimited bookings"
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#8B1E3F]"
                  />
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="p-1.5 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {(form.planFeatures || []).length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  No features added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}