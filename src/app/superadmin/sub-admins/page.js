"use client";

import React, { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import {
  fetchEmployees,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  activateEmployee,
  changeEmployeeRole,
  addEmployeePermission,
  removeEmployeePermission,
  resetEmployeePermissions,
  fetchRoles,
  fetchPermissions,
} from "@/lib/platformApi";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  X,
  ChevronDown,
  ChevronRight,
  UserPlus,
  RefreshCcw,
  Loader2,
  AlertTriangle,
} from "lucide-react";

// ─── Maroon palette ─────────────────────────────────────────────
const C = {
  primary: "#8B1E3F",
  primaryLight: "#A63A5C",
  primaryDark: "#6B1631",
  primaryBg: "#FDF2F4",
};

// ─── Role badge colours ─────────────────────────────────────────
const ROLE_COLORS = {
  owner: "bg-red-100 text-red-800",
  admin: "bg-purple-100 text-purple-800",
  sub_admin: "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
  finance: "bg-amber-100 text-amber-800",
  moderator: "bg-teal-100 text-teal-800",
};

// ─── Role icons ─────────────────────────────────────────────────
const ROLE_ICONS = {
  owner: ShieldAlert,
  admin: ShieldCheck,
  sub_admin: Shield,
  support: Shield,
  finance: Shield,
  moderator: Shield,
};

// =================================================================
// MAIN PAGE
// =================================================================

export default function SubAdminsPage() {
  const { hasPermission, platform } = useSuperAdmin();

  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Data fetching ────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, roleData, permData] = await Promise.all([
        fetchEmployees(),
        fetchRoles(),
        fetchPermissions(true),
      ]);
      setEmployees(empData);
      setRoles(roleData);
      setPermissionGroups(permData);
    } catch (err) {
      alert(
      err?.data?.detail ||   // DRF response
      err?.message ||        // JS Error message
      "Something went wrong"
    );
      console.error("Failed to load sub-admin data:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Filters ──────────────────────────────────────────────────
  const filtered = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      emp.user_email?.toLowerCase().includes(q) ||
      emp.user_name?.toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || emp.role_name?.toLowerCase().includes(roleFilter);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.is_active) ||
      (statusFilter === "inactive" && !emp.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  // ── Quick actions ────────────────────────────────────────────
  const handleToggleStatus = async (emp) => {
    setActionLoading(emp.id);
    try {
      if (emp.is_active) {
        await deactivateEmployee(emp.id);
      } else {
        await activateEmployee(emp.id);
      }
      await loadData();
    } catch (err) {
      console.error("Toggle status failed:", err);
      alert(
      err?.data?.detail ||   // DRF response
      err?.message ||        // JS Error message
      "Something went wrong"
    );
    }
    setActionLoading(null);
  };

  const handleViewDetail = async (emp) => {
    try {
      const detail = await fetchEmployee(emp.id);
      setSelectedEmployee(detail);
      setShowDetailModal(true);
    } catch (err) {
      alert(
      err?.data?.detail ||   // DRF response
      err?.message ||        // JS Error message
        "Something went wrong"
      );
      console.error("Failed to load employee:", err);
    }
  };

  // ── Stats ────────────────────────────────────────────────────
  const stats = [
    { label: "Total", value: employees.length },
    { label: "Active", value: employees.filter((e) => e.is_active).length },
    { label: "Inactive", value: employees.filter((e) => !e.is_active).length },
    {
      label: "Admins",
      value: employees.filter(
        (e) => e.role_name?.toLowerCase().includes("admin") || e.role_name?.toLowerCase().includes("owner")
      ).length,
    },
  ];

  const canManage = hasPermission("employees.create");

  return (
    <SuperAdminLayout
      title="Sub-admin Management"
      description="Manage platform employees, roles and permissions"
      breadcrumbs={[{ label: "Sub-admins" }]}
    >
      <div className="space-y-6">
        {/* ── Stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <div
              key={i}
              className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm"
            >
              <span className="text-sm text-gray-600">{s.label}</span>
              <div className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Toolbar ────────────────────────────────────────── */}
        <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              className="w-full pl-10 h-11 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 px-4 text-sm"
              style={{ "--tw-ring-color": C.primaryLight }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full lg:w-44 h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 bg-white"
          >
            <option value="all">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.display_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full lg:w-36 h-11 rounded-xl border border-gray-200 px-3 text-sm focus:outline-none focus:ring-2 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              className="h-11 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              Refresh
            </button>

            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-11 px-4 rounded-xl text-white flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: C.primary }}
              >
                <UserPlus className="w-4 h-4" />
                Add Employee
              </button>
            )}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Shield className="w-10 h-10 mb-3 text-gray-300" />
              <p className="text-sm">No employees found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Employee
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((emp) => {
                    const RoleIcon =
                      ROLE_ICONS[emp.role_name?.toLowerCase()] || Shield;
                    return (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Name + email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
                              }}
                            >
                              {(emp.user_name || emp.user_email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-gray-900 font-medium truncate">
                                {emp.user_name || "—"}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {emp.user_email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              ROLE_COLORS[
                                roles
                                  .find((r) => r.display_name === emp.role_name)
                                  ?.name
                              ] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            {emp.role_name}
                          </span>
                        </td>

                        {/* Level */}
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {emp.role_level}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              emp.is_active
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        {/* Last Login */}
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {emp.last_login_at
                            ? new Date(emp.last_login_at).toLocaleDateString()
                            : "Never"}
                        </td>

                        {/* Joined */}
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(emp.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleViewDetail(emp)}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            {canManage && (
                              <button
                                onClick={() => handleToggleStatus(emp)}
                                disabled={actionLoading === emp.id}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title={emp.is_active ? "Deactivate" : "Activate"}
                              >
                                {actionLoading === emp.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                ) : emp.is_active ? (
                                  <Ban className="w-4 h-4 text-orange-500" />
                                ) : (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination info */}
        {!loading && filtered.length > 0 && (
          <p className="text-sm text-gray-600">
            Showing {filtered.length} of {employees.length} employees
          </p>
        )}
      </div>

      {/* ── Create modal ───────────────────────────────────────── */}
      {showCreateModal && (
        <CreateEmployeeModal
          roles={roles}
          permissionGroups={permissionGroups}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadData();
          }}
          currentPlatform={platform}
        />
      )}

      {/* ── Detail / edit modal ────────────────────────────────── */}
      {showDetailModal && selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          roles={roles}
          permissionGroups={permissionGroups}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEmployee(null);
          }}
          onUpdated={() => {
            setShowDetailModal(false);
            setSelectedEmployee(null);
            loadData();
          }}
          currentPlatform={platform}
        />
      )}
    </SuperAdminLayout>
  );
}

// =================================================================
// CREATE EMPLOYEE MODAL
// =================================================================

function CreateEmployeeModal({ roles, permissionGroups, onClose, onCreated, currentPlatform }) {
  const [form, setForm] = useState({
    email: "",
    full_name: "",
    phone: "",
    role_id: "",
    permissions: [],
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Only show roles the current user can assign
  const assignableRoles = roles.filter((r) => {
    if (currentPlatform?.is_owner) return true;
    return r.level < (currentPlatform?.role_level || 0);
  });

  const selectedRole = roles.find((r) => r.id === form.role_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!form.email.trim()) newErrors.email = "Required";
    if (!form.full_name.trim()) newErrors.full_name = "Required";
    if (!form.role_id) newErrors.role_id = "Select a role";
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      await createEmployee(form);
      onCreated();
    } catch (err) {
      if (err.data) {
        setErrors(err.data);
      } else {
        setErrors({ email: err.message });
      }
    }
    setSubmitting(false);
  };

  const togglePermission = (code) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(code)
        ? prev.permissions.filter((p) => p !== code)
        : [...prev.permissions, code],
    }));
  };

  const toggleGroup = (catCode) => {
    setExpandedGroups((prev) => ({ ...prev, [catCode]: !prev[catCode] }));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}
            >
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Platform Employee</h2>
              <p className="text-xs text-gray-500">Assign a role and optional extra permissions</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="Email *"
              name="email"
              type="email"
              value={form.email}
              error={errors.email}
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
            />
            <Field
              label="Full Name *"
              name="full_name"
              value={form.full_name}
              error={errors.full_name}
              onChange={(v) => setForm((p) => ({ ...p, full_name: v }))}
            />
          </div>

          <Field
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
          />

          {/* Role select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {assignableRoles.map((role) => {
                const RIcon = ROLE_ICONS[role.name] || Shield;
                const selected = form.role_id === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, role_id: role.id }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                      selected
                        ? "border-[#8B1E3F] bg-[#FDF2F4]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <RIcon className={`w-4 h-4 ${selected ? "text-[#8B1E3F]" : "text-gray-400"}`} />
                    <span className={selected ? "font-medium text-[#8B1E3F]" : "text-gray-700"}>
                      {role.display_name}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.role_id && <p className="text-xs text-red-500 mt-1">{errors.role_id}</p>}
          </div>

          {/* Extra permissions (only shown for sub_admin or if user wants to add) */}
          {selectedRole && selectedRole.name === "sub_admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions <span className="text-gray-400 font-normal">(sub-admin has none by default)</span>
              </label>
              <PermissionPicker
                groups={permissionGroups}
                selected={form.permissions}
                onToggle={togglePermission}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A63A5C] resize-none"
              placeholder="Internal notes about this employee…"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: C.primary }}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Employee
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

// =================================================================
// EMPLOYEE DETAIL / EDIT MODAL (WITH FULL EDIT LOGIC)
// =================================================================

function EmployeeDetailModal({
  employee,
  roles,
  permissionGroups,
  onClose,
  onUpdated,
  currentPlatform,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  // const canManage = hasPermission("employees.manage_roles");
  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  // Initialize edit form when employee loads or edit mode toggles
  useEffect(() => {
    if (employee?.user) {
      setEditForm({
        full_name: employee.user.full_name || "",
        phone: employee.user.phone || "",
        notes: employee.notes || "",
      });
    }
  }, [employee, isEditing]);

  const emp = employee;
  const membership = emp;
  console.log(membership,"membershipmembership")
  const effectivePerms = membership.effective_permissions || [];
  const userPerms = membership.permissions || [];
  const deniedPerms = membership.denied_permissions || [];
  const roleName = membership.role?.name;
  const canManage = membership.can_be_managed;
  // ── Edit Handlers ─────────────────────────────────────────────
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel edit - reset form
      setEditForm({
        full_name: employee.user?.full_name || "",
        phone: employee.user?.phone || "",
        notes: employee.notes || "",
      });
      setErrors({});
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSaveDetails = async () => {
    // Validation
    const newErrors = {};
    if (!editForm.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setActionLoading(true);
    setErrors({});
    
    try {
      // Update employee details via API
      await updateEmployee(emp.id, {
        // full_name: editForm.full_name.trim(),
        // phone: editForm.phone.trim(),
        notes: editForm.notes.trim(),
      });
      
      setIsEditing(false);
      onUpdated(); // Refresh parent data
    } catch (err) {
      console.error("Update failed:", err);
      if (err.data) {
        setErrors(err.data);
      } else {
        setErrors({ general: err.message || "Failed to update employee" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  // ── Role Management ───────────────────────────────────────────
  
  const handleRoleChange = async (roleId) => {
    if (roleId === emp.role?.id) return;
    
    setActionLoading(true);
    try {
      await changeEmployeeRole(emp.id, roleId);
      onUpdated();
    } catch (err) {
      console.error("Role change failed:", err);
      alert(err?.data?.detail || err?.message || "Failed to change role");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Permission Management ─────────────────────────────────────
  
  const handleTogglePerm = async (code) => {
    setActionLoading(true);
    try {
      if (userPerms.includes(code)) {
        await removeEmployeePermission(emp.id, code);
      } else {
        await addEmployeePermission(emp.id, code);
      }
      
      // Reload employee data to get updated permissions
      const updated = await fetchEmployee(emp.id);
      Object.assign(emp, updated);
      setExpandedGroups(g => ({ ...g })); // Force re-render
    } catch (err) {
      console.error("Toggle perm failed:", err);
      alert(err?.data?.detail || err?.message || "Failed to update permission");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPerms = async () => {
    if (!window.confirm("Reset all extra permissions to role defaults?")) return;
    
    setActionLoading(true);
    try {
      await resetEmployeePermissions(emp.id);
      onUpdated();
    } catch (err) {
      console.error("Reset failed:", err);
      alert(err?.data?.detail || err?.message || "Failed to reset permissions");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Status Management ─────────────────────────────────────────
  
  const handleStatusToggle = async () => {
    const action = emp.is_active ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} this employee?`)) return;
    
    setActionLoading(true);
    try {
      if (emp.is_active) {
        await deactivateEmployee(emp.id);
      } else {
        await activateEmployee(emp.id);
      }
      onUpdated();
    } catch (err) {
      console.error("Status toggle failed:", err);
      alert(err?.data?.detail || err?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "permissions", label: "Permissions" },
  ];

  // Filter assignable roles based on hierarchy
  const assignableRoles = roles.filter((r) => {
    if (currentPlatform?.is_owner) return r.name !== roleName;
    return (
      r.level < (currentPlatform?.role_level || 0) && r.name !== roleName
    );
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
              }}
            >
              {(emp.user?.full_name || emp.user?.email || "?").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditing ? "Edit Employee" : (emp.user?.full_name || emp.user?.email)}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500">{emp.user?.email}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    emp.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {emp.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canManage && !isEditing && (
              <button
                onClick={handleEditToggle}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                title="Edit employee"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (isEditing) setIsEditing(false); // Exit edit mode when switching tabs
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#8B1E3F] text-[#8B1E3F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Edit Mode: Editable Form */}
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field
                      label="Full Name *"
                      name="full_name"
                      value={editForm.full_name}
                      error={errors.full_name}
                      onChange={(v) => handleInputChange("full_name", v)}
                    />
                    <Field
                      label="Phone"
                      name="phone"
                      value={editForm.phone}
                      error={errors.phone}
                      onChange={(v) => handleInputChange("phone", v)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => handleInputChange("notes", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#A63A5C] resize-none"
                      placeholder="Internal notes about this employee..."
                    />
                  </div>

                  {errors.general && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleEditToggle}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDetails}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                      style={{ backgroundColor: C.primary }}
                    >
                      {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* View Mode: Read-only Display */}
                  
                  {/* Role Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Role
                    </label>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${
                          ROLE_COLORS[roleName] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        {emp.role?.display_name || roleName}
                      </span>
                      <span className="text-xs text-gray-400">Level {emp.role?.level}</span>
                    </div>
                  </div>

                  {/* Change Role (only if can manage and not owner) */}
                  {canManage && !emp.role?.is_owner_role && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Change Role
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {assignableRoles.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => handleRoleChange(r.id)}
                            disabled={actionLoading}
                            className={`px-4 py-2 rounded-xl border text-sm transition-colors disabled:opacity-50 ${
                              r.id === emp.role?.id
                                ? "border-[#8B1E3F] bg-[#FDF2F4] text-[#8B1E3F]"
                                : "border-gray-200 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            {r.display_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Management */}
                  {canManage && (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Account Status</span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {emp.is_active 
                              ? "Employee can access the platform" 
                              : "Employee access is disabled"}
                          </p>
                        </div>
                        <button
                          onClick={handleStatusToggle}
                          disabled={actionLoading}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 ${
                            emp.is_active
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : emp.is_active ? (
                            <>
                              <Ban className="w-4 h-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard label="Joined" value={new Date(emp.created_at).toLocaleDateString()} />
                    <InfoCard
                      label="Last Login"
                      value={emp.last_login_at ? new Date(emp.last_login_at).toLocaleString() : "Never"}
                    />
                    <InfoCard
                      label="Total Permissions"
                      value={effectivePerms.length}
                    />
                    <InfoCard
                      label="Extra Permissions"
                      value={userPerms.length}
                    />
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard 
                      label="Phone" 
                      value={emp.user?.phone || "Not provided"} 
                    />
                    <InfoCard 
                      label="Email Verified" 
                      value={emp.user?.is_email_verified ? "Yes" : "No"} 
                    />
                  </div>

                  {/* Notes */}
                  {emp.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4">{emp.notes}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "permissions" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {emp.role?.is_super_role
                      ? "This role has ALL permissions (super role)."
                      : `${effectivePerms.length} effective permissions (role defaults + extras)`}
                  </p>
                </div>
                {canManage && !emp.role?.is_super_role && (
                  <button
                    onClick={handleResetPerms}
                    disabled={actionLoading}
                    className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Reset to defaults
                  </button>
                )}
              </div>

              {emp.role?.is_super_role ? (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800">
                    Super-role users automatically receive every permission. Individual permission
                    management is not applicable.
                  </p>
                </div>
              ) : (
                <PermissionPicker
                  groups={permissionGroups}
                  selected={effectivePerms}
                  highlighted={userPerms}
                  denied={deniedPerms}
                  onToggle={canManage ? handleTogglePerm : undefined}
                  expandedGroups={expandedGroups}
                  onToggleGroup={(code) =>
                    setExpandedGroups((prev) => ({ ...prev, [code]: !prev[code] }))
                  }
                  readOnly={!canManage}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer (only show in view mode, edit has its own buttons) */}
        {!isEditing && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}

function ModalOverlay({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Background */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-3xl">
        {children}
      </div>
    </div>
  );
}


function Field({ label, name, type = "text", value, error, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#A63A5C] ${
          error ? "border-red-400" : "border-gray-200"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{typeof error === "string" ? error : error[0]}</p>}
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="text-sm font-medium text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

/**
 * PermissionPicker
 *
 * Expandable groups of permission checkboxes.
 * `selected` = effective permissions (checked)
 * `highlighted` = user-specific extras (shown with a dot)
 * `denied` = explicitly denied (shown with strikethrough)
 */
function PermissionPicker({
  groups = [],
  selected = [],
  highlighted = [],
  denied = [],
  onToggle,
  expandedGroups = {},
  onToggleGroup,
  readOnly = false,
}) {
  return (
    <div className="space-y-2">
      {groups.map((group) => {
        const isExpanded = expandedGroups[group.code];
        const perms = group.permissions || [];
        const activeCount = perms.filter((p) => selected.includes(p.code)).length;

        return (
          <div
            key={group.code}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            {/* Group header */}
            <button
              type="button"
              onClick={() => onToggleGroup(group.code)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-800">{group.name}</span>
              </div>
              <span className="text-xs text-gray-500">
                {activeCount}/{perms.length}
              </span>
            </button>

            {/* Permissions list */}
            {isExpanded && (
              <div className="divide-y divide-gray-100">
                {perms.map((perm) => {
                  const isActive = selected.includes(perm.code);
                  const isExtra = highlighted.includes(perm.code);
                  const isDenied = denied.includes(perm.code);

                  return (
                    <label
                      key={perm.code}
                      className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                        readOnly ? "" : "cursor-pointer hover:bg-gray-50"
                      } ${isDenied ? "opacity-50 line-through" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggle && onToggle(perm.code)}
                        disabled={readOnly}
                        className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#8B1E3F] focus:ring-[#A63A5C]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-800">{perm.name}</span>
                          {isExtra && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" title="Extra permission" />
                          )}
                          {perm.is_dangerous && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-red-100 text-red-600 rounded font-medium">
                              dangerous
                            </span>
                          )}
                          {perm.is_restricted && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-600 rounded font-medium">
                              restricted
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                        <code className="text-[10px] text-gray-400 mt-0.5 block">{perm.code}</code>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}