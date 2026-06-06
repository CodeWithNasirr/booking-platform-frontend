// src/hooks/useApiError.js
"use client";

/**
 * useApiError
 * ─────────────────────────────────────────────────────────────────
 * Tiny hook for form-level error handling.
 * Catches API errors and returns structured state for inline display.
 *
 * Usage in any form component:
 *
 *   const { error, handleError, clearError } = useApiError();
 *
 *   async function handleSubmit() {
 *     try {
 *       clearError();
 *       await createBooking(data);
 *     } catch (err) {
 *       handleError(err);     // sets error state from err.code + err.message
 *     }
 *   }
 *
 *   return (
 *     <>
 *       {error && <ApiErrorAlert error={error} onDismiss={clearError} />}
 *       <form onSubmit={handleSubmit}>...
 *     </>
 *   );
 */

import { useState, useCallback } from "react";
import { isPlatformError, getPlatformErrorLevel } from "@/lib/apiErrorHandler";
import { AlertCircle, X } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════

export default function useApiError() {
  const [error, setError] = useState(null);

  const handleError = useCallback((err) => {
    if (!err) return;

    setError({
      code:    err.code    || "unknown",
      message: err.message || "Something went wrong.",
      level:   getPlatformErrorLevel(err) || "field",
      data:    err.data    || {},
    });
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const isCode = useCallback((code) => error?.code === code, [error]);

  return { error, handleError, clearError, isCode };
}


// ═══════════════════════════════════════════════════════════════
// COMPANION COMPONENT — inline error alert for forms
// ═══════════════════════════════════════════════════════════════

/**
 * ApiErrorAlert — drop into any form to show API errors inline.
 *
 * Usage:
 *   import { ApiErrorAlert } from "@/hooks/useApiError";
 *   ...
 *   {error && <ApiErrorAlert error={error} onDismiss={clearError} />}
 */
export function ApiErrorAlert({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm animate-[slideDown_.15s_ease-out]">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-red-800 text-[13px]">{error.message}</p>
        {error.code !== "unknown" && (
          <p className="text-[10px] text-red-500 mt-0.5 font-mono">{error.code}</p>
        )}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 rounded-lg hover:bg-red-100 flex-shrink-0">
          <X className="w-4 h-4 text-red-400" />
        </button>
      )}
    </div>
  );
}