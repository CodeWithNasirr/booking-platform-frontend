"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/t";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  GripVertical,
  Package,
  Zap,
  Star,
  Crown,
  X,
} from "lucide-react";
import { createPlan, updatePlan, fetchPlan, fetchFeatureRegistry } from "@/lib/platformApi";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const MAROON = "#800020";

const uuidv4 = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function emptyFeature(sortOrder = 0) {
  return {
    _key: uuidv4(),
    code: "",
    name: "",
    category: "core",
    feature_type: "boolean",
    is_included: true,
    limit_value: "",
    display_value: "",
    sort_order: sortOrder,
  };
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

function Label({ children, required }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
      {...props}
    />
  );
}

function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className = "", ...props }) {
  return (
    <textarea
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] ${className}`}
      {...props}
    />
  );
}

function Checkbox({ label, checked, onChange, disabled }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-4 h-4 rounded border-gray-300 text-[#800020] focus:ring-[#800020]/30"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-xs text-red-500 mt-1">{error}</p>;
}

/* ════════════════════════════════════════════
   PLAN FORM COMPONENT
   ════════════════════════════════════════════ */

export default function PlanForm({ planId }) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = !!planId;

  /* ── State ─────────────────────────────── */
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  // toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Plan fields
  const [form, setForm] = useState({
    name: "",
    slug: "",
    tier: "starter",
    tagline: "",
    description: "",
    price_monthly: "",
    price_yearly: "",
    currency: "USD",
    trial_days: "0",
    trial_requires_card: false,
    status: "active",
    is_popular: false,
    is_custom: false,
    sort_order: "0",
    stripe_product_id: "",
    stripe_price_monthly_id: "",
    stripe_price_yearly_id: "",
  });

  // Features
  const [features, setFeatures] = useState([emptyFeature(0)]);
  const [featureOptions, setFeatureOptions] = useState([]);

  /* ── Derived options from translations ──── */
  const TIER_OPTIONS = [
    { value: "free", label: t("superadmin.billing.tier_free") },
    { value: "starter", label: t("superadmin.billing.tier_starter") },
    { value: "professional", label: t("superadmin.billing.tier_professional") },
    { value: "enterprise", label: t("superadmin.billing.tier_enterprise") },
  ];

  const STATUS_OPTIONS = [
    { value: "active", label: t("superadmin.billing.status_active") },
    { value: "inactive", label: t("superadmin.billing.status_inactive") },
  ];

  const FEATURE_TYPE_OPTIONS = [
    { value: "boolean", label: t("superadmin.billing.feature_type_boolean") },
    { value: "limit", label: t("superadmin.billing.feature_type_limit") },
    { value: "unlimited", label: t("superadmin.billing.feature_type_unlimited") },
  ];

  const CATEGORY_OPTIONS = [
    { value: "core", label: t("superadmin.billing.category_core") },
    { value: "providers", label: t("superadmin.billing.category_providers") },
    { value: "bookings", label: t("superadmin.billing.category_bookings") },
    { value: "website", label: t("superadmin.billing.category_website") },
    { value: "support", label: t("superadmin.billing.category_support") },
    { value: "integrations", label: t("superadmin.billing.category_integrations") },
    { value: "advanced", label: t("superadmin.billing.category_advanced") },
  ];

  const CURRENCY_OPTIONS = [
    "SAR",
    "USD",
    "AED",
    "EUR",
    "GBP",
    "PKR",
    "QAR",
    "KWD",
    "BHD",
    "OMR",
  ];

  /* ── loadFeatureOptions existing plan ────────────────── */
  useEffect(() => {
    async function loadFeatureOptions() {
      const data = await fetchFeatureRegistry();
      setFeatureOptions(data.features);
    }
    loadFeatureOptions();
  }, []);

  /* ── Load existing plan ────────────────── */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchPlan(planId);
        setForm({
          name: data.name || "",
          slug: data.slug || "",
          tier: data.tier || "starter",
          tagline: data.tagline || "",
          description: data.description || "",
          price_monthly: data.price_monthly ?? "",
          price_yearly: data.price_yearly ?? "",
          currency: data.currency || "USD",
          trial_days: String(data.trial_days ?? 0),
          trial_requires_card: data.trial_requires_card || false,
          status: data.status || "active",
          is_popular: data.is_popular || false,
          is_custom: data.is_custom || false,
          sort_order: String(data.sort_order ?? 0),
          stripe_product_id: data.stripe_product_id || "",
          stripe_price_monthly_id: data.stripe_price_monthly_id || "",
          stripe_price_yearly_id: data.stripe_price_yearly_id || "",
        });
        setAutoSlug(false);
        if (data.features?.length > 0) {
          setFeatures(
            data.features.map((f) => ({
              _key: f.id || uuidv4(),
              code: f.code || "",
              name: f.name || "",
              category: f.category || "core",
              feature_type: f.feature_type || "boolean",
              is_included: f.is_included ?? true,
              limit_value: f.limit_value != null ? String(f.limit_value) : "",
              display_value: f.display_value || "",
              sort_order: f.sort_order ?? 0,
            }))
          );
        } else {
          setFeatures([]);
        }
      } catch (err) {
        setError(err.message || t("superadmin.billing.toast_load_error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [planId, isEdit, t]);

  /* ── Form helpers ──────────────────────── */
  function updateForm(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "name" && autoSlug) {
        next.slug = slugify(value);
      }
      return next;
    });
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  function updateFeature(index, field, value) {
    setFeatures((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === "name" && !next[index].code) {
        next[index].code = slugify(value).replace(/-/g, "_");
      }
      return next;
    });
  }

  function addFeature() {
    setFeatures((prev) => [...prev, emptyFeature(prev.length)]);
  }

  function removeFeature(index) {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  /* ── Validation ────────────────────────── */
  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = t("superadmin.billing.error_name_required");
    if (!form.slug.trim()) errs.slug = t("superadmin.billing.error_slug_required");
    if (!form.tier) errs.tier = t("superadmin.billing.error_tier_required");
    if (form.price_monthly === "" || isNaN(form.price_monthly) || Number(form.price_monthly) < 0) {
      errs.price_monthly = t("superadmin.billing.error_price_monthly");
    }
    if (form.price_yearly !== "" && (isNaN(form.price_yearly) || Number(form.price_yearly) < 0)) {
      errs.price_yearly = t("superadmin.billing.error_price_yearly");
    }

    // Validate features
    const validFeatures = features.filter((f) => f.name.trim() || f.code.trim());
    for (let i = 0; i < validFeatures.length; i++) {
      const f = validFeatures[i];
      if (!f.name.trim()) errs[`feature_${i}_name`] = t("superadmin.billing.error_feature_name");
      if (!f.code.trim()) errs[`feature_${i}_code`] = t("superadmin.billing.error_feature_code");
      if (f.feature_type === "limit" && (!f.limit_value || isNaN(f.limit_value))) {
        errs[`feature_${i}_limit`] = t("superadmin.billing.error_feature_limit");
      }
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* ── Submit ────────────────────────────── */
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      showToast(t("superadmin.billing.toast_fix_errors"), "error");
      return;
    }

    const validFeatures = features
      .filter((f) => f.name.trim() && f.code.trim())
      .map((f, i) => ({
        code: f.code.trim(),
        name: f.name.trim(),
        category: f.category,
        feature_type: f.feature_type,
        is_included: f.is_included,
        limit_value: f.feature_type === "limit" ? Number(f.limit_value) : null,
        display_value: f.display_value || "",
        sort_order: i,
      }));

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      tier: form.tier,
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      price_monthly: Number(form.price_monthly) || 0,
      price_yearly: Number(form.price_yearly) || 0,
      currency: form.currency,
      trial_days: Number(form.trial_days) || 0,
      trial_requires_card: form.trial_requires_card,
      status: form.status,
      is_popular: form.is_popular,
      is_custom: form.is_custom,
      sort_order: Number(form.sort_order) || 0,
      stripe_product_id: form.stripe_product_id.trim(),
      stripe_price_monthly_id: form.stripe_price_monthly_id.trim(),
      stripe_price_yearly_id: form.stripe_price_yearly_id.trim(),
      features: validFeatures,
    };

    try {
      setSaving(true);
      setError(null);
      if (isEdit) {
        await updatePlan(planId, payload);
        showToast(t("superadmin.billing.toast_plan_updated"));
      } else {
        await createPlan(payload);
        showToast(t("superadmin.billing.toast_plan_created"));
      }
      setTimeout(() => router.push("/superadmin/billing"), 800);
    } catch (err) {
      const data = err.data;
      if (data && typeof data === "object") {
        const mapped = {};
        Object.entries(data).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v.join(", ") : String(v);
        });
        setFieldErrors(mapped);
      }
      setError(err.message || t("superadmin.billing.toast_save_error"));
      showToast(err.message || t("superadmin.billing.toast_save_error"), "error");
    } finally {
      setSaving(false);
    }
  }

  /* ── Loading state ─────────────────────── */
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
        <p className="text-gray-500 text-sm">{t("superadmin.billing.loading_plan")}</p>
      </div>
    );
  }

  /* ── Yearly discount preview ───────────── */
  const monthlyNum = Number(form.price_monthly) || 0;
  const yearlyNum = Number(form.price_yearly) || 0;
  const annualFromMonthly = monthlyNum * 12;
  const discountPct =
    annualFromMonthly > 0 && yearlyNum > 0
      ? Math.round((1 - yearlyNum / annualFromMonthly) * 100)
      : 0;

  /* ────────────────────────────────────────
     RENDER
     ──────────────────────────────────────── */
  return (
    <div className="space-y-6 max-w-4xl">
      <SuperAdminLayout>
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/superadmin/billing")}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("superadmin.billing.back_to_billing")}
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? t("superadmin.billing.edit_plan_title") : t("superadmin.billing.create_plan_title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isEdit
              ? t("superadmin.billing.edit_plan_desc")
              : t("superadmin.billing.create_plan_desc")}
          </p>
        </div>

        {/* Global error */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ═══════════════════════════════════
             SECTION: Basic Info
             ═══════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">
              {t("superadmin.billing.section_basic_info")}
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <Label required>{t("superadmin.billing.label_plan_name")}</Label>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  placeholder={t("superadmin.billing.placeholder_plan_name")}
                />
                <FieldError error={fieldErrors.name} />
              </div>
              <div>
                <Label required>{t("superadmin.billing.label_slug")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={form.slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      updateForm("slug", e.target.value);
                    }}
                    placeholder={t("superadmin.billing.placeholder_slug")}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{t("superadmin.billing.hint_slug")}</p>
                <FieldError error={fieldErrors.slug} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <Label required>{t("superadmin.billing.label_tier")}</Label>
                <Select value={form.tier} onChange={(e) => updateForm("tier", e.target.value)}>
                  {TIER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
                <FieldError error={fieldErrors.tier} />
              </div>
              <div>
                <Label>{t("superadmin.billing.label_status")}</Label>
                <Select value={form.status} onChange={(e) => updateForm("status", e.target.value)}>
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label>{t("superadmin.billing.label_tagline")}</Label>
              <Input
                value={form.tagline}
                onChange={(e) => updateForm("tagline", e.target.value)}
                placeholder={t("superadmin.billing.placeholder_tagline")}
              />
            </div>

            <div>
              <Label>{t("superadmin.billing.label_description")}</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateForm("description", e.target.value)}
                rows={3}
                placeholder={t("superadmin.billing.placeholder_description")}
              />
            </div>

            <div className="flex flex-wrap gap-5">
              <Checkbox
                label={t("superadmin.billing.label_is_popular")}
                checked={form.is_popular}
                onChange={(v) => updateForm("is_popular", v)}
              />
              <Checkbox
                label={t("superadmin.billing.label_is_custom")}
                checked={form.is_custom}
                onChange={(v) => updateForm("is_custom", v)}
              />
            </div>

            <div className="w-32">
              <Label>{t("superadmin.billing.label_sort_order")}</Label>
              <Input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(e) => updateForm("sort_order", e.target.value)}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════
             SECTION: Pricing
             ═══════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">
              {t("superadmin.billing.section_pricing")}
            </h2>

            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <Label required>{t("superadmin.billing.label_monthly_price")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_monthly}
                    onChange={(e) => updateForm("price_monthly", e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                <FieldError error={fieldErrors.price_monthly} />
              </div>
              <div>
                <Label>{t("superadmin.billing.label_yearly_price")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price_yearly}
                    onChange={(e) => updateForm("price_yearly", e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                {discountPct > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {t("superadmin.billing.discount_preview", { pct: discountPct })}
                  </p>
                )}
                <FieldError error={fieldErrors.price_yearly} />
              </div>
              <div>
                <Label>{t("superadmin.billing.label_currency")}</Label>
                <Select value={form.currency} onChange={(e) => updateForm("currency", e.target.value)}>
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <Label>{t("superadmin.billing.label_trial_days")}</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.trial_days}
                  onChange={(e) => updateForm("trial_days", e.target.value)}
                  placeholder={t("superadmin.billing.placeholder_trial_days")}
                />
                <p className="text-xs text-gray-400 mt-1">{t("superadmin.billing.hint_trial_days")}</p>
              </div>
              <div className="flex items-end pb-2">
                <Checkbox
                  label={t("superadmin.billing.label_trial_requires_card")}
                  checked={form.trial_requires_card}
                  onChange={(v) => updateForm("trial_requires_card", v)}
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════
             SECTION: Stripe Integration
             ═══════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <h2 className="text-base font-semibold text-gray-900 pb-3 border-b border-gray-100">
              {t("superadmin.billing.section_stripe")}
            </h2>
            <p className="text-xs text-gray-400 -mt-2">{t("superadmin.billing.hint_stripe")}</p>

            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <Label>{t("superadmin.billing.label_stripe_product_id")}</Label>
                <Input
                  value={form.stripe_product_id}
                  onChange={(e) => updateForm("stripe_product_id", e.target.value)}
                  placeholder="prod_xxx"
                />
              </div>
              <div>
                <Label>{t("superadmin.billing.label_stripe_monthly_id")}</Label>
                <Input
                  value={form.stripe_price_monthly_id}
                  onChange={(e) => updateForm("stripe_price_monthly_id", e.target.value)}
                  placeholder="price_xxx"
                />
              </div>
              <div>
                <Label>{t("superadmin.billing.label_stripe_yearly_id")}</Label>
                <Input
                  value={form.stripe_price_yearly_id}
                  onChange={(e) => updateForm("stripe_price_yearly_id", e.target.value)}
                  placeholder="price_xxx"
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════
             SECTION: Features
             ═══════════════════════════════════ */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{t("superadmin.billing.section_features")}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t("superadmin.billing.features_count_desc", { count: features.length })}
                </p>
              </div>
              <button
                type="button"
                onClick={addFeature}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-lg"
                style={{ backgroundColor: MAROON }}
              >
                <Plus className="w-3.5 h-3.5" /> {t("superadmin.billing.add_feature")}
              </button>
            </div>

            {features.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400 mb-3">{t("superadmin.billing.no_features_yet")}</p>
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-sm font-medium hover:underline"
                  style={{ color: MAROON }}
                >
                  {t("superadmin.billing.add_first_feature")}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {features.map((feat, idx) => (
                  <div
                    key={feat._key}
                    className="relative bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      title={t("superadmin.billing.remove_feature")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid md:grid-cols-3 gap-4 pr-8">
                      {/* Name */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">{t("superadmin.billing.feature_label_name")} *</label>
                        <Input
                          value={feat.name}
                          onChange={(e) => updateFeature(idx, "name", e.target.value)}
                          placeholder={t("superadmin.billing.feature_placeholder_name")}
                        />
                        <FieldError error={fieldErrors[`feature_${idx}_name`]} />
                      </div>

                      {/* Code */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">{t("superadmin.billing.feature_label_code")} *</label>
                        <Select
                          value={feat.code}
                          disabled={!featureOptions.length}
                          onChange={(e) => {
                            const selected = featureOptions.find(
                              f => f.code === e.target.value
                            );
                            if (!selected) {
                              updateFeature(idx, "code", "");
                              return;
                            }
                            updateFeature(idx, "code", selected.code);
                            updateFeature(idx, "name", selected.name);
                            updateFeature(idx, "category", selected.category);
                            updateFeature(idx, "feature_type", selected.type);
                          }}
                        >
                          <option value="">{t("superadmin.billing.feature_select_placeholder")}</option>
                          {featureOptions.map((opt) => (
                            <option key={opt.code} value={opt.code}>
                              {opt.name}
                            </option>
                          ))}
                        </Select>
                        <FieldError error={fieldErrors[`feature_${idx}_code`]} />
                      </div>

                      {/* Category */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">{t("superadmin.billing.feature_label_category")}</label>
                        <Select
                          value={feat.category}
                          onChange={(e) => updateFeature(idx, "category", e.target.value)}
                        >
                          {CATEGORY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-4 mt-3">
                      {/* Type */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">{t("superadmin.billing.feature_label_type")}</label>
                        <Select
                          value={feat.feature_type}
                          onChange={(e) => updateFeature(idx, "feature_type", e.target.value)}
                        >
                          {FEATURE_TYPE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </Select>
                      </div>

                      {/* Included (for boolean) */}
                      <div className="flex items-end pb-2">
                        <Checkbox
                          label={t("superadmin.billing.feature_label_included")}
                          checked={feat.is_included}
                          onChange={(v) => updateFeature(idx, "is_included", v)}
                        />
                      </div>

                      {/* Limit value (for limit type) */}
                      {feat.feature_type === "limit" && (
                        <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">{t("superadmin.billing.feature_label_limit")}</label>
                          <Input
                            type="number"
                            min="0"
                            value={feat.limit_value}
                            onChange={(e) => updateFeature(idx, "limit_value", e.target.value)}
                            placeholder={t("superadmin.billing.feature_placeholder_limit")}
                          />
                          <FieldError error={fieldErrors[`feature_${idx}_limit`]} />
                        </div>
                      )}

                      {/* Display override */}
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1 block">{t("superadmin.billing.feature_label_display")}</label>
                        <Input
                          value={feat.display_value}
                          onChange={(e) => updateFeature(idx, "display_value", e.target.value)}
                          placeholder={t("superadmin.billing.feature_placeholder_display")}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════
             ACTIONS
             ═══════════════════════════════════ */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => router.push("/superadmin/billing")}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors"
              style={{ backgroundColor: MAROON }}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? t("superadmin.billing.update_plan") : t("superadmin.billing.create_plan")}
            </button>
          </div>
        </form>
      </SuperAdminLayout>
    </div>
  );
}