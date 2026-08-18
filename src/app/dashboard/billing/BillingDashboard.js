// src/app/dashboard/billing/BillingDashboard.js
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import {
  fetchBillingDashboard,
  fetchPlans,
  createCheckout,
  openBillingPortal,
  fetchEnterpriseRequest,
  submitEnterpriseRequest,
  cancelEnterpriseRequest,
} from "@/lib/billingApi";
import {
  CreditCard,
  Crown,
  Sparkles,
  Clock,
  CalendarClock,
  Receipt,
  ExternalLink,
  ArrowRight,
  Check,
  X,
  Star,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Package,
  Users,
  Calendar,
  FileText,
  Download,
  Building2,
  Send,
} from "lucide-react";

const isEnterprisePlan = (plan) => plan?.is_custom || plan?.tier === "enterprise";

// Open (non-terminal) enterprise request statuses.
const OPEN_ENTERPRISE_STATUSES = ["pending", "under_review"];

const STATUS_STYLES = {
  active:    "bg-emerald-100 text-emerald-700 border-emerald-200",
  trialing:  "bg-amber-100 text-amber-700 border-amber-200",
  past_due:  "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  expired:   "bg-gray-100 text-gray-600 border-gray-200",
  paid:      "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending:   "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected:  "bg-red-100 text-red-700 border-red-200",
  approved:  "bg-blue-100 text-blue-700 border-blue-200",
};

const STATUS_LABELS = {
  active: "Active", trialing: "Free Trial", past_due: "Past Due",
  cancelled: "Cancelled", expired: "Expired", paid: "Paid",
  pending: "Pending", completed: "Completed", rejected: "Rejected",
  approved: "Approved",
};

export default function BillingDashboard() {
  const { activeTenant, t } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dashboard, setDashboard] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [billingInterval, setBillingInterval] = useState("month");
  const [showPlans, setShowPlans] = useState(false);
  const [expandedSections, setExpandedSections] = useState({ addons: false, history: false });
  const [checkoutBanner, setCheckoutBanner] = useState(null);
  const [enterpriseReq, setEnterpriseReq] = useState(null);
  const [enterprisePlan, setEnterprisePlan] = useState(null); // plan being requested (opens modal)
  const [enterpriseSubmitting, setEnterpriseSubmitting] = useState(false);

  // Check URL for checkout result
  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (checkout === "success") {
      setCheckoutBanner("success");
      const url = new URL(window.location);
      url.searchParams.delete("checkout");
      window.history.replaceState(null, "", url.toString());
      // The subscription is activated server-side by the payment callback +
      // webhook, which may land a moment after this redirect. Poll silently a
      // few times so the UI reflects the new plan without a manual refresh.
      let attempts = 0;
      const poll = () => {
        attempts += 1;
        loadData(true);
        if (attempts < 6) setTimeout(poll, 2500);
      };
      setTimeout(poll, 1500);
    } else if (checkout === "cancelled") {
      setCheckoutBanner("cancelled");
    }
  }, [searchParams]);

  const loadData = useCallback(async (silent = false) => {
    if (!activeTenant) return;
    try {
      if (!silent) setLoading(true);
      const [dashData, plansData, entData] = await Promise.all([
        fetchBillingDashboard(activeTenant),
        fetchPlans(),
        fetchEnterpriseRequest(activeTenant).catch(() => ({ request: null })),
      ]);
      setDashboard(dashData);
      setPlans(plansData);
      setEnterpriseReq(entData?.request || null);
      if (dashData.current_plan?.billing_interval) {
        setBillingInterval(dashData.current_plan.billing_interval);
      }
    } catch (err) {
      console.error("Failed to load billing:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [activeTenant]);

  useEffect(() => { loadData(); }, [loadData]);

  const TIER_ORDER = {
    free: 0,
    starter: 1,
    professional: 2,
    enterprise: 3,
  };

  const handleUpgrade = async (planTier) => {
    const currentTier = dashboard?.current_plan?.tier || "free";
    const isDowngrade =
      (TIER_ORDER[planTier] ?? 0) < (TIER_ORDER[currentTier] ?? 0);

    // Downgrades are scheduled for the next billing cycle.
    if (isDowngrade) {
      const ok = window.confirm(
        `Downgrade to ${planTier}? Your current plan stays active until the end of your ` +
        `billing period, then the downgrade takes effect. You won't be charged now.`
      );

      if (!ok) return;
    }

    setActionLoading(planTier);

    try {
      const result = await createCheckout(
        activeTenant,
        planTier,
        billingInterval
      );

      // Scheduled downgrade — no payment, current plan kept until effective date.
      if (result.scheduled) {
        setShowPlans(false); // <-- ADD THIS
        setCheckoutBanner("scheduled");
        setTimeout(() => loadData(true), 800);
        return;
      }

      if (result.no_change) {
        setShowPlans(false); // Optional: also close for no-op
        window.alert("You're already on this plan.");
        return;
      }

      if (result.free_plan || result.upgraded) {
        setShowPlans(false); // Good UX for immediate plan changes too
        setCheckoutBanner(result.upgraded ? "upgraded" : "success");
        setTimeout(() => loadData(), 1500);
        return;
      }

      // Upgrade → pay via Moyasar hosted checkout.
      if (result.checkout_url) {
        window.location.href = result.checkout_url;
      }
    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setActionLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setActionLoading("portal");
    try {
      const result = await openBillingPortal(activeTenant);
      if (result.portal_url) window.location.href = result.portal_url;
    } catch (err) { alert(err.message); }
    finally { setActionLoading(null); }
  };

  const handleContactSales = (plan) => {
    // Close the plan picker, open the enterprise request modal for this plan.
    setShowPlans(false);
    setEnterprisePlan(plan);
  };

  const handleSubmitEnterprise = async (payload) => {
    setEnterpriseSubmitting(true);
    try {
      const result = await submitEnterpriseRequest(activeTenant, payload);
      setEnterpriseReq(result.request);
      setEnterprisePlan(null);
      setCheckoutBanner("enterprise_submitted");
    } catch (err) {
      alert(err.message || "Something went wrong");
    } finally {
      setEnterpriseSubmitting(false);
    }
  };

  const handleCancelEnterprise = async () => {
    if (!confirm(t("billing.enterprise.cancelConfirm") || "Withdraw this Enterprise request?")) return;
    try {
      const result = await cancelEnterpriseRequest(activeTenant);
      setEnterpriseReq(result.request);
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleSection = (key) => setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const getPrice = (plan) => {
    if (billingInterval === "year") return (parseFloat(plan.price_yearly) / 12).toFixed(0);
    return parseFloat(plan.price_monthly).toFixed(0);
  };

  const sub = dashboard?.current_plan;
  const isCurrentPlan = (plan) => sub?.plan?.tier === plan.tier;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
      </div>
    );
  }

  return (
     <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("billing.myPlan")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("billing.breadcrumb")}</p>
        </div>
      </div>

      {/* Checkout banners */}
      {checkoutBanner === "success" && (
        <Banner type="success" icon={Check} title={t("billing.paymentSuccess")} message={t("billing.paymentSuccessDesc")} onDismiss={() => setCheckoutBanner(null)} />
      )}
      {checkoutBanner === "upgraded" && (
        <Banner type="success" icon={Zap} title={t("billing.planUpdated")} message={t("billing.planUpdatedDesc")} onDismiss={() => setCheckoutBanner(null)} />
      )}
      {checkoutBanner === "cancelled" && (
        <Banner type="warning" icon={AlertTriangle} title={t("billing.checkoutCancelled")} message={t("billing.checkoutCancelledDesc")} onDismiss={() => setCheckoutBanner(null)} />
      )}
      {checkoutBanner === "scheduled" && (
        <Banner
          type="warning"
          icon={AlertTriangle}
          title={t("billing.downgradeScheduled") || "Downgrade scheduled"}
          message={
            t("billing.downgradeScheduledDesc") ||
            "Your current plan stays active until the end of this billing period, then the downgrade takes effect. You were not charged."
          }
          onDismiss={() => setCheckoutBanner(null)}
        />
      )}
      {checkoutBanner === "enterprise_submitted" && (
        <Banner type="success" icon={Building2} title={t("billing.enterprise.submittedTitle") || "Request received"} message={t("billing.enterprise.submittedDesc") || "Our sales team will reach out shortly."} onDismiss={() => setCheckoutBanner(null)} />
      )}

      {/* ═══════ ENTERPRISE REQUEST STATUS ═══════ */}
      {enterpriseReq && OPEN_ENTERPRISE_STATUSES.includes(enterpriseReq.status) && (
        <EnterpriseStatusCard req={enterpriseReq} onCancel={handleCancelEnterprise} t={t} />
      )}

      {/* ═══════ MY PLAN ═══════ */}
      <Section title={t("billing.myPlan")}>
        {sub ? (
          <CurrentPlanCard sub={sub} t={t} onManage={handleManageBilling} onViewPlans={() => setShowPlans(true)} actionLoading={actionLoading} />
        ) : (
          <EmptyState icon={Sparkles} title={t("billing.noActiveSubscription")} message={t("billing.choosePlan")} ctaLabel={t("billing.viewPlans")} onCta={() => setShowPlans(true)} />
        )}
      </Section>

      {/* ═══════ UPCOMING SUBSCRIPTIONS ═══════ */}
      <Section  title = {t("billing.upcomingSubscriptions")} subtitle={t("billing.upcomingSubscriptionsDesc")}>
        {dashboard?.upcoming?.length > 0 ? (
          <div className="space-y-3">
            {dashboard.upcoming.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <CalendarClock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{item.change_type} to {item.requested_plan}</p>
                    <p className="text-xs text-gray-500">
                      {item.effective_date ? `Effective: ${new Date(item.effective_date).toLocaleDateString()}` : `Requested: ${new Date(item.created_at).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <StatusBadge status={item.status} t={t} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={CalendarClock} title={t("billing.upcomingSubscriptions")} message={t("billing.upcomingSubscriptionsDesc")} />
        )}
      </Section>

      {/* ═══════ ADD-ONS ═══════ */}
      <CollapsibleSection title={t("billing.addons")} subtitle={t("billing.addonsDesc")} expanded={expandedSections.addons} onToggle={() => toggleSection("addons")}>
        <EmptyState icon={Package} title={t("billing.noActiveSubscription")} message={t("billing.noAddons")} />
      </CollapsibleSection>

      {/* ═══════ USAGE ═══════ */}
      {dashboard?.usage && sub && (
        <Section  title={t("billing.currentUsage")} subtitle={t("billing.currentUsageDesc")}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UsageCard icon={Users} label={t("billing.providers")} usage={dashboard.usage.max_providers}  t={t} />
            <UsageCard icon={Package} label={t("billing.services")} usage={dashboard.usage.max_services}  t={t} />
            <UsageCard icon={Calendar} label={t("billing.monthlyBookings")} usage={dashboard.usage.max_bookings_monthly}  t={t} />
          </div>
        </Section>
      )}

      {/* ═══════ INVOICES ═══════ */}
      {dashboard?.invoices?.length > 0 && (
        <Section  title={t("billing.recentInvoices")} subtitle={t("billing.recentInvoicesDesc")}>
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.invoice")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.description")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.amount")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.date")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.status")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.downloadPdf")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboard.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-gray-600">{inv.description}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{inv.amount} {inv.currency}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={inv.status} /></td>
                    <td className="px-4 py-3">
                      {inv.stripe_url && (
                        <a href={inv.stripe_url} target="_blank" rel="noopener noreferrer" className="text-[#8B1E3F] hover:underline text-xs flex items-center gap-1">
                          <Download className="w-3 h-3" /> PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* ═══════ SUBSCRIPTION HISTORY ═══════ */}
      <CollapsibleSection title={t("billing.subscriptionHistory")} subtitle={t("billing.subscriptionHistoryDesc")} expanded={expandedSections.history} onToggle={() => toggleSection("history")}>
        {dashboard?.history?.length > 0 ? (
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.change")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.fromTo")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.date")}</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">{t("billing.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboard.history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 capitalize font-medium text-gray-900">{item.change_type}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="capitalize">{item.current_plan}</span> → <span className="capitalize font-medium">{item.requested_plan}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><StatusBadge status={item.status} t={t} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={Receipt} title={t("billing.noSubscriptionHistory")} message={t("billing.subscriptionHistoryDesc")} />
        )}
      </CollapsibleSection>

      {/* ═══════ PLAN PICKER MODAL ═══════ */}
      {showPlans && (
        <PlanPickerModal
          plans={plans}
          currentTier={sub?.plan?.tier}
          billingInterval={billingInterval}
          currentInterval={sub?.billing_interval} // ✅ ADD THIS
          onIntervalChange={setBillingInterval}
          onSelect={handleUpgrade}
          onContactSales={handleContactSales}
          enterpriseReq={enterpriseReq}
          onClose={() => setShowPlans(false)}
          actionLoading={actionLoading}
          getPrice={getPrice}
          t={t}
        />
      )}

      {/* ═══════ ENTERPRISE REQUEST MODAL ═══════ */}
      {enterprisePlan && (
        <EnterpriseRequestModal
          plan={enterprisePlan}
          tenant={activeTenant}
          submitting={enterpriseSubmitting}
          onSubmit={handleSubmitEnterprise}
          onClose={() => setEnterprisePlan(null)}
          t={t}
        />
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════
// SUBCOMPONENTS
// ═══════════════════════════════════════════════════════════════════

function CurrentPlanCard({ sub, t , onManage, onViewPlans, actionLoading }) {
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] p-5 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-lg font-bold">{sub.plan?.name || "—"} {t("billing.plan")}</h3>
              <p className="text-white/60 text-sm mt-0.5">{sub.billing_interval === "year"
  ? t("billing.yearlyBilling")
  : t("billing.monthlyBilling")}</p>
            </div>
          </div>
          <StatusBadge status={sub.status} t={t} />
        </div>
      </div>

      <div className="p-5 bg-white space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoBlock label={t("billing.price")} value={`$${sub.current_price}/${sub.billing_interval === "year" ? "yr" : "mo"}`} />
          {sub.is_trialing && sub.days_remaining_in_trial > 0 && (
            <InfoBlock label={t("billing.trialRemaining")} value={`${sub.days_remaining_in_trial} ${t("billing.days")}`} warn={sub.days_remaining_in_trial <= 3} />
          )}
          {sub.current_period_end && (
            <InfoBlock label={sub.cancel_at_period_end ? t("billing.accessEnds") : t("billing.nextRenewal")} value={new Date(sub.current_period_end).toLocaleDateString()} warn={sub.cancel_at_period_end} />
          )}
        </div>

        {sub.plan?.features?.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t("billing.planFeatures")}</p>
            <div className="grid grid-cols-2 gap-2">
              {sub.plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {f.included ? <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                  <span className={f.included ? "text-gray-700" : "text-gray-400"}>
                    {f.display_value !== "Included" && f.display_value !== "Not included" ? `${f.display_value} ` : ""}{f.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
          <button onClick={onViewPlans} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] text-white font-medium hover:opacity-90 text-sm">
            <CreditCard className="w-4 h-4" /> {t("billing.viewPlans")}
          </button>
          {sub.has_stripe_subscription && (
            <>
              <button onClick={onManage} disabled={actionLoading === "portal"} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#8B1E3F]/20 text-[#8B1E3F] font-medium hover:bg-[#8B1E3F]/5 text-sm">
                {actionLoading === "portal" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {t("billing.manageBilling")} <ExternalLink className="w-3 h-3" />
              </button>
              <button onClick={onManage} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 text-sm">
                <Receipt className="w-4 h-4" /> {t("billing.viewInvoices")} <ExternalLink className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {sub.cancel_at_period_end && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{t("billing.cancelAtPeriodEnd")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlanPickerModal({ plans, currentTier, billingInterval,currentInterval,onIntervalChange, onSelect, onContactSales, enterpriseReq, onClose, actionLoading, getPrice , t}) {
  const hasOpenEnterprise = enterpriseReq && ["pending", "under_review"].includes(enterpriseReq.status);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900">{t("billing.choosePlan")}</h2>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl">
              <button onClick={() => onIntervalChange("month")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${billingInterval === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{t("billing.monthly")}</button>
              <button onClick={() => onIntervalChange("year")} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${billingInterval === "year" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                {t("billing.yearly")} <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">-20%</span>
              </button>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
           const isCurrent =
            plan.tier === currentTier &&
            billingInterval === currentInterval;
            const isFree = plan.tier === "free";
            const isCustom = isEnterprisePlan(plan);
            const price = getPrice(plan);
            const isLoading = actionLoading === plan.tier;

            return (
              <div key={plan.id} className={`rounded-xl border p-5 flex flex-col ${isCurrent ? "border-[#8B1E3F] ring-2 ring-[#8B1E3F]/20 bg-[#8B1E3F]/5" : isCustom ? "border-amber-200 bg-amber-50/40" : plan.is_popular ? "border-rose-200 bg-rose-50/50" : "border-gray-200 bg-white"}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isCurrent && <span className="px-2.5 py-0.5 rounded-full bg-[#8B1E3F] text-white text-xs font-bold">{t("billing.current")}</span>}
                  {isCustom && !isCurrent && <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center gap-1"><Building2 className="w-3 h-3" />{t("billing.enterprise.badge") || "Enterprise"}</span>}
                  {plan.is_popular && !isCurrent && !isCustom && <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current" />{t("billing.popular")}</span>}
                </div>
                <h4 className="font-bold text-gray-900 mb-1">{plan.name}</h4>
                <p className="text-xs text-gray-500 mb-3">{plan.tagline}</p>
                <div className="mb-4">
                  {isCustom ? (
                    <span className="text-2xl font-extrabold text-gray-900">{t("billing.enterprise.customPrice") || "Custom"}</span>
                  ) : (
                    <>
                      <span className="text-2xl font-extrabold text-gray-900">{isFree ? "Free" : `$${price}`}</span>
                      {!isFree && <span className="text-gray-500 text-sm">/mo</span>}
                    </>
                  )}
                </div>
                <div className="flex-1 space-y-2 mb-4">
                  {plan.features?.slice(0, 5).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {f.included ? <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
                      <span className={f.included ? "text-gray-700" : "text-gray-400"}>
                        {f.display_value !== "Included" && f.display_value !== "Not included" ? `${f.display_value} ` : ""}{f.name}
                      </span>
                    </div>
                  ))}
                </div>
                {isCurrent ? (
                  <div className="py-2.5 rounded-xl text-center text-sm font-medium text-[#8B1E3F] bg-[#8B1E3F]/10">{t("billing.currentPlan")}</div>
                ) : isCustom ? (
                  hasOpenEnterprise ? (
                    <div className="py-2.5 rounded-xl text-center text-sm font-medium text-amber-700 bg-amber-100">{t("billing.enterprise.requestPending") || "Request pending"}</div>
                  ) : (
                    <button onClick={() => onContactSales(plan)} className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:opacity-90 shadow-md">
                      <Building2 className="w-3.5 h-3.5" /> {t("billing.enterprise.contactSales") || "Contact Sales"}
                    </button>
                  )
                ) : (
                  <button onClick={() => onSelect(plan.tier)} disabled={isLoading} className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${isFree ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] text-white hover:opacity-90 shadow-md"}`}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{isFree ? t("billing.switchToFree") : <> {t("billing.upgrade")} <ArrowRight className="w-3.5 h-3.5" /></>}</>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EnterpriseStatusCard({ req, onCancel, t }) {
  const statusLabel =
    req.status === "under_review"
      ? t("billing.enterprise.statusUnderReview") || "Under review"
      : t("billing.enterprise.statusPending") || "Pending review";
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 overflow-hidden">
      <div className="flex items-start gap-3 p-5">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{t("billing.enterprise.requestTitle") || "Enterprise request"}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">{statusLabel}</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {t("billing.enterprise.requestPendingDesc") || "Our sales team is reviewing your request and will be in touch. You can withdraw it any time before it's approved."}
          </p>
          {req.created_at && (
            <p className="text-xs text-gray-400 mt-2">
              {t("billing.enterprise.submittedOn") || "Submitted"}: {new Date(req.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-xs font-medium hover:bg-amber-100 flex-shrink-0">
          {t("billing.enterprise.withdraw") || "Withdraw"}
        </button>
      </div>
    </div>
  );
}

function EnterpriseRequestModal({ plan, tenant, submitting, onSubmit, onClose, t }) {
  const [form, setForm] = useState({
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    company_size: "",
    expected_volume: "",
    message: "",
  });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const input = "w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500";

  const submit = (e) => {
    e.preventDefault();
    if (submitting) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t("billing.enterprise.contactSales") || "Contact Sales"}</h2>
              <p className="text-xs text-gray-500">{plan?.name || "Enterprise"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {t("billing.enterprise.modalIntro") || "Tell us about your needs and our sales team will prepare a tailored Enterprise quote for you."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label={t("billing.enterprise.contactName") || "Contact name"}>
              <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} className={input} />
            </Field>
            <Field label={t("billing.enterprise.contactEmail") || "Work email"}>
              <input type="email" value={form.contact_email} onChange={(e) => set("contact_email", e.target.value)} className={input} />
            </Field>
            <Field label={t("billing.enterprise.contactPhone") || "Phone"}>
              <input value={form.contact_phone} onChange={(e) => set("contact_phone", e.target.value)} className={input} />
            </Field>
            <Field label={t("billing.enterprise.companySize") || "Company size"}>
              <input value={form.company_size} onChange={(e) => set("company_size", e.target.value)} placeholder="e.g. 50–200" className={input} />
            </Field>
            <div className="sm:col-span-2">
              <Field label={t("billing.enterprise.expectedVolume") || "Expected monthly volume"}>
                <input value={form.expected_volume} onChange={(e) => set("expected_volume", e.target.value)} placeholder="e.g. 10,000 bookings/mo" className={input} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={t("billing.enterprise.message") || "Anything else?"}>
                <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3} className={`${input} resize-none`} />
              </Field>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50">
              {t("common.cancel") || "Cancel"}
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("billing.enterprise.sendRequest") || "Send request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function UsageCard({ icon: Icon, label, usage, t }) {
  if (!usage) return null;
  const pct = usage.unlimited ? 0 : Math.min(usage.percentage, 100);
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-2xl font-bold text-gray-900">{usage.current}</span>
        <span className="text-sm text-gray-500">/ {usage.unlimited ? "∞" : usage.limit}</span>
      </div>
      {!usage.unlimited && <div className="w-full h-1.5 rounded-full bg-gray-100"><div className={`h-full rounded-full ${pct >= 80 ? "bg-red-500" : "bg-[#8B1E3F]"}`} style={{ width: `${pct}%` }} /></div>}
      {usage.unlimited && <p className="text-xs text-gray-400">{t("billing.unlimited")}</p>}
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CollapsibleSection({ title, subtitle, expanded, onToggle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={onToggle} className="w-full px-5 py-4 border-b border-gray-100 flex items-center justify-between hover:bg-gray-50">
        <div className="text-left">
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && <div className="p-5">{children}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, ctaLabel, onCta }) {
  return (
    <div className="text-center py-10">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{message}</p>
      {ctaLabel && onCta && (
        <button onClick={onCta} className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B1E3F] text-white font-medium hover:opacity-90 text-sm">
          <CreditCard className="w-4 h-4" /> {ctaLabel}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status, dark = false, t }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const label = t?.(`billing.status.${status}`) || status;

  if (dark) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white/90">
        {label}
      </span>
    );
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${style}`}>
      {label}
    </span>
  );
}

function InfoBlock({ label, value, warn = false }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${warn ? "text-amber-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}

function Banner({ type, icon: Icon, title, message, onDismiss }) {
  const s = { success: "bg-emerald-50 border-emerald-200", warning: "bg-amber-50 border-amber-200" };
  const i = { success: "bg-emerald-100 text-emerald-600", warning: "bg-amber-100 text-amber-600" };
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${s[type]}`}>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${i[type]}`}><Icon className="w-4 h-4" /></div>
      <div className="flex-1"><p className="font-bold text-gray-900 text-sm">{title}</p><p className="text-xs text-gray-600">{message}</p></div>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
    </div>
  );
}