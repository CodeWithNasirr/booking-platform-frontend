"use client";

/**
 * SEOSettingsPanel — Phase 5.
 *
 * Rendered inside the website editor's Page Settings (BuilderSidebar → Settings
 * tab). Edits the site SEO via the existing API:
 *   GET/PUT /api/v1/website/seo/
 * Open-Graph image uploads go through the centralized media endpoint:
 *   POST /api/v1/website/media/og-image/   → { url }  (Cloudflare R2 in prod)
 *
 * Editing is gated by the seo_tools plan feature (usePlan) AND enforced by the
 * backend (402) — the frontend gate is UX only, never the authorization.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Image as ImageIcon, Loader2, Check, AlertCircle, Lock, Upload, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { usePlan } from "@/contexts/PlanContext";
import { apiFetch } from "@/lib/apiClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const EMPTY = { seo_title: "", seo_description: "", seo_keywords: "", og_image: "" };

export default function SEOSettingsPanel({ T, isRTL }) {
  const { activeTenant, tenants } = useApp();
  const { hasFeature, loading: planLoading } = usePlan();
  const allowed = hasFeature("seo_tools");

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const tenant = (tenants || []).find((t) => String(t.id) === String(activeTenant));
  const previewDomain = tenant?.primary_domain?.domain || tenant?.slug || "your-site";

  const load = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/v1/website/seo/", activeTenant, { method: "GET" });
      setForm({ ...EMPTY, ...(data || {}) });
    } catch {
      setError(T({ en: "Couldn't load SEO settings.", ar: "تعذّر تحميل إعدادات SEO.", ur: "SEO سیٹنگز لوڈ نہیں ہوسکیں۔" }));
    } finally {
      setLoading(false);
    }
  }, [activeTenant, T]);

  useEffect(() => { if (allowed) load(); else setLoading(false); }, [allowed, load]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setSaved(false); };

  const onSave = async () => {
    setSaving(true); setError(null); setSaved(false);
    try {
      const data = await apiFetch("/api/v1/website/seo/", activeTenant, {
        method: "PUT", body: JSON.stringify(form),
      });
      setForm({ ...EMPTY, ...(data || {}) });
      setSaved(true);
    } catch (e) {
      setError(e?.message || T({ en: "Save failed.", ar: "فشل الحفظ.", ur: "محفوظ نہیں ہوا۔" }));
    } finally {
      setSaving(false);
    }
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (file) e.target.value = "";
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await apiFetch("/api/v1/website/media/og-image/", activeTenant, {
        method: "POST", body: fd,
      });
      if (res?.url) { setForm((f) => ({ ...f, og_image: res.url })); setSaved(false); }
    } catch (e2) {
      setError(e2?.message || T({ en: "Upload failed.", ar: "فشل الرفع.", ur: "اپ لوڈ ناکام۔" }));
    } finally {
      setUploading(false);
    }
  };

  const label = (t) => <label className={`block text-xs font-medium text-slate-600 mb-1 ${isRTL ? "text-right" : ""}`}>{T(t)}</label>;
  const inputCls = "w-full text-sm rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400/40";

  // ── Feature-locked state (matches app upgrade UX) ────────────────────────
  if (!planLoading && !allowed) {
    return (
      <div className="p-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">{T({ en: "SEO Tools", ar: "أدوات SEO", ur: "SEO ٹولز" })}</p>
          <p className="text-xs text-slate-500 mt-1">
            {T({ en: "Upgrade your plan to customize search & social metadata.",
                 ar: "قم بترقية خطتك لتخصيص بيانات البحث والتواصل.",
                 ur: "سرچ اور سوشل میٹا ڈیٹا کے لیے اپنا پلان اپ گریڈ کریں۔" })}
          </p>
        </div>
      </div>
    );
  }

  if (loading || planLoading) {
    return <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className={`p-4 space-y-5 ${isRTL ? "text-right" : ""}`} dir={isRTL ? "rtl" : "ltr"}>
      <div>
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Search className="w-4 h-4" /> {T({ en: "SEO Settings", ar: "إعدادات SEO", ur: "SEO سیٹنگز" })}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          {T({ en: "How your site appears in search and social shares.",
               ar: "كيف يظهر موقعك في البحث والمشاركة.",
               ur: "آپ کی سائٹ سرچ اور شیئر میں کیسے نظر آتی ہے۔" })}
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> <span>{error}</span>
        </div>
      ) : null}

      <div>
        {label({ en: "SEO Title", ar: "عنوان SEO", ur: "SEO ٹائٹل" })}
        <input className={inputCls} maxLength={70} value={form.seo_title} onChange={set("seo_title")}
               placeholder={T({ en: "e.g. Acme Salon — Book Online", ar: "مثال: صالون Acme", ur: "مثلاً Acme سیلون" })} />
        <div className="text-[10px] text-slate-400 mt-0.5">{form.seo_title.length}/70</div>
      </div>

      <div>
        {label({ en: "SEO Description", ar: "وصف SEO", ur: "SEO تفصیل" })}
        <textarea className={inputCls} maxLength={160} rows={3} value={form.seo_description} onChange={set("seo_description")}
                  placeholder={T({ en: "A short summary for search results", ar: "ملخص قصير لنتائج البحث", ur: "سرچ نتائج کے لیے مختصر خلاصہ" })} />
        <div className="text-[10px] text-slate-400 mt-0.5">{form.seo_description.length}/160</div>
      </div>

      <div>
        {label({ en: "Keywords", ar: "الكلمات المفتاحية", ur: "کلیدی الفاظ" })}
        <input className={inputCls} value={form.seo_keywords} onChange={set("seo_keywords")}
               placeholder={T({ en: "salon, haircut, booking", ar: "صالون، قص شعر", ur: "سیلون، ہیئرکٹ" })} />
      </div>

      {/* OG image */}
      <div>
        {label({ en: "Open Graph Image", ar: "صورة Open Graph", ur: "اوپن گراف تصویر" })}
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
            {form.og_image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.og_image} alt="OG" className="w-full h-full object-cover" />
            ) : <ImageIcon className="w-6 h-6 text-slate-300" />}
          </div>
          <div className="flex flex-col gap-1.5">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:brightness-110 disabled:opacity-60">
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {form.og_image ? T({ en: "Replace", ar: "استبدال", ur: "تبدیل کریں" }) : T({ en: "Upload", ar: "رفع", ur: "اپ لوڈ" })}
            </button>
            {form.og_image ? (
              <button type="button" onClick={() => { setForm((f) => ({ ...f, og_image: "" })); setSaved(false); }}
                      className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600">
                <X className="w-3.5 h-3.5" /> {T({ en: "Remove", ar: "إزالة", ur: "ہٹائیں" })}
              </button>
            ) : null}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        </div>
      </div>

      {/* Google search preview */}
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">{T({ en: "Search preview", ar: "معاينة البحث", ur: "سرچ پیش منظر" })}</div>
        <div className="text-[13px] text-emerald-700 truncate">https://{previewDomain}</div>
        <div className="text-[15px] text-blue-800 truncate">{form.seo_title || previewDomain}</div>
        <div className="text-[12px] text-slate-500 line-clamp-2">{form.seo_description || T({ en: "Your description will appear here.", ar: "سيظهر وصفك هنا.", ur: "آپ کی تفصیل یہاں نظر آئے گی۔" })}</div>
      </div>

      {/* Social / OG preview */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 px-3 pt-2">{T({ en: "Social preview", ar: "معاينة التواصل", ur: "سوشل پیش منظر" })}</div>
        <div className="w-full aspect-[1.91/1] bg-slate-100 flex items-center justify-center">
          {form.og_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.og_image} alt="OG preview" className="w-full h-full object-cover" />
          ) : <ImageIcon className="w-8 h-8 text-slate-300" />}
        </div>
        <div className="p-2 bg-white">
          <div className="text-[11px] text-slate-400 truncate">{previewDomain}</div>
          <div className="text-[13px] font-semibold text-slate-800 truncate">{form.seo_title || previewDomain}</div>
          <div className="text-[11px] text-slate-500 line-clamp-2">{form.seo_description}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button type="button" disabled={saving} onClick={onSave}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:brightness-110 disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {T({ en: "Save SEO", ar: "حفظ SEO", ur: "SEO محفوظ کریں" })}
        </button>
        {saved ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
            <Check className="w-3.5 h-3.5" /> {T({ en: "Saved", ar: "تم الحفظ", ur: "محفوظ ہوگیا" })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
