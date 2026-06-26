// src/app/superadmin/announcements/page.js
"use client";

/**
 * Announcements Management — Platform Admin
 * ─────────────────────────────────────────────────────
 * CRUD for SystemAnnouncement model.
 * Publish/draft toggle, target by plan tier, expiry dates,
 * level-based styling (info / warning / critical / maintenance).
 */

import { useState, useEffect, useCallback } from "react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import { useSuperAdmin } from "@/contexts/Superadmincontext";
import { useTranslation } from "@/lib/t";
import {
  Plus, Edit, Trash2, Loader2, X, Save,
  Megaphone, Info, AlertTriangle, AlertCircle,
  Wrench, Eye, EyeOff, Clock,
} from "lucide-react";
import {
  fetchAnnouncements, createAnnouncement,
  updateAnnouncement, deleteAnnouncement,
} from "@/lib/platformApi";

const M = "#8B1E3F";

function getLevelConfig(level, t) {
  const LEVEL = {
    info:        { Icon: Info,          color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",   label: t("superadmin.billing.level_info") },
    warning:     { Icon: AlertTriangle, color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  label: t("superadmin.billing.level_warning") },
    critical:    { Icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200",    label: t("superadmin.billing.level_critical") },
    maintenance: { Icon: Wrench,        color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", label: t("superadmin.billing.level_maintenance") },
  };
  return LEVEL[level] || LEVEL.info;
}

const TIERS = ["free", "starter", "professional", "enterprise"];

export default function AnnouncementsPage() {
  const { hasPermission } = useSuperAdmin();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  function flash(msg, type = "success") { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetchAnnouncements();
      setItems(Array.isArray(d) ? d : d?.results || []);
    } catch { setItems([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── save ──
  async function handleSave(formData) {
    setSaving(true);
    try {
      if (modal.mode === "edit" && modal.data.id) {
        await updateAnnouncement(modal.data.id, formData);
        flash(t("superadmin.billing.announcement_updated"));
      } else {
        await createAnnouncement(formData);
        flash(t("superadmin.billing.announcement_created"));
      }
      setModal(null);
      load();
    } catch (e) { flash(e.message, "error"); }
    setSaving(false);
  }

  // ── delete ──
  async function handleDelete(id) {
    if (!confirm(t("superadmin.billing.confirm_delete_announcement"))) return;
    setDeleting(id);
    try { await deleteAnnouncement(id); flash(t("superadmin.billing.announcement_deleted")); load(); } catch (e) { flash(e.message, "error"); }
    setDeleting(null);
  }

  // ── toggle ──
  async function togglePublish(ann) {
    try {
      await updateAnnouncement(ann.id, { is_active: !ann.is_active });
      load();
      flash(ann.is_active ? t("superadmin.billing.announcement_unpublished") : t("superadmin.billing.announcement_published"));
    } catch (e) { flash(e.message, "error"); }
  }

  const published = items.filter(a => a.is_active).length;
  const drafts    = items.filter(a => !a.is_active).length;

  return (
    <SuperAdminLayout
      title={t("superadmin.billing.announcements_title")}
      description={t("superadmin.billing.announcements_desc")}
      breadcrumbs={[{ label: t("superadmin.billing.announcements_title") }]}
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_.15s_ease-out]">
          <div className={`px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>{toast.msg}</div>
        </div>
      )}

      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">{t("superadmin.billing.announcements_summary", { published, drafts })}</p>
        <button onClick={() => setModal({ mode: "create", data: {} })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: M }}>
          <Plus className="w-4 h-4" /> {t("superadmin.billing.new_announcement")}
        </button>
      </div>

      {/* list */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-20 text-center">
          <Megaphone className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">{t("superadmin.billing.no_announcements_yet")}</p>
          <p className="text-xs text-gray-300 mt-1">{t("superadmin.billing.create_announcement_hint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(ann => {
            const lc = getLevelConfig(ann.level, t);
            const { Icon } = lc;
            return (
              <div key={ann.id}
                className={`bg-white rounded-2xl border p-5 transition ${ann.is_active ? lc.border : "border-gray-200 opacity-60"}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${lc.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${lc.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-gray-900">{ann.title}</h3>
                      <span className={`px-2 py-[2px] rounded-full text-[10px] font-semibold capitalize ${lc.bg} ${lc.color}`}>{lc.label}</span>
                      <span className={`px-2 py-[2px] rounded-full text-[10px] font-semibold ${
                        ann.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {ann.is_active ? t("superadmin.billing.status_published") : t("superadmin.billing.status_draft")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{ann.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-400">
                      <span>{t("superadmin.billing.created_on", { date: new Date(ann.created_at).toLocaleDateString() })}</span>
                      {ann.ends_at && (
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {t("superadmin.billing.expires_on", { date: new Date(ann.ends_at).toLocaleDateString() })}</span>
                      )}
                      {ann.target_tiers?.length > 0 && (
                        <span>{t("superadmin.billing.targets_label")}: {ann.target_tiers.join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => togglePublish(ann)} className="p-2 rounded-xl hover:bg-gray-100 transition"
                      title={ann.is_active ? t("superadmin.billing.unpublish") : t("superadmin.billing.publish")}>
                      {ann.is_active ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    </button>
                    <button onClick={() => setModal({ mode: "edit", data: ann })} className="p-2 rounded-xl hover:bg-gray-100 transition">
                      <Edit className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(ann.id)} disabled={deleting === ann.id}
                      className="p-2 rounded-xl hover:bg-red-50 transition">
                      {deleting === ann.id ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════ CREATE / EDIT MODAL ════ */}
      {modal && <AnnouncementModal mode={modal.mode} initial={modal.data} saving={saving} onSave={handleSave} onClose={() => setModal(null)} t={t} />}
    </SuperAdminLayout>
  );
}


// ═══════════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════════

function AnnouncementModal({ mode, initial, saving, onSave, onClose, t }) {
  const [form, setForm] = useState({
    title:        initial.title || "",
    message:      initial.message || "",
    level:        initial.level || "info",
    is_active:    initial.is_active ?? true,
    target_tiers: initial.target_tiers || [],
    ends_at:      initial.ends_at ? initial.ends_at.split("T")[0] : "",
  });

  function toggleTier(tier) {
    setForm(p => ({
      ...p,
      target_tiers: p.target_tiers.includes(tier)
        ? p.target_tiers.filter(t => t !== tier)
        : [...p.target_tiers, tier],
    }));
  }

  function submit(e) {
    e.preventDefault();
    onSave({
      ...form,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    });
  }

  const levelOptions = [
    { value: "info",        label: t("superadmin.billing.level_info") },
    { value: "warning",     label: t("superadmin.billing.level_warning") },
    { value: "critical",    label: t("superadmin.billing.level_critical") },
    { value: "maintenance", label: t("superadmin.billing.level_maintenance") },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{mode === "edit" ? t("superadmin.billing.edit_announcement") : t("superadmin.billing.new_announcement_title")}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("superadmin.billing.label_title")} <span className="text-red-500">*</span></label>
            <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-[#8B1E3F]/15" placeholder={t("superadmin.billing.placeholder_title")} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("superadmin.billing.label_message")} <span className="text-red-500">*</span></label>
            <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} required
              rows={4} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:ring-2 focus:ring-[#8B1E3F]/15"
              placeholder={t("superadmin.billing.placeholder_message")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("superadmin.billing.label_level")}</label>
              <select value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white">
                {levelOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("superadmin.billing.label_expires")}</label>
              <input type="date" value={form.ends_at} onChange={e => setForm(p => ({ ...p, ends_at: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t("superadmin.billing.label_target_plans")} <span className="text-gray-400 font-normal text-xs">({t("superadmin.billing.empty_means_all")})</span></label>
            <div className="flex gap-2 flex-wrap">
              {TIERS.map(tier => (
                <button key={tier} type="button" onClick={() => toggleTier(tier)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border capitalize transition ${
                    form.target_tiers.includes(tier) ? "border-[#8B1E3F] bg-rose-50 text-[#8B1E3F]" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}>{tier}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? "bg-emerald-500" : "bg-gray-300"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "left-6" : "left-1"}`} />
            </button>
            <span className="text-sm text-gray-700">{form.is_active ? t("superadmin.billing.status_published") : t("superadmin.billing.status_draft")}</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50">{t("common.cancel")}</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: M }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {mode === "edit" ? t("superadmin.billing.update") : t("superadmin.billing.publish")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}