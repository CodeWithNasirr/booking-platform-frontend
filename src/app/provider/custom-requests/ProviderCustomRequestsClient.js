"use client";

/**
 * Provider Custom Requests — inbox-style list (V2.F)
 *
 * Tabs:
 *   Inbox      — pending + negotiating + quoted (active work)
 *   My Requests — accepted + converted
 *   Completed  — completed
 *   Archived   — rejected + cancelled
 *
 * Each row shows status pill, customer, last-message preview from
 * the timeline+messages mix. Clicking a row jumps to the detail
 * page where the conversation lives.
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import DashboardLayout from "@/components/provider/DashboardLayout";
import { Inbox, ListChecks, CheckCircle, Archive, RefreshCw } from "lucide-react";
import { fetchProviderRequests } from "./api";

const STATUS_TONE = {
  pending: { dot: "bg-yellow-400", chip: "bg-yellow-100 text-yellow-800" },
  negotiating: { dot: "bg-blue-400", chip: "bg-blue-100 text-blue-800" },
  quoted: { dot: "bg-indigo-400", chip: "bg-indigo-100 text-indigo-800" },
  accepted: { dot: "bg-emerald-400", chip: "bg-emerald-100 text-emerald-800" },
  converted: { dot: "bg-purple-400", chip: "bg-purple-100 text-purple-800" },
  completed: { dot: "bg-slate-400", chip: "bg-slate-100 text-slate-800" },
  rejected: { dot: "bg-rose-400", chip: "bg-rose-100 text-rose-800" },
  cancelled: { dot: "bg-gray-400", chip: "bg-gray-100 text-gray-700" },
};

const TABS = {
  inbox: {
    label: "Inbox",
    icon: Inbox,
    statuses: ["pending", "negotiating", "quoted"],
  },
  mine: {
    label: "My Requests",
    icon: ListChecks,
    statuses: ["accepted", "converted"],
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    statuses: ["completed"],
  },
  archived: {
    label: "Archived",
    icon: Archive,
    statuses: ["rejected", "cancelled"],
  },
};

export default function ProviderCustomRequestsClient() {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [tab, setTab] = useState("inbox");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ALL requests for this provider once; tab-filter client-side
  // so counts stay accurate across tabs.
  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchProviderRequests(tenantId);
      setRequests(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const statuses = TABS[tab].statuses;
    return requests.filter((r) => statuses.includes(r.status));
  }, [requests, tab]);

  const counts = useMemo(() => {
    const c = {};
    for (const key of Object.keys(TABS)) {
      c[key] = requests.filter((r) => TABS[key].statuses.includes(r.status)).length;
    }
    return c;
  }, [requests]);

  return (
    <DashboardLayout pageName="Custom Requests">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">Custom Requests</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {requests.length} assigned
            </p>
          </div>
          <button onClick={load}
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto border-b">
          {Object.entries(TABS).map(([key, def]) => {
            const Icon = def.icon;
            const active = tab === key;
            const count = counts[key];
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                  active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {def.label}
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    active ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-700"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600 text-center py-12">{error}</p>
        ) : visible.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <ul className="space-y-2">
            {visible.map((r) => {
              const tone = STATUS_TONE[r.status] || {};
              return (
                <li key={r.id}>
                  <button
                    onClick={() => router.push(`/provider/custom-requests/${r.id}`)}
                    className="w-full text-left bg-white rounded-xl border hover:shadow-sm transition p-4 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        #{r.request_number} · {r.customer_name || r.customer_email || "—"}
                      </p>
                      {r.budget_max && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Budget up to {r.budget_max}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${tone.chip}`}>
                        {r.status}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}

function EmptyState({ tab }) {
  const Icon = TABS[tab].icon;
  const hints = {
    inbox: "New assignments will land here.",
    mine: "Requests you've quoted and won will show up here.",
    completed: "Wrapped-up work moves here.",
    archived: "Rejected and cancelled requests are kept here.",
  };
  return (
    <div className="text-center py-16 text-gray-500">
      <Icon className="w-10 h-10 mx-auto mb-3 text-gray-300" />
      <p className="font-medium">Nothing in {TABS[tab].label.toLowerCase()}</p>
      <p className="text-sm text-gray-400 mt-1">{hints[tab]}</p>
    </div>
  );
}
