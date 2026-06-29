"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTenantLang } from "../contexts/TenantLangContext";
import { useTenantTheme } from "../contexts/TenantThemeContext";
import { useTenantSite } from "../[domain]/TenantClientWrapper";
import { tenantRoutes } from "@/lib/tenantRoutes";
import { resolveTranslatedContent } from "../[domain]/utils/resolveTranslated";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TRANSLATIONS = {
  en: {
    step1Title: "What do you need?",
    step2Title: "Project Details",
    step3Title: "Attachments",
    step4Title: "Contact Information",
    step5Title: "Review & Submit",
    title: "Title",
    titlePlaceholder: "What do you need?",
    description: "Description",
    descriptionPlaceholder: "Describe your request in detail...",
    category: "Category",
    selectCategory: "Select a category",
    budgetRange: "Budget Range",
    budgetMin: "Minimum",
    budgetMax: "Maximum",
    deadline: "Deadline",
    priority: "Priority",
    priorityLow: "Low",
    priorityMedium: "Medium",
    priorityHigh: "High",
    priorityUrgent: "Urgent",
    deliveryPreference: "Expected Delivery",
    asap: "ASAP",
    oneWeek: "1 Week",
    twoWeeks: "2 Weeks",
    oneMonth: "1 Month",
    flexible: "Flexible",
    dropzoneText: "Drag & drop files here, or click to browse",
    maxFiles: "files maximum",
    maxSize: "max per file",
    name: "Name",
    email: "Email",
    phone: "Phone",
    company: "Company Name",
    contactMethod: "Preferred Contact Method",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactWhatsapp: "WhatsApp",
    reviewSummary: "Review Your Request",
    edit: "Edit",
    termsAgree: "I agree to the",
    terms: "terms and conditions",
    back: "Back",
    next: "Next",
    submit: "Submit Request",
    submitting: "Submitting...",
    required: "Required",
    successTitle: "Request Submitted!",
    successMessage: "We've received your request and will get back to you soon.",
    avgResponse: "Average response time:",
    submitAnother: "Submit Another Request",
    viewServices: "View Our Services",
    refNumber: "Reference Number",
    weOffer: "We offer",
    bookNow: "Book Now",
    orderNow: "Order Now",
    instead: "instead?",
    characters: "characters",
    noFiles: "No files attached",
    notProvided: "Not provided",
    draftRestored: "Draft restored from your previous session",
    dismiss: "Dismiss",
  },
  ar: {
    step1Title: "ماذا تحتاج؟",
    step2Title: "تفاصيل المشروع",
    step3Title: "المرفقات",
    step4Title: "معلومات الاتصال",
    step5Title: "المراجعة والإرسال",
    title: "العنوان",
    titlePlaceholder: "ماذا تحتاج؟",
    description: "الوصف",
    descriptionPlaceholder: "صف طلبك بالتفصيل...",
    category: "الفئة",
    selectCategory: "اختر فئة",
    budgetRange: "نطاق الميزانية",
    budgetMin: "الحد الأدنى",
    budgetMax: "الحد الأقصى",
    deadline: "الموعد النهائي",
    priority: "الأولوية",
    priorityLow: "منخفض",
    priorityMedium: "متوسط",
    priorityHigh: "عالي",
    priorityUrgent: "عاجل",
    deliveryPreference: "التسليم المتوقع",
    asap: "في أقرب وقت",
    oneWeek: "أسبوع واحد",
    twoWeeks: "أسبوعان",
    oneMonth: "شهر واحد",
    flexible: "مرن",
    dropzoneText: "اسحب وأفلت الملفات هنا، أو انقر للتصفح",
    maxFiles: "ملفات كحد أقصى",
    maxSize: "كحد أقصى لكل ملف",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    company: "اسم الشركة",
    contactMethod: "طريقة الاتصال المفضلة",
    contactEmail: "بريد إلكتروني",
    contactPhone: "هاتف",
    contactWhatsapp: "واتساب",
    reviewSummary: "مراجعة طلبك",
    edit: "تعديل",
    termsAgree: "أوافق على",
    terms: "الشروط والأحكام",
    back: "رجوع",
    next: "التالي",
    submit: "إرسال الطلب",
    submitting: "جارٍ الإرسال...",
    required: "مطلوب",
    successTitle: "تم إرسال الطلب!",
    successMessage: "لقد استلمنا طلبك وسنعود إليك قريبا.",
    avgResponse: "متوسط وقت الاستجابة:",
    submitAnother: "إرسال طلب آخر",
    viewServices: "عرض خدماتنا",
    refNumber: "رقم المرجع",
    weOffer: "نقدم",
    bookNow: "احجز الآن",
    orderNow: "اطلب الآن",
    instead: "بدلا من ذلك؟",
    characters: "حرف",
    noFiles: "لا توجد ملفات مرفقة",
    notProvided: "غير متوفر",
    draftRestored: "تم استعادة المسودة من جلستك السابقة",
    dismiss: "إغلاق",
  },
  ur: {
    step1Title: "آپ کو کیا چاہیے؟",
    step2Title: "پروجیکٹ کی تفصیلات",
    step3Title: "منسلکات",
    step4Title: "رابطے کی معلومات",
    step5Title: "جائزہ اور جمع کروائیں",
    title: "عنوان",
    titlePlaceholder: "آپ کو کیا چاہیے؟",
    description: "تفصیل",
    descriptionPlaceholder: "اپنی درخواست کی تفصیل بیان کریں...",
    category: "زمرہ",
    selectCategory: "زمرہ منتخب کریں",
    budgetRange: "بجٹ کی حد",
    budgetMin: "کم از کم",
    budgetMax: "زیادہ سے زیادہ",
    deadline: "آخری تاریخ",
    priority: "ترجیح",
    priorityLow: "کم",
    priorityMedium: "درمیانی",
    priorityHigh: "زیادہ",
    priorityUrgent: "فوری",
    deliveryPreference: "متوقع ترسیل",
    asap: "جلد از جلد",
    oneWeek: "ایک ہفتہ",
    twoWeeks: "دو ہفتے",
    oneMonth: "ایک مہینہ",
    flexible: "لچکدار",
    dropzoneText: "فائلیں یہاں ڈریگ اور ڈراپ کریں، یا براؤز کرنے کے لیے کلک کریں",
    maxFiles: "زیادہ سے زیادہ فائلیں",
    maxSize: "فی فائل زیادہ سے زیادہ",
    name: "نام",
    email: "ای میل",
    phone: "فون",
    company: "کمپنی کا نام",
    contactMethod: "رابطے کا ترجیحی طریقہ",
    contactEmail: "ای میل",
    contactPhone: "فون",
    contactWhatsapp: "واٹس ایپ",
    reviewSummary: "اپنی درخواست کا جائزہ لیں",
    edit: "ترمیم",
    termsAgree: "میں متفق ہوں",
    terms: "شرائط و ضوابط",
    back: "واپس",
    next: "اگلا",
    submit: "درخواست جمع کروائیں",
    submitting: "جمع ہو رہا ہے...",
    required: "ضروری",
    successTitle: "درخواست جمع ہو گئی!",
    successMessage: "ہم نے آپ کی درخواست موصول کر لی ہے اور جلد آپ سے رابطہ کریں گے۔",
    avgResponse: "اوسط جوابی وقت:",
    submitAnother: "ایک اور درخواست جمع کروائیں",
    viewServices: "ہماری خدمات دیکھیں",
    refNumber: "حوالہ نمبر",
    weOffer: "ہم پیش کرتے ہیں",
    bookNow: "ابھی بک کریں",
    orderNow: "ابھی آرڈر کریں",
    instead: "اس کی بجائے؟",
    characters: "حروف",
    noFiles: "کوئی فائل منسلک نہیں",
    notProvided: "فراہم نہیں کیا گیا",
    draftRestored: "آپ کے پچھلے سیشن سے مسودہ بحال کیا گیا",
    dismiss: "خارج",
  },
};

const PRIORITY_COLORS = {
  low: { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" },
  high: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  urgent: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" },
};

const DELIVERY_OPTIONS = ["asap", "oneWeek", "twoWeeks", "oneMonth", "flexible"];

const STEP_ICONS = {
  1: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  2: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  3: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  4: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  5: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function getFileTypeIcon(file) {
  const type = file.type || "";
  if (type.startsWith("image/")) return (
    <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
  if (type === "application/pdf") return (
    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
  if (type.startsWith("video/")) return (
    <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
  return (
    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

const DRAFT_KEY_PREFIX = "custom_request_draft_";

export default function CustomRequestModule({ data = {}, settings = {}, tenantId, domain }) {
  const { isRTL, language } = useTenantLang();
  const { theme } = useTenantTheme();
  const { currency } = useTenantSite();

  const cfg = { ...data, ...settings };

  const t = useMemo(() => {
    const lang = ["ar", "ur"].includes(language) ? language : "en";
    return TRANSLATIONS[lang] || TRANSLATIONS.en;
  }, [language]);

  const primaryColor = theme?.primary_color || "#8B1E3F";

  const allowUploads = cfg.allow_file_uploads !== false;
  const requireBudget = cfg.require_budget === true;
  const requireDeadline = cfg.require_deadline === true;
  const maxAttachments = cfg.max_attachments || 5;
  const maxFileSize = cfg.max_file_size_mb ? `${cfg.max_file_size_mb}MB` : (cfg.max_file_size || "10MB");
  const showTrustBadges = cfg.show_trust_badges !== false;
  const showResponseTime = cfg.show_response_time !== false;
  const avgResponseTime = (typeof cfg.average_response_time === "object"
    ? (cfg.average_response_time[language] || cfg.average_response_time.en)
    : cfg.avg_response_time) || "24 hours";
  const categories = cfg.categories || [];
  const trustBadges = [cfg.trust_badge_1, cfg.trust_badge_2, cfg.trust_badge_3].filter(Boolean);
  const successMessageOverride = cfg.success_message;
  const redirectAfterSubmit = cfg.redirect_after_submit || "";

  const totalSteps = allowUploads ? 5 : 4;
  const stepMapping = useMemo(() => {
    if (allowUploads) return { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
    return { 1: 1, 2: 2, 3: 4, 4: 5 };
  }, [allowUploads]);

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState("next");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    budget_min: "",
    budget_max: "",
    deadline: "",
    priority: "",
    delivery_preference: "",
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    company_name: "",
    contact_method: "email",
  });
  const [files, setFiles] = useState([]);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serviceSuggestions, setServiceSuggestions] = useState([]);
  const [searchingServices, setSearchingServices] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);
  const [animating, setAnimating] = useState(false);

  const fileInputRef = useRef(null);
  const searchTimerRef = useRef(null);
  const containerRef = useRef(null);

  const draftKey = DRAFT_KEY_PREFIX + (domain || "default");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.form) {
          setForm(prev => ({ ...prev, ...parsed.form }));
          setDraftNotice(true);
        }
      }
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    if (submitted) return;
    const hasData = Object.values(form).some(v => v !== "" && v !== "email");
    if (hasData) {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ form, timestamp: Date.now() }));
      } catch {}
    }
  }, [form, draftKey, submitted]);

  const searchServices = useCallback(async (query) => {
    if (!query || query.length < 3) {
      setServiceSuggestions([]);
      return;
    }
    setSearchingServices(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/public-services/?search=${encodeURIComponent(query)}`,
        { headers: { "X-Tenant": domain } }
      );
      if (res.ok) {
        const result = await res.json();
        const services = Array.isArray(result) ? result : result.results || [];
        setServiceSuggestions(services.slice(0, 3));
      }
    } catch {} finally {
      setSearchingServices(false);
    }
  }, [domain]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));

    if (name === "title") {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => searchServices(value), 500);
    }
  }, [searchServices]);

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles].slice(0, maxAttachments));
  }, [maxAttachments]);

  const handleFileSelect = useCallback((e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected].slice(0, maxAttachments));
    e.target.value = "";
  }, [maxAttachments]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getLogicalStep = (step) => stepMapping[step];

  const validateStep = useCallback((step) => {
    const logicalStep = getLogicalStep(step);
    const errors = {};

    if (logicalStep === 1) {
      if (!form.title.trim()) errors.title = true;
      if (!form.description.trim()) errors.description = true;
    } else if (logicalStep === 2) {
      if (requireBudget && !form.budget_min && !form.budget_max) errors.budget_min = true;
      if (requireDeadline && !form.deadline) errors.deadline = true;
    } else if (logicalStep === 4) {
      if (!data.allow_anonymous) {
        if (!form.customer_name.trim()) errors.customer_name = true;
        if (!form.customer_email.trim()) errors.customer_email = true;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) errors.customer_email = true;
      }
    } else if (logicalStep === 5) {
      if (data.terms_text && !termsAccepted) errors.terms = true;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, requireBudget, requireDeadline, data.allow_anonymous, data.terms_text, termsAccepted, stepMapping]);

  const goToStep = useCallback((step) => {
    setDirection(step > currentStep ? "next" : "prev");
    setAnimating(true);
    setTimeout(() => {
      setCurrentStep(step);
      setAnimating(false);
    }, 150);
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) goToStep(currentStep + 1);
  }, [currentStep, totalSteps, validateStep, goToStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        customer_name: form.customer_name,
        customer_email: form.customer_email,
      };
      if (form.category) payload.category = form.category;
      if (form.budget_min) payload.budget_min = parseFloat(form.budget_min);
      if (form.budget_max) payload.budget_max = parseFloat(form.budget_max);
      if (form.deadline) payload.deadline = form.deadline;
      if (form.priority) payload.priority = form.priority;
      if (form.delivery_preference) payload.delivery_preference = form.delivery_preference;
      if (form.customer_phone) payload.customer_phone = form.customer_phone;
      if (form.company_name) payload.company_name = form.company_name;
      if (form.contact_method) payload.contact_method = form.contact_method;

      const res = await fetch(`${API_BASE}/api/v1/custom-requests/public/submit/`, {
        method: "POST",
        headers: {
          "X-Tenant": domain,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.message || "Failed to submit request");
      }

      const result = await res.json();

      if (files.length > 0 && result.id) {
        for (const file of files) {
          const fileData = new FormData();
          fileData.append("file", file);
          await fetch(`${API_BASE}/api/v1/custom-requests/public/${result.id}/upload-file/`, {
            method: "POST",
            headers: { "X-Tenant": domain },
            body: fileData,
          });
        }
      }

      try { localStorage.removeItem(draftKey); } catch {}

      // Persist the request token + email so the customer can come
      // back to /my-requests and see this submission without going
      // through OTP. The backend returns these on success.
      if (result.access_token && result.tenant_id) {
        try {
          localStorage.setItem(`customer_request_token_${result.tenant_id}`, result.access_token);
          if (result.email) {
            localStorage.setItem(`customer_request_email_${result.tenant_id}`, result.email);
          }
        } catch {}
      }

      setSubmitResult(result);
      setSubmitted(true);

      if (redirectAfterSubmit) {
        setTimeout(() => { window.location.href = redirectAfterSubmit; }, 3000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }, [form, files, domain, draftKey, currentStep, validateStep]);

  const resetForm = useCallback(() => {
    setForm({
      title: "", description: "", category: "",
      budget_min: "", budget_max: "", deadline: "",
      priority: "", delivery_preference: "",
      customer_name: "", customer_email: "", customer_phone: "",
      company_name: "", contact_method: "email",
    });
    setFiles([]);
    setTermsAccepted(false);
    setCurrentStep(1);
    setSubmitted(false);
    setSubmitResult(null);
    setError(null);
    setFieldErrors({});
    setServiceSuggestions([]);
  }, []);

  const bgClass = data.background === "gray" ? "bg-gray-50"
    : data.background === "gradient" ? "bg-gradient-to-br from-gray-50 to-white"
    : "bg-white";

  const inputClass = `w-full border rounded-xl px-4 py-3 text-sm transition-all duration-200 outline-none
    ${isRTL ? "text-right" : "text-left"}`;

  const inputStyle = (hasError) => ({
    borderColor: hasError ? "#EF4444" : "#E5E7EB",
    "--tw-ring-color": primaryColor,
  });

  const inputFocusClass = "focus:ring-2 focus:border-transparent";

  const labelClass = `block text-sm font-medium text-gray-700 mb-1.5 ${isRTL ? "text-right" : "text-left"}`;

  if (submitted) {
    return (
      <div className={`${bgClass} py-16 px-4`} dir={isRTL ? "rtl" : "ltr"}>
        <div className="max-w-lg mx-auto text-center">
          <div className="mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <svg
                className="w-10 h-10 animate-[checkmark_0.4s_ease-in-out]"
                style={{ color: primaryColor }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                  style={{
                    strokeDasharray: 24,
                    strokeDashoffset: 0,
                    animation: "checkDraw 0.5s ease-in-out forwards",
                  }}
                />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-3" style={{ color: primaryColor }}>
            {data.success_title || t.successTitle}
          </h2>
          <p className="text-gray-600 mb-6">
            {(successMessageOverride && typeof successMessageOverride === "object"
              ? (successMessageOverride[language] || successMessageOverride.en)
              : successMessageOverride) || data.success_message || t.successMessage}
          </p>

          {submitResult?.id && (
            <div className="inline-block bg-gray-100 rounded-xl px-6 py-3 mb-6">
              <p className="text-xs text-gray-500 mb-1">{t.refNumber}</p>
              <p className="text-lg font-mono font-bold" style={{ color: primaryColor }}>
                #{submitResult.id}
              </p>
            </div>
          )}

          {showResponseTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-8">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.avgResponse} {avgResponseTime}</span>
            </div>
          )}

          {showTrustBadges && (trustBadges.length > 0 || data.trust_badges?.length > 0) && (
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {trustBadges.length > 0
                ? trustBadges.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 text-sm text-gray-600">
                      <span>{typeof badge === "object" ? (badge[language] || badge.en) : badge}</span>
                    </div>
                  ))
                : data.trust_badges?.map((badge, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 text-sm text-gray-600">
                      {badge.icon && <span className="text-lg">{badge.icon}</span>}
                      <span>{badge.label}</span>
                    </div>
                  ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={resetForm}
              className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:opacity-90 hover:scale-[1.02] min-h-[44px]"
              style={{ backgroundColor: primaryColor }}
            >
              {t.submitAnother}
            </button>
            <a
              href={tenantRoutes.services()}
              className="px-6 py-3 rounded-xl border font-medium transition-all duration-200 hover:bg-gray-50 min-h-[44px] flex items-center justify-center"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              {t.viewServices}
            </a>
          </div>
        </div>

        <style jsx>{`
          @keyframes checkDraw {
            from { stroke-dashoffset: 24; }
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    );
  }

  const progressPercent = (currentStep / totalSteps) * 100;

  const stepLabels = [
    t.step1Title,
    t.step2Title,
    ...(allowUploads ? [t.step3Title] : []),
    t.step4Title,
    t.step5Title,
  ];

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="h-1 w-full bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%`, backgroundColor: primaryColor }}
        />
      </div>

      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          return (
            <div key={stepNum} className="flex flex-col items-center flex-1">
              <button
                onClick={() => {
                  if (isCompleted) goToStep(stepNum);
                }}
                disabled={!isCompleted}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 min-w-[40px]
                  ${isCompleted ? "text-white border-transparent cursor-pointer hover:scale-110" : ""}
                  ${isCurrent ? "text-white border-transparent scale-110 shadow-lg" : ""}
                  ${!isCompleted && !isCurrent ? "text-gray-400 border-gray-200 bg-white" : ""}
                `}
                style={isCompleted || isCurrent ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  STEP_ICONS[getLogicalStep(stepNum)]
                )}
              </button>
              <span className={`mt-2 text-xs font-medium hidden sm:block transition-colors duration-200
                ${isCurrent ? "font-semibold" : isCompleted ? "" : "text-gray-400"}
              `} style={isCurrent || isCompleted ? { color: primaryColor } : {}}>
                {stepLabels[i]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );


  const getTranslated = (value) => {
    if (!value) return "";

    if (typeof value === "string") return value;

    if (typeof value === "object") {
      return value[language] || value.en || Object.values(value)[0] || "";
    }

    return "";
  };
  const renderStep1 = () => (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <label className={labelClass}>
          {t.title} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          className={`${inputClass} ${inputFocusClass}`}
          style={inputStyle(fieldErrors.title)}
          placeholder={t.titlePlaceholder}
        />
        {fieldErrors.title && (
          <p className="text-xs text-red-500 mt-1">{t.required}</p>
        )}

        {searchingServices && (
          <p className="text-xs text-gray-400 mt-2">{isRTL ? "جارٍ البحث..." : "Searching..."}</p>
        )}
        {serviceSuggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {serviceSuggestions.map((svc) => (
              <div
                key={svc.id || svc.slug}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm"
              >
                <span className="text-blue-800">
                  {t.weOffer} <strong>{getTranslated(svc.name || svc.title)}</strong> - {t.instead}
                </span>
                <a
                  href={tenantRoutes.service(svc.slug)}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-white text-xs font-medium transition hover:opacity-90 min-h-[32px] flex items-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {svc.service_type === "booking" ? t.bookNow : t.orderNow}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>
          {t.description} <span className="text-red-500">*</span>
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          maxLength={2000}
          className={`${inputClass} ${inputFocusClass} resize-none`}
          style={inputStyle(fieldErrors.description)}
          placeholder={t.descriptionPlaceholder}
        />
        <div className={`flex justify-between mt-1 ${isRTL ? "flex-row-reverse" : ""}`}>
          {fieldErrors.description ? (
            <p className="text-xs text-red-500">{t.required}</p>
          ) : <span />}
          <p className="text-xs text-gray-400">
            {form.description.length}/2000 {t.characters}
          </p>
        </div>
      </div>

      {categories.length > 0 && (
        <div>
          <label className={labelClass}>{t.category}</label>
          <select
            name="category"
            value={form.category}
            onChange={handleChange}
            className={`${inputClass} ${inputFocusClass} bg-white`}
            style={inputStyle(false)}
          >
            <option value="">{t.selectCategory}</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <label className={labelClass}>
          {t.budgetRange} {requireBudget && <span className="text-red-500">*</span>}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm ${isRTL ? "right-3" : "left-3"}`}>
              {currency || "USD"}
            </span>
            <input
              type="number"
              name="budget_min"
              value={form.budget_min}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`${inputClass} ${inputFocusClass} ${isRTL ? "pr-14" : "pl-14"}`}
              style={inputStyle(fieldErrors.budget_min)}
              placeholder={t.budgetMin}
            />
          </div>
          <div className="relative">
            <span className={`absolute top-1/2 -translate-y-1/2 text-gray-400 text-sm ${isRTL ? "right-3" : "left-3"}`}>
              {currency || "USD"}
            </span>
            <input
              type="number"
              name="budget_max"
              value={form.budget_max}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`${inputClass} ${inputFocusClass} ${isRTL ? "pr-14" : "pl-14"}`}
              style={inputStyle(false)}
              placeholder={t.budgetMax}
            />
          </div>
        </div>
        {fieldErrors.budget_min && (
          <p className="text-xs text-red-500 mt-1">{t.required}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          {t.deadline} {requireDeadline && <span className="text-red-500">*</span>}
        </label>
        <input
          type="date"
          name="deadline"
          value={form.deadline}
          onChange={handleChange}
          min={new Date().toISOString().split("T")[0]}
          className={`${inputClass} ${inputFocusClass}`}
          style={inputStyle(fieldErrors.deadline)}
        />
        {fieldErrors.deadline && (
          <p className="text-xs text-red-500 mt-1">{t.required}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>{t.priority}</label>
        <div className="flex flex-wrap gap-2">
          {["low", "medium", "high", "urgent"].map((level) => {
            const colors = PRIORITY_COLORS[level];
            const isSelected = form.priority === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, priority: prev.priority === level ? "" : level }))}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 min-h-[44px]
                  ${isSelected ? `${colors.bg} ${colors.text} ${colors.border} ring-2 scale-105` : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}
                `}
                style={isSelected ? { "--tw-ring-color": colors.border.replace("border-", "") } : {}}
              >
                {t[`priority${level.charAt(0).toUpperCase() + level.slice(1)}`]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.deliveryPreference}</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DELIVERY_OPTIONS.map((opt) => {
            const isSelected = form.delivery_preference === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, delivery_preference: prev.delivery_preference === opt ? "" : opt }))}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 min-h-[44px]
                  ${isSelected ? "text-white border-transparent shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}
                `}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
              >
                {t[opt]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer
          ${dragActive ? "border-blue-400 bg-blue-50 scale-[1.02]" : "border-gray-300 hover:border-gray-400 bg-gray-50/50"}
        `}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="mb-3">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-gray-600 mb-1 font-medium">{t.dropzoneText}</p>
        <p className="text-xs text-gray-400">
          {maxAttachments} {t.maxFiles} &middot; {maxFileSize} {t.maxSize}
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl group hover:shadow-sm transition-shadow"
            >
              {file.type?.startsWith("image/") ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                  {getFileTypeIcon(file)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
      <div>
        <label className={labelClass}>
          {t.name} {!data.allow_anonymous && <span className="text-red-500">*</span>}
        </label>
        <input
          type="text"
          name="customer_name"
          value={form.customer_name}
          onChange={handleChange}
          className={`${inputClass} ${inputFocusClass}`}
          style={inputStyle(fieldErrors.customer_name)}
        />
        {fieldErrors.customer_name && (
          <p className="text-xs text-red-500 mt-1">{t.required}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>
          {t.email} {!data.allow_anonymous && <span className="text-red-500">*</span>}
        </label>
        <input
          type="email"
          name="customer_email"
          value={form.customer_email}
          onChange={handleChange}
          className={`${inputClass} ${inputFocusClass}`}
          style={inputStyle(fieldErrors.customer_email)}
        />
        {fieldErrors.customer_email && (
          <p className="text-xs text-red-500 mt-1">{t.required}</p>
        )}
      </div>

      <div>
        <label className={labelClass}>{t.phone}</label>
        <input
          type="tel"
          name="customer_phone"
          value={form.customer_phone}
          onChange={handleChange}
          className={`${inputClass} ${inputFocusClass}`}
          style={inputStyle(false)}
        />
      </div>

      <div>
        <label className={labelClass}>{t.company}</label>
        <input
          type="text"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          className={`${inputClass} ${inputFocusClass}`}
          style={inputStyle(false)}
        />
      </div>

      <div>
        <label className={labelClass}>{t.contactMethod}</label>
        <div className="flex flex-wrap gap-3">
          {[
            { value: "email", label: t.contactEmail, icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )},
            { value: "phone", label: t.contactPhone, icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            )},
            { value: "whatsapp", label: t.contactWhatsapp, icon: (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            )},
          ].map(({ value, label, icon }) => {
            const isSelected = form.contact_method === value;
            return (
              <label
                key={value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 min-h-[44px]
                  ${isSelected ? "text-white border-transparent shadow-md" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}
                `}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
              >
                <input
                  type="radio"
                  name="contact_method"
                  value={value}
                  checked={isSelected}
                  onChange={handleChange}
                  className="hidden"
                />
                {icon}
                <span className="text-sm font-medium">{label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderReviewCard = (title, stepNum, children) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        <button
          type="button"
          onClick={() => goToStep(stepNum)}
          className="text-sm font-medium px-3 py-1 rounded-lg transition-colors hover:bg-gray-100 min-h-[32px]"
          style={{ color: primaryColor }}
        >
          {t.edit}
        </button>
      </div>
      <div className="space-y-2 text-sm text-gray-600">{children}</div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4 animate-[fadeIn_0.3s_ease-out]">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{t.reviewSummary}</h3>

      {renderReviewCard(t.step1Title, 1, (
        <>
          <div><span className="font-medium text-gray-700">{t.title}:</span> {form.title}</div>
          <div><span className="font-medium text-gray-700">{t.description}:</span> {form.description}</div>
          {form.category && <div><span className="font-medium text-gray-700">{t.category}:</span> {form.category}</div>}
        </>
      ))}

      {renderReviewCard(t.step2Title, 2, (
        <>
          {(form.budget_min || form.budget_max) ? (
            <div>
              <span className="font-medium text-gray-700">{t.budgetRange}:</span>{" "}
              {form.budget_min && `${currency || "USD"} ${form.budget_min}`}
              {form.budget_min && form.budget_max && " - "}
              {form.budget_max && `${currency || "USD"} ${form.budget_max}`}
            </div>
          ) : (
            <div><span className="font-medium text-gray-700">{t.budgetRange}:</span> {t.notProvided}</div>
          )}
          <div>
            <span className="font-medium text-gray-700">{t.deadline}:</span>{" "}
            {form.deadline || t.notProvided}
          </div>
          {form.priority && (
            <div>
              <span className="font-medium text-gray-700">{t.priority}:</span>{" "}
              <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${PRIORITY_COLORS[form.priority]?.bg} ${PRIORITY_COLORS[form.priority]?.text}`}>
                {t[`priority${form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}`]}
              </span>
            </div>
          )}
          {form.delivery_preference && (
            <div><span className="font-medium text-gray-700">{t.deliveryPreference}:</span> {t[form.delivery_preference]}</div>
          )}
        </>
      ))}

      {allowUploads && renderReviewCard(t.step3Title, 3, (
        files.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-lg text-xs">
                {getFileTypeIcon(f)}
                <span className="max-w-[120px] truncate">{f.name}</span>
              </span>
            ))}
          </div>
        ) : <p className="text-gray-400">{t.noFiles}</p>
      ))}

      {renderReviewCard(t.step4Title, allowUploads ? 4 : 3, (
        <>
          <div><span className="font-medium text-gray-700">{t.name}:</span> {form.customer_name || t.notProvided}</div>
          <div><span className="font-medium text-gray-700">{t.email}:</span> {form.customer_email || t.notProvided}</div>
          {form.customer_phone && <div><span className="font-medium text-gray-700">{t.phone}:</span> {form.customer_phone}</div>}
          {form.company_name && <div><span className="font-medium text-gray-700">{t.company}:</span> {form.company_name}</div>}
          <div><span className="font-medium text-gray-700">{t.contactMethod}:</span> {t[`contact${form.contact_method.charAt(0).toUpperCase() + form.contact_method.slice(1)}`]}</div>
        </>
      ))}

      {data.terms_text && (
        <label className={`flex items-start gap-3 p-4 border rounded-2xl cursor-pointer transition-colors ${fieldErrors.terms ? "border-red-300 bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              setFieldErrors(prev => ({ ...prev, terms: undefined }));
            }}
            className="mt-0.5 w-5 h-5 rounded shrink-0"
            style={{ accentColor: primaryColor }}
          />
          <span className="text-sm text-gray-600">
            {t.termsAgree} <span className="underline" style={{ color: primaryColor }}>{t.terms}</span>
            <br />
            <span className="text-xs text-gray-400 mt-1 block">{data.terms_text}</span>
          </span>
        </label>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    const logicalStep = getLogicalStep(currentStep);
    switch (logicalStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  const isLastStep = currentStep === totalSteps;

  return (
    <div className={`${bgClass} py-12 px-4`} dir={isRTL ? "rtl" : "ltr"} ref={containerRef}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: primaryColor }}>
            {data.title || t.step1Title.replace("?", "")}
          </h2>
          {data.subtitle && (
            <p className="text-gray-500">{data.subtitle}</p>
          )}
        </div>

        {renderStepIndicator()}

        {draftNotice && (
          <div className="mb-6 flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
            <span>{t.draftRestored}</span>
            <button
              onClick={() => setDraftNotice(false)}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              {t.dismiss}
            </button>
          </div>
        )}

        <div
          className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 transition-all duration-200
            ${animating ? (direction === "next" ? "opacity-0 translate-x-4" : "opacity-0 -translate-x-4") : "opacity-100 translate-x-0"}
          `}
        >
          {renderCurrentStep()}
        </div>

        <div className={`flex items-center gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl border border-gray-300 text-gray-700 font-medium transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 min-h-[48px]"
            >
              {t.back}
            </button>
          )}
          <button
            type="button"
            onClick={isLastStep ? handleSubmit : handleNext}
            disabled={submitting}
            className={`flex-1 px-6 py-3.5 rounded-xl text-white font-medium transition-all duration-200 hover:opacity-90 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] shadow-sm
              ${currentStep === 1 ? "w-full" : ""}
            `}
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? t.submitting : isLastStep ? (data.button_text || t.submit) : t.next}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
