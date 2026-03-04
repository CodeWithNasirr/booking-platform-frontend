"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Search,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

const MAROON = "#800020";

/*
  ┌─────────────────────────────────────────────────────────┐
  │  INVOICES PAGE                                          │
  │                                                         │
  │  Backend endpoint: NOT YET BUILT                        │
  │  Planned: GET /api/v1/platform/billing/invoices/        │
  │                                                         │
  │  This page is scaffolded and ready to connect once the  │
  │  backend invoice model and views are implemented.       │
  │  See "Pending Implementation" in the Billing Guide.     │
  └─────────────────────────────────────────────────────────┘
*/

const INVOICE_STATUS = {
  paid:    { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
  pending: { bg: "bg-amber-50",   text: "text-amber-700",   icon: Clock },
  overdue: { bg: "bg-red-50",     text: "text-red-700",     icon: AlertCircle },
  void:    { bg: "bg-gray-100",   text: "text-gray-600",    icon: XCircle },
};

function StatusBadge({ status }) {
  const s = INVOICE_STATUS[status] || INVOICE_STATUS.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

function formatCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Placeholder data showing the expected shape ──
const PLACEHOLDER_INVOICES = [
  { id: "INV-2026-001", tenant_name: "Elegant Spa", amount: 299, status: "paid", issued_at: "2026-02-01", paid_at: "2026-02-01", plan: "Professional" },
  { id: "INV-2026-002", tenant_name: "Urban Cuts Barbershop", amount: 99, status: "paid", issued_at: "2026-02-01", paid_at: "2026-02-03", plan: "Starter" },
  { id: "INV-2026-003", tenant_name: "Wellness Hub", amount: 599, status: "pending", issued_at: "2026-02-01", paid_at: null, plan: "Enterprise" },
  { id: "INV-2026-004", tenant_name: "Beauty Palace", amount: 299, status: "overdue", issued_at: "2026-01-15", paid_at: null, plan: "Professional" },
  { id: "INV-2026-005", tenant_name: "Zen Studio", amount: 99, status: "paid", issued_at: "2026-01-01", paid_at: "2026-01-01", plan: "Starter" },
];

export default function InvoicesPage() {

  const router = useRouter();

  const [invoices] = useState(PLACEHOLDER_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // TODO: Replace with real API call when endpoint is built
  // const loadInvoices = useCallback(async () => {
  //   const data = await platformFetch(`/api/v1/platform/billing/invoices/?${params}`);
  //   setInvoices(data.results);
  // }, []);

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (search && !inv.tenant_name.toLowerCase().includes(search.toLowerCase()) && !inv.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

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
            <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-sm text-gray-500 mt-1">Manage billing invoices across all tenants</p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Export to CSV (coming soon)"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Notice banner */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Preview Mode</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Invoices shown below are sample data. This page will connect to the backend once the
            invoice model and <code className="bg-amber-100 px-1 rounded">GET /api/v1/platform/billing/invoices/</code> endpoint are implemented.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Total Paid</div>
          <div className="text-2xl font-semibold text-emerald-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Pending</div>
          <div className="text-2xl font-semibold text-amber-600">{formatCurrency(totalPending)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-1">Overdue</div>
          <div className="text-2xl font-semibold text-red-600">{formatCurrency(totalOverdue)}</div>
        </div>
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
              placeholder="Search by tenant or invoice ID..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-medium text-gray-900">{inv.id}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{inv.tenant_name}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                      {inv.plan}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(inv.issued_at)}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(inv.paid_at)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Download PDF (coming soon)">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
          Showing {filtered.length} of {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
        </div>
      </div>
    </SuperAdminLayout>
    </div>
  );
}