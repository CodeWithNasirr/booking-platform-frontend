"use client";

import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

export default function StepsHeader({
  steps,
  currentStep,
  onStepClick,
  theme,
  lang,
  isRTL,
}) {
  return (
    <div className="p-6 border-b">
      <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          const isClickable = idx <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{
                  backgroundColor:
                    isActive || isCompleted
                      ? theme.primary_color || "#3B82F6"
                      : "#E5E7EB",
                  color: isActive || isCompleted ? "#fff" : "#6B7280",
                }}
              >
                {isCompleted ? "✓" : idx + 1}
              </button>

              <span className={`ml-3 text-sm hidden sm:block ${
                isActive ? "text-gray-900" : "text-gray-500"
              }`}>
                {resolveTranslated(step.label, lang)}
              </span>

              {idx < steps.length - 1 && (
                <div
                  className="flex-1 h-0.5 mx-4"
                  style={{
                    backgroundColor: isCompleted
                      ? theme.primary_color || "#3B82F6"
                      : "#E5E7EB",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
