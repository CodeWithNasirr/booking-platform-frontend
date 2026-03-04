"use client";

import { useTenantTheme } from "../contexts/TenantThemeContext";

export default function PaymentModule({ settings, tenantId, lang }) {
  const theme = useTenantTheme();
  
  const {
    variant = "button",
    amount,
    currency = "USD",
    button_text,
    description,
  } = settings || {};

  const buttonLabel = typeof button_text === "object" 
    ? button_text[lang] || button_text.en 
    : button_text || "Pay Now";

  if (variant === "button") {
    return (
      <button
        className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
        style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        onClick={() => {
          // TODO: Integrate with payment gateway
          console.log("Payment initiated", { amount, currency, tenantId });
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        {buttonLabel}
        {amount && <span>({currency} {amount})</span>}
      </button>
    );
  }

  return null;
}