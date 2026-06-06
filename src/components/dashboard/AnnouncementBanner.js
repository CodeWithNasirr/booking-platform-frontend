// src/components/dashboard/AnnouncementBanner.js
"use client";

/**
 * AnnouncementBanner
 * ─────────────────────────────────────────────────────
 * Shows active platform announcements at the top of the tenant dashboard.
 *
 * Behavior:
 *   • Fetches active announcements on mount
 *   • Displays one at a time (highest severity first)
 *   • "Dismiss" hides for the current session (sessionStorage)
 *   • Navigation arrows if multiple announcements
 *   • Level-based styling: info (blue), warning (amber), critical (red), maintenance (violet)
 *
 * Integration:
 *   In src/components/dashboard/DashboardLayout.js, at the TOP of the layout content:
 *
 *     import AnnouncementBanner from "@/components/dashboard/AnnouncementBanner";
 *     ...
 *     <div className="flex-1 flex flex-col overflow-hidden">
 *       <AnnouncementBanner />
 *       <main ...>
 */

import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import {
  Info, AlertTriangle, AlertCircle, Wrench,
  X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { fetchActiveAnnouncements, markAnnouncementRead } from "@/lib/supportApi";

const SEVERITY_ORDER = { critical: 0, maintenance: 1, warning: 2, info: 3 };

const LEVEL_STYLE = {
  info: {
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-800",
    icon: Info,
    iconColor: "text-blue-600",
    dismiss: "text-blue-500 hover:text-blue-700 hover:bg-blue-100",
  },
  warning: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-900",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    dismiss: "text-amber-500 hover:text-amber-700 hover:bg-amber-100",
  },
  critical: {
    bg: "bg-red-50 border-red-200",
    text: "text-red-900",
    icon: AlertCircle,
    iconColor: "text-red-600",
    dismiss: "text-red-400 hover:text-red-600 hover:bg-red-100",
  },
  maintenance: {
    bg: "bg-violet-50 border-violet-200",
    text: "text-violet-900",
    icon: Wrench,
    iconColor: "text-violet-600",
    dismiss: "text-violet-400 hover:text-violet-600 hover:bg-violet-100",
  },
};

function getDismissedIds() {
  try {
    return JSON.parse(sessionStorage.getItem("dismissed_announcements") || "[]");
  } catch { return []; }
}
function addDismissedId(id) {
  try {
    const ids = getDismissedIds();
    ids.push(id);
    sessionStorage.setItem("dismissed_announcements", JSON.stringify(ids));
  } catch { /* silent */ }
}

export default function AnnouncementBanner() {
  const { activeTenant } = useApp();
  const [announcements, setAnnouncements] = useState([]);
  console.log("AnnouncementBanner",announcements)
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    setDismissed(getDismissedIds());
  }, []);

  useEffect(() => {
    if (!activeTenant) return;
    fetchActiveAnnouncements(activeTenant)
      .then(d => {
        const all = Array.isArray(d) ? d : d?.results || [];
        // sort by severity
        all.sort((a, b) => (SEVERITY_ORDER[a.level] ?? 9) - (SEVERITY_ORDER[b.level] ?? 9));
        setAnnouncements(all);
      })
      .catch(() => {});
  }, [activeTenant]);

  const visible = announcements.filter(a => !dismissed.includes(a.id));

  if (visible.length === 0) return null;

  const safeIndex = Math.min(index, visible.length - 1);
  const ann = visible[safeIndex];
  if (!ann) return null;

  const style = LEVEL_STYLE[ann.level] || LEVEL_STYLE.info;
  const Icon = style.icon;

  function dismiss() {
    addDismissedId(ann.id);
    setDismissed(prev => [...prev, ann.id]);
    // try to mark read on server (non-blocking)
    markAnnouncementRead(activeTenant, ann.id).catch(() => {});
    // adjust index
    if (safeIndex >= visible.length - 1) setIndex(Math.max(0, safeIndex - 1));
  }

  function prev() { setIndex(i => Math.max(0, i - 1)); }
  function next() { setIndex(i => Math.min(visible.length - 1, i + 1)); }

  return (
    <div className={`border-b ${style.bg} transition-all duration-300`}>
      <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center gap-3">
        {/* Icon */}
        <Icon className={`w-4 h-4 flex-shrink-0 ${style.iconColor}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${style.text} truncate`}>
            {ann.title}
            {ann.message && (
              <span className="font-normal ml-1.5 opacity-80">— {ann.message}</span>
            )}
          </p>
        </div>

        {/* Navigation (if multiple) */}
        {visible.length > 1 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={prev} disabled={safeIndex === 0}
              className={`p-1 rounded ${style.dismiss} disabled:opacity-30`}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className={`text-[10px] font-medium ${style.text} opacity-60 mx-0.5`}>
              {safeIndex + 1}/{visible.length}
            </span>
            <button onClick={next} disabled={safeIndex >= visible.length - 1}
              className={`p-1 rounded ${style.dismiss} disabled:opacity-30`}>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dismiss */}
        <button onClick={dismiss} className={`p-1 rounded-lg ${style.dismiss} transition flex-shrink-0`} title="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}