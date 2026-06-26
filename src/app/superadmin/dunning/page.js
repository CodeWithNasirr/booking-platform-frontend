// src/app/superadmin/dunning/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, AlertTriangle, RefreshCw, Play, CheckCircle2,
  XCircle, Clock, Zap,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useTranslation } from "@/lib/t";
import { fetchDunningStatus, retryDunning, runDunningBatch } from "@/lib/platformApi";

export default function DunningPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);
  const [runningBatch, setRunningBatch] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchDunningStatus();
      setData(res);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRetry = async (subId) => {
    setRetrying(subId);
    try {
      await retryDunning(subId);
      showToast(t("dunning_retry_success"));
      load();
    } catch (e) {
      showToast(e.message || t("dunning_retry_failed"), "error");
    } finally {
      setRetrying(null);
    }
  };

  const handleBatchRun = async () => {
    if (!confirm(t("dunning_batch_confirm"))) return;
    setRunningBatch(true);
    try {
      const result = await runDunningBatch();
      showToast(t("dunning_batch_complete", { retried: result.retried, cancelled: result.cancelled }));
      load();
    } catch (e) {
      showToast(e.message || t("dunning_batch_failed"), "error");
    } finally {
      setRunningBatch(false);
    }
  };

  if (loading || !data) {
    return (
      <SuperAdminLayout title={t("dunning_title")} breadcrumbs={[{ label: t("dunning_breadcrumb") }]}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </SuperAdminLayout>
    );
  }

  const subs = data.subscriptions || [];
  const byAttempts = data.by_attempts || {};

  return (
    <SuperAdminLayout
      title={t("dunning_title")}
      description={t("dunning_description")}
      breadcrumbs={[{ label: t("dunning_breadcrumb") }]}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label={t("dunning_total_past_due")}
          value={data.total_past_due || 0}
          icon={AlertTriangle}
          color="text-red-600"
          bg="bg-red-50 border-red-200"
        />
        <SummaryCard
          label={t("dunning_never_retried")}
          value={byAttempts[0] || 0}
          icon={Clock}
          color="text-amber-600"
          bg="bg-amber-50 border-amber-200"
        />
        <SummaryCard
          label={t("dunning_1_2_attempts")}
          value={(byAttempts[1] || 0) + (byAttempts[2] || 0)}
          icon={RefreshCw}
          color="text-blue-600"
          bg="bg-blue-50 border-blue-200"
        />
        <SummaryCard
          label={t("dunning_4_plus_attempts")}
          value={byAttempts["4+"] || 0}
          icon={XCircle}
          color="text-red-600"
          bg="bg-red-50 border-red-200"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleBatchRun}
          disabled={runningBatch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition"
          style={{ backgroundColor: "#8B1E3F" }}
        >
          {runningBatch ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {runningBatch ? t("dunning_running") : t("dunning_run_now")}
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {subs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
            <p className="font-medium">{t("dunning_no_past_due")}</p>
            <p className="text-sm text-gray-400 mt-1">{t("dunning_all_up_to_date")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t("dunning_col_tenant")}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t("dunning_col_tier")}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t("dunning_col_gateway")}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t("dunning_col_attempts")}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t("dunning_col_period_end")}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t("dunning_col_last_retry")}</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">{t("dunning_col_action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subs.map(sub => {
                  const attempts = sub.metadata?.retry_attempts || 0;
                  const lastRetry = sub.metadata?.last_retry_at;

                  return (
                    <tr key={sub.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900">{sub.tenant__name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 capitalize">
                          {sub.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{sub.gateway_provider}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          attempts >= 4
                            ? "bg-red-100 text-red-700"
                            : attempts >= 2
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {attempts}/4
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {lastRetry ? new Date(lastRetry).toLocaleString() : t("dunning_never")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRetry(sub.id)}
                          disabled={retrying === sub.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 transition"
                          style={{ backgroundColor: "#8B1E3F" }}
                        >
                          {retrying === sub.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3" />
                          )}
                          {t("dunning_retry")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white font-medium ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}>
            {toast.msg}
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}

function SummaryCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className={`rounded-xl border p-5 ${bg}`}>
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
    </div>
  );
}