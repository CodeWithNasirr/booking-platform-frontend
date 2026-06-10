"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  Building2,
  Briefcase,
  Users,
  CalendarClock,
  Globe,
  Layout,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Trash2,
} from "lucide-react";

import { Button } from "@/app/ui/button";
import { Progress } from "@/app/ui/progress";
import { Card } from "@/app/ui/card";

import { useApp } from "@/contexts/AppContext";

import Step1_Business from "./steps/Step1_Business";
import Step2_Services from "./steps/Step2_Services";
import Step3_Provider from "./steps/Step3_Provider";
import Step4_Availability from "./steps/Step4_Availability";
import Step5_DomainTemplate from "./steps/Step5_DomainTemplate";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";


import Cookies from "js-cookie";
import { apiFetch } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { formatDynamicAPIAccesses } from "next/dist/server/app-render/dynamic-rendering";
// import { useApp } from "@/contexts/AppContext"; // if you need it later

// Map backend onboarding_step -> wizard step (1–5) so user resumes correctly
function mapBackendStepToWizardStep(onboardingStep) {
  if (!onboardingStep || onboardingStep <= 1) return 1; // only verified
  if (onboardingStep === 2) return 2; // business done → services
  if (onboardingStep === 3) return 3; // services done → provider
  if (onboardingStep === 4) return 4; // provider done → availability
  // 5 (availability / branding) or 6 (domain-template) or 7+ → go to last step in wizard
  return 5;
}

export default function OnboardingWizard({ tenant }) {
  const normalizedTenant = Array.isArray(tenant) ? tenant[0] : tenant;
  const [tenantState, setTenantState] = useState(normalizedTenant);
  const router = useRouter();
  const token = Cookies.get("access_token");
    // console.log("OnboardingWizard tenant:", normalizedTenant);

  const { t, isRTL,user,tenants,authInitialized,loadingUser,activeTenant } = useApp();


  useEffect(() => {
    console.log("ONBOARDING PAGE");

    console.log({
      authInitialized,
      loadingUser,
      user,
      activeTenant,
      tenantsLength: tenants.length,
    });

    if (!authInitialized) return;

    if (!user) {
      console.log("ONBOARDING REDIRECT LOGIN");
      router.replace("/auth/login");
      return;
    }

  }, [
    authInitialized,
    user,
    loadingUser,
    tenants,
    activeTenant
  ]);


  useEffect(() => {
    if (normalizedTenant) {
      setTenantState(normalizedTenant);
    }
  }, [normalizedTenant]);

  function flattenErrors(errors, parentKey = "") {
  let messages = [];

  if (Array.isArray(errors)) {
    errors.forEach((item, index) => {
      if (typeof item === "string") {
        messages.push(`${parentKey}: ${item}`);
      } else {
        messages.push(
          ...flattenErrors(item, `${parentKey}[${index}]`)
        );
      }
    });
  } else if (typeof errors === "object" && errors !== null) {
    Object.entries(errors).forEach(([key, value]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      messages.push(...flattenErrors(value, fullKey));
    });
  }

  return messages;
}

  

  // ------------------------------------------------------
  // STEP SETUP
  // ------------------------------------------------------
  const steps = [
    { id: 1, name: "Business Info", icon: Building2 },
    { id: 2, name: "Services", icon: Briefcase },
    { id: 3, name: "Provider", icon: Users },
    { id: 4, name: "Availability", icon: CalendarClock },
    { id: 5, name: "Domain & Template", icon: Globe },
  ];

  const [currentStep, setCurrentStep] = useState(
    mapBackendStepToWizardStep(tenantState?.onboarding_step)
  );

  function normalizeStep(step, tenantState) {
    // Skip provider step for individual tenants
    if (step === 3 && tenantState?.has_providers === false) {
      return 4;
    }

    // Enforce backend onboarding progress
    const minStep = mapBackendStepToWizardStep(
      tenantState?.onboarding_step
    );

    if (step < minStep) return minStep;

    return step;
  }

  const minStep = mapBackendStepToWizardStep(
    tenantState?.onboarding_step
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stepInUrl = Number(params.get("step") || 1);

    if (stepInUrl !== currentStep) {
      params.set("step", currentStep);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    }
  }, [currentStep]);




    useEffect(() => {
    const savedProviderId = localStorage.getItem("provider_id");
    if (savedProviderId) {
        setProviderId(savedProviderId);
    }
    }, []);





  const progress = (currentStep / steps.length) * 100;

  useEffect(() => {
    if (!tenantState) return;

    const backendStep = mapBackendStepToWizardStep(
      tenantState.onboarding_step
    );

    setCurrentStep(
      normalizeStep(backendStep, tenantState)
    );

    // If individual owner → provider already exists in backend
    if (tenantState.has_providers === false) {
      apiFetch(
      "/api/v1/providers/me/",
      tenantState.id,
      {
        method: "GET",
      }
    )
      .then((data) => {
        if (data?.id) {
          setProviderId(data.id);
          localStorage.setItem("provider_id", data.id);
        }
      })
      .catch(console.error);
        }


  }, [tenantState]);


  // ------------------------------------------------------
  // FORM DATA
  // ------------------------------------------------------
  const [formData, setFormData] = useState({
    // business
    businessName: "",
    business_type: "",
    address: "",
    city: "",
    country: "",
    timezone: "",
    currency: "",

    // provider
    providerName: "",
    providerEmail: "",
    providerPhone: "",
    assignAllServices: true,

    // domain/template
    subdomain: "",
    customDomain: "",
    selectedTemplate: "",
  });

  const updateFormData = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // Prefill business + template details from tenant settings when editing
  useEffect(() => {
    if (!tenantState) return;

    const business = tenantState.settings?.business || {};
    const template = tenantState.settings?.template || {};

    setFormData((prev) => ({
      ...prev,
      businessName: business.business_name || tenantState.name || "",
      business_type: business.business_type || "",
      address: business.address || "",
      city: business.city || "",
      country: business.country || "",
      currency: business.currency || "",
      timezone: business.timezone || tenantState.timezone || "",

      selectedTemplate: template.selected || "",
    }));
  }, [tenantState]);

  // ------------------------------------------------------
  // SERVICES STATE
  // ------------------------------------------------------
  const [services, setServices] = useState([
    { id: 1, name: "", duration_minutes: 30, price: "", category: "" },
  ]);

  const addService = () =>
    setServices((prev) => [
      ...prev,
      { id: Date.now(), name: "", duration_minutes: 30, price: "", category: "" },
    ]);

  const updateService = (id, key, value) =>
    setServices((prev) =>
      prev.map((srv) => (srv.id === id ? { ...srv, [key]: value } : srv))
    );

  const removeService = (id) =>
    setServices((prev) => prev.filter((srv) => srv.id !== id));

  // ------------------------------------------------------
  // AVAILABILITY STATE
  // ------------------------------------------------------
  const daysOfWeek = [
    { id: "mon", label: "Monday" },
    { id: "tue", label: "Tuesday" },
    { id: "wed", label: "Wednesday" },
    { id: "thu", label: "Thursday" },
    { id: "fri", label: "Friday" },
    { id: "sat", label: "Saturday" },
    { id: "sun", label: "Sunday" },
  ];

  const [weeklySchedule, setWeeklySchedule] = useState(
    Object.fromEntries(
      daysOfWeek.map((d) => [
        d.id,
        { enabled: d.id !== "sun", start: "09:00", end: "18:00" },
      ])
    )
  );

  const toggleDay = (day) =>
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled: !prev[day].enabled },
    }));

  const updateScheduleTime = (day, key, value) =>
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: value },
    }));

  // Provider id needed for availability step
  const [providerId, setProviderId] = useState(null);
  

  function buildPayload(step) {
    if (step === 2) {
      return {
        services: services.map((srv) => ({
          name: srv.name,
          description: "",
          duration_minutes: Number(srv.duration_minutes),
          price: Number(srv.price || 0),
          category: srv.category || "General",
        })),
      };
    }

    if (step === 3) {
      return {
        name: formData.providerName,
        email: formData.providerEmail,
        phone: formData.providerPhone,
        assign_all_services: formData.assignAllServices,
      };
    }

    if (step === 4) {
      if (!providerId) {
        // Allow backend to auto-detect owner provider
        return {
          availability_slots: Object.keys(weeklySchedule)
            .filter((d) => weeklySchedule[d].enabled)
            .map((d) => ({
              day_of_week: daysOfWeek.findIndex((x) => x.id === d),
              start_time: weeklySchedule[d].start,
              end_time: weeklySchedule[d].end,
            })),
        };
      }

      return {
        provider_id: providerId,
        availability_slots: Object.keys(weeklySchedule)
        .filter((d) => weeklySchedule[d].enabled)
        .map((d) => ({
          day_of_week: daysOfWeek.findIndex((x) => x.id === d),
          start_time: weeklySchedule[d].start,
          end_time: weeklySchedule[d].end,
        })),
      };
    }


    if (step === 5) {
      return {
        subdomain: formData.subdomain,
        custom_domain: formData.customDomain || "",
        template_slug: formData.selectedTemplate,
        selected_layout: formData.selectedLayout,
      };
    }

    return null;
  }


  // ------------------------------------------------------
  // SAVE STEP → NEW BACKEND APIS
  // ------------------------------------------------------
  async function saveStep() {
    if (!token) return alert("Login required");
    if (!tenantState?.id) {
      console.error("Tenant missing", tenantState);
      alert("Tenant not loaded");
      return;
    }

    let endpoint = "";
    let body;
    let headers = {
      Authorization: `Bearer ${token}`,
      "X-Tenant": tenantState.id,
    };

    // STEP 1 — FormData
    if (currentStep === 1) {
      endpoint = "/api/v1/onboarding/business-info/";

      const form = new FormData();
      form.append("business_name", formData.businessName);
      form.append("business_type", formData.business_type);
      form.append("timezone", formData.timezone);
      form.append("currency", formData.currency);
      form.append("tenant_mode", formData.tenant_mode);

      if (formData.business_document instanceof File) {
        form.append("business_document", formData.business_document);
      }

      body = form;
    }

    // STEP 2–5 — JSON
    else {
      headers["Content-Type"] = "application/json";

      endpoint =
        currentStep === 2
          ? "/api/v1/onboarding/services/"
          : currentStep === 3
          ? "/api/v1/onboarding/provider/"
          : currentStep === 4
          ? "/api/v1/onboarding/availability/"
          : "/api/v1/onboarding/domain-template/";

      body = JSON.stringify(buildPayload(currentStep));
    }

    let json;

    try {
      json =
        currentStep === 1
          ? await apiFetch(
              endpoint,
              tenantState.id,
              {
                method: "POST",
                headers: {},
                body,
              }
            )
          : await apiFetch(
              endpoint,
              tenantState.id,
              {
                method: "POST",
                body,
              }
            );
    } catch (err) {
      console.error(err);
      return;
    }

    if (json.tenant) {
      setTenantState((p) => ({ ...p, ...json.tenant }));
    }
    
    // Store provider id from step 3 response
    if (currentStep === 3 && json.provider?.id) {
      setProviderId(json.provider.id);
      localStorage.setItem("provider_id", json.provider.id); // ⭐ persist
    }

    // Final step → redirect to publishing animation
    if (currentStep === 5) {
      const domain = json.domain || "";
      router.push(
        `/auth/onboarding/publishing?${domain}`
      );
      return;
    }

    // Otherwise go to next step
    setCurrentStep((prev) =>
    normalizeStep(prev + 1, tenantState)
  );

  }

  // ------------------------------------------------------
  // RENDER
  // ------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-secondary p-6 md:p-10">

      <div className="max-w-5xl mx-auto">
        <div className={`absolute ${isRTL ? "left-4" : "right-4"}`}>
          <LanguageSwitcher />
        </div>
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            {t("onboarding.title")}
          </h1>

          <p className="text-foreground/70 text-lg">
            {t("onboarding.subtitle")}
          </p>
        </div>

        {/* PROGRESS SECTION */}
        <div className="mb-10">
          <Progress value={progress} className="h-2 mb-5 rounded-full" />

          <div
            className={`flex justify-between items-center ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isProviderStep = step.id === 3;

              const isCompleted = isProviderStep
                ? tenantState?.has_providers && currentStep > 3
                : currentStep > step.id;

              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={[
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md",
                        isCompleted
                          ? "bg-primary text-primary-foreground scale-105"
                          : isCurrent
                          ? "bg-accent text-primary scale-110 ring-2 ring-ring"
                          : "bg-secondary text-foreground/40",
                      ].join(" ")}
                    >
                      {isCompleted ? <Check /> : <Icon />}
                    </div>

                    <span
                      className={[
                        "text-sm mt-2 hidden md:block",
                        isCurrent
                          ? "text-primary font-semibold"
                          : "text-foreground/50",
                      ].join(" ")}
                    >
                      {t(`onboarding.steps.${step.id}`)}
                    </span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={[
                        "w-14 md:w-24 h-1 mx-2 rounded-full transition-all",
                        isCompleted ? "bg-primary" : "bg-border",
                      ].join(" ")}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN CARD */}
        <Card className="p-6 md:p-10 shadow-2xl rounded-3xl bg-background border border-border space-y-8">

          {currentStep === 1 && (
            <Step1_Business formData={formData} update={updateFormData} />
          )}

          {currentStep === 2 && (
            <Step2_Services
              services={services}
              addService={addService}
              updateService={updateService}
              removeService={removeService}
            />
          )}

          {currentStep === 3 && tenantState?.has_providers && (
            <Step3_Provider formData={formData} update={updateFormData} />
          )}

          {currentStep === 4 && (
            <Step4_Availability
              daysOfWeek={daysOfWeek}
              weeklySchedule={weeklySchedule}
              toggleDay={toggleDay}
              updateScheduleTime={updateScheduleTime}
              tenantState={tenantState}
            />
          )}

          {currentStep === 5 && (
            <Step5_DomainTemplate formData={formData} update={updateFormData} />
          )}

          {/* FOOTER BUTTONS */}
          <div
            className={`flex justify-between items-center mt-10 pt-6 border-t border-border ${
              isRTL ? "flex-row-reverse" : ""
            }`}
          >
            <Button
              variant="outline"
              disabled={currentStep <= minStep}
              onClick={() =>
                setCurrentStep((p) => normalizeStep(p - 1, tenantState))
              }
              className="rounded-xl px-6 py-3 border-border hover:bg-accent"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              {t("common.back")}
            </Button>

            <Button
              className="rounded-xl px-8 py-3 text-white shadow-lg hover:bg-accent"
              onClick={saveStep}
            >
              {currentStep === 5
                ? t("onboarding.complete")
                : t("common.continue")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );


}
