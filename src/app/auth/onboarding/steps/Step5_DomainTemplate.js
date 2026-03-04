"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import {
  Check,
  Link2,
  Globe,
  Layout,
  ExternalLink,
  Grid,
} from "lucide-react";
import { resolveTranslated } from "@/app/tenant-site/templates/utils/lang";
import { useApp } from "@/contexts/AppContext";

export default function Step5_DomainTemplate({ formData, update }) {
  const { t, language, isRTL } = useApp();

  const [mode, setMode] = useState(
    formData.hasDomain ? "has_domain" : "no_domain"
  );
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  /* ---------------- FETCH TEMPLATES ---------------- */
  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await axios.get("/api/v1/website/templates/");
        setTemplates(res.data.results || res.data || []);
      } catch (err) {
        console.error("Template fetch error:", err);
      } finally {
        setLoadingTemplates(false);
      }
    }
    fetchTemplates();
  }, []);

  useEffect(() => {
    if (formData.selectedTemplate) {
      fetchTemplateDetails(formData.selectedTemplate);
    }
  }, [formData.selectedTemplate, language]);

  async function fetchTemplateDetails(slug) {
    try {
      const res = await axios.get(`/api/v1/website/templates/${slug}/`);
      setSelectedTemplate(res.data);
    } catch (err) {
      console.error("Failed to load template details:", err);
    }
  }

  const inputBase =
    "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm " +
    "text-foreground placeholder:text-foreground/50 " +
    "focus:outline-none focus:ring-2 focus:ring-ring";

  /* ---------------- DOMAIN TYPE ---------------- */
  const handleDomainSelect = (type) => {
    setMode(type);
    update("hasDomain", type === "has_domain");
    if (type === "no_domain") update("customDomain", "");
  };

  function normalizeI18n(value) {
    if (!value) return "";
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value.replace(/'/g, '"'));
    } catch {
      return value;
    }
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("onboarding.step5.title")}
        </h3>
        <p className="text-foreground/70 text-sm">
          {t("onboarding.step5.subtitle")}
        </p>
      </div>

      {/* DOMAIN TYPE */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          {t("onboarding.step5.domainLabel")}{" "}
          <span className="text-foreground/40">
            ({t("onboarding.step5.optional")})
          </span>
        </label>

        <div
          className={`flex rounded-xl overflow-hidden border border-border bg-secondary ${
            isRTL ? "flex-row-reverse" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => handleDomainSelect("has_domain")}
            className={`flex-1 py-3 text-sm flex items-center justify-center gap-2 transition
              ${
                mode === "has_domain"
                  ? "bg-background text-foreground"
                  : "text-foreground/50"
              }`}
          >
            <Link2 className="w-4 h-4" />
            {t("onboarding.step5.hasDomain")}
          </button>

          <button
            type="button"
            onClick={() => handleDomainSelect("no_domain")}
            className={`flex-1 py-3 text-sm flex items-center justify-center gap-2 transition
              ${
                mode === "no_domain"
                  ? "bg-background text-foreground"
                  : "text-foreground/50"
              }`}
          >
            <Globe className="w-4 h-4" />
            {t("onboarding.step5.noDomain")}
          </button>
        </div>

        {mode === "has_domain" && (
          <div className="mt-4">
            <input
              className={inputBase}
              placeholder={t("onboarding.step5.domainPlaceholder")}
              value={formData.customDomain}
              onChange={(e) => update("customDomain", e.target.value)}
            />
            <p className="text-xs text-foreground/50 mt-1">
              {t("onboarding.step5.domainHint")}
            </p>
          </div>
        )}

        {mode === "no_domain" && (
          <div className="mt-4 space-y-1">
            <label className="text-sm font-medium text-foreground">
              {t("onboarding.step5.subdomainLabel")} *
            </label>

            <div className="flex items-center gap-2">
              <input
                className={`${inputBase} flex-1`}
                placeholder={t("onboarding.step5.subdomainPlaceholder")}
                value={formData.subdomain}
                onChange={(e) =>
                  update(
                    "subdomain",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                  )
                }
              />
              <span className="text-sm text-foreground/60">
                .bookingpro.app
              </span>
            </div>

            {formData.subdomain && (
              <p className="text-sm text-foreground/60">
                {t("onboarding.step5.sitePreview")}{" "}
                <span className="text-primary font-medium">
                  https://{formData.subdomain}.bookingpro.app
                </span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* TEMPLATE SELECTION */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-foreground">
          {t("onboarding.step5.templateLabel")} *
        </label>

        {loadingTemplates && (
          <p className="text-xs text-foreground/50">
            {t("common.loading")}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const isSelected = formData.selectedTemplate === tpl.slug;

            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => update("selectedTemplate", tpl.slug)}
                className={`flex flex-col p-4 rounded-2xl border-2 text-left transition
                  ${
                    isSelected
                      ? "border-primary bg-accent shadow-md"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
              >
                <div className="h-28 rounded-xl bg-secondary mb-3 overflow-hidden">
                  {tpl.preview_url ? (
                    <img
                      src={tpl.preview_url}
                      className="w-full h-full object-cover"
                      alt={resolveTranslated(tpl.name, language)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Layout className="w-8 h-8 text-foreground/40" />
                    </div>
                  )}
                </div>

                <h4 className="font-medium text-foreground">
                  {resolveTranslated(tpl.name, language)}
                </h4>

                <p className="text-xs text-foreground/60 mb-2 line-clamp-2">
                  {resolveTranslated(tpl.description, language)}
                </p>

                <div className="flex items-center gap-2 text-xs text-foreground/50">
                  <Grid className="w-3 h-3" />
                  {tpl.layouts_count} {t("onboarding.step5.layouts")}
                </div>

                {isSelected && (
                  <div className="flex items-center gap-1 text-primary text-xs font-medium mt-2">
                    <Check className="w-4 h-4" />
                    {t("common.selected")}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* LAYOUT SELECTION */}
      {selectedTemplate && (
        <div className="space-y-4 p-6 bg-secondary rounded-2xl">
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-1">
              {t("onboarding.step5.layoutTitle")}
            </h4>
            <p className="text-sm text-foreground/70">
              {t("onboarding.step5.layoutSubtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {selectedTemplate.layouts?.map((layout) => {
              const nameI18n = normalizeI18n(layout.layout_name);
              const descI18n = normalizeI18n(layout.description);
              const isSelected =
                formData.selectedLayout === layout.layout_id;

              return (
                <div
                  key={layout.layout_id}
                  className={`p-4 rounded-xl border-2 transition bg-background
                    ${
                      isSelected
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="flex justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-semibold text-foreground">
                        {resolveTranslated(nameI18n, language)}
                      </h5>
                      <p className="text-xs text-foreground/60">
                        {resolveTranslated(descI18n, language)}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        update("selectedLayout", layout.layout_id)
                      }
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-accent"
                        }`}
                    >
                      {isSelected
                        ? t("common.selected")
                        : t("common.select")}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          `/tenant-site/templates/${selectedTemplate.slug}/layouts/${layout.layout_id}`,
                          "_blank"
                        )
                      }
                      className="px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
