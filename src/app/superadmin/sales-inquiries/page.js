"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2, Inbox, Mail, Phone, Building2, Users, MessageSquare,
  X, Save, AlertCircle, CheckCircle2, RefreshCw,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  fetchSalesInquiries, updateSalesInquiry,
} from "@/lib/enterpriseApi";

const MAROON = "#800020";

const STATUSES = ["all", "new", "contacted", "qualified", "converted", "closed"];

const STATUS_STYLES = {
  new:       { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  contacted: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  qualified: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
  converted: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  closed:    { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.closed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {status}
    </span>
  );
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/* ── Detail drawer ── */
function InquiryDrawer({ inquiry, onClose, onSaved, onToast }) {
  const [form, setForm] = useState({ status: inquiry.status, notes: inquiry.notes || "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ status: inquiry.status, notes: inquiry.notes || "" });
  }, [inquiry]);

  async function save() {
    setSaving(true);
    try {
      const updated = await updateSalesInquiry(inquiry.id, form);
      onSaved(updated);
      onToast("Inquiry updated", "success");
    } catch (e) {
      onToast(e.data?.detail || e.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  const Row = ({ icon: Icon, label, value }) =>
    value ? (
      <div className="flex items-start gap-2.5 py-1.5">
        <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <div className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</div>
          <div className="text-sm text-gray-800 break-words">{value}</div>
        </div>
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{inquiry.contact_name}</h3>
            <p className="text-xs text-gray-500">{inquiry.plan_interest || "general"} · {fmtDate(inquiry.created_at)}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-gray-200 p-4">
            <Row icon={Mail} label="Email" value={inquiry.contact_email} />
            <Row icon={Phone} label="Phone" value={inquiry.contact_phone} />
            <Row icon={Building2} label="Company" value={inquiry.company_name} />
            <Row icon={Users} label="Company size" value={inquiry.company_size} />
            <Row icon={Users} label="Expected volume" value={inquiry.expected_volume} />
            <Row icon={MessageSquare} label="Message" value={inquiry.message} />
          </div>

          {inquiry.converted_tenant_name && (
            <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              Converted → tenant <b>{inquiry.converted_tenant_name}</b>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {STATUSES.filter((s) => s !== "all").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600">Internal notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              placeholder="Add a note for the sales team…"
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: MAROON }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesInquiriesPage() {
  const [filter, setFilter] = useState("all");
  const [inquiries, setInquiries] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSalesInquiries(filter);
      setInquiries(Array.isArray(data?.inquiries) ? data.inquiries : []);
      setCounts(data?.counts || {});
    } catch (e) {
      setError(e.message || "Failed to load sales inquiries");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  function handleSaved(updated) {
    setSelected(updated);
    setInquiries((list) => list.map((i) => (i.id === updated.id ? updated : i)));
    // Refresh counts (status may have changed the bucket).
    load();
  }

  return (
    <SuperAdminLayout title="Sales Inquiries" description="Contact-Sales lead pipeline">
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === s ? "text-white" : "text-gray-600 bg-gray-100 hover:bg-gray-200"
            }`}
            style={filter === s ? { backgroundColor: MAROON } : {}}
          >
            {s} {counts[s] != null && <span className={filter === s ? "text-white/80" : "text-gray-400"}>({counts[s]})</span>}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-2 rounded-lg text-gray-500 hover:bg-gray-100" title="Refresh">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" style={{ color: MAROON }} /></div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-gray-700 text-sm">{error}</p>
          <button onClick={load} className="px-4 py-2 rounded-lg text-white text-sm" style={{ backgroundColor: MAROON }}>Retry</button>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
            <Inbox className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-gray-700 font-medium">No inquiries here</p>
          <p className="text-sm text-gray-400">Leads from the public Contact-Sales form will appear in this pipeline.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Interest</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((i) => (
                  <tr key={i.id} onClick={() => setSelected(i)} className="hover:bg-gray-50/60 cursor-pointer">
                    <td className="px-5 py-3.5">
                      <div className="text-sm font-medium text-gray-900">{i.contact_name}</div>
                      <div className="text-xs text-gray-400">{i.contact_email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-700">{i.company_name || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-600 capitalize">{i.plan_interest || "general"}</span>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={i.status} /></td>
                    <td className="px-5 py-3.5 text-xs text-gray-500">{fmtDate(i.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <InquiryDrawer
          inquiry={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
          onToast={showToast}
        />
      )}
    </SuperAdminLayout>
  );
}
