"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Crown, Loader2, Check, X, Eye, Plus, Edit, Archive,
  Building2, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  fetchEnterpriseRequests, reviewEnterpriseRequest,
  approveEnterpriseRequest, rejectEnterpriseRequest,
  fetchFeatures, createFeature, updateFeature, archiveFeature,
} from "@/lib/enterpriseApi";

const MAROON = "#800020";

const STATUS_STYLES = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: Clock },
  under_review: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: Eye },
  approved: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: CheckCircle },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: XCircle },
  cancelled: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", icon: X },
  expired: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", icon: AlertCircle },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      <Icon className="w-3 h-3" />
      {status.replace("_", " ")}
    </span>
  );
}

/* ══════════════════ APPROVAL QUEUE ══════════════════ */

function ApproveModal({ request, onClose, onDone }) {
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [interval, setInterval] = useState("month");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setSaving(true); setError(null);
    try {
      await approveEnterpriseRequest(request.id, {
        quoted_price: price || null,
        quoted_currency: currency,
        billing_interval: interval,
        notes,
      });
      onDone();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1">Approve Enterprise Request</h3>
        <p className="text-sm text-gray-500 mb-4">{request.tenant_name} · provisions the Enterprise plan (manual billing).</p>
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600">Negotiated price</label>
              <input value={price} onChange={(e) => setPrice(e.target.value)} type="number"
                placeholder="e.g. 4999" className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="w-24">
              <label className="text-xs font-semibold text-gray-600">Currency</label>
              <input value={currency} onChange={(e) => setCurrency(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Billing interval</label>
            <select value={interval} onChange={(e) => setInterval(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="month">Monthly</option>
              <option value="year">Yearly</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: MAROON }}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Approve & Provision
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalQueue() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEnterpriseRequests(statusFilter || undefined);
      setRequests(Array.isArray(data) ? data : data?.results || []);
    } catch { setRequests([]); } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function act(fn, id) {
    setBusyId(id);
    try { await fn(id); await load(); }
    catch (e) { alert(e.message); }
    finally { setBusyId(null); }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {["", "pending", "under_review", "approved", "rejected", "all"].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s === "all" ? "all" : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              statusFilter === s ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-300"
            }`}
            style={statusFilter === s ? { backgroundColor: MAROON } : {}}>
            {s === "" ? "Open" : s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: MAROON }} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-500">No enterprise requests.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {requests.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900 truncate">{r.tenant_name}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">
                  {r.contact_email || "—"} · {r.message ? r.message.slice(0, 80) : "no message"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {r.status === "pending" && (
                  <button onClick={() => act(reviewEnterpriseRequest, r.id)} disabled={busyId === r.id}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 text-blue-700 bg-blue-50">
                    Start review
                  </button>
                )}
                {(r.status === "pending" || r.status === "under_review") && (
                  <>
                    <button onClick={() => setApproving(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: MAROON }}>
                      <Check className="w-3 h-3" /> Approve
                    </button>
                    <button onClick={() => { const n = prompt("Rejection reason (optional):"); if (n !== null) act((id) => rejectEnterpriseRequest(id, n), r.id); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-700 bg-red-50">
                      <X className="w-3 h-3" /> Reject
                    </button>
                  </>
                )}
                <button onClick={() => router.push(`/superadmin/enterprise/tenants/${r.tenant}`)}
                  className="p-2 text-gray-400 hover:text-gray-700" title="Tenant detail">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approving && (
        <ApproveModal request={approving} onClose={() => setApproving(null)}
          onDone={() => { setApproving(null); load(); }} />
      )}
    </div>
  );
}

/* ══════════════════ FEATURE MANAGER ══════════════════ */

const CATEGORIES = ["core", "providers", "bookings", "communication", "analytics", "support", "integrations", "branding"];
const VALUE_TYPES = ["boolean", "limit", "unlimited"];

function FeatureModal({ feature, onClose, onDone }) {
  const isEdit = !!feature;
  const [form, setForm] = useState({
    code: feature?.code || "", name: feature?.name || "",
    category: feature?.category || "core", value_type: feature?.value_type || "boolean",
    description: feature?.description || "", sort_order: feature?.sort_order ?? 0,
    is_active: feature?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function submit() {
    setSaving(true); setError(null);
    try {
      if (isEdit) {
        const { code, ...rest } = form; // code is immutable
        await updateFeature(feature.id, rest);
      } else {
        await createFeature(form);
      }
      onDone();
    } catch (e) { setError(e.data?.code?.[0] || e.data?.detail || e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{isEdit ? "Edit Feature" : "New Feature"}</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600">Code {isEdit && <span className="text-gray-400">(immutable)</span>}</label>
            <input value={form.code} disabled={isEdit}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="max_providers"
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono disabled:bg-gray-100" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-600">Value type</label>
              <select value={form.value_type} onChange={(e) => setForm({ ...form, value_type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {VALUE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Cancel</button>
          <button onClick={submit} disabled={saving || !form.code || !form.name}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50" style={{ backgroundColor: MAROON }}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureManager() {
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeatures({ includeArchived: showArchived });
      setFeatures(Array.isArray(data) ? data : []);
    } catch { setFeatures([]); } finally { setLoading(false); }
  }, [showArchived]);

  useEffect(() => { load(); }, [load]);

  async function archive(f) {
    if (!confirm(`Archive "${f.name}"? It stays resolvable for existing tenants but is hidden from new plans.`)) return;
    try { await archiveFeature(f.id); load(); } catch (e) { alert(e.message); }
  }

  const grouped = {};
  for (const f of features) (grouped[f.category] ||= []).push(f);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Show archived
        </label>
        <button onClick={() => setEditing(null)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: MAROON }}>
          <Plus className="w-4 h-4" /> New Feature
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: MAROON }} /></div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{cat}</h4>
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {list.map((f) => (
                  <div key={f.id} className={`flex items-center gap-3 px-5 py-3 ${!f.is_active ? "opacity-50" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">{f.name}</span>
                        <code className="text-[11px] text-gray-400">{f.code}</code>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{f.value_type}</span>
                        {!f.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">archived</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{f.assigned_plan_count} plan(s)</p>
                    </div>
                    <button onClick={() => setEditing(f)} className="p-1.5 text-gray-400 hover:text-gray-700" title="Edit"><Edit className="w-4 h-4" /></button>
                    {f.is_active && (
                      <button onClick={() => archive(f)} className="p-1.5 text-gray-400 hover:text-red-600" title="Archive"><Archive className="w-4 h-4" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {features.length === 0 && <div className="text-center py-16 text-sm text-gray-500">No features.</div>}
        </div>
      )}

      {editing !== undefined && (
        <FeatureModal feature={editing} onClose={() => setEditing(undefined)}
          onDone={() => { setEditing(undefined); load(); }} />
      )}
    </div>
  );
}

/* ══════════════════ PAGE ══════════════════ */

export default function EnterprisePage() {
  const [tab, setTab] = useState("queue");
  return (
    <SuperAdminLayout title="Enterprise" description="Approval queue & feature management">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Crown className="w-5 h-5" style={{ color: MAROON }} />
          <h1 className="text-xl font-bold text-gray-900">Enterprise</h1>
        </div>
        <div className="border-b border-gray-200 mb-6 flex gap-1">
          {[["queue", "Approval Queue"], ["features", "Feature Manager"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
                tab === k ? "text-gray-900" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={tab === k ? { borderColor: MAROON, color: MAROON } : {}}>
              {label}
            </button>
          ))}
        </div>
        {tab === "queue" ? <ApprovalQueue /> : <FeatureManager />}
      </div>
    </SuperAdminLayout>
  );
}
