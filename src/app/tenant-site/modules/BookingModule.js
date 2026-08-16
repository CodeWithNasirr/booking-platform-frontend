"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { resolveTranslated, resolveTranslatedContent } from "../[domain]/utils/resolveTranslated";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
 
// ── Gateway-agnostic imports ──
import { detectGateway, GATEWAY, buildHyperPayCallbackUrl } from "@/lib/paymentGateway";
import HyperPayWidget from "@/components/payment/HyperPayWidget";
import useApiError, {
  ApiErrorAlert
} from "@/hooks/useApiError";
import { useTenantSite } from "../[domain]/TenantClientWrapper";
import { apiFetch } from "@/lib/apiClient";
import DateTimePicker from "./booking/steps/DateTimePicker";
import { formatCurrency } from "@/lib/currency";
import IntegrationRequiredModal from "@/components/shared/IntegrationRequiredModal";

// ─── NEW IMPORTS ────────────────────────────────────────────────────────────
import {
  isBookableService,
  isProjectService,
  isMilestoneService,
  filterBookableServices,
  getServiceType,
  getServiceRoute,
} from "@/lib/serviceTypeHelper";
// import {
//   saveBookingState,
//   loadBookingState,
//   clearBookingState,
// } from "@/lib/bookingPersistence";
import { saveBookingState, loadBookingState,clearBookingState,} from "../[domain]/booking/bookingPersistence";

// =============================================================================
// API Configuration
// =============================================================================
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// =============================================================================
// MAIN BOOKING MODULE
// =============================================================================
export default function BookingModule({ data, settings: propSettings, tenantId, domain, lang: propLang }) {
  const router = useRouter();
  const {timezone,currency} = useTenantSite();

  async function fetchServiceBySlug(slug) {
      if (!slug) throw new Error("Missing service slug");

      try {
        const res = await fetch(`${API_BASE}/api/v1/public-services/`, {
          headers: {
            "Content-Type": "application/json",
            "X-Tenant": domain,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch services");
        }

        const data = await res.json();
        const services = data.services || data.results || data || [];
  
        const normalize = (value) =>
          value
            ?.toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-");

        const service = services.find((s) => {
          if (s.slug) {
            return normalize(s.slug) === normalize(slug);
          }
          return normalize(s.title?.en || s.name) === normalize(slug);
        });

        if (!service) {
          throw new Error("Service not found");
        }

        return service;
      } catch (err) {
        console.error("fetchServiceBySlug error:", err);

        const fallback = MOCK_SERVICES.find(
          (s) =>
            s.title?.en
              ?.toLowerCase()
              .replace(/\s+/g, "-") === slug
        );

        if (fallback) return fallback;

        throw err;
      }
    }

  useEffect(() => {
    if (!data?.preselected_service_slug) return;

    fetchServiceBySlug(data.preselected_service_slug).then(service => {
      // ── ROUTE GUARD: redirect non-booking services ──
      if (isProjectService(service)) {
        const route = getServiceRoute(service);
        router.push(route.url);
        return;
      }

      setSelectedService(service);
      setCurrentStep(
        resolvedSettings.show_staff_selection ? 0 : 1
      );
    });
  }, [data?.preselected_service_slug]);

  const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  );
  
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();
  const lang = propLang || language;
  const settings = propSettings || data?.settings || {};
  const resolvedSettings = resolveTranslatedContent(settings, lang);

  // Booking state
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customerData, setCustomerData] = useState({});
  const [bookingResult, setBookingResult] = useState(null);

  const [clientSecret, setClientSecret] = useState(null);
  const [createdBooking, setCreatedBooking] = useState(null);
  const [activeGateway, setActiveGateway] = useState(null);       // "stripe" | "hyperpay"
  const [hyperPayData, setHyperPayData] = useState(null);         // { checkout_id, widget_url, brands }

  const [integrationError, setIntegrationError] = useState(null);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState(null);
  const {
  error,
  handleError,
  clearError,
} = useApiError();

  // ── Track whether we've done the initial restore ──
  const restoredRef = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PERSISTENCE: Restore on mount
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadBookingState(domain);
    if (!saved) return;

    // Restore primitive scalars
    if (saved.step != null)        setCurrentStep(saved.step);
    if (saved.staffId)             setSelectedStaff(saved.staffObj || null);
    if (saved.time)                setSelectedTime(saved.time);
    if (saved.customerData)        setCustomerData(saved.customerData);
    // ── Persistence restore: no new Date() from saved ISO string ─────────────
    if (saved.date) setSelectedDate(saved.date); // saved.date was already "YYYY-MM-DD"

    // Restore selected service by re-fetching (so we have the full object)
    if (saved.serviceId) {
      fetch(`${API_BASE}/api/v1/public-services/`, {
        headers: { "Content-Type": "application/json", "X-Tenant": domain },
      })
        .then((r) => r.json())
        .then((d) => {
          const list = d.services || d.results || d || [];
          const svc = list.find((s) => s.id === saved.serviceId);
          if (svc && isBookableService(svc)) {
            setSelectedService(svc);
          }
        })
        .catch(() => {}); // silent – user just starts fresh
    }
  }, [domain]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PERSISTENCE: Auto-save on every meaningful state change
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    // Don't persist the confirmation / payment step (contains secrets)
    if (bookingResult) return;

    // ── Persistence save: store the string directly ──────────────────────────
    saveBookingState(domain, {
      step: currentStep,
      serviceId: selectedService?.id || null,
      staffObj: selectedStaff || null,
      date: selectedDate,        // already a string — no .toISOString()
      time: selectedTime,
      customerData,
    });
  }, [currentStep, selectedService, selectedStaff, selectedDate, selectedTime, customerData, domain, bookingResult]);

  // Default steps if not provided
  const defaultSteps = [
    { id: "service", label: { en: "Select Service", ar: "اختر الخدمة", ur: "سروس منتخب کریں" } },
    { id: "datetime", label: { en: "Date & Time", ar: "التاريخ والوقت", ur: "تاریخ اور وقت" } },
    { id: "details", label: { en: "Your Details", ar: "بياناتك", ur: "آپ کی تفصیلات" } },
    { id: "confirm", label: { en: "Confirm", ar: "تأكيد", ur: "تصدیق" } },
  ];

  const steps = resolvedSettings.steps || defaultSteps;
  const currentStepId = steps[currentStep]?.id || "service";

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // setError(null);
      clearError();
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // setError(null);
      clearError();
    }
  };

  const goToStep = (stepIndex) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
      // setError(null);
      clearError();
    }
  };

  // Reset booking  ── also clears persisted state ──
  const resetBooking = () => {
    setCurrentStep(0);
    setSelectedCategory(null);
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerData({});
    setBookingResult(null);
    setClientSecret(null);
    setCreatedBooking(null);
    // setError(null);
    clearError();
    clearBookingState(domain);
  };

  // Variant handling
  const variant = resolvedSettings.variant || "full_page";
  const containerClass = variant === "inline" 
    ? "bg-white rounded-2xl shadow-lg p-6" 
    : "bg-white";

  return (
    <>
    <div className={`booking-module ${containerClass} ${isRTL ? "rtl" : ""}`}>
      {/* ================= STEPS HEADER ================= */}
      <StepsHeader
        steps={steps}
        currentStep={currentStep}
        onStepClick={goToStep}
        theme={theme}
        lang={lang}
        isRTL={isRTL}
      />

      {/* ================= ERROR DISPLAY ================= */}
      {/* {error && (
        <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )} */}
      {error && (
        <div className="px-4 pt-4">
            <ApiErrorAlert
              error={error}
              onDismiss={clearError}
            />
        </div>
      )}

      {/* ================= STEP CONTENT ================= */}
      <div className="booking-content min-h-[400px]">
        {currentStepId === "service" && (
          <ServiceSelector
            tenantId={tenantId}
            domain={domain}
            settings={resolvedSettings}
            selectedCategory={selectedCategory}
            selectedService={selectedService}
            selectedStaff={selectedStaff}
            onCategorySelect={setSelectedCategory}
            onServiceSelect={(service) => {
              // ── ROUTE GUARD: non-booking services redirect ──
              if (service && isProjectService(service)) {
                const route = getServiceRoute(service);
                router.push(route.url);
                return;
              }

              setSelectedService(service);
              if (!resolvedSettings.show_staff_selection) {
                goToNextStep();
              }
            }}
            onStaffSelect={(staff) => {
              setSelectedStaff(staff);
              goToNextStep();
            }}
            onIntegrationBlocked={(result) => {
              setIntegrationError(result);
            }}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {currentStepId === "datetime" && (
         // ── DateTimePicker wiring ─────────────────────────────────────────────────
        <DateTimePicker
          domain={domain}
          service={selectedService}
          staff={selectedStaff}
          selectedDate={selectedDate}      // string
          selectedTime={selectedTime}      // string
          onDateSelect={setSelectedDate}   // receives string from picker
          onTimeSelect={(time) => {
            setSelectedTime(time);
            goToNextStep();
          }}
          timezone={timezone}              // tenant IANA string from useTenantSite()
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
        )}

        {currentStepId === "details" && (
          <CustomerForm
            customerData={customerData}
            onDataChange={setCustomerData}
            onSubmit={async () => {
            setIsLoading(true);
            // setError(null);
            clearError();

            try {
              // 1️⃣ Create booking
              const booking = await createBooking({
                tenantId,
                domain,
                service: selectedService,
                staff: selectedStaff,
                date: selectedDate,
                time: selectedTime,
                customer: customerData,
                timezone,
              });

              setCreatedBooking(booking);

              // 2️⃣ Initiate payment
              // TODO: Escrow integration handled in backend (Django)
              //       For milestone services, this would create an escrow hold
              //       instead of a direct payment capture.
              const data = await apiFetch(
                `/api/v1/bookings/${booking.id}/initiate_payment/`,
                domain,
                {
                  method: "POST",

                  body: JSON.stringify({
                    is_deposit: false,
                  }),
                }
              );
              // Moyasar hosted-invoice flow: redirect to the hosted page.
              if (data.gateway === "moyasar" && data.redirect_url) {
                window.location.href = data.redirect_url;
                return;
              }

              const gateway = detectGateway(data);
              setActiveGateway(gateway);

              if (gateway === GATEWAY.HYPERPAY) {
                // HyperPay: store checkout data for widget
                setHyperPayData({
                  checkout_id: data.checkout_id,
                  widget_url: data.widget_url,
                  brands: data.brands || ["VISA", "MASTER", "MADA"],
                  callback_url: data.callback_url || buildHyperPayCallbackUrl("booking", booking.id),
                });
              } else {
                // Stripe: existing flow
                setClientSecret(data.client_secret);
              }
 
              // 3️⃣ NOW move to confirm
              goToNextStep();
            } catch (e) {
              // setError(e.message);
              handleError(e);
            } finally {
              setIsLoading(false);
            }
          }}

            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        )}

        {currentStepId === "confirm" && (activeGateway === GATEWAY.STRIPE ? clientSecret : hyperPayData) && (
          activeGateway === GATEWAY.HYPERPAY ? (
            // ── HyperPay: Widget-based payment ──
            <ConfirmAndPayHyperPay
              booking={createdBooking}
              hyperPayData={hyperPayData}
              domain={domain}
              service={selectedService}
              staff={selectedStaff}
              date={selectedDate}
              time={selectedTime}
              customer={customerData}
              settings={resolvedSettings}
              timezone={timezone}
              onReset={resetBooking}
              theme={theme}
              lang={lang}
              isRTL={isRTL}
            />
          ) : (
            // ── Stripe: Existing Elements flow ──
            <Elements
              stripe={stripePromise}
              options={{ clientSecret }}
            >
              <ConfirmAndPay
                booking={createdBooking}
                tenantId={tenantId}
                domain={domain}
                service={selectedService}
                staff={selectedStaff}
                date={selectedDate}
                time={selectedTime}
                customer={customerData}
                settings={resolvedSettings}
                bookingResult={bookingResult}
                setBookingResult={setBookingResult}
                isLoading={isLoading}
                onReset={resetBooking}
                timezone={timezone}
                theme={theme}
                lang={lang}
                isRTL={isRTL}
              />
            </Elements>
          )
        )}
      </div>

      {/* ================= NAVIGATION BUTTONS ================= */}
      {currentStepId !== "confirm" && (
        <div className={`flex justify-between p-6 border-t ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            onClick={goToPrevStep}
            disabled={currentStep === 0}
            className="px-6 py-3 text-gray-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:text-gray-900 transition-colors"
          >
            {resolveTranslated({ en: "Back", ar: "رجوع", ur: "واپس" }, lang)}
          </button>
          
          {/* Next button is typically handled by each step's selection */}
        </div>
      )}
    </div>
      <IntegrationRequiredModal
      checkResult={integrationError}
      panel="provider"
      allowSkip={false}
      onClose={() => setIntegrationError(null)}
      onConnect={(resolution) => {
        console.log(resolution);
      }}
    />
    </>
  );

}




// =============================================================================
// STEPS HEADER COMPONENT
// =============================================================================
function StepsHeader({ steps, currentStep, onStepClick, theme, lang, isRTL }) {
  return (
    <div className="p-6 border-b">
      <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
        {steps.map((step, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          const isClickable = idx <= currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <button
                onClick={() => isClickable && onStepClick(idx)}
                disabled={!isClickable}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                  ${isCompleted 
                    ? "text-white" 
                    : isActive 
                    ? "text-white" 
                    : "bg-gray-200 text-gray-500"
                  }
                  ${isClickable ? "cursor-pointer hover:scale-105" : "cursor-not-allowed"}
                `}
                style={{
                  backgroundColor: isCompleted || isActive 
                    ? theme.primary_color || "#3B82F6" 
                    : undefined
                }}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </button>

              {/* Step Label */}
              <span className={`ml-3 text-sm font-medium hidden sm:block ${
                isActive ? "text-gray-900" : "text-gray-500"
              }`}>
                {resolveTranslated(step.label, lang)}
              </span>

              {/* Connector Line */}
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  isCompleted ? "" : "bg-gray-200"
                }`} style={{
                  backgroundColor: isCompleted ? theme.primary_color || "#3B82F6" : undefined
                }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// SERVICE SELECTOR COMPONENT
// =============================================================================
function ServiceSelector({
  tenantId,
  domain,
  settings,
  selectedCategory,
  selectedService,
  selectedStaff,
  onCategorySelect,
  onServiceSelect,
  onStaffSelect,
  theme,
  lang,
  isRTL,
}) {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState("services"); // services | staff

  // Fetch services — ✅ FILTERED to bookable types only
  useEffect(() => {
    async function fetchServices() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `${API_BASE}/api/v1/public-services/`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Tenant": domain,
            },
          }
        );
    
        if (res.ok) {
          const data = await res.json();
          const servicesData = data.services || data.results || data || [];

          // ── CORE CHANGE: only show online/booking services ──
          const bookable = filterBookableServices(servicesData);
          setServices(bookable);

          // Extract unique categories from filtered services
          const categoryMap = new Map();
          bookable.forEach(service => {
            if (service.category?.id) {
              categoryMap.set(service.category.id, service.category);
            }
          });
          setCategories(Array.from(categoryMap.values()));
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
        setServices(filterBookableServices(MOCK_SERVICES));
        setCategories(["Massage", "Facial", "Body Treatment"]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchServices();
  }, [domain, tenantId]);

  // Fetch staff when service is selected
  useEffect(() => {
    async function fetchStaff() {
      if (!selectedService || !settings.show_staff_selection) return;

      setIsLoading(true);

      try {
        const res = await fetch(
          `${API_BASE}/api/v1/providers/public_provider/?service=${selectedService.id}`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Tenant": domain,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to fetch providers");

        const data = await res.json();
        setStaff(data.results || data);
        setView("staff");
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setStaff([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStaff();
  }, [selectedService, domain, settings.show_staff_selection]);
  
  // Filter services by category
  const filteredServices = selectedCategory
    ? services.filter(s => s.category?.id === selectedCategory.id)
    : services;


  if (isLoading) {
    return <ServiceSelectorSkeleton />;
  }

  // Staff Selection View
  if (view === "staff" && settings.show_staff_selection && selectedService) {
    return (
      <div className="p-6">
        {/* Back to Services */}
        <button
          onClick={() => {
            setView("services");
            onServiceSelect(null);
          }}
          className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <svg className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {resolveTranslated({ en: "Back to Services", ar: "العودة للخدمات", ur: "سروسز پر واپس" }, lang)}
        </button>

        {/* Selected Service Summary */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-500">
            {resolveTranslated({ en: "Selected Service", ar: "الخدمة المختارة", ur: "منتخب سروس" }, lang)}
          </p>
          <p className="font-semibold text-gray-900">
            {resolveTranslated(selectedService.title || selectedService.name, lang)}
          </p>
         <p className="text-sm text-gray-600">
          {selectedService.duration_minutes} min •
          {formatCurrency(
            selectedService.base_price || selectedService.price,
            selectedService.currency || currency
          )}
        </p>
        </div>

        {/* Staff Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {resolveTranslated({ en: "Choose Service Expert", ar: "اختر خبير الخدمة", ur: "اپنا تھراپسٹ منتخب کریں" }, lang)}
        </h3>

        {/* Any Available Option */}
        <button
          onClick={() => onStaffSelect(null)}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl mb-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <p className="font-medium text-gray-700">
            {resolveTranslated({ en: "No Preference", ar: "لا تفضيل", ur: "کوئی ترجیح نہیں" }, lang)}
          </p>
          <p className="text-sm text-gray-500">
            {resolveTranslated({ en: "First available", ar: "أول متاح", ur: "پہلا دستیاب" }, lang)}
          </p>
        </button>

      {/* Staff Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {staff.map((member) => (
          <button
            key={member.id}

            disabled={!member.integrations_ready}

            onClick={() => {

              if (!member.integrations_ready) {

                onIntegrationBlocked?.(
                  member.integration_check
                );

                return;
              }

              onStaffSelect(member);
            }}

            className={`
              p-4 rounded-xl border-2 text-left transition-all
              ${
                !member.integrations_ready
                  ? "opacity-50 cursor-not-allowed border-red-200 bg-red-50"
                  : selectedStaff?.id === member.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              }
            `}
          >
              <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                {member.photo ? (
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                    style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
                  >
                    {member.name?.charAt(0)}
                  </div>
                )}
                <div className={isRTL ? "text-right" : ""}>
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.specialization || member.role}</p>
                  {!member.integrations_ready && (
                    <div className="mt-2 text-xs text-red-600 font-medium">
                      Google Calendar not connected
                    </div>
                  )}
                  {member.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-sm text-gray-600">{member.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Services View
  return (
    <div className="p-6">
      {/* Category Tabs */}
      {settings.show_categories && categories.length > 0 && (
        <div className={`flex gap-2 mb-6 overflow-x-auto pb-2 ${isRTL ? "flex-row-reverse" : ""}`}>
          <button
            onClick={() => onCategorySelect(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
               selectedCategory === null
                ? "text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            style={{
              backgroundColor: selectedCategory === null ? theme.primary_color || "#3B82F6" : undefined
            }}
          >
            {resolveTranslated({ en: "All Services", ar: "جميع الخدمات", ur: "تمام سروسز" }, lang)}
          </button>
          
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory?.id === cat.id
                  ? "text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              style={{
                backgroundColor: selectedCategory?.id === cat.id ? theme.primary_color || "#3B82F6" : undefined
              }}
            >
              {resolveTranslated(cat.name, lang)}
            </button>
          ))}
        </div>
      )}

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            isSelected={selectedService?.id === service.id}
            onSelect={() => onServiceSelect(service)}
            showPrice={settings.show_price !== false}
            showDuration={settings.show_duration !== false}
            showImage={settings.theme?.show_images !== false}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500">
            {resolveTranslated({ en: "No services found", ar: "لم يتم العثور على خدمات", ur: "کوئی سروس نہیں ملی" }, lang)}
          </p>
        </div>
      )}
    </div>
  );
}
 
// =============================================================================
// SERVICE CARD COMPONENT
// =============================================================================
function ServiceCard({ service, isSelected, onSelect, showPrice, showDuration, showImage, theme, lang, isRTL }) {
  const title = resolveTranslated(service.title || service.name, lang);
  const description = resolveTranslated(service.short_description, lang);
  // const price = resolveTranslated(service.base_price || service.price_label, lang);
  const price = formatCurrency(
      service.base_price || service.price,
      service.currency || currency
    );

  return (
    <button
      onClick={onSelect}
      className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className={`flex gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
        {/* Image */}
        {showImage && service.image && (
          <img
            src={service.image}
            alt={title}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        )}

        {/* Content */}
        <div className={`flex-1 ${isRTL ? "text-right" : ""}`}>
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{description}</p>
          )}

          <div className={`flex items-center gap-3 text-sm ${isRTL ? "flex-row-reverse" : ""}`}>
            {showPrice && price && (
              <span 
                className="font-semibold"
                style={{ color: theme.primary_color || "#3B82F6" }}
              >
                {price}
              </span>
            )}
            
            {showDuration && service.duration_minutes && (
              <span className="text-gray-400">
                {service.duration_minutes} min
              </span>
            )}
          </div>
        </div>

        {/* Selection Indicator */}
        <div className={`flex-shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`}>
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-white"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </button>
  );
}

// =============================================================================
// CUSTOMER FORM COMPONENT
// =============================================================================
function CustomerForm({ customerData, onDataChange, onSubmit, theme, lang, isRTL }) {
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    onDataChange({ ...customerData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!customerData.name?.trim()) {
      newErrors.name = resolveTranslated({ en: "Name is required", ar: "الاسم مطلوب", ur: "نام ضروری ہے" }, lang);
    }
    
    if (!customerData.email?.trim()) {
      newErrors.email = resolveTranslated({ en: "Email is required", ar: "البريد الإلكتروني مطلوب", ur: "ای میل ضروری ہے" }, lang);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = resolveTranslated({ en: "Invalid email", ar: "بريد إلكتروني غير صالح", ur: "غلط ای میل" }, lang);
    }
    
    if (!customerData.phone?.trim()) {
      newErrors.phone = resolveTranslated({ en: "Phone is required", ar: "الهاتف مطلوب", ur: "فون ضروری ہے" }, lang);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  const fields = [
    {
      id: "name",
      type: "text",
      label: { en: "Full Name", ar: "الاسم الكامل", ur: "پورا نام" },
      placeholder: { en: "Enter your full name", ar: "أدخل اسمك الكامل", ur: "اپنا پورا نام درج کریں" },
      required: true,
    },
    {
      id: "email",
      type: "email",
      label: { en: "Email Address", ar: "البريد الإلكتروني", ur: "ای میل ایڈریس" },
      placeholder: { en: "your@email.com", ar: "your@email.com", ur: "your@email.com" },
      required: true,
    },
    {
      id: "phone",
      type: "tel",
      label: { en: "Phone Number", ar: "رقم الهاتف", ur: "فون نمبر" },
      placeholder: { en: "+1 (555) 123-4567", ar: "+966 50 123 4567", ur: "+92 300 1234567" },
      required: true,
    },
    {
      id: "notes",
      type: "textarea",
      label: { en: "Special Requests (Optional)", ar: "طلبات خاصة (اختياري)", ur: "خصوصی درخواستیں (اختیاری)" },
      placeholder: { en: "Any allergies, preferences, or special requests...", ar: "أي حساسية أو تفضيلات أو طلبات خاصة...", ur: "کوئی الرجی، ترجیحات، یا خصوصی درخواستیں..." },
      required: false,
    },
  ];

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
        {resolveTranslated({ en: "Your Information", ar: "معلوماتك", ur: "آپ کی معلومات" }, lang)}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.id}>
            <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? "text-right" : ""}`}>
              {resolveTranslated(field.label, lang)}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {field.type === "textarea" ? (
              <textarea
                value={customerData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={resolveTranslated(field.placeholder, lang)}
                rows={3}
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:border-transparent ${
                  errors[field.id] ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                } ${isRTL ? "text-right" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            ) : (
              <input
                type={field.type}
                value={customerData[field.id] || ""}
                onChange={(e) => handleChange(field.id, e.target.value)}
                placeholder={resolveTranslated(field.placeholder, lang)}
                className={`w-full px-4 py-3 rounded-xl border transition-colors focus:ring-2 focus:border-transparent ${
                  errors[field.id] ? "border-red-300 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
                } ${isRTL ? "text-right" : ""}`}
                dir={isRTL ? "rtl" : "ltr"}
              />
            )}
            
            {errors[field.id] && (
              <p className={`mt-1 text-sm text-red-500 ${isRTL ? "text-right" : ""}`}>
                {errors[field.id]}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full py-4 text-white rounded-xl font-semibold text-lg mt-6 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {resolveTranslated({ en: "Continue", ar: "متابعة", ur: "جاری رکھیں" }, lang)}
        </button>
      </form>
    </div>
  );
}

// =============================================================================
// CONFIRM AND PAY COMPONENT
// =============================================================================
function ConfirmAndPay({
    tenantId,
    domain,
    service,
    staff,
    date,
    time,
    customer,
    settings,
    bookingResult,
    setBookingResult,
    isLoading,
    onConfirm,
    timezone,
    onReset,
    theme,
    lang,
    isRTL,
    booking,
  }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isPaying, setIsPaying] = useState(false);
    const [error, setError] = useState(null);


    const handlePay = async () => {
    if (!stripe || !elements) return;

    setIsPaying(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message);
      setIsPaying(false);
      return;
    }

    clearBookingState(domain);

    // ✅ Do NOT use backend response
    setBookingResult({
      status: "processing",
      booking_id: booking.id,
    });

    setIsPaying(false);
  };

  // Success State
  if (bookingResult) {
    return (
      <div className="p-6 text-center">
        <div 
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-4xl"
          style={{ backgroundColor: "#10B981" }}
        >
          ✓
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {resolveTranslated({ en: "Booking Confirmed!", ar: "تم تأكيد الحجز!", ur: "بکنگ کی تصدیق!" }, lang)}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {resolveTranslated({ 
            en: "A confirmation email has been sent to your email address.", 
            ar: "تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.", 
            ur: "آپ کے ای میل ایڈریس پر تصدیقی ای میل بھیج دی گئی ہے۔" 
          }, lang)}
        </p>

        {/* Booking Details Card */}
        <div className="bg-gray-50 rounded-2xl p-6 max-w-md mx-auto mb-6 text-left">
          <div className="space-y-3">
            <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-gray-500">
                {resolveTranslated({ en: "Booking ID", ar: "رقم الحجز", ur: "بکنگ آئی ڈی" }, lang)}
              </span>
              <span className="font-semibold text-gray-900">
                {bookingResult.booking_id || bookingResult.id || bookingResult.booking_number || "—"}
              </span>
            </div>
            
            <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-gray-500">
                {resolveTranslated({ en: "Service", ar: "الخدمة", ur: "سروس" }, lang)}
              </span>
              <span className="font-semibold text-gray-900">
                {resolveTranslated(service?.title || service?.name, lang)}
              </span>
            </div>
            
            <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
              <span className="text-gray-500">
                {resolveTranslated({ en: "Date & Time", ar: "التاريخ والوقت", ur: "تاریخ اور وقت" }, lang)}
              </span>
              <span className="font-semibold text-gray-900">
                {formatDate(date, lang, timezone)} • {formatTime(time)}
              </span>
            </div>
            
            {staff && (
              <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
                <span className="text-gray-500">
                  {resolveTranslated({ en: "Therapist", ar: "المعالج", ur: "تھراپسٹ" }, lang)}
                </span>
                <span className="font-semibold text-gray-900">{staff.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`flex flex-wrap gap-4 justify-center ${isRTL ? "flex-row-reverse" : ""}`}>
        
        {bookingResult.meeting_url && (
          <a
            href={bookingResult.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "#10B981" }}
          >
            {resolveTranslated(
              { en: "Join Meeting", ar: "الانضمام للاجتماع", ur: "میٹنگ میں شامل ہوں" },
              lang
            )}
          </a>
        )}

        {/* TODO: Escrow integration handled in backend (Django)
             For milestone bookings, show "View Project" button that
             routes to ProjectDashboard instead of booking details. */}
        {bookingResult.project_id ? (
          <a
            href={`/projects/${bookingResult.project_id}`}
            className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {resolveTranslated({ en: "View Project", ar: "عرض المشروع", ur: "پروجیکٹ دیکھیں" }, lang)}
          </a>
        ) : (
          <button
            onClick={onReset}
            className="px-6 py-3 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
          >
            {resolveTranslated({ en: "Book Another", ar: "حجز آخر", ur: "ایک اور بک کریں" }, lang)}
          </button>
        )}

        <a
          href={`/booking/id/${bookingResult.booking_id || bookingResult.id}`}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          {resolveTranslated({ en: "View Details", ar: "عرض التفاصيل", ur: "تفصیلات دیکھیں" }, lang)}
        </a>
      </div>

      </div>
    );
  }

  // Confirmation Form
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
        {resolveTranslated({ en: "Review Your Booking", ar: "مراجعة حجزك", ur: "اپنی بکنگ کا جائزہ لیں" }, lang)}
      </h3>

      {/* Booking Summary */}
      <div className="bg-gray-50 rounded-2xl p-6 max-w-lg mx-auto mb-6">
        {/* Service */}
        <div className={`flex gap-4 mb-6 pb-6 border-b ${isRTL ? "flex-row-reverse" : ""}`}>
          {service?.image && (
            <img
              src={service.image}
              alt={resolveTranslated(service.title || service.name, lang)}
              className="w-20 h-20 rounded-xl object-cover"
            />
          )}
          <div className={isRTL ? "text-right" : ""}>
            <h4 className="font-semibold text-gray-900 text-lg">
              {resolveTranslated(service?.title || service?.name, lang)}
            </h4>
            <p className="text-gray-500">{service?.duration_minutes} min</p>
            {staff && (
              <p className="text-sm text-gray-600">
                {resolveTranslated({ en: "with", ar: "مع", ur: "کے ساتھ" }, lang)} {staff.name}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <DetailRow
            label={resolveTranslated({ en: "Date", ar: "التاريخ", ur: "تاریخ" }, lang)}
            value={formatDate(date, lang, timezone)}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Time", ar: "الوقت", ur: "وقت" }, lang)}
            value={formatTime(time)}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Name", ar: "الاسم", ur: "نام" }, lang)}
            value={customer.name}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Email", ar: "البريد", ur: "ای میل" }, lang)}
            value={customer.email}
            isRTL={isRTL}
          />
          
          <DetailRow
            label={resolveTranslated({ en: "Phone", ar: "الهاتف", ur: "فون" }, lang)}
            value={customer.phone}
            isRTL={isRTL}
          />
        </div>

        {/* Price Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="text-lg font-semibold text-gray-900">
              {resolveTranslated({ en: "Total", ar: "المجموع", ur: "کل" }, lang)}
            </span>
            <span
            className="text-2xl font-bold"
            style={{ color: theme.primary_color || "#3B82F6" }}
          >
            {formatCurrency(
              service?.base_price || service?.price,
              service?.currency || currency
            )}
          </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="max-w-lg mx-auto mb-6 p-4 bg-yellow-50 rounded-xl">
          <p className={`text-sm text-yellow-800 ${isRTL ? "text-right" : ""}`}>
            <strong>{resolveTranslated({ en: "Special Requests:", ar: "طلبات خاصة:", ur: "خصوصی درخواستیں:" }, lang)}</strong>{" "}
            {customer.notes}
          </p>
        </div>
      )}

      {/* Terms */}
      <div className="max-w-lg mx-auto mb-6">
        <label className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          <input
            type="checkbox"
            id="terms"
            className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={`text-sm text-gray-600 ${isRTL ? "text-right" : ""}`}>
            {resolveTranslated({
              en: "I agree to the cancellation policy and terms of service",
              ar: "أوافق على سياسة الإلغاء وشروط الخدمة",
              ur: "میں کینسلیشن پالیسی اور سروس کی شرائط سے متفق ہوں"
            }, lang)}
          </span>
        </label>
      </div>

      {/* Confirm Button */}
      <div className="max-w-lg mx-auto mb-6">
         <PaymentElement />
        <button
          onClick={handlePay}
          disabled={!stripe || isPaying}
          className="w-full py-4 text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          style={{ backgroundColor: theme.primary_color || "#3B82F6" }}
        >
          {isPaying ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {resolveTranslated({ en: "Processing...", ar: "جاري المعالجة...", ur: "پروسیسنگ..." }, lang)}
            </>
          ) : ( 
            <>
              {resolveTranslated({ en: "Confirm & Pay", ar: "تأكيد الحجز", ur: "بکنگ کی تصدیق" }, lang)}
            </>
          )}
        </button>
        {error && (
          <div className="max-w-lg mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mt-4">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}



// =============================================================================
// CONFIRM AND PAY — HYPERPAY VARIANT
// =============================================================================
function ConfirmAndPayHyperPay({
  booking,
  hyperPayData,
  domain,
  service,
  staff,
  date,
  time,
  customer,
  settings,
  timezone,
  onReset,
  theme,
  lang,
  isRTL,
}) {
  /**
   * HyperPay payment is redirect-based:
   * - We show the booking summary
   * - We render the HyperPay widget (loads external JS)
   * - Customer fills card details IN the widget
   * - On submit → HyperPay handles 3DS and redirects to callback
   * - Callback page verifies and shows success/failure
   *
   * No stripe.confirmPayment() — the widget handles everything.
   */
  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
        {resolveTranslated({ en: "Review & Pay", ar: "مراجعة والدفع", ur: "جائزہ اور ادائیگی" }, lang)}
      </h3>
 
      {/* Booking Summary (reuse same layout as Stripe variant) */}
      <div className="bg-gray-50 rounded-2xl p-6 max-w-lg mx-auto mb-6">
        <div className={`flex gap-4 mb-6 pb-6 border-b ${isRTL ? "flex-row-reverse" : ""}`}>
          {service?.image && (
            <img
              src={service.image}
              alt={resolveTranslated(service.title || service.name, lang)}
              className="w-20 h-20 rounded-xl object-cover"
            />
          )}
          <div className={isRTL ? "text-right" : ""}>
            <h4 className="font-semibold text-gray-900 text-lg">
              {resolveTranslated(service?.title || service?.name, lang)}
            </h4>
            <p className="text-gray-500">{service?.duration_minutes} min</p>
            {staff && (
              <p className="text-sm text-gray-600">
                {resolveTranslated({ en: "with", ar: "مع", ur: "کے ساتھ" }, lang)} {staff.name}
              </p>
            )}
          </div>
        </div>
 
        <div className="space-y-3">
          <DetailRow
            label={resolveTranslated({ en: "Date", ar: "التاريخ", ur: "تاریخ" }, lang)}
            value={formatDate(date, lang, timezone)}
            isRTL={isRTL}
          />
          <DetailRow
            label={resolveTranslated({ en: "Time", ar: "الوقت", ur: "وقت" }, lang)}
            value={formatTime(time)}
            isRTL={isRTL}
          />
          <DetailRow
            label={resolveTranslated({ en: "Name", ar: "الاسم", ur: "نام" }, lang)}
            value={customer.name}
            isRTL={isRTL}
          />
        </div>
 
        <div className="mt-6 pt-6 border-t">
          <div className={`flex justify-between items-center ${isRTL ? "flex-row-reverse" : ""}`}>
            <span className="text-lg font-semibold text-gray-900">
              {resolveTranslated({ en: "Total", ar: "المجموع", ur: "کل" }, lang)}
            </span>
            <span
              className="text-2xl font-bold"
              style={{ color: theme.primary_color || "#3B82F6" }}
            >
              {formatCurrency(
                service?.base_price || service?.price,
                service?.currency || currency
              )}
            </span>
          </div>
        </div>
      </div>
 
      {/* HyperPay Widget */}
      <div className="max-w-lg mx-auto">
        <HyperPayWidget
          checkoutId={hyperPayData.checkout_id}
          widgetUrl={hyperPayData.widget_url}
          brands={hyperPayData.brands}
          callbackUrl={hyperPayData.callback_url}
          lang={lang}
          isRTL={isRTL}
          theme={theme}
        />
      </div>
    </div>
  );
}



// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function DetailRow({ label, value, isRTL }) {
  return (
    <div className={`flex justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function ServiceSelectorSkeleton() {
  return (
    <div className="p-6">
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(time) {
  if (!time) return "";
  
  if (typeof time === "string") {
    if (time.includes("AM") || time.includes("PM")) return time;
    
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  }
  
  return time;
}

function formatDate(dateValue, lang = "en", timezone = "UTC") {
  if (!dateValue) return "";

  let y, m, d;

  if (dateValue instanceof Date) {
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(dateValue);

    [y, m, d] = formatted.split("-");
  }
  else if (typeof dateValue === "string") {
    [y, m, d] = dateValue.split("-");
  } else {
    return "";
  }

  const locale =
    lang === "ar" ? "ar-SA" :
    lang === "ur" ? "ur-PK" :
    "en-US";

  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}


async function createBooking({ domain, service, staff, date, time, customer, timezone }) {
  // date is ALREADY "YYYY-MM-DD" — no conversion needed whatsoever
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format");
  }

  const payload = {
    service: service.id,
    provider: staff?.id || null,
    scheduled_date: date,   // "YYYY-MM-DD" — backend parses in tenant TZ
    scheduled_time: time,   // "HH:MM"     — backend uses as-is
    customer_name:  customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    customer_notes: customer.notes || "",
  };

  return await apiFetch(
    "/api/v1/bookings/",
    domain,
    {
      method: "POST",

      body: JSON.stringify(payload),
    }
  );
  // const res = await fetch(`${API_BASE}/api/v1/bookings/`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json", "X-Tenant": domain },
  //   body: JSON.stringify(payload),
  // });

  // if (!res.ok) {
  //   const err = await res.json().catch(() => ({}));
  //   throw new Error(err.detail || "Failed to create booking");
  // }

  // return res.json();
}


const MOCK_SERVICES = [
  {
    id: "srv_1",
    title: { en: "Swedish Massage", ar: "التدليك السويدي", ur: "سویڈش مساج" },
    description: { en: "Classic relaxation massage using long, flowing strokes.", ar: "تدليك استرخاء كلاسيكي باستخدام حركات طويلة وسلسة.", ur: "لمبے، بہتے ہوئے اسٹروکس کا استعمال کرتے ہوئے کلاسک ریلیکسیشن مساج۔" },
    price: { en: "$89", ar: "89$", ur: "$89" },
    duration_minutes: 60,
    category: "Massage",
    order_type: "online",
    image: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=400",
  },
  {
    id: "srv_2",
    title: { en: "Deep Tissue Massage", ar: "تدليك الأنسجة العميقة", ur: "ڈیپ ٹشو مساج" },
    description: { en: "Targeted pressure techniques to reach deeper muscle layers.", ar: "تقنيات ضغط مستهدفة للوصول إلى طبقات العضلات العميقة.", ur: "گہری پٹھوں کی تہوں تک پہنچنے کے لیے ٹارگٹڈ پریشر تکنیک۔" },
    price: { en: "$109", ar: "109$", ur: "$109" },
    duration_minutes: 60,
    category: "Massage",
    order_type: "online",
    image: "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400",
  },
  {
    id: "srv_3",
    title: { en: "Signature Luxe Facial", ar: "فيشال لوكس المميز", ur: "سگنیچر لکس فیشل" },
    description: { en: "Our bestselling facial combines deep cleansing, exfoliation, and LED therapy.", ar: "فيشالنا الأكثر مبيعاً يجمع التنظيف العميق والتقشير والعلاج بالضوء LED.", ur: "ہمارا بیسٹ سیلنگ فیشل ڈیپ کلینزنگ، ایکسفولیئشن، اور LED تھراپی کو یکجا کرتا ہے۔" },
    price: { en: "$129", ar: "129$", ur: "$129" },
    duration_minutes: 75,
    category: "Facial",
    order_type: "online",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400",
  },
  {
    id: "srv_4",
    title: { en: "Hot Stone Massage", ar: "تدليك الأحجار الساخنة", ur: "ہاٹ سٹون مساج" },
    description: { en: "Heated basalt stones placed on key points while massage techniques melt away tension.", ar: "أحجار البازلت الساخنة توضع على نقاط رئيسية بينما تقنيات التدليك تذيب التوتر.", ur: "گرم بیسالٹ پتھر کلیدی پوائنٹس پر رکھے جاتے ہیں جبکہ مساج تکنیک تناؤ کو پگھلا دیتی ہے۔" },
    price: { en: "$149", ar: "149$", ur: "$149" },
    duration_minutes: 90,
    category: "Massage",
    order_type: "online",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
  },
];

const MOCK_STAFF = [
  {
    id: "staff_1",
    name: "Sarah Johnson",
    role: "Senior Massage Therapist",
    specialization: "Deep Tissue, Swedish",
    rating: 4.9,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  },
  {
    id: "staff_2",
    name: "Michael Chen",
    role: "Licensed Esthetician",
    specialization: "Facials, Skincare",
    rating: 4.8,
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
  },
  {
    id: "staff_3",
    name: "Emily Rodriguez",
    role: "Massage Therapist",
    specialization: "Hot Stone, Aromatherapy",
    rating: 4.7,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
  },
];