// src/app/superadmin/health/page.js
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Activity, AlertTriangle, CheckCircle2, XCircle,
  RefreshCw, Webhook, CreditCard, Users, Server,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useTranslation } from "@/lib/t";
import { fetchSystemHealth } from "@/lib/platformApi";

export default function HealthPage() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await fetchSystemHealth();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading || !data) {
    return (
      <SuperAdminLayout title={t("health_title")} breadcrumbs={[{ label: t("health_breadcrumb") }]}>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </SuperAdminLayout>
    );
  }

  const wh = data.webhooks || {};
  const pay = data.payments || {};
  const subs = data.subscriptions || {};
  const tenants = data.tenants || {};
  const queues = data.queues || {};

  return (
    <SuperAdminLayout
      title={t("health_title")}
      description={t("health_description")}
      breadcrumbs={[{ label: t("health_breadcrumb") }]}
    >
      {/* Refresh */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {t("health_refresh")}
        </button>
      </div>

      {/* ═══ STATUS CARDS ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatusCard
          title={t("health_card_webhooks")}
          value={`${wh.success_rate ?? 100}%`}
          subtitle={t("health_card_webhooks_sub", { failed: wh.failed_24h || 0, total: wh.total_24h || 0 })}
          icon={Webhook}
          status={wh.failed_24h > 0 ? "warning" : "healthy"}
          t={t}
        />
        <StatusCard
          title={t("health_card_payments")}
          value={pay.last_24h?.succeeded || 0}
          subtitle={t("health_card_payments_sub", { failed: pay.last_24h?.failed || 0, revenue: pay.last_24h?.revenue || 0 })}
          icon={CreditCard}
          status={(pay.last_24h?.failed || 0) > 0 ? "warning" : "healthy"}
          t={t}
        />
        <StatusCard
          title={t("health_card_subscriptions")}
          value={subs.total_active || 0}
          subtitle={t("health_card_subscriptions_sub", { past_due: subs.past_due_count || 0, trialing: subs.total_trialing || 0 })}
          icon={Users}
          status={(subs.past_due_count || 0) > 5 ? "warning" : "healthy"}
          t={t}
        />
        <StatusCard
          title={t("health_card_queues")}
          value={queues.available ? `${queues.completed_1h || 0}` : t("health_na")}
          subtitle={queues.available ? t("health_card_queues_sub", { failed: queues.failed_1h || 0 }) : queues.message || t("health_unavailable")}
          icon={Server}
          status={!queues.available ? "unknown" : (queues.failed_1h || 0) > 0 ? "warning" : "healthy"}
          t={t}
        />
      </div>

      {/* ═══ WEBHOOK FAILURES ═══ */}
      {wh.recent_failures?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-gray-900">{t("health_webhook_failures")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_event_id")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_type")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_provider")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_error")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wh.recent_failures.map((f, i) => (
                  <tr key={i} className="hover:bg-red-50/30">
                    <td className="px-4 py-2 font-mono text-xs text-gray-700 max-w-[160px] truncate">{f.external_event_id}</td>
                    <td className="px-4 py-2 text-gray-700">{f.event_type}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{f.provider}</span>
                    </td>
                    <td className="px-4 py-2 text-red-600 text-xs max-w-[250px] truncate">
                    {f.error}
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">
                    {new Date(f.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ FAILED PAYMENTS ═══ */}
      {pay.recent_failures?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900">{t("health_failed_payments")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_tenant")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_amount")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_provider")}</th>
                  <th className="px-4 py-2 text-left text-gray-600">{t("health_col_time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pay.recent_failures.map((f, i) => (
                  <tr key={i} className="hover:bg-red-50/30">
                    <td className="px-4 py-2 font-medium text-gray-900">{f.tenant__name || "—"}</td>
                    <td className="px-4 py-2 text-gray-900">{f.amount} {f.currency}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{f.provider}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{new Date(f.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ SUBSCRIPTION BREAKDOWN ═══ */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{t("health_subscription_breakdown")}</h3>
        </div>
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(subs.by_status || {}).map(([status, count]) => (
            <div key={status} className="text-center p-4 rounded-xl bg-gray-50">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-xs text-gray-500 capitalize mt-1">{t(`health_status_${status}`) || status.replace(/_/g, " ")}</div>
            </div>
          ))}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

function StatusCard({ title, value, subtitle, icon: Icon, status, t }) {
  const colors = {
    healthy: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600", dot: "bg-green-500", label: t("health_status_healthy") },
    warning: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600", dot: "bg-amber-500", label: t("health_status_warning") },
    critical: { bg: "bg-red-50", border: "border-red-200", icon: "text-red-600", dot: "bg-red-500", label: t("health_status_critical") },
    unknown: { bg: "bg-gray-50", border: "border-gray-200", icon: "text-gray-400", dot: "bg-gray-400", label: t("health_status_unknown") },
  };
  const c = colors[status] || colors.unknown;

  return (
    <div className={`rounded-xl border p-5 ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${c.icon}`} />
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
          <span className="text-[10px] font-medium text-gray-500">{c.label}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{title}</div>
      <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
    </div>
  );
}