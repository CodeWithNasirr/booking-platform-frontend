// // components/superadmin/TenantsList.jsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // Added missing import
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import EditTenantModal from "./components/EditTenantModal";

import { fetchTenants,  fetchTenant, fetchTenantStats, suspendTenant, activateTenant,updateTenant } from "@/lib/platformApi";
import {
  Search, Plus, Filter, Download, MoreVertical, Eye, Edit,
  Ban, CheckCircle, TrendingUp, TrendingDown, Users, Building2,
  Clock, Globe, ChevronLeft, ChevronRight, Loader2, X,
} from "lucide-react";
import Link from "next/link";

// ─── Maroon Theme ───────────────────────────────────────────────
const MAROON = "#800020";
const MAROON_LIGHT = "#9B1B3F";
const MAROON_DARK = "#5C0018";
const MAROON_BG = "#FDF1F4";
const MAROON_HOVER = "#FCE4EB";

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, change, positive, icon: Icon, gradient }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: gradient }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <span
            className={`text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-full ${
              positive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <div className="text-3xl font-semibold text-gray-900 tracking-tight">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────
function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    trial: "bg-amber-50 text-amber-700 ring-amber-200",
    suspended: "bg-red-50 text-red-700 ring-red-200",
    pending: "bg-blue-50 text-blue-700 ring-blue-200",
    cancelled: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
}

// ─── Tier Badge ─────────────────────────────────────────────────
function TierBadge({ tier }) {
  const styles = {
    free: "bg-gray-100 text-gray-700",
    starter: "bg-blue-50 text-blue-700",
    professional: "bg-purple-50 text-purple-700",
    enterprise: "bg-orange-50 text-orange-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tier] || styles.free}`}>
      {tier}
    </span>
  );
}

// ─── Dropdown Menu ──────────────────────────────────────────────
function ActionDropdown({ tenant, onView, onEdit, onSuspend, onActivate }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, placement: "bottom" });
  const ref = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 192;
      const dropdownHeight = 180;
      const margin = 8;
      
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top, placement;
      
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - margin;
        placement = "top";
      } else {
        top = rect.bottom + margin;
        placement = "bottom";
      }
      
      setCoords({
        top,
        left: rect.right - dropdownWidth,
        placement,
      });
    }
    setOpen(!open);
  };

  const isActive = tenant.status === "active" || tenant.status === "trial";

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 rounded-lg hover:bg-rose-50 transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-gray-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className={`fixed w-48 bg-white border border-rose-100 rounded-xl shadow-xl overflow-hidden z-20`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            <button
              onClick={() => { onView(tenant); setOpen(false); }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-rose-50 transition-colors text-left"
            >
              <Eye className="w-4 h-4 text-rose-700" />
              View Details
            </button>
            <button
              onClick={() => { onEdit(tenant); setOpen(false); }}
              className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-rose-50 transition-colors text-left"
            >
              <Edit className="w-4 h-4 text-rose-700" />
              Edit Tenant
            </button>
            <div className="h-px bg-rose-100 mx-2" />
            {isActive ? (
              <button
                onClick={() => { onSuspend(tenant); setOpen(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-rose-50 transition-colors text-left"
              >
                <Ban className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700">Suspend</span>
              </button>
            ) : (
              <button
                onClick={() => { onActivate(tenant); setOpen(false); }}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-rose-50 transition-colors text-left"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Activate</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function TenantsListPage() {
  const router = useRouter();
  const { hasPermission } = useSuperAdmin();

  const [tenants, setTenants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal states
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tierFilter, setTierFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);


  // toast
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
    }

  // ── Fetch tenants ──
  const loadTenants = async () => {
    setLoading(true);
    try {
      const params = { page, page_size: 15 };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      if (tierFilter !== "all") params.tier = tierFilter;

      const data = await fetchTenants(params);
      setTenants(data.results || []);
      setTotalPages(data.total_pages || 1);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const data = await fetchTenantStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  useEffect(() => { loadStats(); }, []);
  useEffect(() => { loadTenants(); }, [page, statusFilter, tierFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadTenants();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Actions ──
  const handleSuspend = async (tenant) => {
    if (!confirm(`Suspend "${tenant.name}"? This will restrict their access.`)) return;
    setActionLoading(tenant.id);
    try {
      await suspendTenant(tenant.id, "Suspended by platform admin");
      loadTenants();
      loadStats();
      showToast(`"${tenant.name}" has been suspended.`);
    } catch (err) {
      showToast(err.message || "Failed to suspend tenant", "error");
    }
    setActionLoading(null);
    setShowSuspendModal(false);
  };

  const handleActivate = async (tenant) => {
    setActionLoading(tenant.id);
    try {
      await activateTenant(tenant.id);
      loadTenants();
      loadStats();
      showToast(`"${tenant.name}" has been activated.`);
    } catch (err) {
      showToast(err.message || "Failed to activate tenant", "error");
    }
    setActionLoading(null);
    setShowActivateModal(false);
  };

  // ── Edit Action ──
  const handleEditSave = async (payload) => {
    if (!selectedTenant) return;
    setActionLoading(selectedTenant.id);
    try {
      const updated = await updateTenant(selectedTenant.id, payload);
      loadTenants(); // Refresh list
      loadStats();   // Refresh stats
      showToast(`"${updated.name}" has been updated.`);
      setShowEditModal(false);
      setSelectedTenant(null);
    } catch (err) {
      showToast(err.message || "Failed to update tenant", "error");
    }
    setActionLoading(null);
  };

  // Modal handlers
  const openEditModal = async (tenant) => {
  try {
    setActionLoading(tenant.id);

    // fetch FULL tenant detail
    const fullTenant = await fetchTenant(tenant.id);

    setSelectedTenant(fullTenant);
    setShowEditModal(true);
  } catch (err) {
    alert("Failed to load tenant details");
  } finally {
    setActionLoading(null);
  }
};

  const openSuspendModal = (tenant) => {
    setSelectedTenant(tenant);
    setShowSuspendModal(true);
  };

  const openActivateModal = (tenant) => {
    setSelectedTenant(tenant);
    setShowActivateModal(true);
  };

  return (
    <SuperAdminLayout
      title="Tenants"
      description="Manage all tenant businesses on the platform"
      breadcrumbs={[{ label: "Tenants" }]}
    >
      <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

        {/* ── Stats Grid ── */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              label="Total Tenants"
              value={stats.total?.toLocaleString() || "0"}
              change="+12.5%"
              positive
              icon={Building2}
              gradient={`linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)`}
            />
            <StatCard
              label="Active"
              value={stats.active?.toLocaleString() || "0"}
              change="+8.1%"
              positive
              icon={CheckCircle}
              gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
            />
            <StatCard
              label="On Trial"
              value={stats.trial?.toLocaleString() || "0"}
              change="+15.3%"
              positive
              icon={Clock}
              gradient="linear-gradient(135deg, #D97706 0%, #B45309 100%)"
            />
            <StatCard
              label="Suspended"
              value={stats.suspended?.toLocaleString() || "0"}
              change="-5.2%"
              positive={false}
              icon={Ban}
              gradient="linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
            />
          </div>
        )}

        {/* ── Filters Bar ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 h-11 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-shadow"
                style={{ "--tw-ring-color": MAROON_LIGHT }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[140px]"
              style={{ "--tw-ring-color": MAROON_LIGHT }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={tierFilter}
              onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
              className="h-11 rounded-xl border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 min-w-[140px]"
              style={{ "--tw-ring-color": MAROON_LIGHT }}
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button className="h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">Loading tenants…</span>
            </div>
          ) : tenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Building2 className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No tenants found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Domain</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenants.map((tenant) => (
                    <tr
                      key={tenant.id}
                      className={`hover:bg-gray-50/60 transition-colors ${
                        actionLoading === tenant.id ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Link href={`/superadmin/tenants/${tenant.id}`} className="flex items-center gap-3 group">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%)` }}
                          >
                            {tenant.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 group-hover:text-[#800020] transition-colors">
                              {tenant.name}
                            </div>
                            <div className="text-xs text-gray-500">{tenant.owner_email || tenant.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <TierBadge tier={tenant.subscription_tier} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-gray-700">{tenant.member_count || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        {tenant.primary_domain ? (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            {tenant.primary_domain}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(tenant.created_at).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ActionDropdown
                          tenant={tenant}
                          onView={(t) => router.push(`/superadmin/tenants/${t.id}`)}
                          onEdit={openEditModal}
                          onSuspend={openSuspendModal}
                          onActivate={openActivateModal}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && tenants.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50/50">
              <p className="text-sm text-gray-600">
                Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-700 font-medium px-2">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Tenant Modal ── */}
      {showEditModal && selectedTenant && (
        <EditTenantModal
          tenant={selectedTenant}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTenant(null);
          }}
          onSave={handleEditSave}
          loading={actionLoading === selectedTenant?.id}
        />
      )}

      {/* ── Suspend Modal ── */}
      {showSuspendModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suspend {selectedTenant.name}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will restrict their access to the platform.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(selectedTenant)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Suspend"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Activate Modal ── */}
      {showActivateModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Activate {selectedTenant.name}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This will restore their full platform access.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleActivate(selectedTenant)}
                disabled={actionLoading}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: MAROON }}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Activate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}