"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import DashboardLayout from "@/components/provider/DashboardLayout";
import { fetchProviderRequests } from "./api";

const STATUS_TABS = ["all", "pending", "negotiating", "accepted", "converted"];

const STATUS_COLOR = {
  pending: "bg-yellow-100 text-yellow-800",
  negotiating: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  converted: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function ProviderCustomRequestsClient() {
  const router = useRouter();
  const { activeTenant } = useApp();
  const tenantId = activeTenant?.id || activeTenant;

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await fetchProviderRequests(tenantId, filter === "all" ? {} : { status: filter });
      setRequests(data || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [tenantId, filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <DashboardLayout pageName="Custom Requests">
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Custom Requests</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                filter === tab ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : requests.length === 0 ? (
          <div className="text-center text-gray-400 py-16">No requests in this category.</div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/provider/custom-requests/${r.id}`)}
                className="w-full bg-white rounded-lg shadow-sm border hover:shadow transition p-4 text-left flex justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">#{r.request_number}</p>
                  {r.budget_max && (
                    <p className="text-sm text-gray-600 mt-1">
                      Budget: up to {r.budget_max}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[r.status] || ""}`}>
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
