"use client";

import { useState } from "react";
import { resolveTranslated } from "../../src/app/tenant-site/templates/utils/lang";
import { useTenantLang } from "../../src/app/tenant-site/templates/utils/TenantLangContext";

export default function PricingTable({ data }) {
  const { lang } = useTenantLang();
  const T = (v) => resolveTranslated(v, lang);

  const content = data?.content || data || {};
  const { title, subtitle, billing_toggle = false, plans = [] } = content;

  const [billing, setBilling] = useState("monthly");

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        {title && <h2 className="text-4xl font-bold text-gray-900 mb-4">{T(title)}</h2>}
        {subtitle && <p className="text-lg text-gray-600 mb-10">{T(subtitle)}</p>}

        {billing_toggle && (
          <div className="mb-12 flex justify-center">
            <div className="bg-gray-100 p-1 rounded-full flex">
              <button onClick={() => setBilling("monthly")} className={`px-5 py-2 rounded-full text-sm font-medium ${billing === "monthly" ? "bg-white shadow" : "text-gray-500"}`}>Monthly</button>
              <button onClick={() => setBilling("yearly")} className={`px-5 py-2 rounded-full text-sm font-medium ${billing === "yearly" ? "bg-white shadow" : "text-gray-500"}`}>Yearly</button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-10">
          {plans.map((plan, idx) => {
            const price = billing === "monthly" ? (plan.price_monthly || plan.price) : (plan.price_yearly || plan.price);
            return (
              <div key={idx} className={`rounded-2xl p-8 border shadow-sm hover:shadow-xl transition ${plan.highlighted || plan.recommended ? "border-blue-600" : "border-gray-200"}`}>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{T(plan.name)}</h3>
                <div className="text-4xl font-extrabold text-blue-600 mb-2">{price}</div>
                {plan.period && <div className="text-gray-500 text-sm mb-6">{T(plan.period)}</div>}
                <ul className="space-y-3 text-left mb-8">
                  {plan.features?.map((f, i) => <li key={i} className="text-gray-700 text-sm">✓ {T(f)}</li>)}
                </ul>
                {plan.cta && <button className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">{T(plan.cta)}</button>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
