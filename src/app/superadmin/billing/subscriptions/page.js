"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Package,
  Filter,
  RefreshCw,
} from "lucide-react";
import {
  fetchBillingStats,
  fetchPlans,
  fetchPlanSubscribers,
} from "@/lib/platformApi";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const MAROON = "#800020";

const SUB_STATUS = {
  active:    { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  trialing:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  past_due:  { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500" },
  cancelled: { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400" },
};

function StatusBadge({ status }) {
  const s = SUB_STATUS[status] || SUB_STATUS.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function formatCurrency(amount, currency = "USD") {
  if (amount == null || isNaN(amount)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(Number(amount));
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function SubscriptionsPage() {
  const router = useRouter();

  const [plans, setPlans] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);


  // Filters
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  /* ── Load data ─────────────────────────── */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, plansData] = await Promise.all([
        fetchBillingStats().catch(() => null),
        fetchPlans().catch(() => []),
      ]);

      setStats(statsData);
      const plansList = Array.isArray(plansData) ? plansData : plansData?.results || [];
      setPlans(plansList);

      // Fetch subscribers for each plan in parallel
      const activePlans = plansList.filter((p) => p.status !== "archived");
      const results = await Promise.all(
        activePlans.map(async (p) => {
          try {
            const res = await fetchPlanSubscribers(p.id);
        
            return (Array.isArray(res) ? res : []).map((s) => ({
              ...s,

              // normalize fields for UI
              tenant_status: s.status,
              subscription_status: s.status,

              plan_name: p.name,
              plan_slug: p.slug,
              plan_tier: p.tier,
            }));
          } catch {
            return [];
          }
        })
      );

      setAllSubs(results.flat());
    } catch (err) {
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Filter ────────────────────────────── */
  const filtered = allSubs.filter((s) => {
    if (planFilter !== "all" && s.plan_slug !== planFilter) return false;
    if (statusFilter !== "all" && s.subscription_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!s.tenant_name?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  /* ── Loading / Error ───────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
        <p className="text-gray-500 text-sm">Loading subscriptions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-gray-700 font-medium">{error}</p>
        <button onClick={loadData} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <SuperAdminLayout>
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/superadmin/billing")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Billing & Plans
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
            <p className="text-sm text-gray-500 mt-1">
              {stats?.total_subscribers?.toLocaleString() ?? allSubs.length} total active subscriptions
              {stats?.mrr != null && ` · MRR: ${formatCurrency(stats.mrr)}`}
            </p>
          </div>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: allSubs.length, color: "text-gray-900" },
          { label: "Active", value: allSubs.filter((s) => s.subscription_status === "active").length, color: "text-emerald-600" },
          { label: "Trialing", value: allSubs.filter((s) => s.subscription_status === "trialing").length, color: "text-amber-600" },
          { label: "Past Due", value: allSubs.filter((s) => s.subscription_status === "past_due").length, color: "text-red-600" },
        ].map((st) => (
          <div key={st.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-2xl font-semibold ${st.color}`}>{st.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{st.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by tenant name..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
            />
          </div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
          >
            <option value="all">All Plans</option>
            {plans.filter((p) => p.status !== "archived").map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {allSubs.length === 0 ? "No subscriptions found" : "No results match your filters"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s, i) => (
                  <tr key={`${s.tenant_id}-${i}`} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{s.tenant_name}</div>
                      <div className="text-xs text-gray-400 capitalize">{s.tenant_status}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                        {s.plan_name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.subscription_status} />
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">
                      {formatCurrency(s.price, s.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(s.start_date)}</td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(s.end_date)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => router.push(`/superadmin/tenants/${s.tenant_id}`)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: MAROON }}
                      >
                        View Tenant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {allSubs.length} subscription{allSubs.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </SuperAdminLayout>
    </div>
  );
}