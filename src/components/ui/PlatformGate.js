// src/components/ui/PlatformGate.js
"use client";

/**
 * PlatformGate
 * ─────────────────────────────────────────────────────────────────
 * Listens for platform-level errors broadcast by apiErrorHandler
 * and renders the appropriate UI:
 *
 *   "block" errors  → full-screen overlay (maintenance, api_disabled)
 *   "toast" errors  → bottom-right toast notification (rate limit, etc.)
 *   "modal" errors  → centered modal with details (gateway disabled)
 *
 * Integration:
 *   Wrap your DashboardLayout children with PlatformGate:
 *
 *     import PlatformGate from "@/components/ui/PlatformGate";
 *     ...
 *     <PlatformGate>
 *       <AnnouncementBanner />
 *       <main>{children}</main>
 *     </PlatformGate>
 *
 *   Also wrap the public layout (signup page) for registration_closed.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Wrench, WifiOff, ShieldAlert, X,
  AlertTriangle, Ban, RefreshCw,
} from "lucide-react";
import { onPlatformError } from "@/lib/apiErrorHandler";

const M = "#8B1E3F";

// ═══════════════════════════════════════════════════════════════
// BLOCK-LEVEL ERROR CONFIGS
// ═══════════════════════════════════════════════════════════════

const BLOCK_CONFIG = {
  maintenance: {
    icon: Wrench,
    bg:   "from-slate-900 to-slate-800",
    accent: "text-amber-400",
    accentBg: "bg-amber-400/10 border-amber-400/20",
  },
  api_disabled: {
    icon: WifiOff,
    bg:   "from-slate-900 to-slate-800",
    accent: "text-blue-400",
    accentBg: "bg-blue-400/10 border-blue-400/20",
  },
  capacity_reached: {
    icon: ShieldAlert,
    bg:   "from-slate-900 to-slate-800",
    accent: "text-red-400",
    accentBg: "bg-red-400/10 border-red-400/20",
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function PlatformGate({ children }) {
  // Blocking error state — covers the entire screen
  const [blockError, setBlockError] = useState(null);

  // Toast queue — non-blocking messages
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  // Modal error state — dismissible centered modal
  const [modalError, setModalError] = useState(null);

  // ── Subscribe to platform errors ──
  useEffect(() => {
    const unsub = onPlatformError((payload) => {
      switch (payload.level) {
        case "block":
          setBlockError(payload);
          break;

        case "toast":
        case "field":
          toastId.current += 1;
          const id = toastId.current;
          setToasts(prev => [...prev, { ...payload, id }]);
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
          }, 6000);
          break;

        case "modal":
          setModalError(payload);
          break;

        default:
          break;
      }
    });
    return unsub;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // FULL-SCREEN BLOCK
  // ═══════════════════════════════════════════════════════════

  if (blockError) {
    const cfg  = BLOCK_CONFIG[blockError.code] || BLOCK_CONFIG.maintenance;
    const Icon = cfg.icon;

    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br ${cfg.bg}`}>
        <div className="text-center max-w-md px-8">
          <div className={`w-20 h-20 rounded-2xl ${cfg.accentBg} border flex items-center justify-center mx-auto mb-8`}>
            <Icon className={`w-10 h-10 ${cfg.accent}`} />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            {blockError.title}
          </h1>

          <p className="text-base text-slate-400 leading-relaxed mb-8">
            {blockError.detail}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white border border-slate-600 hover:bg-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>

          {blockError.code === "maintenance" && (
            <p className="text-xs text-slate-500 mt-6">
              The platform is undergoing scheduled maintenance.
              This page will auto-retry when service resumes.
            </p>
          )}
        </div>

        {/* Auto-retry for maintenance every 30 seconds */}
        {blockError.code === "maintenance" && (
          <MaintenanceAutoRetry onClear={() => setBlockError(null)} />
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // NORMAL RENDER + TOAST LAYER + MODAL LAYER
  // ═══════════════════════════════════════════════════════════

  return (
    <>
      {children}

      {/* ── Toast stack ── */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-[80] flex flex-col gap-2 items-end">
          {toasts.map(toast => (
            <div
              key={toast.id}
              className="flex items-start gap-3 px-5 py-3.5 bg-white rounded-xl shadow-xl border border-gray-200 max-w-sm animate-[slideUp_.2s_ease-out]"
            >
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.detail}</p>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ── */}
      {modalError && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setModalError(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center animate-[slideUp_.2s_ease-out]">
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Ban className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{modalError.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">{modalError.detail}</p>
            <button
              onClick={() => setModalError(null)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: M }}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════
// AUTO-RETRY (maintenance only)
// ═══════════════════════════════════════════════════════════════

function MaintenanceAutoRetry({ onClear }) {
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${API}/api/v1/platform/auth/me/`, {
          method: "HEAD",
        });
        // If NOT 503, maintenance is over
        if (res.status !== 503) {
          onClear();
          window.location.reload();
        }
      } catch {
        // Network error — still down, keep waiting
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [onClear]);

  return null;
}