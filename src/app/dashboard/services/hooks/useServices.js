"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import Cookies from "js-cookie";
import { useBillingGate } from "@/lib/useBillingGate";
import { usePaymentGateway } from "@/lib/usePaymentGateway";
import { apiFetch } from "@/lib/apiClient";
export function useServices() {
  const { user, loadingUser, requiresOnboarding, activeTenant,t,isRTL } = useApp();
  const router = useRouter();
  const tenantId = activeTenant;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;
  

  // State
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [viewMode, setViewMode] = useState("active");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [activeTab, setActiveTab] = useState("basic");
  const [serviceCategories, setServiceCategories] = useState([]);
  const [deletedCount, setDeletedCount] = useState(0);
  const { handleGatewayError, GatewayGateModal } = usePaymentGateway({ autoLoad: false });
  const { handleBillingError, BillingGateModal } = useBillingGate();


  const [form, setForm] = useState({
    name: "",
    category_id: "",
    price: 0,
    duration: 60,
    description: "",
    short_description: "",
    isActive: true,
    serviceType: "online",
    orderType: "booking",
    pricingType: "fixed",
    // Subscription fields (Phase 2 model). billingType drives whether
    // this Service shows up in PricingTable's subscription source.
    billingType: "one_time",
    priceMonthly: null,
    priceYearly: null,
    trialDays: 0,
    autoRenewDefault: true,
    planFeatures: [],
    maxCapacity: 1,
    image: "",
    deliveryDays: 7,
    revisions: 1,
    packages: [],
    addons: [],
    availability: [],
    requirements: [],
  });

  // Auth guards
  useEffect(() => {
    if (!loadingUser && !user) router.replace("/");
  }, [loadingUser, user, router]);

  useEffect(() => {
    if (requiresOnboarding) router.replace("/auth/onboarding?step=1");
  }, [requiresOnboarding, router]);

  // API Helper
  const authFetch = async (url, options = {}) => {
    if (!tenantId) throw new Error("Tenant not ready");

    const token = Cookies.get("access_token");

    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Tenant": tenantId,
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const errorData = await res.json();

      // 🔥 STEP 1: gateway gate (ADD THIS)
      if (handleGatewayError(errorData)) {
        return;
      }

      // 🔥 STEP 2: billing gate
      if (handleBillingError(errorData)) {
        return;
      }

      const messages = Object.values(errorData)
        .filter((v) => Array.isArray(v))
        .flat();

      const error = new Error(messages.join("\n") || "Request failed");
      error.status = res.status;
      error.raw = errorData;
      throw error;
    }

    if (res.status === 204) return null;
    return res.json();
  };

  // Load services
  useEffect(() => {
    if (!user || !activeTenant) return;
    
    async function loadServices() {
      try {
        const endpoint =
          viewMode === "deleted"
            ? `/api/v1/services/deleted/`
            : `/api/v1/services/`;
        const data = await apiFetch(
          endpoint,
          tenantId
        );
        
        const normalized = (data.results || data).map((s) => ({
          id: s.id,
          slug: s.slug,
          name: s.name?.en || "",
          category: s.category_name?.en || s.category?.name?.en || "Uncategorized",
          category_id: s.category?.id || s.category || "",
          price: s.base_price,
          currency : s.currency,
          duration: s.duration_minutes || 0,
          description: s.description?.en || s.short_description?.en || "",
          isActive: s.is_active,
          serviceType: s.service_type,
          orderType: s.order_type,
          pricingType: s.pricing_type,
          billingType: s.billing_type || "one_time",
          priceMonthly: s.price_monthly,
          priceYearly: s.price_yearly,
          created_at: s.created_at,
          deleted_at: s.deleted_at,
          deliveryDays: s.default_delivery_days,
          image: s.image || "",
        }));

        setServices(normalized);
        
        if (viewMode === "active") {
          try {
            const deletedData = await apiFetch(`/api/v1/services/deleted/`,tenantId);
            setDeletedCount(deletedData.length || deletedData.results?.length || 0);
          } catch (e) {
            setDeletedCount(0);
          }
        }
      } catch (e) {
        console.error("Failed to load services", e);
      }
    }
    
    loadServices();
  }, [user, activeTenant, viewMode]);

  // Load categories
  useEffect(() => {
    if (!activeTenant) return;
    apiFetch(`/api/v1/service-categories/`,tenantId)
      .then((data) => setServiceCategories(data.results || []))
      .catch(() => setServiceCategories([]));
  }, [activeTenant]);

  // Filtered services
  const filtered = services.filter((s) => {
    const matchText =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || s.category === selectedCategory;
    return matchText && matchCat;
  });

  // Form handlers
  const resetForm = () => {
    setForm({
      name: "",
      category_id: "",
      price: 0,
      duration: 60,
      description: "",
      short_description: "",
      isActive: true,
      serviceType: "online",
      orderType: "booking",
      pricingType: "fixed",
      billingType: "one_time",
      priceMonthly: null,
      priceYearly: null,
      trialDays: 0,
      autoRenewDefault: true,
      planFeatures: [],
      maxCapacity: 1,
      image: "",
      hasMilestones: false,
      requiresDeposit: false,
      depositPercent: 30,
      deliveryDays: 7,
      revisions: 1,
      packages: [],
      addons: [],
      availability: [],
      requirements: [],
    });
    setMenuOpenId(null);
  };

  const openAddModal = () => {
    setEditing(null);
    resetForm();
    setModalOpen(true);
    setMenuOpenId(null);
  };

  // CRUD Operations
  const handleSave = async () => {
    try {
      if (form.orderType === "milestone" && !form.deliveryDays) {
        alert("Milestone projects require delivery days");
        return;
      }
      if (form.orderType === "booking" && !form.duration) {
        alert("Booking services require duration");
        return;
      }
      if (form.orderType === "hybrid" && (!form.duration || !form.deliveryDays)) {
        alert("Hybrid services need both meeting duration AND project delivery days");
        return;
      }

      const isSubscription = ["monthly", "yearly"].includes(form.billingType);

      // Strip empty strings off plan_features so the JSON ledger stays clean.
      const planFeatures = (form.planFeatures || [])
        .map((f) => (typeof f === "string" ? f.trim() : f))
        .filter((f) => (typeof f === "string" ? f.length > 0 : !!f));

      const payload = {
        name: { en: form.name },
        description: { en: form.description },
        short_description: { en: form.short_description || form.description },
        category: form.category_id || null,
        base_price: form.pricingType === "custom" ? null : form.price,
        currency: form.currency || "SAR",
        duration_minutes: ["booking", "hybrid"].includes(form.orderType) ? form.duration : null,
        default_delivery_days: ["milestone", "hybrid"].includes(form.orderType) ? form.deliveryDays : null,
        default_revisions: form.orderType === "milestone" ? form.revisions : 0,
        service_type: form.serviceType,
        order_type: form.orderType,
        pricing_type: form.pricingType,
        // Subscription fields (Phase 2 model)
        billing_type: form.billingType || "one_time",
        price_monthly: isSubscription ? form.priceMonthly : null,
        price_yearly: isSubscription ? form.priceYearly : null,
        trial_days: isSubscription ? (form.trialDays || 0) : 0,
        auto_renew_default: isSubscription ? form.autoRenewDefault !== false : true,
        plan_features: isSubscription ? planFeatures : [],
        is_active: form.isActive,
        image: form.image,
        packages: form.pricingType === "package" ? form.packages : [],
        addons: form.addons,
        availability: ["booking", "hybrid"].includes(form.orderType) ? form.availability : [],
        requirements: form.requirements || [],
      };

      let saved;
      if (editing) {
        if (!editing.slug) {
          alert("Service slug missing");
          return;
        }
       saved = await apiFetch(
        `/api/v1/services/${editing.slug}/`,
        tenantId,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );
      } else {
        saved = await apiFetch(
        `/api/v1/services/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      }
      if (!saved) return;

      const fresh = await apiFetch(`/api/v1/services/${saved.slug}/`,tenantId);
      const normalizedService = {
        id: fresh.id,
        slug: fresh.slug,
        name: fresh.name?.en || "",
        category: fresh.category?.name?.en || "Uncategorized",
        category_id: fresh.category?.id || "",
        price: fresh.base_price,
        duration: fresh.duration_minutes || 0,
        description: fresh.description?.en || "",
        isActive: fresh.is_active,
        serviceType: fresh.service_type,
        orderType: fresh.order_type,
        pricingType: fresh.pricing_type,
        // hasMilestones: fresh.has_milestones,
        // requiresDeposit: fresh.requires_deposit,
        deliveryDays: fresh.default_delivery_days,
        image: fresh.image || "",
        packages: fresh.packages || [],
        addons: fresh.addons || [],
        availability: fresh.availability || [],
      };

      setServices((prev) => {
        if (editing) return prev.map((s) => (s.id === saved.id ? normalizedService : s));
        return [normalizedService, ...prev];
      });

      setModalOpen(false);
      setEditing(null);
      resetForm();
    } catch (err) {
      // 🔥 gateway gate
      if (handleGatewayError(err?.data || err)) return;

      // 🔥 billing gate
      if (handleBillingError(err)) return;

      alert(err.detail || "Failed to save service");
    }
  };

  const handleEdit = async (service) => {
    try {
      const fullService = await apiFetch(`/api/v1/services/${service.slug}/`,tenantId);
      const mappedAvailability = (fullService.availability || []).map((avail) => ({
        day_of_week: avail.day_of_week,
        start_time: avail.start_time,
        end_time: avail.end_time,
        slot_duration: avail.slot_duration,
        buffer_time: avail.buffer_time,
        max_bookings_per_slot: avail.max_bookings_per_slot,
      }));

      setEditing(fullService);
      setForm({
        name: fullService.name?.en || "",
        category_id: fullService.category?.id || "",
        price: fullService.base_price || 0,
        duration: fullService.duration_minutes || 60,
        description: fullService.description?.en || "",
        short_description: fullService.short_description?.en || fullService.description?.en || "",
        isActive: fullService.is_active ?? true,
        serviceType: fullService.service_type || "online",
        orderType: fullService.order_type || "booking",
        pricingType: fullService.pricing_type || "fixed",
        billingType: fullService.billing_type || "one_time",
        priceMonthly: fullService.price_monthly ?? null,
        priceYearly: fullService.price_yearly ?? null,
        trialDays: fullService.trial_days ?? 0,
        autoRenewDefault: fullService.auto_renew_default !== false,
        planFeatures: Array.isArray(fullService.plan_features)
          ? fullService.plan_features
          : [],
        deliveryDays: fullService.default_delivery_days || 7,
        revisions: fullService.default_revisions || 1,
        image: fullService.image || "",
        packages: fullService.packages || [],
        addons: fullService.addons || [],
        availability: mappedAvailability || [],
        requirements: fullService.requirements || [],
      });
      setActiveTab("basic");
      setModalOpen(true);
      setMenuOpenId(null);
    } catch (err) {
      alert("Failed to load service details for editing");
    }
  };

  const handleDuplicate = async (service) => {
    try {
      const res = await apiFetch(
        `/api/v1/services/${service.slug}/duplicate/`,
        tenantId,
        {
          method: "POST",
        }
      );
      const newService = {
        id: res.service.id,
        slug: res.service.slug,
        name: res.service.name.en,
        category: res.service.category?.name?.en || "Uncategorized",
        price: res.service.base_price,
        duration: res.service.duration_minutes || 0,
        description: res.service.description?.en || "",
        isActive: res.service.is_active,
        serviceType: res.service.service_type,
        orderType: res.service.order_type,
      };
      setServices((prev) => {
        const idx = prev.findIndex((s) => s.id === service.id);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr.splice(idx + 1, 0, newService);
          return newArr;
        }
        return [newService, ...prev];
      });
      setMenuOpenId(null);
    } catch {
      alert("Duplicate failed");
    }
  };

  const handleToggleActive = async (service) => {
    try {
      const res = await apiFetch(
        `/api/v1/services/${service.slug}/toggle_active/`,
        tenantId,
        {
          method: "POST",
        }
      );
      setServices((prev) =>
        prev.map((s) => (s.id === service.id ? { ...s, isActive: res.is_active } : s))
      );
    } catch {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (service) => {
    if (
      !confirm(
        viewMode === "deleted"
          ? "Permanently delete this service? This cannot be undone."
          : "Delete this service? It will be moved to the Recycle Bin."
      )
    )
      return;

    try {
      if (viewMode === "deleted") {
        await apiFetch(
          `/api/v1/services/${service.slug}/permanent_delete/`,
          tenantId,
          {
            method: "DELETE",
          }
        );
      } else {
        await apiFetch(
          `/api/v1/services/${service.slug}/`,
          tenantId,
          {
            method: "DELETE",
          }
        );
      }

      setServices((prev) => prev.filter((s) => s.id !== service.id));
      if (viewMode === "active") {
        setDeletedCount((prev) => prev + 1);
      }
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  };

  const handleRestore = async (service) => {
    try {
      await apiFetch(
        `/api/v1/services/${service.slug}/restore/`,
        tenantId,
        {
          method: "POST",
        }
      );
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      setDeletedCount((prev) => Math.max(0, prev - 1));
    } catch {
      alert("Restore failed");
    }
  };

  // Category Management
  const handleSaveCategory = async (categoryData) => {
    try {
      const payload = {
        name: { en: categoryData.name },
        description: { en: categoryData.description || "" },
        icon: categoryData.icon || "",
      };

      await apiFetch(
        `/api/v1/service-categories/`,
        tenantId,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await apiFetch(
        `/api/v1/service-categories/`,
        tenantId
      );
      setServiceCategories(data.results || []);
    } catch (err) {
      alert("Failed to create category: " + err.message);
    }
  };

  const handleDeleteCategory = async (categorySlug) => {
    if (!confirm("Delete this category? Services in this category will become uncategorized."))
      return;
    try {
      await apiFetch(
        `/api/v1/service-categories/${categorySlug}/`,
        tenantId,
        {
          method: "DELETE",
        }
      );
      setServiceCategories((prev) => prev.filter((c) => c.slug !== categorySlug));
    } catch (err) {
      alert("Failed to delete category: " + (err.message || "Unknown error"));
    }
  };

  return {
    BillingGateModal,
    GatewayGateModal, 
    // Auth state
    user,
    loadingUser,
    requiresOnboarding,
    isRTL,
    t,
    // Local state
    services,
    filtered,
    search,
    setSearch,
    view,
    setView,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    modalOpen,
    setModalOpen,
    editing,
    setEditing,
    menuOpenId,
    setMenuOpenId,
    activeTab,
    setActiveTab,
    serviceCategories,
    deletedCount,
    form,
    setForm,
    
    // Actions
    openAddModal,
    handleSave,
    handleEdit,
    handleDuplicate,
    handleToggleActive,
    handleDelete,
    handleRestore,
    handleSaveCategory,
    handleDeleteCategory,
    resetForm,
  };
}