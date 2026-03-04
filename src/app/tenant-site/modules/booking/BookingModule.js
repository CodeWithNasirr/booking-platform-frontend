"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useTenantLang } from "../../contexts/TenantLangContext";
import { useTenantTheme } from "../../contexts/TenantThemeContext";

import StepsHeader from "./steps/StepsHeader";
import ServiceSelector from "./steps/ServiceSelector/ServiceSelector";
import DateTimePicker from "./steps/DateTimePicker";
import CustomerForm from "./steps/CustomerForm";
import ConfirmAndPay from "./steps/ConfirmAndPay";

import { fetchServiceBySlug } from "./utils/fetchServiceBySlug";
import { createBooking } from "./api/booking";
import { DEFAULT_STEPS } from "./utils/constants";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

export default function BookingModule({
  data,
  settings: propSettings,
  tenantId,
  domain,
  lang: propLang,
}) {
  const { language, isRTL } = useTenantLang();
  const theme = useTenantTheme();

  const lang = propLang || language;
  const settings = propSettings || data?.settings || {};
  const steps = settings.steps || DEFAULT_STEPS;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customerData, setCustomerData] = useState({});
  const [clientSecret, setClientSecret] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  const stepId = steps[currentStep]?.id;

  const next = () => setCurrentStep(s => s + 1);
  const back = () => setCurrentStep(s => Math.max(0, s - 1));

  useEffect(() => {
    if (!data?.preselected_service_slug) return;

    fetchServiceBySlug(data.preselected_service_slug, domain)
      .then(service => {
        setSelectedService(service);
        setCurrentStep(settings.show_staff_selection ? 0 : 1);
      });
  }, [data?.preselected_service_slug]);

  return (
    <div className={`booking-module ${isRTL ? "rtl" : ""}`}>
      <StepsHeader
        steps={steps}
        currentStep={currentStep}
        onStepClick={setCurrentStep}
        theme={theme}
        lang={lang}
        isRTL={isRTL}
      />

      {error && <div className="error-box">{error}</div>}

      {stepId === "service" && (
        <ServiceSelector
          domain={domain}
          settings={settings}
          selectedService={selectedService}
          selectedStaff={selectedStaff}
          onServiceSelect={setSelectedService}
          onStaffSelect={setSelectedStaff}
          onNext={next}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}

      {stepId === "datetime" && (
        <DateTimePicker
          domain={domain}
          service={selectedService}
          staff={selectedStaff}
          onDateSelect={setSelectedDate}
          onTimeSelect={(t) => {
            setSelectedTime(t);
            next();
          }}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}

      {stepId === "details" && (
        <CustomerForm
          customerData={customerData}
          onDataChange={setCustomerData}
          onSubmit={async () => {
            const booking = await createBooking({
              domain,
              service: selectedService,
              staff: selectedStaff,
              date: selectedDate,
              time: selectedTime,
              customer: customerData,
            });

            setBooking(booking);
            setClientSecret(booking.client_secret);
            next();
          }}
          theme={theme}
          lang={lang}
          isRTL={isRTL}
        />
      )}

      {stepId === "confirm" && clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <ConfirmAndPay
            booking={booking}
            bookingResult={bookingResult}
            domain={domain}
            onConfirm={setBookingResult}
            theme={theme}
            lang={lang}
            isRTL={isRTL}
          />
        </Elements>
      )}
    </div>
  );
}
