"use client";

/**
 * MySubscriptionsClient — Customer-facing subscription management.
 *
 * Auth mirrors MyOrders / MyBookings: prefer customer_token (JWT) from
 * localStorage, fall back to X-Order-Token for guest customers who
 * verified via email link.
 *
 * Actions: pause / resume / cancel — each hits the matching action on
 * /api/v1/customer-subscriptions/{id}/{action}/
 */

import { useState, useEffect, useCallback } from "react";
import LayoutRenderer from "../LayoutRenderer";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated } from "../utils/resolveTranslated";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const STATUS_STYLE = {
  active: "bg-green-100 text-green-700",
  paused: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-gray-200 text-gray-600",
  expired: "bg-red-100 text-red-700",
};

function resolveToken() {
  if (typeof window === "undefined") return { token: null, type: null };
  const jwt = localStorage.getItem("customer_token");
  if (jwt) return { token: jwt, type: "jwt" };

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("customer_order_token_")) {
      const guest = localStorage.getItem(key);
      if (guest) return { token: guest, type: "guest" };
    }
  }
  return { token: null, type: null };
}

function authHeaders(domain, { token, type }) {
  const h = { "Content-Type": "application/json" };
  if (domain) h["X-Tenant"] = domain;
  if (!token) return h;
  if (type === "guest") h["X-Order-Token"] = token;
  else h["Authorization"] = `Bearer ${token}`;
  return h;
}

export default function MySubscriptionsClient({ domain, site, header, footer }) {
  const { language: lang } = useTenantLang();

  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasToken, setHasToken] = useState(false);
  const [acting, setActing] = useState(null);

  const fetchSubs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const auth = resolveToken();
      if (!auth.token) {
        setHasToken(false);
        setLoading(false);
        return;
      }
      setHasToken(true);

      const res = await fetch(
        `${API_BASE}/api/v1/customer-subscriptions/by-email/`,
        {
          headers: authHeaders(domain, auth),
          credentials: "include",
        }
      );
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setHasToken(false);
          setLoading(false);
          return;
        }
        throw new Error(String(res.status));
      }
      const data = await res.json();
      setSubs(data.subscriptions || data.results || []);
    } catch {
      setError(
        resolveTranslated(
          {
            en: "Failed to load your subscriptions.",
            ar: "فشل تحميل اشتراكاتك.",
            ur: "آپ کی سبسکرپشنز لوڈ کرنے میں ناکامی۔",
          },
          lang
        )
      );
    } finally {
      setLoading(false);
    }
  }, [domain, lang]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const doAction = useCallback(
    async (id, action) => {
      setActing(id + ":" + action);
      try {
        const auth = resolveToken();
        const res = await fetch(
          `${API_BASE}/api/v1/customer-subscriptions/${id}/${action}/`,
          { method: "POST", headers: authHeaders(domain, auth), credentials: "include" }
        );
        if (!res.ok) throw new Error(String(res.status));
        await fetchSubs();
      } catch {
        // Inline alerts are loud; keep silent — UI will reflect actual server state on refresh.
      } finally {
        setActing(null);
      }
    },
    [domain, fetchSubs]
  );

  const headerSection = header ? [header] : [];
  const footerSection = footer ? [footer] : [];

  return (
    <>
      {headerSection.length > 0 && <LayoutRenderer sections={headerSection} site={site} />}

      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {resolveTranslated(
              { en: "My Subscriptions", ar: "اشتراكاتي", ur: "میری سبسکرپشنز" },
              lang
            )}
          </h1>

          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin h-8 w-8 border-b-2 border-gray-900 rounded-full" />
            </div>
          )}

          {!loading && error && (
            <div className="text-center py-10">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchSubs}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl"
              >
                {resolveTranslated(
                  { en: "Try Again", ar: "حاول مرة أخرى", ur: "دوبارہ کوشش کریں" },
                  lang
                )}
              </button>
            </div>
          )}

          {!loading && !error && !hasToken && (
            <EmptyAuthState lang={lang} />
          )}

          {!loading && !error && hasToken && subs.length === 0 && (
            <EmptyListState lang={lang} />
          )}

          {!loading && !error && hasToken && subs.length > 0 && (
            <ul className="space-y-3">
              {subs.map((s) => (
                <SubscriptionCard
                  key={s.id}
                  sub={s}
                  lang={lang}
                  acting={acting}
                  onPause={() => doAction(s.id, "pause")}
                  onResume={() => doAction(s.id, "resume")}
                  onCancel={() => doAction(s.id, "cancel")}
                />
              ))}
            </ul>
          )}
        </div>
      </main>

      {footerSection.length > 0 && <LayoutRenderer sections={footerSection} site={site} />}
    </>
  );
}

function SubscriptionCard({ sub, lang, acting, onPause, onResume, onCancel }) {
  const t = (en, ar, ur) => resolveTranslated({ en, ar, ur }, lang);
  const isActive = sub.status === "active";
  const isPaused = sub.status === "paused";
  const isTerminal = ["cancelled", "expired"].includes(sub.status);
  const acting_pause = acting === sub.id + ":pause";
  const acting_resume = acting === sub.id + ":resume";
  const acting_cancel = acting === sub.id + ":cancel";

  return (
    <li className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{sub.service_name}</p>
          <p className="text-sm text-gray-500">
            {sub.billing_interval === "monthly"
              ? t("Monthly", "شهري", "ماہانہ")
              : t("Yearly", "سنوي", "سالانہ")}{" "}
            · {sub.currency} {Number(sub.price).toFixed(2)}
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
            STATUS_STYLE[sub.status] || "bg-gray-100 text-gray-600"
          }`}
        >
          {sub.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
        <Row label={t("Started", "بدأ", "شروع")} value={sub.start_date} />
        <Row
          label={t("Next billing", "الفوترة التالية", "اگلی بلنگ")}
          value={isTerminal ? "—" : sub.next_billing_date}
        />
      </div>

      {!isTerminal && (
        <div className="flex flex-wrap gap-2 mt-5">
          {isActive && (
            <ActionButton
              onClick={onPause}
              disabled={acting_pause}
              variant="secondary"
              label={t("Pause", "إيقاف مؤقت", "روکیں")}
            />
          )}
          {isPaused && (
            <ActionButton
              onClick={onResume}
              disabled={acting_resume}
              variant="primary"
              label={t("Resume", "استئناف", "دوبارہ شروع کریں")}
            />
          )}
          <ActionButton
            onClick={onCancel}
            disabled={acting_cancel}
            variant="danger"
            label={t("Cancel", "إلغاء", "منسوخ کریں")}
          />
        </div>
      )}
    </li>
  );
}

function Row({ label, value }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value || "—"}</p>
    </div>
  );
}

function ActionButton({ onClick, disabled, variant, label }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:opacity-90",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${variants[variant]}`}
    >
      {label}
    </button>
  );
}

function EmptyAuthState({ lang }) {
  const t = (en, ar, ur) => resolveTranslated({ en, ar, ur }, lang);
  return (
    <div className="text-center py-16 text-gray-600">
      <p className="text-lg font-medium mb-2">
        {t("Sign in to view your subscriptions", "سجّل الدخول لعرض اشتراكاتك", "سبسکرپشنز دیکھنے کے لیے سائن ان کریں")}
      </p>
      <p className="text-sm">
        {t(
          "You'll receive an email with a link the first time you subscribe.",
          "ستتلقى رابطًا بالبريد الإلكتروني عند اشتراكك لأول مرة.",
          "پہلی بار سبسکرائب کرنے پر آپ کو ای میل کا لنک ملے گا۔"
        )}
      </p>
    </div>
  );
}

function EmptyListState({ lang }) {
  const t = (en, ar, ur) => resolveTranslated({ en, ar, ur }, lang);
  return (
    <div className="text-center py-16 text-gray-500">
      <div className="text-4xl mb-2">🔁</div>
      <p>{t("No subscriptions yet.", "لا توجد اشتراكات بعد.", "ابھی کوئی سبسکرپشن نہیں۔")}</p>
    </div>
  );
}
