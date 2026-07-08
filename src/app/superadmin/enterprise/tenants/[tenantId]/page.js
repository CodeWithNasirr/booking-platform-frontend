"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, Save, Plus, Trash2, FileText, Users, Sliders, Check,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  fetchEnterpriseContract, saveEnterpriseContract,
  fetchTenantOverrides, saveTenantOverride, deleteTenantOverride,
  fetchEffectiveFeatures, fetchFeatures,
} from "@/lib/enterpriseApi";

const MAROON = "#800020";
const CADENCE = ["monthly", "quarterly", "yearly", "one_time", "custom"];
const TERMS = ["due_on_receipt", "net_15", "net_30", "net_60", "net_90", "custom"];
const MODES = ["enabled", "disabled", "set", "unlimited"];

function Section({ icon: Icon, title, children, action }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: MAROON }} />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/* ── Contract editor ── */
function ContractEditor({ tenantId }) {
  const [contract, setContract] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEnterpriseContract(tenantId);
      const c = data?.contract || null;
      setContract(c);
      setForm(c ? {
        custom_price: c.custom_price || "", currency: c.currency || "SAR",
        billing_cadence: c.billing_cadence || "yearly", payment_terms: c.payment_terms || "net_30",
        contract_start: c.contract_start || "", contract_end: c.contract_end || "",
        renewal_date: c.renewal_date || "", auto_renew: c.auto_renew || false,
        status: c.status || "active", notes: c.notes || "",
      } : {
        currency: "SAR", billing_cadence: "yearly", payment_terms: "net_30",
        auto_renew: false, status: "active",
      });
    } catch (e) { setMsg({ err: e.message }); } finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const payload = { ...form };
      ["contract_start", "contract_end", "renewal_date"].forEach((k) => { if (!payload[k]) payload[k] = null; });
      if (payload.custom_price === "") payload.custom_price = null;
      const data = await saveEnterpriseContract(tenantId, payload);
      setContract(data.contract);
      setMsg({ ok: data.created ? "Contract created." : "Contract saved." });
    } catch (e) { setMsg({ err: e.data?.detail || e.message }); } finally { setSaving(false); }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: MAROON }} /></div>;

  const set = (k, v) => setForm({ ...form, [k]: v });
  const input = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm";

  return (
    <Section icon={FileText} title="Contract"
      action={contract?.billing_mode && <span className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-500">billing: {contract.billing_mode}</span>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Custom price"><input type="number" value={form.custom_price} onChange={(e) => set("custom_price", e.target.value)} className={input} /></Field>
        <Field label="Currency"><input value={form.currency} onChange={(e) => set("currency", e.target.value)} className={input} /></Field>
        <Field label="Billing cadence">
          <select value={form.billing_cadence} onChange={(e) => set("billing_cadence", e.target.value)} className={input}>
            {CADENCE.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Payment terms">
          <select value={form.payment_terms} onChange={(e) => set("payment_terms", e.target.value)} className={input}>
            {TERMS.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
          </select>
        </Field>
        <Field label="Contract start"><input type="date" value={form.contract_start} onChange={(e) => set("contract_start", e.target.value)} className={input} /></Field>
        <Field label="Contract end"><input type="date" value={form.contract_end} onChange={(e) => set("contract_end", e.target.value)} className={input} /></Field>
        <Field label="Renewal date"><input type="date" value={form.renewal_date} onChange={(e) => set("renewal_date", e.target.value)} className={input} /></Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={input}>
            {["draft", "active", "expired", "terminated"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="col-span-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.auto_renew} onChange={(e) => set("auto_renew", e.target.checked)} /> Auto-renew
          </label>
        </div>
        <div className="col-span-2">
          <Field label="Notes"><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={`${input} resize-none`} /></Field>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4">
        {msg ? <span className={`text-xs ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.ok || msg.err}</span> : <span />}
        <button onClick={save} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50" style={{ backgroundColor: MAROON }}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Contract
        </button>
      </div>
    </Section>
  );
}

/* ── Overrides + effective preview ── */
function OverridesPanel({ tenantId }) {
  const [overrides, setOverrides] = useState([]);
  const [effective, setEffective] = useState(null);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ feature: "", mode: "unlimited", numeric_value: "", note: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, eff, feats] = await Promise.all([
        fetchTenantOverrides(tenantId),
        fetchEffectiveFeatures(tenantId),
        fetchFeatures(),
      ]);
      setOverrides(Array.isArray(ov) ? ov : []);
      setEffective(eff);
      setFeatures(Array.isArray(feats) ? feats : []);
    } catch { /* keep */ } finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  async function saveDraft() {
    if (!draft.feature) return;
    const payload = { feature: draft.feature, mode: draft.mode, note: draft.note };
    if (draft.mode === "set") payload.numeric_value = Number(draft.numeric_value);
    try {
      await saveTenantOverride(tenantId, payload);
      setAdding(false); setDraft({ feature: "", mode: "unlimited", numeric_value: "", note: "" });
      load();
    } catch (e) { alert(e.data?.detail || e.message); }
  }

  async function remove(featureId) {
    if (!confirm("Remove this override? The feature reverts to the plan value.")) return;
    try { await deleteTenantOverride(tenantId, featureId); load(); } catch (e) { alert(e.message); }
  }

  const input = "px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm";

  return (
    <>
      <Section icon={Sliders} title="Feature Overrides"
        action={<button onClick={() => setAdding(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={{ backgroundColor: MAROON }}><Plus className="w-3 h-3" /> Add</button>}>
        {loading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin" style={{ color: MAROON }} /></div>
        ) : (
          <>
            {adding && (
              <div className="flex flex-wrap items-center gap-2 p-3 mb-3 bg-gray-50 rounded-lg">
                <select value={draft.feature} onChange={(e) => setDraft({ ...draft, feature: e.target.value })} className={input}>
                  <option value="">Select feature…</option>
                  {features.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.code})</option>)}
                </select>
                <select value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value })} className={input}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                {draft.mode === "set" && (
                  <input type="number" placeholder="value" value={draft.numeric_value}
                    onChange={(e) => setDraft({ ...draft, numeric_value: e.target.value })} className={`${input} w-24`} />
                )}
                <input placeholder="note" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} className={`${input} flex-1`} />
                <button onClick={saveDraft} className="p-1.5 rounded-lg text-white" style={{ backgroundColor: MAROON }}><Check className="w-4 h-4" /></button>
                <button onClick={() => setAdding(false)} className="p-1.5 text-gray-400">✕</button>
              </div>
            )}
            {overrides.length === 0 && !adding ? (
              <p className="text-sm text-gray-400 py-2">No overrides — this tenant resolves the plan defaults.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {overrides.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2.5">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{o.feature_name}</span>
                      <code className="ml-2 text-[11px] text-gray-400">{o.feature_code}</code>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                        {o.mode}{o.mode === "set" ? ` = ${o.numeric_value}` : ""}
                      </span>
                      {o.note && <span className="ml-2 text-xs text-gray-400">{o.note}</span>}
                    </div>
                    <button onClick={() => remove(o.feature)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Section>

      {effective && (
        <Section icon={Users} title={`Effective Features · ${effective.plan?.tier || "no plan"}`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {Object.entries(effective.features).map(([code, f]) => (
              <div key={code} className="flex items-center justify-between text-sm py-0.5">
                <span className="text-gray-600 truncate">{f.name}</span>
                <span className={`font-medium ${f.overridden ? "text-amber-600" : "text-gray-900"}`}>
                  {f.display_value}{f.overridden ? " *" : ""}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">* overridden for this tenant</p>
        </Section>
      )}
    </>
  );
}

export default function EnterpriseTenantDetail() {
  const { tenantId } = useParams();
  const router = useRouter();
  return (
    <SuperAdminLayout title="Enterprise Tenant" description="Contract & feature overrides">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push("/superadmin/enterprise")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to Enterprise
        </button>
        <ContractEditor tenantId={tenantId} />
        <OverridesPanel tenantId={tenantId} />
      </div>
    </SuperAdminLayout>
  );
}
