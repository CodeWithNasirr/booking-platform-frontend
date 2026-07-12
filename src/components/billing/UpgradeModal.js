// src/components/billing/UpgradeModal.js
"use client";

import { useRouter } from "next/navigation";
import { Sparkles, X, ArrowRight, Lock, TrendingUp } from "lucide-react";

const MAROON = "#8B1E3F";

/**
 * The single upgrade prompt for the whole tenant dashboard. Driven by
 * UpgradeContext; opened with the info returned by parseUpgradeError.
 */
export default function UpgradeModal({ info, onClose }) {
  const router = useRouter();
  if (!info) return null;

  const isLimit = info.reason === "plan_limit_exceeded";
  const Icon = isLimit ? TrendingUp : Lock;
  const title = isLimit ? "You've hit a plan limit" : "Upgrade to unlock this";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${MAROON}, #6B1630)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5 text-white/80" />
          </button>
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
          {info.plan && (
            <p className="text-white/70 text-sm mt-1 capitalize">
              Current plan: {info.plan}
            </p>
          )}
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700">{info.message}</p>

          {isLimit && info.limit != null && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 text-sm">
              <span className="text-gray-500">Usage</span>
              <span className="font-semibold text-gray-900">
                {info.current ?? "—"} / {info.limit}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-4 h-4" style={{ color: MAROON }} />
            Upgrade takes effect immediately — no data is lost.
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Not now
            </button>
            <button
              onClick={() => { onClose(); router.push("/dashboard/billing"); }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold hover:opacity-90"
              style={{ backgroundColor: MAROON }}
            >
              View plans <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
