"use client";

import Cookies from "js-cookie";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  Receipt,
  Wallet,
  Banknote,
  Loader2,
  FileText,
  Send,
  X,
  Plus,
  Calendar,
  MoreVertical,
} from "lucide-react";
import { apiFetch } from "@/lib/apiClient";
// ─── API Layer ───────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

async function fetchWithAuth(endpoint, activeTenant, options = {}) {
  const token = Cookies.get("access_token");
  if (!activeTenant) throw new Error("Tenant not ready");

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      "X-Tenant": activeTenant,
      ...options.headers,
    },
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      data?.detail || data?.message || `Request failed: ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

const financeAPI = {
  // Stats
  getStats: (params, t) =>
    apiFetch(
      `/api/v1/finance/stats/?${new URLSearchParams(params)}`,
      t
    ),

  // Transactions
  getTransactions: (params, t) =>
    apiFetch(
      `/api/v1/finance/transactions/?${new URLSearchParams(params)}`,
      t
    ),
  getTransactionDetail: (id, t) =>
    apiFetch(`/api/v1/finance/transactions/${id}/`, t),

  // Invoices
  getInvoices: (params, t) =>
    apiFetch(
      `/api/v1/finance/invoices/?${new URLSearchParams(params)}`,
      t
    ),
  sendInvoice: (id, t) =>
    apiFetch(`/api/v1/finance/invoices/${id}/send/`, t, {
      method: "POST",
    }),
  downloadInvoice: (id, t) =>
    apiFetch(`/api/v1/finance/invoices/${id}/download/`, t),

  // Payouts
  getPayouts: (params, t) =>
    apiFetch(
      `/api/v1/finance/payouts/?${new URLSearchParams(params)}`,
      t
    ),
  createPayout: (data, t) =>
    apiFetch("/api/v1/finance/payouts/create/", t, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Constants ───────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "This Week", value: "7d" },
  { label: "This Month", value: "30d" },
  { label: "This Quarter", value: "90d" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
];

const TRANSACTION_TYPES = [
  { label: "All Types", value: "" },
  { label: "Payment", value: "payment" },
  { label: "Refund", value: "refund" },
  { label: "Payout", value: "payout" },
  { label: "Transfer", value: "transfer" },
  { label: "Platform Fee", value: "fee" },
];

const TRANSACTION_STATUSES = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
];

const INVOICE_STATUSES = [
  { label: "All Statuses", value: "" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];

const PAYOUT_STATUSES = [
  { label: "All Statuses", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
];

const PAGE_SIZE = 15;

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatCurrency(amount, currency = "SAR") {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateRangeParams(rangeValue) {
  const now = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  const daysAgo = (n) => new Date(now - n * 86400000);

  switch (rangeValue) {
    case "7d":
      return { start_date: fmt(daysAgo(7)), end_date: fmt(now) };
    case "30d":
      return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
    case "90d":
      return { start_date: fmt(daysAgo(90)), end_date: fmt(now) };
    case "last_month":
      return {
        start_date: fmt(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        end_date: fmt(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "this_year":
      return {
        start_date: fmt(new Date(now.getFullYear(), 0, 1)),
        end_date: fmt(now),
      };
    default:
      return { start_date: fmt(daysAgo(30)), end_date: fmt(now) };
  }
}

/** Safely extract display text from a multilingual object */
function toText(val, fallback = "—") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    return val.en || val.ar || val.ur || Object.values(val)[0] || fallback;
  }
  return fallback;
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function StatCard({
  title,
  value,
  change,
  detail,
  icon: Icon,
  color,
  loading,
}) {
  const isPositive = typeof change === "string" ? !change.startsWith("-") : change >= 0;

  return (
    <div className="p-6 rounded-xl bg-white border border-[#8B1E3F]/10 hover:shadow-lg transition-all duration-300 hover:border-[#8B1E3F]/20 group">
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && change !== null && (
          <div
            className={`flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full ${
              isPositive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {typeof change === "string"
              ? change
              : `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
          </div>
        )}
      </div>
      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-24" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-sm text-gray-600 font-medium">{title}</div>
          {detail && (
            <div className="text-xs text-gray-500 mt-2">{detail}</div>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status, type = "transaction" }) {
  const configs = {
    transaction: {
      pending: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Loader2 },
      completed: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle2 },
      failed: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: XCircle },
      cancelled: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: XCircle },
      refunded: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: ArrowDownRight },
    },
    invoice: {
      draft: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: FileText },
      sent: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Send },
      paid: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle2 },
      overdue: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: AlertCircle },
      cancelled: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: XCircle },
    },
    payout: {
      pending: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", icon: Clock },
      processing: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", icon: Loader2 },
      paid: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle2 },
      completed: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", icon: CheckCircle2 },
      failed: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", icon: XCircle },
      cancelled: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200", icon: XCircle },
    },
  };

  const config = configs[type]?.[status] || {
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    icon: AlertCircle,
  };

  const label = status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full border ${config.bg} ${config.text} ${config.border}`}
    >
      {label}
    </span>
  );
}

function TypeBadge({ type }) {
  const configs = {
    payment: { bg: "bg-green-100", text: "text-green-700" },
    refund: { bg: "bg-red-100", text: "text-red-700" },
    payout: { bg: "bg-blue-100", text: "text-blue-700" },
    transfer: { bg: "bg-purple-100", text: "text-purple-700" },
    fee: { bg: "bg-gray-100", text: "text-gray-600" },
  };
  const config = configs[type] || { bg: "bg-gray-100", text: "text-gray-600" };
  const label = type?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || type;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
    >
      {label}
    </span>
  );
}

function Pagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Showing {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) pageNum = i + 1;
          else if (page <= 3) pageNum = i + 1;
          else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
          else pageNum = page - 2 + i;

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-8 h-8 text-xs rounded-lg transition-colors ${
                pageNum === page
                  ? "bg-[#8B1E3F] text-white"
                  : "text-gray-600 hover:bg-[#8B1E3F]/10"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="text-center py-12">
      <div className="inline-flex p-3 bg-[#8B1E3F]/10 rounded-full mb-3">
        <Icon className="w-6 h-6 text-[#8B1E3F]/50" />
      </div>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options, className = "" }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none bg-white cursor-pointer hover:border-[#8B1E3F]/50 transition-colors text-sm ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none transition-all text-sm"
      />
    </div>
  );
}

function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-50 rounded-xl animate-pulse" />
      ))}
    </div>
  );
}

// ─── Transactions Tab ────────────────────────────────────────────────────────

function TransactionsTab({ dateRange, activeTenant }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const searchTimeout = useRef(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadTransactions = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const params = {
        ...getDateRangeParams(dateRange),
        page,
        page_size: PAGE_SIZE,
        ...(search && { search }),
        ...(typeFilter && { transaction_type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      };
      const data = await financeAPI.getTransactions(params, activeTenant);
      setTransactions(data.results || data || []);
      setTotalCount(data.count || data?.length || 0);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, page, search, typeFilter, statusFilter, activeTenant]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter, dateRange]);

  const handleSearchChange = (val) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 400);
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search transactions..."
        />
        <div className="flex gap-2">
          <FilterSelect
            value={typeFilter}
            onChange={setTypeFilter}
            options={TRANSACTION_TYPES}
            className="min-w-[140px]"
          />
          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={TRANSACTION_STATUSES}
            className="min-w-[140px]"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonRows />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No transactions found"
          description="Transactions will appear here when payments are processed"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Booking / Project
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-4 px-4 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-[#8B1E3F]/5 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${
                            txn.transaction_type === "refund"
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          } flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                        >
                          {txn.transaction_type === "refund" ? (
                            <ArrowDownLeft className="w-5 h-5" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 truncate max-w-[200px]">
                            {toText(txn.description, `${txn.transaction_type || "Payment"} transaction`)}
                          </p>
                          {txn.stripe_payment_intent_id && (
                            <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                              {txn.stripe_payment_intent_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <TypeBadge type={txn.transaction_type} />
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={txn.status} type="transaction" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {txn.booking_number && (
                          <span className="text-[#8B1E3F] font-semibold">
                            {txn.booking_number}
                          </span>
                        )}
                        {txn.project_number && (
                          <span className="text-gray-500 text-xs ml-1">
                            / {txn.project_number}
                          </span>
                        )}
                        {!txn.booking_number && !txn.project_number && (
                          <span className="text-gray-300">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-bold ${
                          txn.transaction_type === "refund"
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {txn.transaction_type === "refund" ? "-" : "+"}
                        {formatCurrency(txn.amount, txn.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-gray-600 text-sm">
                        {txn.net_amount
                          ? formatCurrency(txn.net_amount, txn.currency)
                          : "—"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDate(txn.completed_at || txn.created_at)}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(
                          txn.completed_at || txn.created_at
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <button className="p-2 hover:bg-[#8B1E3F]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ─── Invoices Tab ────────────────────────────────────────────────────────────

function InvoicesTab({ dateRange, activeTenant }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sendingId, setSendingId] = useState(null);
  const searchTimeout = useRef(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadInvoices = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const params = {
        ...getDateRangeParams(dateRange),
        page,
        page_size: PAGE_SIZE,
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      };
      const data = await financeAPI.getInvoices(params, activeTenant);
      setInvoices(data.results || data || []);
      setTotalCount(data.count || data?.length || 0);
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, page, search, statusFilter, activeTenant]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateRange]);

  const handleSearchChange = (val) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setSearch(val), 400);
  };

  const handleSendInvoice = async (invoiceId) => {
    setSendingId(invoiceId);
    try {
      await financeAPI.sendInvoice(invoiceId, activeTenant);
      loadInvoices();
    } catch (err) {
      console.error("Failed to send invoice:", err);
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchInput
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by invoice #, customer..."
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={INVOICE_STATUSES}
          className="min-w-[140px]"
        />
      </div>

      {loading ? (
        <SkeletonRows />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description="Invoices are automatically generated when bookings are confirmed"
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#8B1E3F]/5 transition-colors group"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#8B1E3F]/10 text-[#8B1E3F] flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-900 font-mono">
                            {inv.invoice_number || `INV-${inv.id?.toString().slice(0, 8)}`}
                          </span>
                          {inv.booking_number && (
                            <p className="text-xs text-gray-400">
                              Booking: {inv.booking_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-gray-900">
                        {toText(inv.customer_name, "—")}
                      </p>
                      {inv.customer_email && (
                        <p className="text-xs text-gray-400">
                          {inv.customer_email}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {formatDate(inv.issued_date || inv.created_at)}
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <span
                        className={
                          inv.status === "overdue"
                            ? "text-red-600 font-semibold"
                            : "text-gray-600"
                        }
                      >
                        {formatDate(inv.due_date)}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(inv.amount, inv.currency)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={inv.status} type="invoice" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {inv.status === "draft" && (
                          <button
                            onClick={() => handleSendInvoice(inv.id)}
                            disabled={sendingId === inv.id}
                            className="p-2 text-[#8B1E3F] hover:bg-[#8B1E3F]/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Send invoice"
                          >
                            {sendingId === inv.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-[#8B1E3F]/5 hover:border-[#8B1E3F]/30 transition-all"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ─── Payouts Tab ─────────────────────────────────────────────────────────────

function PayoutsTab({ dateRange, activeTenant }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const loadPayouts = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const params = {
        ...getDateRangeParams(dateRange),
        page,
        page_size: PAGE_SIZE,
        ...(statusFilter && { status: statusFilter }),
      };
      const data = await financeAPI.getPayouts(params, activeTenant);
      setPayouts(data.results || data || []);
      setTotalCount(data.count || data?.length || 0);
    } catch (err) {
      console.error("Failed to load payouts:", err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, page, statusFilter, activeTenant]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateRange]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={PAYOUT_STATUSES}
          className="sm:w-48"
        />
      </div>

      {loading ? (
        <SkeletonRows />
      ) : payouts.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No payouts found"
          description="Payouts are created when providers are paid for completed services"
        />
      ) : (
        <>
          <div className="space-y-4">
            {payouts.map((po) => (
              <div
                key={po.id}
                className="p-6 rounded-xl border border-gray-200 hover:border-[#8B1E3F]/30 hover:shadow-lg transition-all duration-300 bg-white group"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl ${
                        po.status === "paid" || po.status === "completed"
                          ? "bg-green-100 text-green-600"
                          : "bg-amber-100 text-amber-600"
                      } flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}
                    >
                      {po.status === "paid" || po.status === "completed" ? (
                        <CheckCircle className="w-7 h-7" />
                      ) : (
                        <Clock className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {toText(po.provider_name, "Provider")}
                      </h3>
                      {po.period && (
                        <p className="text-sm text-[#8B1E3F] font-medium mb-1">
                          {po.period}
                        </p>
                      )}
                      {po.stripe_payout_id && (
                        <p className="text-xs text-gray-400 font-mono">
                          {po.stripe_payout_id}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-900">
                      {formatCurrency(po.amount, po.currency)}
                    </div>
                    <div className="mt-3">
                      <StatusBadge status={po.status} type="payout" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Scheduled</p>
                        <p className="font-medium text-gray-900">
                          {formatDate(po.scheduled_for)}
                        </p>
                      </div>
                    </div>
                    {po.paid_at && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Paid At</p>
                          <p className="font-medium text-gray-900">
                            {formatDateTime(po.paid_at)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button className="px-5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-[#8B1E3F] hover:text-white hover:border-[#8B1E3F] transition-all">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ─── Tab Config ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "transactions", label: "Transactions", icon: CreditCard },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "payouts", label: "Payouts", icon: DollarSign },
];

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function FinancePage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp();
  const router = useRouter();
  const [dateRange, setDateRange] = useState("30d");
  const [activeTab, setActiveTab] = useState("transactions");
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useBlockBackNavigation(!!user);

  // Auth guard
  useEffect(() => {
    if (!loadingUser && !user) router.replace("/");
  }, [loadingUser, user, router]);

  // Onboarding redirect
  useEffect(() => {
    if (requiresOnboarding) router.replace("/auth/onboarding?step=1");
  }, [requiresOnboarding, router]);

  const loadStats = useCallback(
    async (showLoader = true) => {
      if (!activeTenant) return;
      const params = getDateRangeParams(dateRange);
      if (showLoader) setStatsLoading(true);
      else setRefreshing(true);

      try {
        const data = await financeAPI.getStats(params, activeTenant);
        setStats(data);
      } catch (err) {
        console.error("Failed to load finance stats:", err);
      } finally {
        setStatsLoading(false);
        setRefreshing(false);
      }
    },
    [dateRange, activeTenant]
  );

  useEffect(() => {
    loadStats(true);
  }, [loadStats]);

  if (requiresOnboarding || loadingUser) return null;

  return (
    <div className="space-y-6 p-6 bg-[#FAF5F7] min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Finance & Payments
          </h1>
          <p className="text-gray-600 mt-1">
            Manage revenue, transactions, and payouts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-300 focus:border-[#8B1E3F] focus:ring-2 focus:ring-[#8B1E3F]/20 outline-none bg-white cursor-pointer hover:border-[#8B1E3F]/50 transition-colors shadow-sm"
          >
            {DATE_RANGES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadStats(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center px-3 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>

          <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-white hover:border-[#8B1E3F]/30 transition-all shadow-sm">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.total_revenue || 0)}
          change={stats?.revenue_change}
          detail="vs previous period"
          icon={DollarSign}
          color="from-green-500 to-green-600"
          loading={statsLoading}
        />
        <StatCard
          title="Pending Payouts"
          value={formatCurrency(stats?.pending_payouts || 0)}
          change={
            stats?.pending_payout_count
              ? `${stats.pending_payout_count} payments`
              : undefined
          }
          detail={
            stats?.next_payout_date
              ? `Next payout: ${formatDate(stats.next_payout_date)}`
              : undefined
          }
          icon={Clock}
          color="from-amber-500 to-amber-600"
          loading={statsLoading}
        />
        <StatCard
          title="Completed Bookings"
          value={stats?.completed_bookings?.toLocaleString() || "0"}
          change={
            stats?.platform_fees
              ? `${formatCurrency(stats.platform_fees)} fees`
              : undefined
          }
          detail="This period"
          icon={CheckCircle}
          color="from-[#8B1E3F] to-[#6B1630]"
          loading={statsLoading}
        />
        <StatCard
          title="Refunds Issued"
          value={formatCurrency(stats?.total_refunds || 0)}
          change={
            stats?.refund_count
              ? `${stats.refund_count} refund${stats.refund_count !== 1 ? "s" : ""}`
              : undefined
          }
          icon={RefreshCw}
          color="from-red-500 to-red-600"
          loading={statsLoading}
        />
      </div>

      {/* ── Tab Container ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#8B1E3F]/10 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="border-b border-[#8B1E3F]/10 px-6 bg-white">
          <div className="flex items-center gap-8 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-5 px-1 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 ${
                    isActive
                      ? "border-[#8B1E3F] text-[#8B1E3F]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-[#8B1E3F]/30"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "transactions" && (
            <TransactionsTab
              dateRange={dateRange}
              activeTenant={activeTenant}
            />
          )}
          {activeTab === "invoices" && (
            <InvoicesTab
              dateRange={dateRange}
              activeTenant={activeTenant}
            />
          )}
          {activeTab === "payouts" && (
            <PayoutsTab
              dateRange={dateRange}
              activeTenant={activeTenant}
            />
          )}
        </div>
      </div>
    </div>
  );
}