"use client";

import { useTenantTheme } from "../contexts/TenantThemeContext";

export default function VideoCallModule({ settings, tenantId, lang }) {
  const theme = useTenantTheme();
  
  const {
    variant = "button",
    button_text,
    description,
  } = settings || {};

  const buttonLabel = typeof button_text === "object" 
    ? button_text[lang] || button_text.en 
    : button_text || "Start Video Call";

  return (
    <button
      className="px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
      style={{ backgroundColor: theme.primary_color || "#10B981" }}
      onClick={() => {
        // TODO: Integrate with video call service
        console.log("Video call initiated", { tenantId });
      }}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {buttonLabel}
    </button>
  );
}