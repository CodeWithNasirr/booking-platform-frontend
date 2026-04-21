// src/app/dashboard/services/components/ServiceModal/index.js
"use client";

import { X, AlertTriangle } from "lucide-react";
import { BasicTab } from "./BasicTab";
import { PricingTab } from "./PricingTab";
import { PackagesTab } from "./PackagesTab";
import { AvailabilityTab } from "./AvailabilityTab";
import { AdvancedTab } from "./AdvancedTab";
import { useApp } from "@/contexts/AppContext";

import { useServiceIntegrationGuard } from "@/app/dashboard/integrations/hooks/useServiceIntegrationGuard";
import IntegrationRequiredModal from "@/components/shared/IntegrationRequiredModal";

export function ServiceModal({
  editing,
  form,
  setForm,
  activeTab,
  setActiveTab,
  categories,
  onSave,
  onClose,
}) {
  const { t } = useApp();

  // ── Integration dependency guard ──
  const guard = useServiceIntegrationGuard(form.serviceType, form.orderType);

  // Dynamic Tabs Based on Logic
  const tabs = [
    { id: "basic", label: t("services.tabs.basic") },
    { id: "pricing", label: t("services.tabs.pricing") },

    form.pricingType === "package" && {
      id: "packages",
      label: t("services.tabs.packages"),
    },

    form.orderType === "booking" && {
      id: "availability",
      label: t("services.tabs.availability"),
    },

    { id: "advanced", label: t("services.tabs.advanced") },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-900">
            {editing ? t("modal.editService") : t("modal.addService")}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Integration Warning Banner (inline, below header) */}
        {guard.hasWarning && guard.acknowledged && (
          <div className="mx-6 mt-4 flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Integration not connected
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Bookings for this service will fail until a provider connects
                the required integration.
              </p>
              <button
                onClick={guard.recheck}
                className="text-xs font-semibold text-[#8B1E3F] mt-1 hover:underline"
              >
                Re-check now
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 border-b">
          <div className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 font-medium transition-all relative ${
                  activeTab === tab.id ? "text-[#8B1E3F]" : "text-gray-500"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B1E3F]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "basic" && (
            <BasicTab
              form={form}
              setForm={setForm}
              categories={categories}
            />
          )}

          {activeTab === "pricing" && (
            <PricingTab form={form} setForm={setForm} />
          )}

          {activeTab === "packages" && (
            <PackagesTab form={form} setForm={setForm} />
          )}

          {activeTab === "availability" && (
            <AvailabilityTab form={form} setForm={setForm} />
          )}

          {activeTab === "advanced" && (
            <AdvancedTab form={form} setForm={setForm} />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border rounded-xl hover:bg-gray-50"
          >
            {t("modal.cancel")}
          </button>

          <button
            onClick={() => {
              if (guard.validateBeforeSave()) {
                onSave();
              }
            }}
            disabled={guard.isBlocked && !guard.acknowledged}
            className={`px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 transition-all ${
              guard.isBlocked && !guard.acknowledged
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] hover:opacity-90"
            }`}
          >
            {guard.hasWarning && guard.acknowledged && (
              <AlertTriangle className="w-4 h-4 text-amber-200" />
            )}
            {editing ? t("modal.update") : t("modal.create")}
          </button>
        </div>
      </div>

      {/* ── Integration Required Modal ── */}
      {guard.showModal && guard.checkResult && (
        <IntegrationRequiredModal
          checkResult={guard.checkResult}
          panel="tenant"
          allowSkip={true}
          onConnect={guard.handleConnect}
          onSkip={guard.handleSkip}
          onClose={guard.dismissModal}
        />
      )}
    </div>
  );
}