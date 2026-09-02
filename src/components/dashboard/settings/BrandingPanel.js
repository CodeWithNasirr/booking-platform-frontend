"use client";

/**
 * BrandingPanel — Custom Branding (Phase 6).
 *
 * Manage the storefront brand in one place: logo, favicon, theme colors, fonts,
 * corner radius, and the white-label "Powered by" toggle. Reads/writes the
 * gated /api/v1/website/branding/ API. Basic theming is available to every
 * tenant admin; the white-label toggle is gated by the custom_branding plan
 * feature (the API returns `can_white_label`, and we surface an upgrade hint).
 */

import { useState, useEffect, useCallback } from "react";
import { Loader2, Check, Upload, Trash2, Image as ImageIcon, Lock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import {
  getBranding, updateBranding,
  uploadBrandingLogo, deleteBrandingLogo,
  uploadBrandingFavicon, deleteBrandingFavicon,
} from "@/lib/brandingApi";

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RADII = ["0", "4px", "8px", "12px", "16px", "9999px"];
const COLOR_FIELDS = [
  ["primary_color", "branding.colors.primary"],
  ["secondary_color", "branding.colors.secondary"],
  ["accent_color", "branding.colors.accent"],
  ["background_color", "branding.colors.background"],
  ["text_color", "branding.colors.text"],
];

export default function BrandingPanel() {
  const { t, activeTenant } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);       // full server payload
  const [theme, setTheme] = useState({});        // editable theme
  const [hideBrand, setHideBrand] = useState(false);

  const load = useCallback(async () => {
    if (!activeTenant) return;
    setLoading(true);
    setError("");
    try {
      const res = await getBranding(activeTenant);
      setData(res);
      setTheme(res.theme || {});
      setHideBrand(!!res.hide_platform_branding);
    } catch (e) {
      setError(e?.detail || t("branding.loadError"));
    } finally {
      setLoading(false);
    }
  }, [activeTenant, t]);

  useEffect(() => { load(); }, [load]);

  const setField = (k, v) => {
    setTheme((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const invalidColors = COLOR_FIELDS
    .filter(([k]) => theme[k] && !HEX_RE.test(theme[k]))
    .map(([k]) => k);

  const save = async () => {
    if (invalidColors.length) {
      setError(t("branding.invalidColor"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { ...theme, hide_platform_branding: hideBrand };
      const res = await updateBranding(activeTenant, payload);
      setData(res);
      setTheme(res.theme || {});
      setHideBrand(!!res.hide_platform_branding);
      setSaved(true);
    } catch (e) {
      setError(e?.detail || t("branding.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const onLogo = async (e, kind) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    try {
      if (kind === "logo") await uploadBrandingLogo(activeTenant, file);
      else await uploadBrandingFavicon(activeTenant, file);
      await load();
    } catch (err) {
      setError(err?.detail || t("branding.uploadError"));
    }
  };

  const removeAsset = async (kind) => {
    setError("");
    try {
      if (kind === "logo") await deleteBrandingLogo(activeTenant);
      else await deleteBrandingFavicon(activeTenant);
      await load();
    } catch (err) {
      setError(err?.detail || t("branding.uploadError"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const fonts = data?.available_fonts || [];
  const canWhiteLabel = !!data?.can_white_label;

  return (
    <div className="space-y-8">
      {/* ── Assets ─────────────────────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{t("branding.assets")}</h3>
        <p className="text-xs text-gray-500 mb-4">{t("branding.assetsHint")}</p>
        <div className="grid sm:grid-cols-2 gap-6">
          <AssetTile
            label={t("branding.logo")}
            url={resolveMediaUrl(data?.logo_url)}
            onPick={(e) => onLogo(e, "logo")}
            onRemove={() => removeAsset("logo")}
            t={t}
          />
          <AssetTile
            label={t("branding.favicon")}
            url={resolveMediaUrl(data?.favicon_url)}
            onPick={(e) => onLogo(e, "favicon")}
            onRemove={() => removeAsset("favicon")}
            square
            t={t}
          />
        </div>
      </section>

      {/* ── Colors ─────────────────────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("branding.colors.title")}</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {COLOR_FIELDS.map(([key, labelKey]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{t(labelKey)}</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={HEX_RE.test(theme[key] || "") ? theme[key] : "#000000"}
                  onChange={(e) => setField(key, e.target.value)}
                  className="w-10 h-10 rounded border cursor-pointer p-0"
                  aria-label={t(labelKey)}
                />
                <input
                  type="text"
                  value={theme[key] || ""}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder="#RRGGBB"
                  className={`flex-1 px-3 py-2 border rounded-lg text-sm font-mono ${
                    invalidColors.includes(key) ? "border-red-400" : ""
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Typography & shape ─────────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4">{t("branding.typography")}</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <FontSelect
            label={t("branding.bodyFont")}
            value={theme.font_family || ""}
            fonts={fonts}
            onChange={(v) => setField("font_family", v)}
            t={t}
          />
          <FontSelect
            label={t("branding.headingFont")}
            value={theme.heading_font_family || ""}
            fonts={fonts}
            onChange={(v) => setField("heading_font_family", v)}
            t={t}
          />
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("branding.radius")}</label>
            <select
              value={theme.border_radius || ""}
              onChange={(e) => setField("border_radius", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">{t("branding.default")}</option>
              {RADII.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ── Live preview ───────────────────────────────────────── */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-3">{t("branding.preview")}</h3>
        <div
          className="rounded-xl border p-6"
          style={{
            background: theme.background_color || "#fff",
            color: theme.text_color || "#111827",
            fontFamily: theme.font_family ? `'${theme.font_family}', sans-serif` : undefined,
          }}
        >
          <p
            className="text-xl font-bold mb-2"
            style={{
              color: theme.primary_color || "#111827",
              fontFamily: theme.heading_font_family ? `'${theme.heading_font_family}', sans-serif` : undefined,
            }}
          >
            {t("branding.previewHeading")}
          </p>
          <p className="text-sm mb-4 opacity-80">{t("branding.previewBody")}</p>
          <div className="flex gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-white"
              style={{
                background: theme.primary_color || "#8B1E3F",
                borderRadius: theme.border_radius || "8px",
              }}
            >
              {t("branding.previewPrimary")}
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium"
              style={{
                background: "transparent",
                color: theme.secondary_color || "#10B981",
                border: `1px solid ${theme.secondary_color || "#10B981"}`,
                borderRadius: theme.border_radius || "8px",
              }}
            >
              {t("branding.previewSecondary")}
            </button>
          </div>
        </div>
      </section>

      {/* ── White-label ────────────────────────────────────────── */}
      <section className="rounded-xl border p-4 bg-gray-50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">{t("branding.whiteLabel")}</h3>
              {!canWhiteLabel && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> {t("branding.upgrade")}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("branding.whiteLabelHint")}</p>
          </div>
          <button
            type="button"
            disabled={!canWhiteLabel}
            onClick={() => { setHideBrand((v) => !v); setSaved(false); }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
              hideBrand && canWhiteLabel ? "bg-[#8B1E3F]" : "bg-gray-300"
            } ${!canWhiteLabel ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-pressed={hideBrand}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              hideBrand && canWhiteLabel ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B1E3F] text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {t("branding.save")}
        </button>
        {saved && <span className="text-sm text-green-600 flex items-center gap-1"><Check className="w-4 h-4" /> {t("branding.saved")}</span>}
      </div>
    </div>
  );
}

function AssetTile({ label, url, onPick, onRemove, square, t }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex items-center gap-4">
        <div className={`border bg-white flex items-center justify-center overflow-hidden ${square ? "w-16 h-16 rounded-lg" : "w-28 h-16 rounded-lg"}`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} className="w-full h-full object-contain" />
          ) : (
            <ImageIcon className="w-6 h-6 text-gray-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm cursor-pointer hover:bg-gray-50 w-fit">
            <Upload className="w-4 h-4" />
            {url ? t("branding.replace") : t("branding.upload")}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon" className="hidden" onChange={onPick} />
          </label>
          {url && (
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 w-fit">
              <Trash2 className="w-3.5 h-3.5" /> {t("branding.remove")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FontSelect({ label, value, fonts, onChange, t }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
      >
        <option value="">{t("branding.default")}</option>
        {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
  );
}
