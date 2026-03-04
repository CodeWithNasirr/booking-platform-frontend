"use client";

import { Calendar, Box } from "lucide-react";
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

  // 🔹 Disable logic
  const isOrderTypeDisabled = (typeId) => {
    if (form.serviceType === "online") return typeId !== "booking";
    if (form.serviceType === "digital") return typeId !== "order";
    return false;
  };

  const isPricingDisabled = (typeId) => {
    // Disable hourly for digital orders (if no time tracking)
    if (form.orderType === "order" && typeId === "hourly") return true;
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

      {/* ================= CUSTOM INFO ================= */}
      {form.pricingType === "custom" && (
        <div className="p-4 bg-yellow-50 rounded-xl text-sm text-yellow-800">
          Customers will submit a request and you can send a custom quote.
        </div>
      )}
    </div>
  );
}