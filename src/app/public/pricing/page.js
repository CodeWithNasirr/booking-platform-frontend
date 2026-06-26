"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  ArrowRight,
  Star,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";

export default function PricingPage() {
  const [plans, setPlans] = useState([]);
  const [billingInterval, setBillingInterval] = useState("month");
  const [loading, setLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/billing/plans/`
        );
        const data = await res.json();

        setPlans(data);
      } catch (err) {
        console.error("Failed to load plans:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);



  const getPrice = (plan) => {
    if (billingInterval === "year") {
      return (parseFloat(plan.price_yearly) / 12).toFixed(0);
    }
    return parseFloat(plan.price_monthly).toFixed(0);
  };

  const getYearlySavings = (plan) => {
    const monthlyTotal = parseFloat(plan.price_monthly) * 12;
    const yearlyTotal = parseFloat(plan.price_yearly);
    if (monthlyTotal <= 0) return 0;
    return Math.round(((monthlyTotal - yearlyTotal) / monthlyTotal) * 100);
  };

  const getCtaText = (plan) => {
    if (plan.tier === "free") return "Get Started Free";
    if (plan.trial_days > 0) return `Start ${plan.trial_days}-Day Free Trial`;
    return "Subscribe Now";
  };

  const getCtaUrl = (plan) => {
    if (plan.tier === "enterprise") return "/contact?plan=enterprise";
    return `/auth/signup?plan=${plan.tier}&interval=${billingInterval}`;
  };

  const faqs = [
    {
      q: "Can I switch plans at any time?",
      a: "Yes! Upgrade or downgrade anytime from your billing settings. Changes take effect immediately with prorated billing.",
    },
    {
      q: "How does the free trial work?",
      a: "Start with full access to your selected plan for 14 days. No credit card required. You'll only be charged when the trial ends and you choose to continue.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit and debit cards through Stripe, our secure payment processor.",
    },
    {
      q: "Can I cancel my subscription?",
      a: "Cancel anytime from billing settings. You keep access until the end of your current billing period. No hidden fees.",
    },
    {
      q: "What happens when I hit a plan limit?",
      a: "We'll notify you as you approach limits. Upgrade instantly for more capacity, or wait for the next billing cycle when limits reset.",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-3 border-slate-300 border-t-rose-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm mb-8">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-slate-300">Simple, transparent pricing</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Choose the plan that
            <br />
            <span className="bg-gradient-to-r from-rose-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
              fits your business
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">
            Start free. Upgrade when you grow. Every paid plan includes a 14-day
            free trial — no credit card required.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
            <button
              onClick={() => setBillingInterval("month")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billingInterval === "month"
                  ? "bg-white text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("year")}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                billingInterval === "year"
                  ? "bg-white text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* PLAN CARDS */}
      <section className="relative -mt-8 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan) => {
              const isPopular = plan.is_popular;
              const isFree = plan.tier === "free";
              const price = getPrice(plan);
              const savings = getYearlySavings(plan);

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-6 flex flex-col transition-all hover:shadow-xl ${
                    isPopular
                      ? "bg-gradient-to-b from-rose-50 to-white border-rose-200 shadow-lg shadow-rose-100/50 ring-2 ring-rose-500/20 scale-[1.02]"
                      : "bg-white border-slate-200 shadow-md hover:border-slate-300"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 text-white text-xs font-bold shadow-lg">
                        <Star className="w-3 h-3 fill-current" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3
                      className={`text-lg font-bold mb-1 ${
                        isPopular ? "text-rose-900" : "text-slate-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {plan.tagline || plan.description}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-slate-900">
                        {isFree ? "Free" : new Intl.NumberFormat("en-SA", {
                          style: "currency",
                          currency: plan.currency,
                          maximumFractionDigits: 0,
                        }).format(price)}
                      </span>
                      {!isFree && (
                        <span className="text-slate-500 text-sm">/month</span>
                      )}
                    </div>
                    {!isFree && billingInterval === "year" && savings > 0 && (
                      <p className="text-emerald-600 text-sm font-medium mt-1">
                        Save {savings}% with yearly billing
                      </p>
                    )}
                    {!isFree && plan.trial_days > 0 && (
                      <p className="text-amber-600 text-sm mt-1 font-medium">
                        {plan.trial_days}-day free trial included
                      </p>
                    )}
                  </div>

                  <Link
                    href={getCtaUrl(plan)}
                    className={`w-full py-3 rounded-xl text-center font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-6 ${
                      isPopular
                        ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-lg shadow-rose-200/50 hover:shadow-xl"
                        : isFree
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {getCtaText(plan)}
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <div className="flex-1 space-y-3 border-t border-slate-100 pt-5">
                  {plan.features?.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <X className="w-3 h-3 text-slate-400" />
                        </div>
                      )}

                      <span
                        className={`text-sm ${
                          feature.included ? "text-slate-700" : "text-slate-400"
                        }`}
                      >
                        {feature.display_value !== "Included" &&
                        feature.display_value !== "Not included"
                          ? `${feature.display_value} `
                          : ""}
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section className="border-y border-slate-100 bg-slate-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Secure Payments</div>
                <div className="text-sm text-slate-500">
                  256-bit SSL via Stripe
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900">99.9% Uptime</div>
                <div className="text-sm text-slate-500">
                  Enterprise-grade reliability
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Cancel Anytime</div>
                <div className="text-sm text-slate-500">
                  No contracts, no hidden fees
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedFaq(expandedFaq === index ? null : index)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900">{faq.q}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-600 text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Start your free trial today. No credit card required.
          </p>
          <Link
            href="/auth/signup?plan=professional"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}