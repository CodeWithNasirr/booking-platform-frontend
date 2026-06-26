"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/t";
import {
  Mail,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Edit,
  ToggleLeft,
  ToggleRight,
  Send,
  Clock,
  XCircle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
  Activity,
  Code,
  Inbox,
  Copy,
  Braces,
  MousePointerClick,
  Lightbulb,
  Hash,
} from "lucide-react";
import SuperAdminLayout from "@/components/superadmin/SuperAdminLayout";
import {
  fetchEmailTemplates,
  updateEmailTemplate,
  previewEmailTemplate,
  fetchNotificationLogs,
} from "@/lib/platformApi";

/* ────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────── */

const MAROON = "#800020";

function StatusBadge({ status, t }) {
  const LOG_STATUS = {
    queued:    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   icon: Clock,      label: t("superadmin.billing.log_status_queued") },
    sent:      { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle, label: t("superadmin.billing.log_status_sent") },
    delivered: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    icon: CheckCircle, label: t("superadmin.billing.log_status_delivered") },
    failed:    { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     icon: XCircle,    label: t("superadmin.billing.log_status_failed") },
    bounced:   { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    icon: XCircle,    label: t("superadmin.billing.log_status_bounced") },
  };

  const s = LOG_STATUS[status] || { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function CategoryBadge({ eventCode, t }) {
  const CATEGORY_MAP = {
    booking:  { label: t("superadmin.billing.cat_booking"),  color: "bg-blue-50 text-blue-700" },
    order:    { label: t("superadmin.billing.cat_order"),    color: "bg-purple-50 text-purple-700" },
    billing:  { label: t("superadmin.billing.cat_billing"),   color: "bg-amber-50 text-amber-700" },
    platform: { label: t("superadmin.billing.cat_platform"),  color: "bg-gray-100 text-gray-700" },
    ticket:   { label: t("superadmin.billing.cat_ticket"),   color: "bg-teal-50 text-teal-700" },
    document: { label: t("superadmin.billing.cat_document"), color: "bg-indigo-50 text-indigo-700" },
    payment:  { label: t("superadmin.billing.cat_payment"),  color: "bg-emerald-50 text-emerald-700" },
    dunning:  { label: t("superadmin.billing.cat_dunning"),  color: "bg-red-50 text-red-700" },
    tenant:   { label: t("superadmin.billing.cat_tenant"),   color: "bg-cyan-50 text-cyan-700" },
    invoice:  { label: t("superadmin.billing.cat_invoice"),  color: "bg-orange-50 text-orange-700" },
    provider: { label: t("superadmin.billing.cat_provider"), color: "bg-pink-50 text-pink-700" },
    subscription: { label: t("superadmin.billing.cat_subscription"), color: "bg-violet-50 text-violet-700" },
  };

  const prefix = (eventCode || "").split("_")[0];
  const cat = CATEGORY_MAP[prefix] || { label: t("superadmin.billing.cat_other"), color: "bg-gray-50 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${cat.color}`}>
      {cat.label}
    </span>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
        active
          ? "border-[#800020] text-[#800020]"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count != null && (
        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
          active ? "bg-[#800020]/10 text-[#800020]" : "bg-gray-100 text-gray-500"
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function formatDateShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function humanizeEventCode(code) {
  return (code || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ────────────────────────────────────────────
   Variable Chip — click-to-insert
   ──────────────────────────────────────────── */

function VariableChip({ variable, onInsert, onCopy, t }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e) {
    e.stopPropagation();
    const text = `{{ ${variable.key} }}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      onCopy?.();
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  return (
    <div
      className="group flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-gray-200 hover:border-[#800020]/40 hover:bg-[#800020]/[0.02] cursor-pointer transition-all"
      onClick={() => onInsert(variable.key)}
      title={t("superadmin.billing.variable_click_insert", { key: variable.key })}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <code className="text-xs font-semibold text-[#800020] bg-[#800020]/5 px-1.5 py-0.5 rounded">
            {`{{ ${variable.key} }}`}
          </code>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-gray-500 truncate">{variable.label}</span>
          <span className="text-[10px] text-gray-400 italic hidden sm:inline truncate">
            {t("superadmin.billing.variable_example_prefix")} {variable.example}
          </span>
        </div>
      </div>
      <button
        onClick={handleCopy}
        className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-all shrink-0"
        title={t("superadmin.billing.copy_to_clipboard")}
      >
        {copied
          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          : <Copy className="w-3.5 h-3.5 text-gray-400" />
        }
      </button>
    </div>
  );
}

async function copyText(text) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  } catch (err) {
    console.error("Copy failed", err);
  }
}

/* ────────────────────────────────────────────
   Variable Sidebar Panel
   ──────────────────────────────────────────── */

function VariableSidebar({ variables, variablesGrouped, conditionals, onInsert, activeField, t }) {
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showConditionals, setShowConditionals] = useState(false);

  useEffect(() => {
    if (variablesGrouped) {
      const all = {};
      Object.keys(variablesGrouped).forEach((k) => { all[k] = true; });
      setExpandedGroups(all);
    }
  }, [variablesGrouped]);

  function toggleGroup(group) {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  }

  const filteredGrouped = {};
  if (variablesGrouped) {
    Object.entries(variablesGrouped).forEach(([group, vars]) => {
      const filtered = vars.filter((v) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return v.key.includes(q) || v.label.toLowerCase().includes(q);
      });
      if (filtered.length > 0) {
        filteredGrouped[group] = filtered;
      }
    });
  }

  const totalVars = variables?.length || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-[#800020]/10 flex items-center justify-center">
            <Braces className="w-4 h-4 text-[#800020]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">{t("superadmin.billing.variables_title")}</h4>
            <p className="text-[10px] text-gray-400">{t("superadmin.billing.variables_count", { count: totalVars })}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("superadmin.billing.variables_search_placeholder")}
            className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>

        {/* Active field indicator */}
        {activeField && (
          <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded bg-[#800020]/5">
            <MousePointerClick className="w-3 h-3 text-[#800020]" />
            <span className="text-[10px] font-medium text-[#800020]">
              {t("superadmin.billing.inserting_into")}: {activeField === "subject" ? t("superadmin.billing.field_subject") : activeField === "bodyHtml" ? t("superadmin.billing.field_html_body") : t("superadmin.billing.field_plaintext")}
            </span>
          </div>
        )}
      </div>

      {/* Variable groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {Object.keys(filteredGrouped).length === 0 ? (
          <div className="text-center py-8">
            <Hash className="w-6 h-6 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">
              {search ? t("superadmin.billing.no_matching_variables") : t("superadmin.billing.no_variables_for_event")}
            </p>
          </div>
        ) : (
          Object.entries(filteredGrouped).map(([group, vars]) => (
            <div key={group}>
              <button
                onClick={() => toggleGroup(group)}
                className="w-full flex items-center justify-between py-1.5 px-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                <span>{group}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">
                    {vars.length}
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${expandedGroups[group] ? "rotate-90" : ""}`} />
                </div>
              </button>
              {expandedGroups[group] && (
                <div className="space-y-1 mb-2">
                  {vars.map((v) => (
                    <VariableChip
                      key={v.key}
                      variable={v}
                      onInsert={onInsert}
                      onCopy={() => {}}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Conditional syntax section */}
      <div className="px-3 pb-3 border-t border-gray-100 pt-2 shrink-0">
        <button
          onClick={() => setShowConditionals(!showConditionals)}
          className="w-full flex items-center justify-between py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800"
        >
          <div className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>{t("superadmin.billing.conditional_syntax")}</span>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showConditionals ? "rotate-180" : ""}`} />
        </button>

        {showConditionals && conditionals?.length > 0 && (
          <div className="mt-1.5 space-y-2">
            {conditionals.map((cond, i) => (
              <div key={i} className="rounded-lg border border-gray-100 bg-gray-50/50 p-2">
                <p className="text-[10px] font-medium text-gray-600 mb-1">{cond.label}</p>
                <code className="text-[10px] text-gray-500 block break-all leading-relaxed font-mono">
                  {cond.code}
                </code>
                <button
                  onClick={() => copyText(cond.code)}
                  className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#800020] hover:underline"
                >
                  <Copy className="w-2.5 h-2.5" /> {t("superadmin.billing.copy")}
                </button>
              </div>
            ))}

            <div className="px-2 py-1.5 bg-blue-50/50 rounded text-[10px] text-blue-600 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: t("superadmin.billing.variable_tip"),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Edit Template Modal (Enhanced)
   ──────────────────────────────────────────── */

function EditModal({ template, onClose, onSave, saving, t }) {
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [previewSubject, setPreviewSubject] = useState(null);

  const [variables, setVariables] = useState([]);
  const [variablesGrouped, setVariablesGrouped] = useState({});
  const [conditionals, setConditionals] = useState([]);
  const [varsLoading, setVarsLoading] = useState(false);

  const [activeField, setActiveField] = useState("bodyHtml");
  const subjectRef = useRef(null);
  const bodyHtmlRef = useRef(null);
  const bodyTextRef = useRef(null);

  useEffect(() => {
    if (template) {
      setSubject(template.subject || "");
      setBodyHtml(template.body_html || "");
      setBodyText(template.body_text || "");
      setIsActive(template.is_active ?? true);
      setPreviewHtml(null);
      setPreviewSubject(null);

      if (template.variables) {
        setVariables(template.variables);
        setVariablesGrouped(template.variables_grouped || {});
        setConditionals(template.conditionals || []);
      } else {
        loadVariables(template.event_code);
      }
    }
  }, [template]);

  async function loadVariables(eventCode) {
    setVarsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/templates/${eventCode}/variables/`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVariables(data.variables || []);
      setVariablesGrouped(data.variables_grouped || {});
      setConditionals(data.conditionals || []);
    } catch {
      setVariables([]);
      setVariablesGrouped({});
    } finally {
      setVarsLoading(false);
    }
  }

  function insertVariable(key) {
    const tag = `{{ ${key} }}`;
    const fieldMap = {
      subject: { ref: subjectRef, value: subject, setter: setSubject },
      bodyHtml: { ref: bodyHtmlRef, value: bodyHtml, setter: setBodyHtml },
      bodyText: { ref: bodyTextRef, value: bodyText, setter: setBodyText },
    };

    const field = fieldMap[activeField] || fieldMap.bodyHtml;
    const el = field.ref.current;

    if (el) {
      const start = el.selectionStart ?? field.value.length;
      const end = el.selectionEnd ?? start;
      const before = field.value.substring(0, start);
      const after = field.value.substring(end);
      const newValue = before + tag + after;
      field.setter(newValue);

      requestAnimationFrame(() => {
        el.focus();
        const newPos = start + tag.length;
        el.setSelectionRange(newPos, newPos);
      });
    } else {
      field.setter(field.value + tag);
    }
  }

  async function handlePreview() {
    setPreviewing(true);
    try {
      const data = await previewEmailTemplate(template.event_code);
      setPreviewHtml(data.body_html);
      setPreviewSubject(data.subject);
    } catch {
      setPreviewHtml("<p style='color:red'>" + t("superadmin.billing.preview_failed") + "</p>");
    } finally {
      setPreviewing(false);
    }
  }

  function handleSave() {
    onSave({
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      is_active: isActive,
    });
  }

  if (!template) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[3vh] overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[1100px] flex flex-col max-h-[94vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("superadmin.billing.edit_template_title")}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <CategoryBadge eventCode={template.event_code} t={t} />
              <code className="text-xs text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                {template.event_code}
              </code>
              {variables.length > 0 && (
                <span className="text-[10px] text-gray-400">
                  · {t("superadmin.billing.variable_count_label", { count: variables.length })}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body: two-column layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* ── Left: Editor ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-w-0">

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{t("superadmin.billing.template_active_label")}</span>
              <button
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isActive ? "bg-emerald-500" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("superadmin.billing.subject_line_label")}
              </label>
              <input
                ref={subjectRef}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setActiveField("subject")}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] transition-colors ${
                  activeField === "subject" ? "border-[#800020]/40 bg-[#800020]/[0.01]" : "border-gray-300"
                }`}
                placeholder={t("superadmin.billing.subject_placeholder")}
              />
            </div>

            {/* HTML Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  {t("superadmin.billing.html_body_label")}
                </label>
                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Code className="w-3 h-3" /> HTML + {"{{ variables }}"}
                </span>
              </div>
              <textarea
                ref={bodyHtmlRef}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                onFocus={() => setActiveField("bodyHtml")}
                rows={12}
                className={`w-full rounded-lg border px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] transition-colors ${
                  activeField === "bodyHtml" ? "border-[#800020]/40 bg-[#800020]/[0.01]" : "border-gray-300"
                }`}
                placeholder='<p>Hello {{ customer_name }},</p>'
              />
            </div>

            {/* Plaintext Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("superadmin.billing.plaintext_label")}
                <span className="text-gray-400 font-normal ml-1">({t("common.optional")})</span>
              </label>
              <textarea
                ref={bodyTextRef}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                onFocus={() => setActiveField("bodyText")}
                rows={4}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020] transition-colors ${
                  activeField === "bodyText" ? "border-[#800020]/40 bg-[#800020]/[0.01]" : "border-gray-300"
                }`}
                placeholder="Hello {{ customer_name }},"
              />
            </div>

            {/* Preview */}
            <div>
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {t("superadmin.billing.preview_with_sample")}
              </button>

              {previewHtml && (
                <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-medium text-gray-500">{t("superadmin.billing.preview_label")}</span>
                    </div>
                    {previewSubject && (
                      <p className="text-xs text-gray-700 mt-1 font-medium">
                        {t("superadmin.billing.preview_subject_prefix")}: {previewSubject}
                      </p>
                    )}
                  </div>
                  <div
                    className="p-4 text-sm bg-white"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Variable Sidebar ── */}
          <div className="w-[320px] border-l border-gray-200 bg-gray-50/40 shrink-0 flex flex-col overflow-hidden">
            {varsLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <VariableSidebar
                variables={variables}
                variablesGrouped={variablesGrouped}
                conditionals={conditionals}
                onInsert={insertVariable}
                activeField={activeField}
                t={t}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200 shrink-0">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: MAROON }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("superadmin.billing.save_template")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   Log Detail Modal
   ──────────────────────────────────────────── */

function LogDetailModal({ log, onClose, t }) {
  if (!log) return null;

  const LOG_STATUS = {
    queued:    { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500",   icon: Clock },
    sent:      { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle },
    delivered: { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500",    icon: CheckCircle },
    failed:    { bg: "bg-red-50",     text: "text-red-700",     dot: "bg-red-500",     icon: XCircle },
    bounced:   { bg: "bg-gray-100",   text: "text-gray-600",    dot: "bg-gray-400",    icon: XCircle },
  };

  const s = LOG_STATUS[log.status] || LOG_STATUS.queued;
  const StatusIcon = s.icon || Clock;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{t("superadmin.billing.delivery_details_title")}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center`}>
              <StatusIcon className={`w-5 h-5 ${s.text}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 capitalize">{log.status}</div>
              <div className="text-xs text-gray-400">{formatDate(log.sent_at || log.created_at)}</div>
            </div>
          </div>
          <hr className="border-gray-100" />
          {[
            [t("superadmin.billing.detail_event"), log.event_code],
            [t("superadmin.billing.detail_recipient"), log.recipient_email],
            [t("superadmin.billing.detail_subject"), log.subject],
            [t("superadmin.billing.detail_channel"), log.channel],
            [t("superadmin.billing.detail_sent_at"), formatDate(log.sent_at)],
            [t("superadmin.billing.detail_queued_at"), formatDate(log.created_at)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="text-gray-900 text-right max-w-[60%] truncate">{value || "—"}</span>
            </div>
          ))}
          {log.error_message && (
            <div className="mt-2 p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-medium text-red-700 mb-1">{t("superadmin.billing.detail_error")}</p>
              <p className="text-xs text-red-600 break-words">{log.error_message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════ */

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [tab, setTab] = useState("templates");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateCategory, setTemplateCategory] = useState("all");
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  // Logs
  const [logs, setLogs] = useState([]);
  const [logSearch, setLogSearch] = useState("");
  const [logStatus, setLogStatus] = useState("all");
  const [logEvent, setLogEvent] = useState("all");
  const [viewingLog, setViewingLog] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  /* ── Load ──────────────────────────────── */
  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEmailTemplates();
      setTemplates(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setError(err.message || t("superadmin.billing.toast_load_error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const params = {};
      if (logStatus !== "all") params.status = logStatus;
      if (logEvent !== "all") params.event_code = logEvent;
      if (logSearch) params.email = logSearch;
      const data = await fetchNotificationLogs(params);
      setLogs(Array.isArray(data) ? data : data?.results || []);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [logStatus, logEvent, logSearch]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);
  useEffect(() => { if (tab === "logs") loadLogs(); }, [tab, loadLogs]);

  /* ── When clicking Edit, fetch full template detail with variables ── */
  async function openEditor(tpl) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/notifications/templates/${tpl.event_code}/`
      );
      if (!res.ok) throw new Error();
      const full = await res.json();
      setEditingTemplate(full);
    } catch {
      setEditingTemplate(tpl);
    }
  }

  /* ── Save ──────────────────────────────── */
  async function handleSaveTemplate(data) {
    if (!editingTemplate) return;
    try {
      setSaving(true);
      await updateEmailTemplate(editingTemplate.event_code, data);
      showToast(t("superadmin.billing.toast_template_updated"));
      setEditingTemplate(null);
      loadTemplates();
    } catch (err) {
      showToast(err.message || t("superadmin.billing.toast_save_error"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(tpl) {
    try {
      await updateEmailTemplate(tpl.event_code, { is_active: !tpl.is_active });
      showToast(t("superadmin.billing.toast_template_toggled", {
        name: humanizeEventCode(tpl.event_code),
        status: !tpl.is_active ? t("superadmin.billing.enabled") : t("superadmin.billing.disabled"),
      }));
      loadTemplates();
    } catch (err) {
      showToast(err.message || t("superadmin.billing.toast_toggle_error"), "error");
    }
  }

  /* ── Filter ────────────────────────────── */
  const filteredTemplates = templates.filter((tpl) => {
    if (templateCategory !== "all") {
      const cat = (tpl.event_code || "").split("_")[0];
      if (cat !== templateCategory) return false;
    }
    if (templateSearch) {
      const q = templateSearch.toLowerCase();
      if (
        !(tpl.event_code || "").toLowerCase().includes(q) &&
        !(tpl.subject || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const uniqueCategories = [...new Set(templates.map((t) => (t.event_code || "").split("_")[0]))].sort();
  const activeCount = templates.filter((t) => t.is_active).length;

  /* ── States ────────────────────────────── */
  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: MAROON }} />
          <p className="text-gray-500 text-sm">{t("superadmin.billing.loading_notifications")}</p>
        </div>
      </SuperAdminLayout>
    );
  }

  if (error) {
    return (
      <SuperAdminLayout>
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-gray-700 font-medium">{error}</p>
          <button onClick={loadTemplates} className="px-4 py-2 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: MAROON }}>
            {t("superadmin.billing.retry")}
          </button>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout
      title={t("superadmin.billing.notifications_title")}
      description={t("superadmin.billing.notifications_desc")}
      breadcrumbs={[{ label: t("superadmin.billing.notifications_title") }]}
    >
      <div className="space-y-6">
        {toast && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${toast.type === "error" ? "bg-red-600" : "bg-emerald-600"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("superadmin.billing.email_notifications_title")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("superadmin.billing.templates_summary", { total: templates.length, active: activeCount })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: t("superadmin.billing.stat_templates"), value: templates.length, color: "from-blue-500 to-blue-600" },
            { icon: CheckCircle, label: t("superadmin.billing.stat_active_templates"), value: activeCount, color: "from-emerald-500 to-emerald-600" },
            { icon: Send, label: t("superadmin.billing.stat_sent"), value: logs.filter((l) => l.status === "sent" || l.status === "delivered").length, color: "from-purple-500 to-purple-600" },
            { icon: XCircle, label: t("superadmin.billing.stat_failed"), value: logs.filter((l) => l.status === "failed").length, color: "from-red-500 to-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            <TabButton active={tab === "templates"} onClick={() => setTab("templates")} icon={FileText} label={t("superadmin.billing.tab_templates")} count={templates.length} />
            <TabButton active={tab === "logs"} onClick={() => setTab("logs")} icon={Activity} label={t("superadmin.billing.tab_logs")} />
          </div>
        </div>

        {/* Templates Tab */}
        {tab === "templates" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    placeholder={t("superadmin.billing.search_templates_placeholder")}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
                  />
                </div>
                <select
                  value={templateCategory}
                  onChange={(e) => setTemplateCategory(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30"
                >
                  <option value="all">{t("superadmin.billing.filter_all_categories")}</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      <CategoryBadge eventCode={cat + "_"} t={t} />
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-16">
                  <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {templates.length === 0
                      ? t("superadmin.billing.no_templates_seed")
                      : t("superadmin.billing.no_templates_filter")
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_event")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_subject")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_category")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_vars")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_status")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_updated")}</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_actions")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTemplates.map((tpl) => (
                        <tr key={tpl.event_code} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <code className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded font-medium">
                              {tpl.event_code}
                            </code>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{tpl.subject}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <CategoryBadge eventCode={tpl.event_code} t={t} />
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600">
                              <Braces className="w-3 h-3" />
                              {tpl.variable_count ?? "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              onClick={() => handleToggleActive(tpl)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                tpl.is_active
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                              }`}
                            >
                              {tpl.is_active
                                ? <><ToggleRight className="w-3.5 h-3.5" /> {t("superadmin.billing.status_active")}</>
                                : <><ToggleLeft className="w-3.5 h-3.5" /> {t("superadmin.billing.status_disabled")}</>
                              }
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-500">{formatDateShort(tpl.updated_at)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => openEditor(tpl)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" /> {t("superadmin.billing.edit")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {filteredTemplates.length > 0 && (
                <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
                  {t("superadmin.billing.showing_templates", { filtered: filteredTemplates.length, total: templates.length, plural: templates.length !== 1 ? "s" : "" })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {tab === "logs" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder={t("superadmin.billing.search_logs_placeholder")}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800020]/30 focus:border-[#800020]"
                  />
                </div>
                <select value={logStatus} onChange={(e) => setLogStatus(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#800020]/30">
                  <option value="all">{t("superadmin.billing.filter_all_statuses")}</option>
                  <option value="sent">{t("superadmin.billing.log_status_sent")}</option>
                  <option value="delivered">{t("superadmin.billing.log_status_delivered")}</option>
                  <option value="failed">{t("superadmin.billing.log_status_failed")}</option>
                  <option value="queued">{t("superadmin.billing.log_status_queued")}</option>
                </select>
                <button onClick={loadLogs}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <RefreshCw className={`w-4 h-4 ${logsLoading ? "animate-spin" : ""}`} /> {t("superadmin.billing.refresh")}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {logsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-16">
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">{t("superadmin.billing.no_logs_yet")}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_event")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_recipient")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_subject")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_status")}</th>
                        <th className="px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("superadmin.billing.column_time")}</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <CategoryBadge eventCode={log.event_code} t={t} />
                          </td>
                          <td className="px-5 py-3.5 text-sm text-gray-900">{log.recipient_email}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-700 max-w-xs truncate">{log.subject}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={log.status} t={t} /></td>
                          <td className="px-5 py-3.5 text-xs text-gray-500">{formatDateShort(log.sent_at || log.created_at)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => setViewingLog(log)} className="text-xs font-medium hover:underline" style={{ color: MAROON }}>
                              {t("superadmin.billing.details")}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {editingTemplate && (
          <EditModal
            template={editingTemplate}
            saving={saving}
            onClose={() => setEditingTemplate(null)}
            onSave={handleSaveTemplate}
            t={t}
          />
        )}
        {viewingLog && (
          <LogDetailModal log={viewingLog} onClose={() => setViewingLog(null)} t={t} />
        )}
      </div>
    </SuperAdminLayout>
  );
}