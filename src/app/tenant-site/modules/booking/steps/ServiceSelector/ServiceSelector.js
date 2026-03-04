"use client";

import { useEffect, useState } from "react";
import { resolveTranslated } from "@/app/tenant-site/[domain]/utils/resolveTranslated";

import ServiceCard from "./ServiceCard";
import ServiceSelectorSkeleton from "./ServiceSelectorSkeleton";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ServiceSelector({
  domain,
  settings,
  selectedCategory,
  selectedService,
  selectedStaff,
  onCategorySelect,
  onServiceSelect,
  onStaffSelect,
  onNext,
  theme,
  lang,
  isRTL,
}) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("services"); // services | staff

  // -----------------------------
  // Fetch services
  // -----------------------------
  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/public-services/`, {
        headers: { "X-Tenant": domain },
      });

      const data = await res.json();
      const list = data.services || data.results || [];

      setServices(list);

      // Extract categories
      const map = new Map();
      list.forEach(s => s.category && map.set(s.category.id, s.category));
      setCategories([...map.values()]);

      setIsLoading(false);
    }

    fetchServices();
  }, [domain]);

  // -----------------------------
  // Fetch staff AFTER service select
  // -----------------------------
  useEffect(() => {
    if (!selectedService || !settings.show_staff_selection) return;

    async function fetchStaff() {
      setIsLoading(true);
      const res = await fetch(
        `${API_BASE}/api/v1/providers/public_provider/?service=${selectedService.id}`,
        { headers: { "X-Tenant": domain } }
      );

      const data = await res.json();
      setStaff(data.results || data);
      setView("staff");
      setIsLoading(false);
    }

    fetchStaff();
  }, [selectedService, settings.show_staff_selection, domain]);

  // -----------------------------
  // Loading
  // -----------------------------
  if (isLoading) return <ServiceSelectorSkeleton />;

  // -----------------------------
  // STAFF VIEW (old logic)
  // -----------------------------
  if (view === "staff" && settings.show_staff_selection) {
    return (
      <div className="p-6">
        <button
          onClick={() => {
            setView("services");
            onServiceSelect(null);
          }}
          className="mb-6 text-sm text-gray-600"
        >
          ← {resolveTranslated({ en: "Back to services" }, lang)}
        </button>

        <h3 className="text-xl font-bold mb-4">
          {resolveTranslated({ en: "Choose therapist" }, lang)}
        </h3>

        {/* No preference */}
        <button
          onClick={() => {
            onStaffSelect(null);
            onNext();
          }}
          className="w-full p-4 mb-4 border rounded-xl"
        >
          {resolveTranslated({ en: "No preference" }, lang)}
        </button>

        {/* Staff list */}
        <div className="grid md:grid-cols-2 gap-4">
          {staff.map(member => (
            <button
              key={member.id}
              onClick={() => {
                onStaffSelect(member);
                onNext();
              }}
              className="p-4 border rounded-xl"
            >
              {member.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------
  // SERVICES VIEW (old logic)
  // -----------------------------
  const filteredServices = selectedCategory
    ? services.filter(s => s.category?.id === selectedCategory.id)
    : services;

  return (
    <div className="p-6">
      {/* Categories */}
      {settings.show_categories && categories.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => onCategorySelect(null)}
            className="px-4 py-2 rounded-full bg-gray-100"
          >
            {resolveTranslated({ en: "All" }, lang)}
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat)}
              className="px-4 py-2 rounded-full bg-gray-100"
            >
              {resolveTranslated(cat.name, lang)}
            </button>
          ))}
        </div>
      )}

      {/* Services */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredServices.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={() => {
              onServiceSelect(service);

              if (!settings.show_staff_selection) {
                onNext(); // 👈 EXACT old behavior
              }
            }}
            showPrice
            showDuration
            showImage
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        ))}
      </div>
    </div>
  );
}
