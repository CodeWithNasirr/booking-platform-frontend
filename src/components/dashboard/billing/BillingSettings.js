"use client";

import { useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { useApp } from "@/contexts/AppContext";
import {
  CreditCard,
  Zap,
  ArrowUpRight,
  Check,
  X,
  Star,
  Clock,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Shield,
  Sparkles,
  ArrowRight,
  Crown,
  CalendarClock,
  Receipt,
} from "lucide-react";

export default function BillingSettings() {
  const { activeTenant } = useApp();
  const token = Cookies.get("access_token");

  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [billingInterval, setBillingInterval] = useState("month");
  const [checkoutStatus, setCheckoutStatus] = useState(null); // 'success' | 'cancelled' | 'upgraded'
  // console.log(subscription,"subscription")
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Tenant": activeTenant,
    "Content-Type": "application/json",

  };

  // ── Check URL for checkout result ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setCheckoutStatus("success");
      params.delete("checkout");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    } else if (checkout === "cancelled") {
      setCheckoutStatus("cancelled");
      params.delete("checkout");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  // ── Fetch subscription + plans ──
  const fetchData = useCallback(async () => {
    try {
      const [subRes, plansRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/my-subscription/`, { headers,credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/plans/`, { headers,credentials: "include" }),
      ]);

      const subData = await subRes.json();
      const plansData = await plansRes.json();

      setSubscription(subData.subscription);
      setPlans(plansData);

      if (subData.subscription?.billing_interval) {
        setBillingInterval(subData.subscription.billing_interval);
      }
    } catch (err) {
      console.error("Failed to load billing data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTenant, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handle upgrade / downgrade / subscribe ──
  const handleUpgrade = async (planTier) => {
    setActionLoading(planTier);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/checkout/`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            plan_tier: planTier,
            billing_interval: billingInterval,
          }),
        }
      );

      const data = await res.json();

      // Free plan → handled locally, refresh UI
      if (data.free_plan) {
        await fetchData();
        return;
      }

      // Existing sub modified via Stripe API → refresh UI + show banner
      if (data.upgraded) {
        setCheckoutStatus("upgraded");
        // wait for Stripe webhook to sync DB
        setTimeout(async () => {
          await fetchData();
        }, 1200);
        // await fetchData();
        return;
      }

      // New checkout → redirect to Stripe
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.portal_url) {
        window.location.href = data.portal_url;
      } else {
        alert(data.detail || "Failed to create checkout session");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Open Stripe Billing Portal ──
  const handleManageBilling = async () => {
    setActionLoading("portal");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/portal/`,
        { method: "POST", headers }
      );

      const data = await res.json();

      if (data.portal_url) {
        window.location.href = data.portal_url;
      } else {
        alert(data.detail || "Failed to open billing portal");
      }
    } catch (err) {
      console.error("Portal error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  // ── Helpers ──
  const getPrice = (plan) => {
    if (billingInterval === "year") {
      return (parseFloat(plan.price_yearly) / 12).toFixed(0);
    }
    return parseFloat(plan.price_monthly).toFixed(0);
  };

  const isCurrentPlan = (plan) => {
    return subscription?.plan?.tier === plan.tier;
  };

  const isDowngrade = (plan) => {
    if (!subscription?.plan) return false;
    const currentOrder = plans.findIndex((p) => p.tier === subscription.plan.tier);
    const targetOrder = plans.findIndex((p) => p.tier === plan.tier);
    return targetOrder < currentOrder;
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: "Active",
      trialing: "Free Trial",
      past_due: "Past Due",
      cancelled: "Cancelled",
      expired: "Expired",
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Status Banners ── */}
      {checkoutStatus === "success" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Payment successful!</p>
            <p className="text-sm text-emerald-700">
              Your subscription has been activated. Changes may take a moment to reflect.
            </p>
          </div>
          <button
            onClick={() => setCheckoutStatus(null)}
            className="ml-auto text-emerald-400 hover:text-emerald-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {checkoutStatus === "upgraded" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">Plan updated!</p>
            <p className="text-sm text-emerald-700">
              Your subscription has been changed. It may take a moment to fully reflect.
            </p>
          </div>
          <button
            onClick={() => setCheckoutStatus(null)}
            className="ml-auto text-emerald-400 hover:text-emerald-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {checkoutStatus === "cancelled" && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Checkout was cancelled. You can try again anytime.
          </p>
          <button
            onClick={() => setCheckoutStatus(null)}
            className="ml-auto text-amber-400 hover:text-amber-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ── Current Plan Card ── */}
      {subscription && (
        <div className="rounded-2xl border border-[#8B1E3F]/10 overflow-hidden">
          <div className="bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-6 h-6 text-amber-300" />
                  <h3 className="text-xl font-bold">{subscription.plan.name} Plan</h3>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    subscription.status === "trialing"
                      ? "bg-amber-400/20 text-amber-200"
                      : subscription.status === "active"
                      ? "bg-emerald-400/20 text-emerald-200"
                      : "bg-white/20 text-white/80"
                  }`}>
                    {getStatusLabel(subscription.status)}
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  {subscription.billing_interval === "year" ? "Yearly" : "Monthly"} billing
                </p>
              </div>

              <div className="text-right">
                <div className="text-3xl font-extrabold">
                  ${subscription.current_price}
                </div>
                <div className="text-white/60 text-sm">
                  per {subscription.billing_interval}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscription.is_trialing && subscription.days_remaining_in_trial > 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <CalendarClock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-sm">Trial Period</p>
                    <p className="text-amber-700 text-sm">
                      {subscription.days_remaining_in_trial} days remaining
                    </p>
                    {subscription.trial_end && (
                      <p className="text-amber-600 text-xs mt-1">
                        Ends {new Date(subscription.trial_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {subscription.trial_end && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <Clock className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-900 text-sm">Current Period</p>
                    <p className="text-slate-600 text-sm">
                      {subscription.trial_end ? "Ends" : "Renews"}{" "}
                      {new Date(subscription.trial_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {subscription.cancel_at_period_end && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-900 text-sm">Cancelling</p>
                    <p className="text-red-700 text-sm">
                      Access ends{" "}
                      {new Date(
                        subscription.trial_end || subscription.current_period_end
                      ).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              </div>

            {subscription.has_stripe_subscription && (
              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                <button
                  onClick={handleManageBilling}
                  disabled={actionLoading === "portal"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#8B1E3F]/20 text-[#8B1E3F] font-medium hover:bg-[#8B1E3F]/5 transition-all"
                >
                  {actionLoading === "portal" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Manage Billing
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleManageBilling}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  View Invoices
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── No Subscription ── */}
      {!subscription && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-bold text-amber-900">No active subscription</p>
              <p className="text-sm text-amber-700">
                Choose a plan below to unlock premium features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Available Plans ── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Available Plans</h3>
            <p className="text-sm text-gray-600">
              {subscription ? "Switch plans anytime" : "Choose a plan to get started"}
            </p>
          </div>

          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setBillingInterval("month")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                billingInterval === "month"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                billingInterval === "year"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Yearly
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                -20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const isFree = plan.tier === "free";
            const price = getPrice(plan);
            const isDown = isDowngrade(plan);
            const isLoading = actionLoading === plan.tier;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-5 flex flex-col transition-all ${
                  isCurrent
                    ? "border-[#8B1E3F] bg-[#8B1E3F]/5 ring-2 ring-[#8B1E3F]/20"
                    : plan.is_popular
                    ? "border-rose-200 bg-rose-50/50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#8B1E3F] text-white text-xs font-bold">
                      Current
                    </span>
                  )}
                  {plan.is_popular && !isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Popular
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-slate-900 mb-1">{plan.name}</h4>
                <p className="text-xs text-slate-500 mb-3">{plan.tagline || plan.description}</p>

                <div className="mb-4">
                  <span className="text-2xl font-extrabold text-slate-900">
                    {isFree ? "Free" : `$${price}`}
                  </span>
                  {!isFree && <span className="text-slate-500 text-sm">/mo</span>}
                </div>

                <div className="flex-1 space-y-2 mb-4">
                  {plan.feature_list?.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {f.included ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <X className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      )}
                      <span className={f.included ? "text-slate-700" : "text-slate-400"}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <div className="py-2.5 rounded-xl text-center text-sm font-medium text-[#8B1E3F] bg-[#8B1E3F]/10">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    disabled={isLoading}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      isFree
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : isDown
                        ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                        : "bg-gradient-to-r from-[#8B1E3F] to-[#6B1630] text-white hover:opacity-90 shadow-md"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDown ? (
                      <>Downgrade</>
                    ) : isFree ? (
                      <>Switch to Free</>
                    ) : (
                      <>
                        Upgrade
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-700">
              Plan changes are handled securely through Stripe
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Upgrades take effect immediately with prorated billing. Downgrades apply at the end of your current billing period. Your data is always preserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}