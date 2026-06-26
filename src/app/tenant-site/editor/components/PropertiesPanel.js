"use client";

/**
 * PropertiesPanel.js
 * 
 * COMPLETE Properties panel for editing ALL section content.
 * Every text field has EN/AR/UR language tabs.
 * Handles all section types including modules.
 */

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { useBuilder } from "../context/BuilderContext";
import { useTenantLang } from "../../contexts/TenantLangContext";
import { resolveTranslated } from "../../[domain]/utils/resolveTranslated";
import {
  DESTINATION_TYPES,
  listDestinationTypes,
  getDestinationType,
  computeLegacyUrl as computeLegacyUrlFromRegistry,
} from "@/lib/destinationTypes";
import { useNavigationContext } from "@/lib/navigationContext";
import {
  X,
  Type,
  Image,
  Link2,
  Palette,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Settings,
  MessageSquare,
  Upload,
  CreditCard,
  Database,
  FileText,
  ExternalLink,
  RefreshCw,
  Search,
  LayoutList,

} from "lucide-react";

// ============================================================
// MAIN PROPERTIES PANEL
// ============================================================

export default function PropertiesPanel() {
  const { language, isRTL } = useTenantLang();
  const { state, updateSection, clearActiveSection } = useBuilder();

  const T = (v) => resolveTranslated(v, language);
  const { activeSection, activeSectionIndex } = state;

  
  const [activeTab, setActiveTab] = useState("content");

  if (!activeSection) return null;

  const content = activeSection.content || {};
  const sectionType = activeSection.section_type;
  const moduleKey = activeSection.module_key;

  // Update handler for content fields
  const handleUpdate = (key, value) => {
    updateSection(activeSectionIndex, { [key]: value });
  };

  // Deep update for nested objects
  const handleDeepUpdate = (path, value) => {
    const keys = path.split(".");
    const updates = {};
    let current = updates;

    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...getNestedValue(content, keys.slice(0, i + 1).join(".")) };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    updateSection(activeSectionIndex, updates);
  };

  const labels = {
    editSection: { en: "Edit Section", ar: "تحرير القسم", ur: "سیکشن میں ترمیم کریں" },
    content: { en: "Content", ar: "المحتوى", ur: "مواد" },
    style: { en: "Style", ar: "النمط", ur: "اسٹائل" },
    advanced: { en: "Advanced", ar: "متقدم", ur: "ایڈوانسڈ" },
  };

  const tabs = [
    { id: "content", label: labels.content },
    { id: "style", label: labels.style },
    { id: "advanced", label: labels.advanced },
  ];

  // Get section display name
  const getSectionDisplayName = () => {
    if (sectionType === "module" && moduleKey) {
      return moduleKey.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
    }
    return sectionType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <aside
      className={`w-96 bg-white border-slate-200 flex flex-col overflow-hidden flex-shrink-0 ${
        isRTL ? "border-r" : "border-l"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b border-slate-200 ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <div className={isRTL ? "text-right" : ""}>
          <h3 className="font-semibold text-slate-900">{T(labels.editSection)}</h3>
          <p className="text-xs text-slate-500">{getSectionDisplayName()}</p>
        </div>
        <button
          onClick={clearActiveSection}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {T(tab.label)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "content" && (
          <ContentEditor
            sectionType={sectionType}
            moduleKey={moduleKey}
            content={content}
            onUpdate={handleUpdate}
            onDeepUpdate={handleDeepUpdate}
            language={language}
            isRTL={isRTL}
          />
        )}
      
        {activeTab === "style" && (
          <StyleEditor
            sectionType={sectionType}
            moduleKey={moduleKey}
            content={content}
            onUpdate={handleUpdate}
            language={language}
            isRTL={isRTL}
          />
        )}

        {activeTab === "advanced" && (
          <AdvancedEditor
            sectionType={sectionType}
            moduleKey={moduleKey}
            content={content}
            onUpdate={handleUpdate}
            language={language}
            isRTL={isRTL}
          />
        )}
      </div>
    </aside>
  );
}

// ============================================================
// CONTENT EDITOR - Handles all section types
// ============================================================

function ContentEditor({ sectionType, moduleKey, content, onUpdate, onDeepUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);
  console.log(content,"contenteditor");
  // Render based on section type
  switch (sectionType) {
    case "header":
      return <HeaderContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "hero":
      return <HeroContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "services":
      return <ServicesContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "features_icons":
      return <FeaturesContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "testimonials":
      return <TestimonialsContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "pricing_table":
      return <PricingContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "faq_accordion":
      return <FaqContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "stats_banner":
      return <StatsContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "gallery":
      return <GalleryContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "grid":
      return <GridContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "steps":
      return <StepsContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "team":
      return <TeamContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "cta":
      return <CtaContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "footer":
      return <FooterContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    case "module":
      return <ModuleContentEditor moduleKey={moduleKey} content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
    default:
      return <GenericContentEditor content={content} onUpdate={onUpdate} language={language} isRTL={isRTL} />;
  }
}

// ============================================================
// HEADER CONTENT EDITOR
// ============================================================

function HeaderContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleLogoUpdate = (field, lang, value) => {
    const updatedLogo = {
      ...content.logo,
      [field]: typeof content.logo?.[field] === "object"
        ? { ...content.logo[field], [lang]: value }
        : { en: value, ar: value, ur: value },
    };
    onUpdate("logo", updatedLogo);
  };

  const handleNavLinkPatch = (index, patch) => {
    const links = [...(content.nav_links || [])];
    links[index] = { ...links[index], ...patch };
    onUpdate("nav_links", links);
  };

  const handleNavLinkLabelUpdate = (index, lang, value) => {
    const links = [...(content.nav_links || [])];
    links[index] = {
      ...links[index],
      label: { ...links[index].label, [lang]: value },
    };
    onUpdate("nav_links", links);
  };

  const addNavLink = () => {
    const links = [...(content.nav_links || [])];
    links.push({
      label: { en: "New Link", ar: "رابط جديد", ur: "نیا لنک" },
      destination: { type: "system_page", page: "home" },
      url: "/",
    });
    onUpdate("nav_links", links);
  };

  const removeNavLink = (index) => {
    const links = content.nav_links.filter((_, i) => i !== index);
    onUpdate("nav_links", links);
  };

  const handleCtaTextUpdate = (lang, value) => {
    onUpdate("cta_button", {
      ...content.cta_button,
      text: { ...content.cta_button?.text, [lang]: value },
    });
  };

  const handleCtaDestinationPatch = (patch) => {
    onUpdate("cta_button", { ...content.cta_button, ...patch });
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <FieldGroup title={T({ en: "Logo", ar: "الشعار", ur: "لوگو" })} isRTL={isRTL}>
        <MultilingualTextField
          label={{ en: "Logo Text", ar: "نص الشعار", ur: "لوگو ٹیکسٹ" }}
          value={content.logo?.text}
          onChange={(lang, val) => handleLogoUpdate("text", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <TextField
          label={{ en: "Logo Image URL", ar: "رابط صورة الشعار", ur: "لوگو امیج URL" }}
          value={content.logo?.image_url || ""}
          onChange={(val) => onUpdate("logo", { ...content.logo, image_url: val })}
          icon={Image}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Navigation Links */}
      <FieldGroup title={T({ en: "Navigation Links", ar: "روابط التنقل", ur: "نیویگیشن لنکس" })} isRTL={isRTL} defaultOpen>
        {(content.nav_links || []).map((link, index) => (
          <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
            <button
              onClick={() => removeNavLink(index)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <MultilingualTextField
              label={{ en: `Link ${index + 1} Label`, ar: `تسمية الرابط ${index + 1}`, ur: `لنک ${index + 1} لیبل` }}
              value={link.label}
              onChange={(lang, val) => handleNavLinkLabelUpdate(index, lang, val)}
              language={language}
              isRTL={isRTL}
            />
            <DestinationPicker
              value={{ destination: link.destination, url: link.url }}
              onChange={(patch) => handleNavLinkPatch(index, patch)}
              language={language}
              isRTL={isRTL}
            />
          </div>
        ))}
        <AddItemButton onClick={addNavLink} label={{ en: "Add Link", ar: "إضافة رابط", ur: "لنک شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>

      {/* CTA Button */}
      <FieldGroup title={T({ en: "CTA Button", ar: "زر الدعوة للعمل", ur: "سی ٹی اے بٹن" })} isRTL={isRTL}>
        <MultilingualTextField
          label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
          value={content.cta_button?.text}
          onChange={(lang, val) => handleCtaTextUpdate(lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <DestinationPicker
          label={{ en: "Button Destination", ar: "وجهة الزر", ur: "بٹن کی منزل" }}
          value={{ destination: content.cta_button?.destination, url: content.cta_button?.url }}
          onChange={handleCtaDestinationPatch}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>
    </div>
  );
}

// ============================================================
// HERO CONTENT EDITOR
// ============================================================

function HeroContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, {
      ...(typeof content[field] === "object" ? content[field] : {}),
      [lang]: value,
    });
  };

  const handleCtaTextUpdate = (ctaField, lang, value) => {
    const cta = content[ctaField] || {};
    onUpdate(ctaField, {
      ...cta,
      text: { ...cta.text, [lang]: value },
    });
  };

  const handleCtaDestinationPatch = (ctaField, patch) => {
    const cta = content[ctaField] || {};
    onUpdate(ctaField, { ...cta, ...patch });
  };

  const handleFeatureUpdate = (index, lang, value) => {
    const features = [...(content.features_list || [])];
    if (typeof features[index] === "object") {
      features[index] = { ...features[index], [lang]: value };
    } else {
      features[index] = { en: value, ar: value, ur: value };
    }
    onUpdate("features_list", features);
  };

  const addFeature = () => {
    const features = [...(content.features_list || [])];
    features.push({ en: "New Feature", ar: "ميزة جديدة", ur: "نئی خصوصیت" });
    onUpdate("features_list", features);
  };

  const removeFeature = (index) => {
    const features = content.features_list.filter((_, i) => i !== index);
    onUpdate("features_list", features);
  };

  return (
    <div className="space-y-6">
      {/* Main Text */}
      <FieldGroup title={T({ en: "Main Content", ar: "المحتوى الرئيسي", ur: "مین مواد" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      {/* Variant */}
      <SelectField
        label={{ en: "Variant", ar: "النوع", ur: "قسم" }}
        value={content.variant || "centered"}
        onChange={(val) => onUpdate("variant", val)}
        options={[
          { value: "centered", label: "Centered" },
          { value: "split", label: "Split (Text + Image)" },
          { value: "fullscreen", label: "Fullscreen" },
          // { value: "minimal_center", label: "Minimal Center" },
        ]}
        language={language}
        isRTL={isRTL}
      />

      {/* Image (for split variant) */}
      {content.variant === "split" && (
        <TextField
          label={{ en: "Hero Image URL", ar: "رابط صورة البطل", ur: "ہیرو امیج URL" }}
          value={content.image || content.background?.value || ""}
          onChange={(val) => onUpdate("image", val)}
          icon={Image}
          language={language}
          isRTL={isRTL}
        />
      )}

      {/* Primary CTA */}
      <FieldGroup title={T({ en: "Primary Button", ar: "الزر الرئيسي", ur: "پرائمری بٹن" })} isRTL={isRTL}>
        <MultilingualTextField
          label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
          value={content.primary_cta?.text}
          onChange={(lang, val) => handleCtaTextUpdate("primary_cta", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <DestinationPicker
          value={{ destination: content.primary_cta?.destination, url: content.primary_cta?.url }}
          onChange={(patch) => handleCtaDestinationPatch("primary_cta", patch)}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Secondary CTA */}
      <FieldGroup title={T({ en: "Secondary Button", ar: "الزر الثانوي", ur: "سیکنڈری بٹن" })} isRTL={isRTL}>
        <MultilingualTextField
          label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
          value={content.secondary_cta?.text}
          onChange={(lang, val) => handleCtaTextUpdate("secondary_cta", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <DestinationPicker
          value={{ destination: content.secondary_cta?.destination, url: content.secondary_cta?.url }}
          onChange={(patch) => handleCtaDestinationPatch("secondary_cta", patch)}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Features List */}
      <FieldGroup title={T({ en: "Feature Points", ar: "نقاط الميزات", ur: "فیچر پوائنٹس" })} isRTL={isRTL}>
        {(content.features_list || []).map((feature, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1">
              <MultilingualTextField
                label={{ en: `Feature ${index + 1}`, ar: `الميزة ${index + 1}`, ur: `فیچر ${index + 1}` }}
                value={feature}
                onChange={(lang, val) => handleFeatureUpdate(index, lang, val)}
                language={language}
                isRTL={isRTL}
              />
            </div>
            <button
              onClick={() => removeFeature(index)}
              className="mt-6 p-2 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <AddItemButton onClick={addFeature} label={{ en: "Add Feature", ar: "إضافة ميزة", ur: "فیچر شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}


function TeamContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  // -----------------------------
  // Helpers
  // -----------------------------
  const updateMember = (index, field, value) => {
    const members = [...(content.members || [])];
    members[index] = { ...members[index], [field]: value };
    onUpdate("members", members);
  };

  const updateMemberTranslated = (index, field, lang, value) => {
    const members = [...(content.members || [])];
    members[index] = {
      ...members[index],
      [field]: {
        ...(members[index][field] || {}),
        [lang]: value,
      },
    };
    onUpdate("members", members);
  };


  const addMember = () => {
    const members = [...(content.members || [])];
    members.push({
      name: { en: "New Member", ar: "عضو جديد", ur: "نیا رکن" },
      role: { en: "Role", ar: "المنصب", ur: "عہدہ" },
      bio: { en: "Short bio", ar: "نبذة قصيرة", ur: "مختصر تعارف" },
      photo: "",
    });
    onUpdate("members", members);
  };

  const removeMember = (index) => {
    const members = content.members.filter((_, i) => i !== index);
    onUpdate("members", members);
  };

  const updateMemberSocial = (index, field, value) => {
  const members = [...(content.members || [])];
    members[index] = {
      ...members[index],
      social: {
        ...(members[index].social || {}),
        [field]: value,
      },
    };
    onUpdate("members", members);
  };




  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <FieldGroup
        title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })}
        isRTL={isRTL}
      >
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) =>
            onUpdate("title", { ...content.title, [lang]: val })
          }
          language={language}
          isRTL={isRTL}
        />

        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) =>
            onUpdate("subtitle", { ...content.subtitle, [lang]: val })
          }
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Layout */}
      <FieldGroup
        title={T({ en: "Layout", ar: "التخطيط", ur: "لے آؤٹ" })}
        isRTL={isRTL}
      >
        <SelectField
          label={{ en: "Layout Style", ar: "نمط التخطيط", ur: "لے آؤٹ اسٹائل" }}
          value={content.layout || "grid"}
          onChange={(val) => onUpdate("layout", val)}
          options={[
            { value: "grid", label: "Grid" },
            { value: "list", label: "List" },
          ]}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Team Members */}
      <FieldGroup
        title={T({ en: "Team Members", ar: "أعضاء الفريق", ur: "ٹیم ممبرز" })}
        isRTL={isRTL}
        defaultOpen
      >
        {(content.members || []).map((member, index) => (
          <div
            key={index}
            className="relative p-4 bg-slate-50 rounded-xl space-y-4"
          >
            {/* Remove */}
            <button
              onClick={() => removeMember(index)}
              className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Photo */}
            <TextField
              label={{ en: "Photo URL", ar: "رابط الصورة", ur: "تصویر URL" }}
              value={member.photo || ""}
              onChange={(val) => updateMember(index, "photo", val)}
              icon={Image}
              language={language}
              isRTL={isRTL}
            />

            {/* Name */}
            <MultilingualTextField
              label={{ en: "Name", ar: "الاسم", ur: "نام" }}
              value={member.name}
              onChange={(lang, val) =>
                updateMemberTranslated(index, "name", lang, val)
              }
              language={language}
              isRTL={isRTL}
            />

            {/* Role */}
            <MultilingualTextField
              label={{ en: "Role", ar: "المنصب", ur: "عہدہ" }}
              value={member.role}
              onChange={(lang, val) =>
                updateMemberTranslated(index, "role", lang, val)
              }
              language={language}
              isRTL={isRTL}
            />

            {/* Bio */}
            <MultilingualTextField
              label={{ en: "Bio", ar: "نبذة", ur: "تعارف" }}
              value={member.bio}
              onChange={(lang, val) =>
                updateMemberTranslated(index, "bio", lang, val)
              }
              language={language}
              isRTL={isRTL}
            />
             <FieldGroup
                title={T({ en: "Social Links", ar: "روابط التواصل", ur: "سوشل لنکس" })}
                isRTL={isRTL}
              >
                <TextField
                  label={{ en: "LinkedIn URL", ar: "رابط لينكدإن", ur: "لنکڈ اِن URL" }}
                  value={member.social?.linkedin || ""}
                  onChange={(val) =>
                    updateMemberSocial(index, "linkedin", val)
                  }
                  icon={Link2}
                  language={language}
                  isRTL={isRTL}
                />

                <TextField
                  label={{ en: "Twitter / X URL", ar: "رابط تويتر", ur: "ٹوئٹر URL" }}
                  value={member.social?.twitter || ""}
                  onChange={(val) =>
                    updateMemberSocial(index, "twitter", val)
                  }
                  icon={Link2}
                  language={language}
                  isRTL={isRTL}
                />
              </FieldGroup>
          </div>
        ))}

        <AddItemButton
          onClick={addMember}
          label={{ en: "Add Member", ar: "إضافة عضو", ur: "ممبر شامل کریں" }}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>


  


    </div>
  );
}





// ============================================================
// SERVICES CONTENT EDITOR
// ============================================================

// Import your existing field components from PropertiesPanel
// MultilingualTextField, TextField, SelectField, CheckboxField, FieldGroup, AddItemButton

function ServicesContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);
  

  const searchParams = useSearchParams();
  // =============================================================================
  // API Configuration
  // =============================================================================
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // EditorContent
  const domain = searchParams.get("domain");

  // Determine current mode
  const currentMode = content.mode || "static";
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch available services when in database mode
  useEffect(() => {
    if (currentMode === "database") {
      fetchAvailableServices();
    }
  }, [currentMode]);

  const fetchAvailableServices = async () => {
    try {
      setLoadingServices(true);
      const response = await fetch(
          `${API_BASE}/api/v1/public-services/`,
          {
            headers: {
              "Content-Type": "application/json",
              "X-Tenant": domain,
            },
          }
        );
      if (response.ok) {
        const data = await response.json();
        setAvailableServices(data.results || data);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, {
      ...(typeof content[field] === "object" ? content[field] : {}),
      [lang]: value,
    });
  };

  // Filter services by search
  const filteredServices = availableServices.filter(service => {
    if (!searchQuery) return true;
    const name = T(service.name).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* MODE SELECTOR - This is the key new feature! */}
      {/* ============================================================ */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
        <p className="text-sm font-medium text-slate-700 mb-3">
          {T({ en: "Data Source", ar: "مصدر البيانات", ur: "ڈیٹا سورس" })}
        </p>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Static Mode */}
          <button
            onClick={() => onUpdate("mode", "static")}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              currentMode === "static"
                ? "border-blue-500 bg-white shadow-sm"
                : "border-transparent bg-white/50 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText className={`w-4 h-4 ${currentMode === "static" ? "text-blue-600" : "text-slate-400"}`} />
              <span className={`text-sm font-medium ${currentMode === "static" ? "text-blue-600" : "text-slate-600"}`}>
                {T({ en: "Static Content", ar: "محتوى ثابت", ur: "سٹیٹک مواد" })}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {T({ en: "Define services here", ar: "حدد الخدمات هنا", ur: "یہاں خدمات کی وضاحت کریں" })}
            </p>
          </button>

          {/* Database Mode */}
          <button
            onClick={() => onUpdate("mode", "database")}
            className={`p-3 rounded-lg border-2 text-left transition-all ${
              currentMode === "database"
                ? "border-purple-500 bg-white shadow-sm"
                : "border-transparent bg-white/50 hover:bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Database className={`w-4 h-4 ${currentMode === "database" ? "text-purple-600" : "text-slate-400"}`} />
              <span className={`text-sm font-medium ${currentMode === "database" ? "text-purple-600" : "text-slate-600"}`}>
                {T({ en: "From Database", ar: "من قاعدة البيانات", ur: "ڈیٹا بیس سے" })}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {T({ en: "Real services with booking/milestones", ar: "خدمات حقيقية مع الحجز", ur: "حقیقی خدمات بکنگ کے ساتھ" })}
            </p>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION HEADER (Both modes) */}
      {/* ============================================================ */}
      <FieldGroup 
        title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} 
        isRTL={isRTL} 
        defaultOpen
      >
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      {/* ============================================================ */}
      {/* STATIC MODE: Manual service list */}
      {/* ============================================================ */}
      {currentMode === "static" && (
        <StaticServicesEditor
          content={content}
          onUpdate={onUpdate}
          language={language}
          isRTL={isRTL}
        />
      )}

      {/* ============================================================ */}
      {/* DATABASE MODE: Service selector + filters */}
      {/* ============================================================ */}
      {currentMode === "database" && (
        <DatabaseServicesEditor
          content={content}
          onUpdate={onUpdate}
          availableServices={filteredServices}
          loadingServices={loadingServices}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefresh={fetchAvailableServices}
          language={language}
          isRTL={isRTL}
        />
      )}

      {/* ============================================================ */}
      {/* DISPLAY OPTIONS (Both modes) */}
      {/* ============================================================ */}
      <FieldGroup 
        title={T({ en: "Display Options", ar: "خيارات العرض", ur: "ڈسپلے آپشنز" })} 
        isRTL={isRTL}
      >
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label={{ en: "Columns", ar: "الأعمدة", ur: "کالمز" }}
            value={String(content.columns || 3)}
            onChange={(val) => onUpdate("columns", parseInt(val))}
            options={[
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "4", label: "4" },
            ]}
            language={language}
            isRTL={isRTL}
          />
          <SelectField
            label={{ en: "Card Style", ar: "نمط البطاقة", ur: "کارڈ اسٹائل" }}
            value={content.card_style || "elevated"}
            onChange={(val) => onUpdate("card_style", val)}
            options={[
              { value: "elevated", label: "Elevated" },
              { value: "flat", label: "Flat" },
              { value: "bordered", label: "Bordered" },
            ]}
            language={language}
            isRTL={isRTL}
          />
        </div>

        <div className="flex flex-wrap gap-4 mt-4">
          <CheckboxField
            label={{ en: "Show Price", ar: "إظهار السعر", ur: "قیمت دکھائیں" }}
            checked={content.show_price !== false}
            onChange={(val) => onUpdate("show_price", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Show Duration", ar: "إظهار المدة", ur: "دورانیہ دکھائیں" }}
            checked={content.show_duration !== false}
            onChange={(val) => onUpdate("show_duration", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Show Book Button", ar: "إظهار زر الحجز", ur: "بک بٹن دکھائیں" }}
            checked={content.show_book_button !== false}
            onChange={(val) => onUpdate("show_book_button", val)}
            language={language}
          />
          {currentMode === "database" && (
            <CheckboxField
              label={{ en: "Show Service Type Badge", ar: "إظهار شارة النوع", ur: "سروس ٹائپ بیج دکھائیں" }}
              checked={content.show_service_type_badge !== false}
              onChange={(val) => onUpdate("show_service_type_badge", val)}
              language={language}
            />
          )}
        </div>
      </FieldGroup>

      {/* ============================================================ */}
      {/* CTA BUTTON (Both modes) */}
      {/* ============================================================ */}
      <FieldGroup 
        title={T({ en: "Button Settings", ar: "إعدادات الزر", ur: "بٹن سیٹنگز" })} 
        isRTL={isRTL}
      >
        <MultilingualTextField
          label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
          value={content.book_button_text}
          onChange={(lang, val) => handleMultilingualUpdate("book_button_text", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        {currentMode === "static" && (
          <TextField
            label={{ en: "Button URL", ar: "رابط الزر", ur: "بٹن URL" }}
            value={content.book_button_url || ""}
            onChange={(val) => onUpdate("book_button_url", val)}
            placeholder="/book"
            language={language}
            isRTL={isRTL}
          />
        )}
        {currentMode === "database" && (
          <p className="text-xs text-slate-500 mt-2">
            {T({ 
              en: "💡 In database mode, buttons automatically link to booking or order pages based on service type.", 
              ar: "💡 في وضع قاعدة البيانات، ترتبط الأزرار تلقائيًا بصفحات الحجز أو الطلب.",
              ur: "💡 ڈیٹا بیس موڈ میں، بٹن خودکار طور پر بکنگ یا آرڈر پیجز سے لنک ہوتے ہیں۔"
            })}
          </p>
        )}
      </FieldGroup>
    </div>
  );
}

// ============================================================
// STATIC MODE: Manual Services Editor
// ============================================================

function StaticServicesEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleServiceUpdate = (index, field, lang, value) => {
    const services = [...(content.services || [])];
    if (lang) {
      services[index] = {
        ...services[index],
        [field]: { ...services[index][field], [lang]: value },
      };
    } else {
      services[index] = { ...services[index], [field]: value };
    }
    onUpdate("services", services);
  };

  const addService = () => {
    const services = [...(content.services || [])];
    services.push({
      icon: "🎯",
      name: { en: "New Service", ar: "خدمة جديدة", ur: "نئی خدمت" },
      description: { en: "Service description", ar: "وصف الخدمة", ur: "خدمت کی تفصیل" },
      price: 99,
      duration_minutes: 60,
    });
    onUpdate("services", services);
  };

  const removeService = (index) => {
    const services = content.services.filter((_, i) => i !== index);
    onUpdate("services", services);
  };

  return (
    <FieldGroup 
      title={T({ en: "Services", ar: "الخدمات", ur: "خدمات" })} 
      isRTL={isRTL} 
      defaultOpen
    >
      <p className="text-xs text-slate-500 mb-2">
        {(content.services || []).length} {T({ en: "services", ar: "خدمات", ur: "خدمات" })}
      </p>
      
      {(content.services || []).map((service, index) => (
        <ServiceItemEditor
          key={index}
          service={service}
          index={index}
          onUpdate={(field, lang, val) => handleServiceUpdate(index, field, lang, val)}
          onRemove={() => removeService(index)}
          language={language}
          isRTL={isRTL}
        />
      ))}
      
      <AddItemButton 
        onClick={addService} 
        label={{ en: "Add Service", ar: "إضافة خدمة", ur: "خدمت شامل کریں" }} 
        language={language} 
        isRTL={isRTL} 
      />
    </FieldGroup>
  );
}

// ============================================================
// DATABASE MODE: Service Selector + Filters
// ============================================================

function DatabaseServicesEditor({ 
  content, 
  onUpdate, 
  availableServices, 
  loadingServices, 
  searchQuery,
  setSearchQuery,
  onRefresh,
  language, 
  isRTL 
}) {
  const T = (v) => resolveTranslated(v, language);
  const selectedIds = content.service_ids || [];

  const toggleService = (serviceId) => {
    const newIds = selectedIds.includes(serviceId)
      ? selectedIds.filter(id => id !== serviceId)
      : [...selectedIds, serviceId];
    onUpdate("service_ids", newIds);
  };

  const selectAll = () => {
    onUpdate("service_ids", availableServices.map(s => s.id));
  };

  const clearAll = () => {
    onUpdate("service_ids", []);
  };

  return (
    <>
      {/* Link to Service Manager */}
      <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
          <div>
            <p className="text-sm font-medium text-purple-900">
              {T({ en: "Manage Your Services", ar: "إدارة خدماتك", ur: "اپنی خدمات کا انتظام کریں" })}
            </p>
            <p className="text-xs text-purple-600">
              {T({ en: "Create, edit, or delete services in Service Manager", ar: "إنشاء أو تحرير أو حذف الخدمات", ur: "سروس مینیجر میں خدمات بنائیں، ترمیم کریں یا حذف کریں" })}
            </p>
          </div>
          <button
            onClick={() => {
              // Open Service Manager modal or navigate
              // You'll implement this based on your UI pattern
              window.dispatchEvent(new CustomEvent("openServiceManager"));
            }}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
          >
            <Settings className="w-4 h-4" />
            {T({ en: "Open", ar: "فتح", ur: "کھولیں" })}
          </button>
        </div>
      </div>

      {/* Filters */}
      <FieldGroup 
        title={T({ en: "Filter Services", ar: "تصفية الخدمات", ur: "خدمات فلٹر کریں" })} 
        isRTL={isRTL}
      >
        <SelectField
          label={{ en: "Order Type", ar: "نوع الطلب", ur: "آرڈر کی قسم" }}
          value={content.order_type_filter || ""}
          onChange={(val) => onUpdate("order_type_filter", val || null)}
          options={[
            { value: "", label: T({ en: "All Types", ar: "جميع الأنواع", ur: "تمام اقسام" }) },
            { value: "booking", label: T({ en: "Booking Only", ar: "حجز فقط", ur: "صرف بکنگ" }) },
            { value: "milestone", label: T({ en: "Milestone/Project Only", ar: "مشاريع فقط", ur: "صرف پروجیکٹ" }) },
            { value: "hybrid", label: T({ en: "Hybrid Only", ar: "هجين فقط", ur: "صرف ہائبرڈ" }) },
          ]}
          language={language}
          isRTL={isRTL}
        />

        <div className="flex gap-4 mt-3">
          <CheckboxField
            label={{ en: "Featured Only", ar: "المميزة فقط", ur: "صرف فیچرڈ" }}
            checked={content.featured_only || false}
            onChange={(val) => onUpdate("featured_only", val)}
            language={language}
          />
        </div>

        <TextField
          label={{ en: "Max Services", ar: "الحد الأقصى للخدمات", ur: "زیادہ سے زیادہ خدمات" }}
          value={String(content.max_services || 6)}
          onChange={(val) => onUpdate("max_services", parseInt(val) || 6)}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Service Selector */}
      <FieldGroup 
        title={T({ en: "Select Services to Display", ar: "اختر الخدمات للعرض", ur: "ڈسپلے کے لیے خدمات منتخب کریں" })} 
        isRTL={isRTL}
        defaultOpen
      >
        {/* Search & Actions */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRTL ? "right-3" : "left-3"}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={T({ en: "Search services...", ar: "البحث في الخدمات...", ur: "خدمات تلاش کریں..." })}
              className={`w-full py-2 border border-slate-200 rounded-lg text-sm ${isRTL ? "pr-9 pl-3" : "pl-9 pr-3"}`}
            />
          </div>
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            title={T({ en: "Refresh", ar: "تحديث", ur: "ریفریش" })}
          >
            <RefreshCw className={`w-4 h-4 ${loadingServices ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            {T({ en: "Select All", ar: "تحديد الكل", ur: "سب منتخب کریں" })}
          </button>
          <span className="text-slate-300">|</span>
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            {T({ en: "Clear All", ar: "مسح الكل", ur: "سب صاف کریں" })}
          </button>
          <span className="text-xs text-slate-400 ml-auto">
            {selectedIds.length} {T({ en: "selected", ar: "محدد", ur: "منتخب" })}
          </span>
        </div>

        {/* Service List */}
        {loadingServices ? (
          <div className="py-8 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            <p className="text-sm">{T({ en: "Loading services...", ar: "جارٍ تحميل الخدمات...", ur: "خدمات لوڈ ہو رہی ہیں..." })}</p>
          </div>
        ) : availableServices.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm mb-2">{T({ en: "No services found", ar: "لم يتم العثور على خدمات", ur: "کوئی خدمات نہیں ملیں" })}</p>
            <p className="text-xs">{T({ en: "Create services in Service Manager first", ar: "أنشئ الخدمات في مدير الخدمات أولاً", ur: "پہلے سروس مینیجر میں خدمات بنائیں" })}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {availableServices.map((service) => (
              <ServiceSelectItem
                key={service.id}
                service={service}
                isSelected={selectedIds.includes(service.id)}
                onToggle={() => toggleService(service.id)}
                language={language}
                isRTL={isRTL}
              />
            ))}
          </div>
        )}
      </FieldGroup>
    </>
  );
}

// Service item in selector
function ServiceSelectItem({ service, isSelected, onToggle, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);
  
  const typeLabels = {
    booking: { label: "Booking", color: "bg-green-100 text-green-700" },
    milestone: { label: "Project", color: "bg-purple-100 text-purple-700" },
    hybrid: { label: "Hybrid", color: "bg-blue-100 text-blue-700" },
  };
  
  const typeInfo = typeLabels[service.order_type] || typeLabels.booking;

  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? "bg-blue-50 border-2 border-blue-500" 
          : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
      } ${isRTL ? "flex-row-reverse" : ""}`}
    >
      {/* Checkbox */}
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
        isSelected ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
      }`}>
        {isSelected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Service Image */}
      {service.image && (
        <img 
          src={service.image} 
          alt="" 
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
      )}

      {/* Service Info */}
      <div className={`flex-1 min-w-0 ${isRTL ? "text-right" : ""}`}>
        <p className="text-sm font-medium text-slate-900 truncate">
          {T(service.name)}
        </p>
        <div className={`flex items-center gap-2 mt-0.5 ${isRTL ? "flex-row-reverse" : ""}`}>
          <span className={`text-xs px-2 py-0.5 rounded-full ${typeInfo.color}`}>
            {typeInfo.label}
          </span>
          <span className="text-xs text-slate-500">
            ${service.base_price || service.packages?.[0]?.price || 0}

          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SERVICE ITEM EDITOR (For Static Mode)
// ============================================================

function ServiceItemEditor({ service, index, onUpdate, onRemove, language, isRTL }) {
  const [expanded, setExpanded] = useState(false);
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
      >
        <span className="text-xl">{service.icon}</span>
        <span className="flex-1 text-sm font-medium truncate">{T(service.name)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      
      {expanded && (
        <div className="p-3 space-y-3 bg-white">
          <TextField
            label={{ en: "Icon (Emoji)", ar: "الأيقونة", ur: "آئیکن" }}
            value={service.icon}
            onChange={(val) => onUpdate("icon", null, val)}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Name", ar: "الاسم", ur: "نام" }}
            value={service.name}
            onChange={(lang, val) => onUpdate("name", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Description", ar: "الوصف", ur: "تفصیل" }}
            value={service.description}
            onChange={(lang, val) => onUpdate("description", lang, val)}
            language={language}
            isRTL={isRTL}
            multiline
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label={{ en: "Price ($)", ar: "السعر", ur: "قیمت" }}
              value={String(service.price || "")}
              onChange={(val) => onUpdate("price", null, parseFloat(val) || 0)}
              language={language}
              isRTL={isRTL}
            />
            <TextField
              label={{ en: "Duration (min)", ar: "المدة (دقيقة)", ur: "دورانیہ (منٹ)" }}
              value={String(service.duration_minutes || "")}
              onChange={(val) => onUpdate("duration_minutes", null, parseInt(val) || 0)}
              language={language}
              isRTL={isRTL}
            />
          </div>
          <TextField
            label={{ en: "Image URL", ar: "رابط الصورة", ur: "تصویر URL" }}
            value={service.image || service.gallery?.[0]}
            onChange={(val) => onUpdate("image", null, val)}
            language={language}
            isRTL={isRTL}
          />
        </div>
      )}
    </div>
  );
}


// function ServicesContentEditor({ content, onUpdate, language, isRTL }) {
//   const T = (v) => resolveTranslated(v, language);

//   const handleMultilingualUpdate = (field, lang, value) => {
//     onUpdate(field, {
//       ...(typeof content[field] === "object" ? content[field] : {}),
//       [lang]: value,
//     });
//   };

//   const handleServiceUpdate = (index, field, lang, value) => {
//     const services = [...(content.services || [])];
//     if (lang) {
//       services[index] = {
//         ...services[index],
//         [field]: { ...services[index][field], [lang]: value },
//       };
//     } else {
//       services[index] = { ...services[index], [field]: value };
//     }
//     onUpdate("services", services);
//   };

//   const addService = () => {
//     const services = [...(content.services || [])];
//     services.push({
//       icon: "🎯",
//       title: { en: "New Service", ar: "خدمة جديدة", ur: "نئی خدمت" },
//       description: { en: "Service description", ar: "وصف الخدمة", ur: "خدمت کی تفصیل" },
//       price: { en: "From $99", ar: "من 99 دولار", ur: "$99 سے" },
//       delivery: { en: "1-2 days", ar: "1-2 أيام", ur: "1-2 دن" },
//     });
//     onUpdate("services", services);
//   };

//   const removeService = (index) => {
//     const services = content.services.filter((_, i) => i !== index);
//     onUpdate("services", services);
//   };

//   return (
//     <div className="space-y-6">
//       {/* Section Title & Subtitle */}
//       <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
//         <MultilingualTextField
//           label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
//           value={content.title}
//           onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
//           language={language}
//           isRTL={isRTL}
//         />
//         <MultilingualTextField
//           label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
//           value={content.subtitle}
//           onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
//           language={language}
//           isRTL={isRTL}
//           multiline
//         />
//       </FieldGroup>

//       {/* Layout Options */}
//       <div className="grid grid-cols-2 gap-3">
//         <SelectField
//           label={{ en: "Layout", ar: "التخطيط", ur: "لے آؤٹ" }}
//           value={content.layout || "cards"}
//           onChange={(val) => onUpdate("layout", val)}
//           options={[
//             { value: "cards", label: "Cards" },
//             { value: "list", label: "List" },
//             { value: "grid", label: "Grid" },
//           ]}
//           language={language}
//           isRTL={isRTL}
//         />
//         <SelectField
//           label={{ en: "Columns", ar: "الأعمدة", ur: "کالمز" }}
//           value={String(content.columns || 3)}
//           onChange={(val) => onUpdate("columns", parseInt(val))}
//           options={[
//             { value: "2", label: "2" },
//             { value: "3", label: "3" },
//             { value: "4", label: "4" },
//           ]}
//           language={language}
//           isRTL={isRTL}
//         />
//       </div>

//       {/* Services List */}
//       <FieldGroup title={T({ en: "Services", ar: "الخدمات", ur: "خدمات" })} isRTL={isRTL} defaultOpen>
//         <p className="text-xs text-slate-500 mb-2">
//           {(content.services || []).length} {T({ en: "services", ar: "خدمات", ur: "خدمات" })}
//         </p>
        
//         {(content.services || []).map((service, index) => (
//           <ServiceItemEditor
//             key={index}
//             service={service}
//             index={index}
//             onUpdate={(field, lang, val) => handleServiceUpdate(index, field, lang, val)}
//             onRemove={() => removeService(index)}
//             language={language}
//             isRTL={isRTL}
//           />
//         ))}
        
//         <AddItemButton onClick={addService} label={{ en: "Add Service", ar: "إضافة خدمة", ur: "خدمت شامل کریں" }} language={language} isRTL={isRTL} />
//       </FieldGroup>

//       {/* CTA Button */}
//       {content.show_cta !== false && (
//         <FieldGroup title={T({ en: "CTA Button", ar: "زر الدعوة", ur: "سی ٹی اے بٹن" })} isRTL={isRTL}>
//           <MultilingualTextField
//             label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
//             value={content.cta_button?.text}
//             onChange={(lang, val) => onUpdate("cta_button", { ...content.cta_button, text: { ...content.cta_button?.text, [lang]: val } })}
//             language={language}
//             isRTL={isRTL}
//           />
//           <TextField
//             label={{ en: "Button URL", ar: "رابط الزر", ur: "بٹن URL" }}
//             value={content.cta_button?.url || ""}
//             onChange={(val) => onUpdate("cta_button", { ...content.cta_button, url: val })}
//             icon={Link2}
//             language={language}
//             isRTL={isRTL}
//           />
//         </FieldGroup>
//       )}
//     </div>
//   );
// }

// Service Item Editor
// function ServiceItemEditor({ service, index, onUpdate, onRemove, language, isRTL }) {
//   const [expanded, setExpanded] = useState(false);
//   const T = (v) => resolveTranslated(v, language);

//   return (
//     <div className="border border-slate-200 rounded-lg overflow-hidden">
//       <div
//         onClick={() => setExpanded(!expanded)}
//         className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
//       >
//         <span className="text-xl">{service.icon}</span>
//         <span className="flex-1 text-sm font-medium truncate">{T(service.title)}</span>
//         <button
//           onClick={(e) => { e.stopPropagation(); onRemove(); }}
//           className="p-1 text-slate-400 hover:text-red-500"
//         >
//           <Trash2 className="w-4 h-4" />
//         </button>
//         {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
//       </div>
      
//       {expanded && (
//         <div className="p-3 space-y-3 bg-white">
//           <TextField
//             label={{ en: "Icon (Emoji)", ar: "الأيقونة", ur: "آئیکن" }}
//             value={service.icon}
//             onChange={(val) => onUpdate("icon", null, val)}
//             language={language}
//             isRTL={isRTL}
//           />
//           <MultilingualTextField
//             label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
//             value={service.title}
//             onChange={(lang, val) => onUpdate("title", lang, val)}
//             language={language}
//             isRTL={isRTL}
//           />
//           <MultilingualTextField
//             label={{ en: "Description", ar: "الوصف", ur: "تفصیل" }}
//             value={service.description}
//             onChange={(lang, val) => onUpdate("description", lang, val)}
//             language={language}
//             isRTL={isRTL}
//             multiline
//           />
//           <MultilingualTextField
//             label={{ en: "Price", ar: "السعر", ur: "قیمت" }}
//             value={service.price}
//             onChange={(lang, val) => onUpdate("price", lang, val)}
//             language={language}
//             isRTL={isRTL}
//           />
//           <MultilingualTextField
//             label={{ en: "Delivery Time", ar: "وقت التسليم", ur: "ڈیلیوری ٹائم" }}
//             value={service.delivery}
//             onChange={(lang, val) => onUpdate("delivery", lang, val)}
//             language={language}
//             isRTL={isRTL}
//           />
//         </div>
//       )}
//     </div>
//   );
// }

// ============================================================
// TESTIMONIALS CONTENT EDITOR
// ============================================================

function TestimonialsContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleTestimonialUpdate = (index, field, lang, value) => {
    const testimonials = [...(content.testimonials || [])];
    if (lang) {
      testimonials[index] = {
        ...testimonials[index],
        [field]: { ...testimonials[index][field], [lang]: value },
      };
    } else {
      testimonials[index] = { ...testimonials[index], [field]: value };
    }
    onUpdate("testimonials", testimonials);
  };

  const addTestimonial = () => {
    const testimonials = [...(content.testimonials || [])];
    testimonials.push({
      name: { en: "Customer Name", ar: "اسم العميل", ur: "کسٹمر کا نام" },
      text: { en: "Amazing service!", ar: "خدمة رائعة!", ur: "شاندار خدمت!" },
      company: { en: "Company Name", ar: "اسم الشركة", ur: "کمپنی کا نام" },
      photo: "",
      rating: 5,
    });
    onUpdate("testimonials", testimonials);
  };

  const removeTestimonial = (index) => {
    onUpdate("testimonials", content.testimonials.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      <SelectField
        label={{ en: "Variant", ar: "النوع", ur: "قسم" }}
        value={content.variant || "carousel"}
        onChange={(val) => onUpdate("variant", val)}
        options={[
          { value: "carousel", label: "Carousel" },
          { value: "grid", label: "Grid" },
          { value: "masonry", label: "Masonry" },
        ]}
        language={language}
        isRTL={isRTL}
      />

      <div className="flex gap-4">
        <CheckboxField
          label={{ en: "Show Photos", ar: "إظهار الصور", ur: "تصاویر دکھائیں" }}
          checked={content.show_photos !== false}
          onChange={(val) => onUpdate("show_photos", val)}
          language={language}
        />
        <CheckboxField
          label={{ en: "Show Ratings", ar: "إظهار التقييمات", ur: "ریٹنگز دکھائیں" }}
          checked={content.show_ratings !== false}
          onChange={(val) => onUpdate("show_ratings", val)}
          language={language}
        />
      </div>

      <FieldGroup title={T({ en: "Testimonials", ar: "الشهادات", ur: "تعریفیں" })} isRTL={isRTL} defaultOpen>
        {(content.testimonials || []).map((testimonial, index) => (
          <TestimonialItemEditor
            key={index}
            testimonial={testimonial}
            index={index}
            onUpdate={(field, lang, val) => handleTestimonialUpdate(index, field, lang, val)}
            onRemove={() => removeTestimonial(index)}
            language={language}
            isRTL={isRTL}
          />
        ))}
        <AddItemButton onClick={addTestimonial} label={{ en: "Add Testimonial", ar: "إضافة شهادة", ur: "تعریف شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

function TestimonialItemEditor({ testimonial, index, onUpdate, onRemove, language, isRTL }) {
  const [expanded, setExpanded] = useState(false);
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
      >
        {testimonial.photo && <img src={testimonial.photo} className="w-8 h-8 rounded-full object-cover" />}
        <span className="flex-1 text-sm font-medium truncate">{T(testimonial.name)}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-slate-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      
      {expanded && (
        <div className="p-3 space-y-3 bg-white">
          <MultilingualTextField
            label={{ en: "Name", ar: "الاسم", ur: "نام" }}
            value={testimonial.name}
            onChange={(lang, val) => onUpdate("name", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Testimonial Text", ar: "نص الشهادة", ur: "تعریف کا متن" }}
            value={testimonial.text}
            onChange={(lang, val) => onUpdate("text", lang, val)}
            language={language}
            isRTL={isRTL}
            multiline
          />
          <MultilingualTextField
            label={{ en: "Company/Title", ar: "الشركة/المنصب", ur: "کمپنی/عنوان" }}
            value={testimonial.company}
            onChange={(lang, val) => onUpdate("company", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <TextField
            label={{ en: "Photo URL", ar: "رابط الصورة", ur: "فوٹو URL" }}
            value={testimonial.photo || ""}
            onChange={(val) => onUpdate("photo", null, val)}
            icon={Image}
            language={language}
            isRTL={isRTL}
          />
          <SelectField
            label={{ en: "Rating", ar: "التقييم", ur: "ریٹنگ" }}
            value={String(testimonial.rating || 5)}
            onChange={(val) => onUpdate("rating", null, parseInt(val))}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} ⭐` }))}
            language={language}
            isRTL={isRTL}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRICING CONTENT EDITOR
// ============================================================

function PricingContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handlePlanUpdate = (index, field, lang, value) => {
    const plans = [...(content.plans || [])];
    if (lang) {
      plans[index] = {
        ...plans[index],
        [field]: { ...plans[index][field], [lang]: value },
      };
    } else {
      plans[index] = { ...plans[index], [field]: value };
    }
    onUpdate("plans", plans);
  };

  const addPlan = () => {
    const plans = [...(content.plans || [])];
    plans.push({
      name: { en: "New Plan", ar: "خطة جديدة", ur: "نیا پلان" },
      price_monthly: "$99",
      price_yearly: "$999",
      period: { en: "per month", ar: "شهرياً", ur: "فی مہینہ" },
      features: [],
      cta: { en: "Get Started", ar: "ابدأ الآن", ur: "شروع کریں" },
      highlighted: false,
    });
    onUpdate("plans", plans);
  };

  const removePlan = (index) => {
    onUpdate("plans", content.plans.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      <CheckboxField
        label={{ en: "Show Billing Toggle", ar: "إظهار تبديل الفوترة", ur: "بلنگ ٹوگل دکھائیں" }}
        checked={content.billing_toggle !== false}
        onChange={(val) => onUpdate("billing_toggle", val)}
        language={language}
      />

      <FieldGroup title={T({ en: "Pricing Plans", ar: "خطط الأسعار", ur: "قیمتوں کے پلانز" })} isRTL={isRTL} defaultOpen>
        {(content.plans || []).map((plan, index) => (
          <PlanItemEditor
            key={index}
            plan={plan}
            index={index}
            onUpdate={(field, lang, val) => handlePlanUpdate(index, field, lang, val)}
            onRemove={() => removePlan(index)}
            language={language}
            isRTL={isRTL}
          />
        ))}
        <AddItemButton onClick={addPlan} label={{ en: "Add Plan", ar: "إضافة خطة", ur: "پلان شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

function PlanItemEditor({ plan, index, onUpdate, onRemove, language, isRTL }) {
  const [expanded, setExpanded] = useState(false);
  const T = (v) => resolveTranslated(v, language);

  const handleFeatureUpdate = (featureIndex, lang, value) => {
    const features = [...(plan.features || [])];
    if (typeof features[featureIndex] === "object") {
      features[featureIndex] = { ...features[featureIndex], [lang]: value };
    } else {
      features[featureIndex] = { en: value, ar: value, ur: value };
    }
    onUpdate("features", null, features);
  };

  const addFeature = () => {
    const features = [...(plan.features || [])];
    features.push({ en: "New Feature", ar: "ميزة جديدة", ur: "نئی خصوصیت" });
    onUpdate("features", null, features);
  };

  const removeFeature = (featureIndex) => {
    const features = plan.features.filter((_, i) => i !== featureIndex);
    onUpdate("features", null, features);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
      >
        {plan.highlighted && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">★</span>}
        <span className="flex-1 text-sm font-medium truncate">{T(plan.name)}</span>
        <span className="text-sm text-slate-500">{plan.price_monthly}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-slate-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      
      {expanded && (
        <div className="p-3 space-y-3 bg-white">
          <MultilingualTextField
            label={{ en: "Plan Name", ar: "اسم الخطة", ur: "پلان کا نام" }}
            value={plan.name}
            onChange={(lang, val) => onUpdate("name", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label={{ en: "Monthly Price", ar: "السعر الشهري", ur: "ماہانہ قیمت" }}
              value={plan.price_monthly || ""}
              onChange={(val) => onUpdate("price_monthly", null, val)}
              language={language}
              isRTL={isRTL}
            />
            <TextField
              label={{ en: "Yearly Price", ar: "السعر السنوي", ur: "سالانہ قیمت" }}
              value={plan.price_yearly || ""}
              onChange={(val) => onUpdate("price_yearly", null, val)}
              language={language}
              isRTL={isRTL}
            />
          </div>
          <MultilingualTextField
            label={{ en: "Period Label", ar: "فترة الدفع", ur: "مدت کا لیبل" }}
            value={plan.period}
            onChange={(lang, val) => onUpdate("period", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "CTA Text", ar: "نص الزر", ur: "سی ٹی اے ٹیکسٹ" }}
            value={plan.cta}
            onChange={(lang, val) => onUpdate("cta", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <CheckboxField
            label={{ en: "Highlighted", ar: "مميز", ur: "ہائی لائٹڈ" }}
            checked={plan.highlighted}
            onChange={(val) => onUpdate("highlighted", null, val)}
            language={language}
          />

          {/* Features */}
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-slate-600 mb-2">{T({ en: "Features", ar: "الميزات", ur: "خصوصیات" })}</p>
            {(plan.features || []).map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-start gap-2 mb-2">
                <div className="flex-1">
                  <MultilingualTextField
                    label={{ en: `Feature ${featureIndex + 1}`, ar: `الميزة ${featureIndex + 1}`, ur: `فیچر ${featureIndex + 1}` }}
                    value={feature}
                    onChange={(lang, val) => handleFeatureUpdate(featureIndex, lang, val)}
                    language={language}
                    isRTL={isRTL}
                  />
                </div>
                <button onClick={() => removeFeature(featureIndex)} className="mt-6 p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <AddItemButton onClick={addFeature} label={{ en: "Add Feature", ar: "إضافة ميزة", ur: "فیچر شامل کریں" }} language={language} isRTL={isRTL} small />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FAQ CONTENT EDITOR
// ============================================================

function FaqContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleFaqUpdate = (index, field, lang, value) => {
    const faqs = [...(content.faqs || [])];
    faqs[index] = {
      ...faqs[index],
      [field]: { ...faqs[index][field], [lang]: value },
    };
    onUpdate("faqs", faqs);
  };

  const addFaq = () => {
    const faqs = [...(content.faqs || [])];
    faqs.push({
      question: { en: "New Question?", ar: "سؤال جديد؟", ur: "نیا سوال؟" },
      answer: { en: "Answer here...", ar: "الجواب هنا...", ur: "جواب یہاں..." },
    });
    onUpdate("faqs", faqs);
  };

  const removeFaq = (index) => {
    onUpdate("faqs", content.faqs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      <SelectField
        label={{ en: "Layout", ar: "التخطيط", ur: "لے آؤٹ" }}
        value={content.layout || "single_column"}
        onChange={(val) => onUpdate("layout", val)}
        options={[
          { value: "single_column", label: "Single Column" },
          { value: "two_column", label: "Two Columns" },
        ]}
        language={language}
        isRTL={isRTL}
      />

      <FieldGroup title={T({ en: "FAQs", ar: "الأسئلة الشائعة", ur: "عمومی سوالات" })} isRTL={isRTL} defaultOpen>
        {(content.faqs || []).map((faq, index) => (
          <FaqItemEditor
            key={index}
            faq={faq}
            index={index}
            onUpdate={(field, lang, val) => handleFaqUpdate(index, field, lang, val)}
            onRemove={() => removeFaq(index)}
            language={language}
            isRTL={isRTL}
          />
        ))}
        <AddItemButton onClick={addFaq} label={{ en: "Add FAQ", ar: "إضافة سؤال", ur: "سوال شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

function FaqItemEditor({ faq, index, onUpdate, onRemove, language, isRTL }) {
  const [expanded, setExpanded] = useState(false);
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
      >
        <span className="flex-1 text-sm font-medium truncate">{T(faq.question)}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-slate-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      
      {expanded && (
        <div className="p-3 space-y-3 bg-white">
          <MultilingualTextField
            label={{ en: "Question", ar: "السؤال", ur: "سوال" }}
            value={faq.question}
            onChange={(lang, val) => onUpdate("question", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Answer", ar: "الجواب", ur: "جواب" }}
            value={faq.answer}
            onChange={(lang, val) => onUpdate("answer", lang, val)}
            language={language}
            isRTL={isRTL}
            multiline
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// STATS CONTENT EDITOR
// ============================================================

function StatsContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleStatUpdate = (index, field, lang, value) => {
    const stats = [...(content.stats || [])];
    if (lang) {
      stats[index] = {
        ...stats[index],
        [field]: { ...stats[index][field], [lang]: value },
      };
    } else {
      stats[index] = { ...stats[index], [field]: value };
    }
    onUpdate("stats", stats);
  };

  const addStat = () => {
    const stats = [...(content.stats || [])];
    stats.push({
      number: "100+",
      label: { en: "New Metric", ar: "مقياس جديد", ur: "نئی پیمائش" },
    });
    onUpdate("stats", stats);
  };

  const removeStat = (index) => {
    onUpdate("stats", content.stats.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* <SelectField
        label={{ en: "Background Style", ar: "نمط الخلفية", ur: "بیک گراؤنڈ اسٹائل" }}
        value={content.background || "gradient"}
        onChange={(val) => onUpdate("background", val)}
        options={[
          { value: "gradient", label: "Gradient" },
          { value: "solid", label: "Solid" },
          { value: "transparent", label: "Transparent" },
        ]}
        language={language}
        isRTL={isRTL}
      /> */}

      <FieldGroup title={T({ en: "Statistics", ar: "الإحصائيات", ur: "اعدادوشمار" })} isRTL={isRTL} defaultOpen>
        {(content.stats || []).map((stat, index) => (
          <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
            <button
              onClick={() => removeStat(index)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <TextField
              label={{ en: "Number", ar: "الرقم", ur: "نمبر" }}
              value={stat.number}
              onChange={(val) => handleStatUpdate(index, "number", null, val)}
              language={language}
              isRTL={isRTL}
            />
            <MultilingualTextField
              label={{ en: "Label", ar: "التسمية", ur: "لیبل" }}
              value={stat.label}
              onChange={(lang, val) => handleStatUpdate(index, "label", lang, val)}
              language={language}
              isRTL={isRTL}
            />
          </div>
        ))}
        <AddItemButton onClick={addStat} label={{ en: "Add Stat", ar: "إضافة إحصائية", ur: "اعداد شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

// ============================================================
// GALLERY CONTENT EDITOR
// ============================================================

function GalleryContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleItemUpdate = (index, field, lang, value) => {
    const items = [...(content.items || [])];
    if (lang) {
      items[index] = {
        ...items[index],
        [field]: { ...items[index][field], [lang]: value },
      };
    } else {
      items[index] = { ...items[index], [field]: value };
    }
    onUpdate("items", items);
  };

  const addItem = () => {
    const items = [...(content.items || [])];
    items.push({
      title: { en: "New Item", ar: "عنصر جديد", ur: "نیا آئٹم" },
      category: { en: "Category", ar: "الفئة", ur: "کیٹگری" },
      image_url: "https://via.placeholder.com/400x300",
    });
    onUpdate("items", items);
  };

  const removeItem = (index) => {
    onUpdate("items", content.items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label={{ en: "Layout", ar: "التخطيط", ur: "لے آؤٹ" }}
          value={content.layout || "masonry"}
          onChange={(val) => onUpdate("layout", val)}
          options={[
            { value: "masonry", label: "Masonry" },
            { value: "grid", label: "Grid" },
            { value: "carousel", label: "Carousel" },
          ]}
          language={language}
          isRTL={isRTL}
        />
        <SelectField
          label={{ en: "Columns", ar: "الأعمدة", ur: "کالمز" }}
          value={String(content.columns || 3)}
          onChange={(val) => onUpdate("columns", parseInt(val))}
          options={[
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
          language={language}
          isRTL={isRTL}
        />
      </div>

      <CheckboxField
        label={{ en: "Show Filter", ar: "إظهار الفلتر", ur: "فلٹر دکھائیں" }}
        checked={content.show_filter !== false}
        onChange={(val) => onUpdate("show_filter", val)}
        language={language}
      />

      <FieldGroup title={T({ en: "Gallery Items", ar: "عناصر المعرض", ur: "گیلری آئٹمز" })} isRTL={isRTL} defaultOpen>
        {(content.items || []).map((item, index) => (
          <GalleryItemEditor
            key={index}
            item={item}
            index={index}
            onUpdate={(field, lang, val) => handleItemUpdate(index, field, lang, val)}
            onRemove={() => removeItem(index)}
            language={language}
            isRTL={isRTL}
          />
        ))}
        <AddItemButton onClick={addItem} label={{ en: "Add Item", ar: "إضافة عنصر", ur: "آئٹم شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

function GalleryItemEditor({ item, index, onUpdate, onRemove, language, isRTL }) {
  const [expanded, setExpanded] = useState(false);
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
      >
        {item.image_url && <img src={item.image_url} className="w-10 h-10 rounded object-cover" />}
        <span className="flex-1 text-sm font-medium truncate">{T(item.title)}</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-slate-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      
      {expanded && (
        <div className="p-3 space-y-3 bg-white">
          <MultilingualTextField
            label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
            value={item.title}
            onChange={(lang, val) => onUpdate("title", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Category", ar: "الفئة", ur: "کیٹگری" }}
            value={item.category}
            onChange={(lang, val) => onUpdate("category", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          <TextField
            label={{ en: "Image URL", ar: "رابط الصورة", ur: "امیج URL" }}
            value={item.image_url || ""}
            onChange={(val) => onUpdate("image_url", null, val)}
            icon={Image}
            language={language}
            isRTL={isRTL}
          />
        </div>
      )}
    </div>
  );
}


// ============================================================
// GRID CONTENT EDITOR
// ============================================================

function GridContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  // -----------------------------
  // Helpers
  // -----------------------------
  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, {
      ...(content[field] || {}),
      [lang]: value,
    });
  };

  const updateItem = (index, field, lang, value) => {
    const items = [...(content.items || [])];

    if (lang) {
      items[index] = {
        ...items[index],
        [field]: {
          ...(items[index][field] || {}),
          [lang]: value,
        },
      };
    } else {
      items[index] = {
        ...items[index],
        [field]: value,
      };
    }

    onUpdate("items", items);
  };

  const addItem = () => {
    const items = [...(content.items || [])];
    items.push({
      image: "https://via.placeholder.com/400x300",
      title: {
        en: "New Item",
        ar: "عنصر جديد",
        ur: "نیا آئٹم",
      },
      description: {
        en: "Item description",
        ar: "وصف العنصر",
        ur: "آئٹم کی تفصیل",
      },
    });
    onUpdate("items", items);
  };

  const removeItem = (index) => {
    onUpdate(
      "items",
      content.items.filter((_, i) => i !== index)
    );
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <FieldGroup
        title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })}
        isRTL={isRTL}
        defaultOpen
      >
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) =>
            handleMultilingualUpdate("title", lang, val)
          }
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Layout Settings */}
      <FieldGroup
        title={T({ en: "Layout Settings", ar: "إعدادات التخطيط", ur: "لے آؤٹ سیٹنگز" })}
        isRTL={isRTL}
        defaultOpen
      >
        <SelectField
          label={{ en: "Variant", ar: "النوع", ur: "ویریئنٹ" }}
          value={content.variant || "cards"}
          onChange={(val) => onUpdate("variant", val)}
          options={[
            { value: "cards", label: "Cards" },
            { value: "simple", label: "Simple" },
            { value: "image_overlay", label: "Image Overlay" },
          ]}
          language={language}
          isRTL={isRTL}
        />

        <SelectField
          label={{ en: "Columns", ar: "الأعمدة", ur: "کالمز" }}
          value={String(content.columns || 3)}
          onChange={(val) => onUpdate("columns", parseInt(val))}
          options={[
            { value: "2", label: "2" },
            { value: "3", label: "3" },
            { value: "4", label: "4" },
          ]}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Grid Items */}
      <FieldGroup
        title={T({ en: "Grid Items", ar: "عناصر الشبكة", ur: "گرڈ آئٹمز" })}
        isRTL={isRTL}
        defaultOpen
      >
        {(content.items || []).map((item, index) => (
          <div
            key={index}
            className="relative p-4 bg-slate-50 rounded-xl space-y-4"
          >
            {/* Remove */}
            <button
              onClick={() => removeItem(index)}
              className="absolute top-3 right-3 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Image */}
            <TextField
              label={{ en: "Image URL", ar: "رابط الصورة", ur: "امیج URL" }}
              value={item.image || ""}
              onChange={(val) => updateItem(index, "image", null, val)}
              icon={Image}
              language={language}
              isRTL={isRTL}
            />

            {/* Title */}
            <MultilingualTextField
              label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
              value={item.title}
              onChange={(lang, val) =>
                updateItem(index, "title", lang, val)
              }
              language={language}
              isRTL={isRTL}
            />

            {/* Description */}
            <MultilingualTextField
              label={{ en: "Description", ar: "الوصف", ur: "تفصیل" }}
              value={item.description}
              onChange={(lang, val) =>
                updateItem(index, "description", lang, val)
              }
              language={language}
              isRTL={isRTL}
              multiline
            />
          </div>
        ))}

        <AddItemButton
          onClick={addItem}
          label={{ en: "Add Item", ar: "إضافة عنصر", ur: "آئٹم شامل کریں" }}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>
    </div>
  );
}




// ============================================================
// STEPS CONTENT EDITOR
// ============================================================

function StepsContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleStepUpdate = (index, field, lang, value) => {
    const steps = [...(content.steps || [])];
    if (lang) {
      steps[index] = {
        ...steps[index],
        [field]: { ...steps[index][field], [lang]: value },
      };
    } else {
      steps[index] = { ...steps[index], [field]: value };
    }
    onUpdate("steps", steps);
  };

  const addStep = () => {
    const steps = [...(content.steps || [])];
    const nextNum = String(steps.length + 1).padStart(2, "0");
    steps.push({
      number: nextNum,
      title: { en: "New Step", ar: "خطوة جديدة", ur: "نیا قدم" },
      description: { en: "Step description", ar: "وصف الخطوة", ur: "قدم کی تفصیل" },
    });
    onUpdate("steps", steps);
  };

  const removeStep = (index) => {
    onUpdate("steps", content.steps.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      <SelectField
        label={{ en: "Layout", ar: "التخطيط", ur: "لے آؤٹ" }}
        value={content.layout || "horizontal"}
        onChange={(val) => onUpdate("layout", val)}
        options={[
          { value: "horizontal", label: "Horizontal" },
          { value: "vertical", label: "Vertical" },
          { value: "timeline", label: "Timeline" },
        ]}
        language={language}
        isRTL={isRTL}
      />

      <FieldGroup title={T({ en: "Steps", ar: "الخطوات", ur: "اقدامات" })} isRTL={isRTL} defaultOpen>
        {(content.steps || []).map((step, index) => (
          <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
            <button
              onClick={() => removeStep(index)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <TextField
              label={{ en: "Step Number", ar: "رقم الخطوة", ur: "قدم نمبر" }}
              value={step.number}
              onChange={(val) => handleStepUpdate(index, "number", null, val)}
              language={language}
              isRTL={isRTL}
            />
            <MultilingualTextField
              label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
              value={step.title}
              onChange={(lang, val) => handleStepUpdate(index, "title", lang, val)}
              language={language}
              isRTL={isRTL}
            />
            <MultilingualTextField
              label={{ en: "Description", ar: "الوصف", ur: "تفصیل" }}
              value={step.description}
              onChange={(lang, val) => handleStepUpdate(index, "description", lang, val)}
              language={language}
              isRTL={isRTL}
              multiline
            />
          </div>
        ))}
        <AddItemButton onClick={addStep} label={{ en: "Add Step", ar: "إضافة خطوة", ur: "قدم شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

// ============================================================
// CTA CONTENT EDITOR
// ============================================================

function CtaContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  return (
    <div className="space-y-6">
      <SelectField
        label={{ en: "Variant", ar: "النوع", ur: "قسم" }}
        value={content.variant || "banner"}
        onChange={(val) => onUpdate("variant", val)}
        options={[
          { value: "banner", label: "Full Banner" },
          { value: "split", label: "Split" },
          { value: "minimal", label: "Minimal" },
        ]}
        language={language}
        isRTL={isRTL}
      />

      <MultilingualTextField
        label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
        value={content.title}
        onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
        language={language}
        isRTL={isRTL}
      />

      <MultilingualTextField
        label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
        value={content.subtitle}
        onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
        language={language}
        isRTL={isRTL}
        multiline
      />

      {/* Primary button */}
      <FieldGroup title={T({ en: "Primary Button", ar: "الزر الأساسي", ur: "بنیادی بٹن" })} isRTL={isRTL}>
        <MultilingualTextField
          label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
          value={content.button_label}
          onChange={(lang, val) => handleMultilingualUpdate("button_label", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <DestinationPicker
          value={{ destination: content.button_destination, url: content.button_url }}
          onChange={(patch) => {
            onUpdate("button_destination", patch.destination);
            onUpdate("button_url", patch.url);
          }}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Secondary button */}
      <FieldGroup title={T({ en: "Secondary Button", ar: "الزر الثانوي", ur: "ثانوی بٹن" })} isRTL={isRTL}>
        <MultilingualTextField
          label={{ en: "Button Text", ar: "نص الزر", ur: "بٹن ٹیکسٹ" }}
          value={content.secondary_button}
          onChange={(lang, val) => handleMultilingualUpdate("secondary_button", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <DestinationPicker
          value={{ destination: content.secondary_button_destination, url: content.secondary_button_url }}
          onChange={(patch) => {
            onUpdate("secondary_button_destination", patch.destination);
            onUpdate("secondary_button_url", patch.url);
          }}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>
    </div>
  );
}

// ============================================================
// FOOTER CONTENT EDITOR
// ============================================================

function FooterContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleColumnUpdate = (colIndex, field, lang, value) => {
    const columns = [...(content.columns || [])];
    if (lang) {
      columns[colIndex] = {
        ...columns[colIndex],
        [field]: { ...columns[colIndex][field], [lang]: value },
      };
    } else {
      columns[colIndex] = { ...columns[colIndex], [field]: value };
    }
    onUpdate("columns", columns);
  };

  const handleColumnLinkUpdate = (colIndex, linkIndex, field, lang, value) => {
    const columns = [...(content.columns || [])];
    const links = [...(columns[colIndex].links || [])];
    if (lang) {
      links[linkIndex] = {
        ...links[linkIndex],
        [field]: { ...links[linkIndex][field], [lang]: value },
      };
    } else {
      links[linkIndex] = { ...links[linkIndex], [field]: value };
    }
    columns[colIndex] = { ...columns[colIndex], links };
    onUpdate("columns", columns);
  };

  const handleColumnLinkPatch = (colIndex, linkIndex, patch) => {
    const columns = [...(content.columns || [])];
    const links = [...(columns[colIndex].links || [])];
    links[linkIndex] = { ...links[linkIndex], ...patch };
    columns[colIndex] = { ...columns[colIndex], links };
    onUpdate("columns", columns);
  };

  const addColumn = () => {
    const columns = [...(content.columns || [])];
    columns.push({
      title: { en: "New Column", ar: "عمود جديد", ur: "نیا کالم" },
      links: [],
    });
    onUpdate("columns", columns);
  };

  const removeColumn = (index) => {
    onUpdate("columns", content.columns.filter((_, i) => i !== index));
  };

  const addLink = (colIndex) => {
    const columns = [...(content.columns || [])];
    columns[colIndex].links = [
      ...(columns[colIndex].links || []),
      { label: { en: "New Link", ar: "رابط جديد", ur: "نیا لنک" }, url: "#" },
    ];
    onUpdate("columns", columns);
  };

  const removeLink = (colIndex, linkIndex) => {
    const columns = [...(content.columns || [])];
    columns[colIndex].links = columns[colIndex].links.filter((_, i) => i !== linkIndex);
    onUpdate("columns", columns);
  };

  const handleSocialUpdate = (index, field, value) => {
    const links = [...(content.social_links || [])];
    links[index] = { ...links[index], [field]: value };
    onUpdate("social_links", links);
  };

  const addSocialLink = () => {
    const links = [...(content.social_links || [])];
    links.push({ platform: "twitter", url: "#" });
    onUpdate("social_links", links);
  };

  const removeSocialLink = (index) => {
    onUpdate("social_links", content.social_links.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* <SelectField
        label={{ en: "Variant", ar: "النوع", ur: "قسم" }}
        value={content.variant || "multi_column"}
        onChange={(val) => onUpdate("variant", val)}
        options={[
          { value: "multi_column", label: "Multi Column" },
          { value: "minimal", label: "Minimal" },
          { value: "centered", label: "Centered" },
        ]}
        language={language}
        isRTL={isRTL}
      /> */}

      <FieldGroup title={T({ en: "Business Info", ar: "معلومات العمل", ur: "کاروباری معلومات" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Business Name", ar: "اسم العمل", ur: "کاروبار کا نام" }}
          value={content.business_name}
          onChange={(lang, val) => handleMultilingualUpdate("business_name", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Tagline", ar: "الشعار", ur: "ٹیگ لائن" }}
          value={content.tagline}
          onChange={(lang, val) => handleMultilingualUpdate("tagline", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
        <MultilingualTextField
          label={{ en: "Copyright Text", ar: "نص حقوق النشر", ur: "کاپی رائٹ ٹیکسٹ" }}
          value={content.copyright}
          onChange={(lang, val) => handleMultilingualUpdate("copyright", lang, val)}
          language={language}
          isRTL={isRTL}
        />
      </FieldGroup>

      {/* Footer Columns */}
      <FieldGroup title={T({ en: "Footer Columns", ar: "أعمدة التذييل", ur: "فوٹر کالمز" })} isRTL={isRTL} defaultOpen>
        {(content.columns || []).map((column, colIndex) => (
          <FooterColumnEditor
            key={colIndex}
            column={column}
            colIndex={colIndex}
            onUpdateColumn={(field, lang, val) => handleColumnUpdate(colIndex, field, lang, val)}
            onUpdateLink={(linkIndex, field, lang, val) => handleColumnLinkUpdate(colIndex, linkIndex, field, lang, val)}
            onUpdateLinkPatch={(linkIndex, patch) => handleColumnLinkPatch(colIndex, linkIndex, patch)}
            onAddLink={() => addLink(colIndex)}
            onRemoveLink={(linkIndex) => removeLink(colIndex, linkIndex)}
            onRemove={() => removeColumn(colIndex)}
            language={language}
            isRTL={isRTL}
          />
        ))}
        <AddItemButton onClick={addColumn} label={{ en: "Add Column", ar: "إضافة عمود", ur: "کالم شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>

      {/* Social Links */}
      <FieldGroup title={T({ en: "Social Links", ar: "روابط التواصل", ur: "سوشل لنکس" })} isRTL={isRTL}>
        {(content.social_links || []).map((link, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
            <SelectField
              label={{ en: "Platform", ar: "المنصة", ur: "پلیٹ فارم" }}
              value={link.platform}
              onChange={(val) => handleSocialUpdate(index, "platform", val)}
              options={[
                { value: "facebook", label: "Facebook" },
                { value: "twitter", label: "Twitter/X" },
                { value: "instagram", label: "Instagram" },
                { value: "linkedin", label: "LinkedIn" },
                { value: "youtube", label: "YouTube" },
                { value: "dribbble", label: "Dribbble" },
                { value: "behance", label: "Behance" },
              ]}
              language={language}
              isRTL={isRTL}
            />
            <div className="flex-1">
              <TextField
                label={{ en: "URL", ar: "الرابط", ur: "URL" }}
                value={link.url}
                onChange={(val) => handleSocialUpdate(index, "url", val)}
                icon={Link2}
                language={language}
                isRTL={isRTL}
              />
            </div>
            <button onClick={() => removeSocialLink(index)} className="p-2 text-slate-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <AddItemButton onClick={addSocialLink} label={{ en: "Add Social Link", ar: "إضافة رابط", ur: "سوشل لنک شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

function FooterColumnEditor({ column, colIndex, onUpdateColumn, onUpdateLink, onUpdateLinkPatch, onAddLink, onRemoveLink, onRemove, language, isRTL }) {
  const [expanded, setExpanded] = useState(false);
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 p-3 bg-slate-50 cursor-pointer hover:bg-slate-100"
      >
        <span className="flex-1 text-sm font-medium truncate">{T(column.title)}</span>
        <span className="text-xs text-slate-500">{(column.links || []).length} links</span>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1 text-slate-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </div>
      
      {expanded && (
        <div className="p-3 space-y-3 bg-white">
          <MultilingualTextField
            label={{ en: "Column Title", ar: "عنوان العمود", ur: "کالم کا عنوان" }}
            value={column.title}
            onChange={(lang, val) => onUpdateColumn("title", lang, val)}
            language={language}
            isRTL={isRTL}
          />
          
          <div className="border-t pt-2">
            <p className="text-xs font-medium text-slate-600 mb-2">{T({ en: "Links", ar: "الروابط", ur: "لنکس" })}</p>
            {(column.links || []).map((link, linkIndex) => (
              <div key={linkIndex} className="flex items-start gap-2 mb-2 p-2 bg-slate-50 rounded">
                <div className="flex-1 space-y-2">
                  <MultilingualTextField
                    label={{ en: "Label", ar: "التسمية", ur: "لیبل" }}
                    value={link.label}
                    onChange={(lang, val) => onUpdateLink(linkIndex, "label", lang, val)}
                    language={language}
                    isRTL={isRTL}
                  />
                  <DestinationPicker
                    value={{ destination: link.destination, url: link.url }}
                    onChange={(patch) => onUpdateLinkPatch(linkIndex, patch)}
                    language={language}
                    isRTL={isRTL}
                  />
                </div>
                <button onClick={() => onRemoveLink(linkIndex)} className="mt-6 p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <AddItemButton onClick={onAddLink} label={{ en: "Add Link", ar: "إضافة رابط", ur: "لنک شامل کریں" }} language={language} isRTL={isRTL} small />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// FEATURES CONTENT EDITOR
// ============================================================

function FeaturesContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleItemUpdate = (index, field, lang, value) => {
    const items = [...(content.items || [])];
    if (lang) {
      items[index] = {
        ...items[index],
        [field]: { ...items[index][field], [lang]: value },
      };
    } else {
      items[index] = { ...items[index], [field]: value };
    }
    onUpdate("items", items);
  };

  const addItem = () => {
    const items = [...(content.items || [])];
    items.push({
      icon: "✨",
      title: { en: "New Feature", ar: "ميزة جديدة", ur: "نئی خصوصیت" },
      description: { en: "Feature description", ar: "وصف الميزة", ur: "خصوصیت کی تفصیل" },
    });
    onUpdate("items", items);
  };

  const removeItem = (index) => {
    onUpdate("items", content.items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      <SelectField
        label={{ en: "Layout", ar: "التخطيط", ur: "لے آؤٹ" }}
        value={content.layout || "icons_4col"}
        onChange={(val) => onUpdate("layout", val)}
        options={[
          { value: "icons_2col", label: "2 Columns" },
          { value: "icons_3col", label: "3 Columns" },
          { value: "icons_4col", label: "4 Columns" },
        ]}
        language={language}
        isRTL={isRTL}
      />

      <FieldGroup title={T({ en: "Features", ar: "الميزات", ur: "خصوصیات" })} isRTL={isRTL} defaultOpen>
        {(content.items || []).map((item, index) => (
          <div key={index} className="p-3 bg-slate-50 rounded-lg space-y-2 relative">
            <button
              onClick={() => removeItem(index)}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <TextField
              label={{ en: "Icon (Emoji)", ar: "الأيقونة", ur: "آئیکن" }}
              value={item.icon}
              onChange={(val) => handleItemUpdate(index, "icon", null, val)}
              language={language}
              isRTL={isRTL}
            />
            <MultilingualTextField
              label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
              value={item.title}
              onChange={(lang, val) => handleItemUpdate(index, "title", lang, val)}
              language={language}
              isRTL={isRTL}
            />
            <MultilingualTextField
              label={{ en: "Description", ar: "الوصف", ur: "تفصیل" }}
              value={item.description}
              onChange={(lang, val) => handleItemUpdate(index, "description", lang, val)}
              language={language}
              isRTL={isRTL}
              multiline
            />
          </div>
        ))}
        <AddItemButton onClick={addItem} label={{ en: "Add Feature", ar: "إضافة ميزة", ur: "خصوصیت شامل کریں" }} language={language} isRTL={isRTL} />
      </FieldGroup>
    </div>
  );
}

// ============================================================
// MODULE CONTENT EDITOR
// ============================================================

function ModuleContentEditor({ moduleKey, content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  const handleSettingUpdate = (key, value) => {
    onUpdate("settings", { ...content.settings, [key]: value });
  };

  const moduleLabels = {
    chat: { en: "Chat Module", ar: "وحدة الدردشة", ur: "چیٹ ماڈیول", icon: MessageSquare },
    file_upload: { en: "File Upload Module", ar: "وحدة رفع الملفات", ur: "فائل اپ لوڈ ماڈیول", icon: Upload },
    payment: { en: "Payment Module", ar: "وحدة الدفع", ur: "ادائیگی ماڈیول", icon: CreditCard },
    custom_request: { en: "Custom Request", ar: "طلب مخصص", ur: "حسب ضرورت درخواست", icon: FileText },
    customer_requests: { en: "My Requests Portal", ar: "بوابة طلباتي", ur: "میری درخواستیں پورٹل", icon: LayoutList },
  };

  const moduleInfo = moduleLabels[moduleKey] || { en: "Module", ar: "وحدة", ur: "ماڈیول", icon: Settings };
  const ModuleIcon = moduleInfo.icon;

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <ModuleIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="font-medium text-slate-900">{T(moduleInfo)}</p>
          <p className="text-xs text-slate-500">{T({ en: "Core functionality module", ar: "وحدة الوظائف الأساسية", ur: "بنیادی فعالیت ماڈیول" })}</p>
        </div>
      </div>

      {/* Title & Subtitle */}
      <FieldGroup title={T({ en: "Section Header", ar: "عنوان القسم", ur: "سیکشن ہیڈر" })} isRTL={isRTL} defaultOpen>
        <MultilingualTextField
          label={{ en: "Title", ar: "العنوان", ur: "عنوان" }}
          value={content.title}
          onChange={(lang, val) => handleMultilingualUpdate("title", lang, val)}
          language={language}
          isRTL={isRTL}
        />
        <MultilingualTextField
          label={{ en: "Subtitle", ar: "العنوان الفرعي", ur: "ذیلی عنوان" }}
          value={content.subtitle}
          onChange={(lang, val) => handleMultilingualUpdate("subtitle", lang, val)}
          language={language}
          isRTL={isRTL}
          multiline
        />
      </FieldGroup>

      {/* Chat Module Settings */}
      {moduleKey === "chat" && (
        <FieldGroup title={T({ en: "Chat Settings", ar: "إعدادات الدردشة", ur: "چیٹ کی ترتیبات" })} isRTL={isRTL}>
          <CheckboxField
            label={{ en: "Auto Response", ar: "الرد التلقائي", ur: "آٹو رسپانس" }}
            checked={content.settings?.auto_response !== false}
            onChange={(val) => handleSettingUpdate("auto_response", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Enable File Sharing", ar: "تفعيل مشاركة الملفات", ur: "فائل شیئرنگ فعال کریں" }}
            checked={content.settings?.enable_file_sharing !== false}
            onChange={(val) => handleSettingUpdate("enable_file_sharing", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Show Project Brief Form", ar: "إظهار نموذج ملخص المشروع", ur: "پروجیکٹ بریف فارم دکھائیں" }}
            checked={content.settings?.show_project_brief_form !== false}
            onChange={(val) => handleSettingUpdate("show_project_brief_form", val)}
            language={language}
          />
          <TextField
            label={{ en: "Response Time Display", ar: "عرض وقت الاستجابة", ur: "رسپانس ٹائم ڈسپلے" }}
            value={content.settings?.response_time_display || "2 hours"}
            onChange={(val) => handleSettingUpdate("response_time_display", val)}
            language={language}
            isRTL={isRTL}
          />
        </FieldGroup>
      )}

      {/* File Upload Module Settings */}
      {moduleKey === "file_upload" && (
        <FieldGroup title={T({ en: "Upload Settings", ar: "إعدادات الرفع", ur: "اپ لوڈ کی ترتیبات" })} isRTL={isRTL}>
          <TextField
            label={{ en: "Max Files", ar: "الحد الأقصى للملفات", ur: "زیادہ سے زیادہ فائلز" }}
            value={String(content.settings?.max_files || 10)}
            onChange={(val) => handleSettingUpdate("max_files", parseInt(val) || 10)}
            language={language}
            isRTL={isRTL}
          />
          <TextField
            label={{ en: "Max File Size (MB)", ar: "الحد الأقصى لحجم الملف", ur: "زیادہ سے زیادہ فائل سائز" }}
            value={String(content.settings?.max_file_size_mb || 50)}
            onChange={(val) => handleSettingUpdate("max_file_size_mb", parseInt(val) || 50)}
            language={language}
            isRTL={isRTL}
          />
          <CheckboxField
            label={{ en: "Show File Preview", ar: "إظهار معاينة الملف", ur: "فائل پریویو دکھائیں" }}
            checked={content.settings?.show_file_preview !== false}
            onChange={(val) => handleSettingUpdate("show_file_preview", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Enable Folder Organization", ar: "تفعيل تنظيم المجلدات", ur: "فولڈر آرگنائزیشن فعال کریں" }}
            checked={content.settings?.enable_folder_organization !== false}
            onChange={(val) => handleSettingUpdate("enable_folder_organization", val)}
            language={language}
          />
        </FieldGroup>
      )}

      {/* Payment Module Settings */}
      {moduleKey === "payment" && (
        <FieldGroup title={T({ en: "Payment Settings", ar: "إعدادات الدفع", ur: "ادائیگی کی ترتیبات" })} isRTL={isRTL}>
          <CheckboxField
            label={{ en: "Enable Escrow", ar: "تفعيل الضمان", ur: "ایسکرو فعال کریں" }}
            checked={content.settings?.enable_escrow !== false}
            onChange={(val) => handleSettingUpdate("enable_escrow", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Enable Milestone Payments", ar: "تفعيل دفعات الإنجاز", ur: "مائل اسٹون ادائیگیاں فعال کریں" }}
            checked={content.settings?.enable_milestone_payments !== false}
            onChange={(val) => handleSettingUpdate("enable_milestone_payments", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Invoice Generation", ar: "إنشاء الفواتير", ur: "انوائس جنریشن" }}
            checked={content.settings?.invoice_generation !== false}
            onChange={(val) => handleSettingUpdate("invoice_generation", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Display Refund Policy", ar: "عرض سياسة الاسترداد", ur: "ریفنڈ پالیسی دکھائیں" }}
            checked={content.settings?.refund_policy_display !== false}
            onChange={(val) => handleSettingUpdate("refund_policy_display", val)}
            language={language}
          />
        </FieldGroup>
      )}

      {/* Custom Request Module Settings */}
      {moduleKey === "custom_request" && (
        <FieldGroup title={T({ en: "Request Form Settings", ar: "إعدادات نموذج الطلب", ur: "درخواست فارم کی ترتیبات" })} isRTL={isRTL}>
          <CheckboxField
            label={{ en: "Allow File Uploads", ar: "السماح برفع الملفات", ur: "فائل اپ لوڈ کی اجازت دیں" }}
            checked={content.settings?.allow_file_uploads !== false}
            onChange={(val) => handleSettingUpdate("allow_file_uploads", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Require Budget", ar: "الميزانية مطلوبة", ur: "بجٹ ضروری ہے" }}
            checked={content.settings?.require_budget === true}
            onChange={(val) => handleSettingUpdate("require_budget", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Require Deadline", ar: "الموعد النهائي مطلوب", ur: "ڈیڈ لائن ضروری ہے" }}
            checked={content.settings?.require_deadline === true}
            onChange={(val) => handleSettingUpdate("require_deadline", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Allow Guest Submissions", ar: "السماح بالإرسال بدون حساب", ur: "مہمان جمع کرانے کی اجازت دیں" }}
            checked={content.settings?.allow_guest_submissions !== false}
            onChange={(val) => handleSettingUpdate("allow_guest_submissions", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Show Trust Badges", ar: "إظهار شارات الثقة", ur: "ٹرسٹ بیجز دکھائیں" }}
            checked={content.settings?.show_trust_badges !== false}
            onChange={(val) => handleSettingUpdate("show_trust_badges", val)}
            language={language}
          />
          <CheckboxField
            label={{ en: "Show Response Time", ar: "إظهار وقت الاستجابة", ur: "رسپانس ٹائم دکھائیں" }}
            checked={content.settings?.show_response_time !== false}
            onChange={(val) => handleSettingUpdate("show_response_time", val)}
            language={language}
          />
          <TextField
            label={{ en: "Max Attachments", ar: "الحد الأقصى للمرفقات", ur: "زیادہ سے زیادہ منسلکات" }}
            value={String(content.settings?.max_attachments || 5)}
            onChange={(val) => handleSettingUpdate("max_attachments", parseInt(val) || 5)}
            language={language}
            isRTL={isRTL}
          />
          <TextField
            label={{ en: "Max File Size (MB)", ar: "الحد الأقصى لحجم الملف", ur: "زیادہ سے زیادہ فائل سائز" }}
            value={String(content.settings?.max_file_size_mb || 10)}
            onChange={(val) => handleSettingUpdate("max_file_size_mb", parseInt(val) || 10)}
            language={language}
            isRTL={isRTL}
          />
        </FieldGroup>
      )}
      {moduleKey === "custom_request" && (
        <FieldGroup title={T({ en: "Success & Redirect", ar: "النجاح والتوجيه", ur: "کامیابی اور ری ڈائریکٹ" })} isRTL={isRTL}>
          <MultilingualTextField
            label={{ en: "Success Message", ar: "رسالة النجاح", ur: "کامیابی کا پیغام" }}
            value={content.settings?.success_message}
            onChange={(lang, val) => {
              const updated = { ...(content.settings?.success_message || {}), [lang]: val };
              handleSettingUpdate("success_message", updated);
            }}
            language={language}
            isRTL={isRTL}
            multiline
          />
          <MultilingualTextField
            label={{ en: "Average Response Time", ar: "متوسط وقت الاستجابة", ur: "اوسط جوابی وقت" }}
            value={content.settings?.average_response_time}
            onChange={(lang, val) => {
              const updated = { ...(content.settings?.average_response_time || {}), [lang]: val };
              handleSettingUpdate("average_response_time", updated);
            }}
            language={language}
            isRTL={isRTL}
          />
          <TextField
            label={{ en: "Redirect URL (after submit)", ar: "رابط التوجيه (بعد الإرسال)", ur: "ری ڈائریکٹ URL (جمع کرانے کے بعد)" }}
            value={content.settings?.redirect_after_submit || ""}
            onChange={(val) => handleSettingUpdate("redirect_after_submit", val)}
            language={language}
            isRTL={isRTL}
          />
        </FieldGroup>
      )}

      {/* Trust Badges Configuration */}
      {moduleKey === "custom_request" && (
        <FieldGroup title={T({ en: "Trust Badges", ar: "شارات الثقة", ur: "ٹرسٹ بیجز" })} isRTL={isRTL}>
          <MultilingualTextField
            label={{ en: "Badge 1", ar: "الشارة 1", ur: "بیج 1" }}
            value={content.settings?.trust_badge_1}
            onChange={(lang, val) => {
              const updated = { ...(content.settings?.trust_badge_1 || {}), [lang]: val };
              handleSettingUpdate("trust_badge_1", updated);
            }}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Badge 2", ar: "الشارة 2", ur: "بیج 2" }}
            value={content.settings?.trust_badge_2}
            onChange={(lang, val) => {
              const updated = { ...(content.settings?.trust_badge_2 || {}), [lang]: val };
              handleSettingUpdate("trust_badge_2", updated);
            }}
            language={language}
            isRTL={isRTL}
          />
          <MultilingualTextField
            label={{ en: "Badge 3", ar: "الشارة 3", ur: "بیج 3" }}
            value={content.settings?.trust_badge_3}
            onChange={(lang, val) => {
              const updated = { ...(content.settings?.trust_badge_3 || {}), [lang]: val };
              handleSettingUpdate("trust_badge_3", updated);
            }}
            language={language}
            isRTL={isRTL}
          />
        </FieldGroup>
      )}
    </div>
  );
}

// ============================================================
// GENERIC CONTENT EDITOR (Fallback)
// ============================================================

function GenericContentEditor({ content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  // Extract all translatable fields
  const translatableFields = Object.entries(content).filter(([key, value]) => {
    return typeof value === "object" && value !== null && ("en" in value || "ar" in value || "ur" in value);
  });

  const handleMultilingualUpdate = (field, lang, value) => {
    onUpdate(field, { ...(content[field] || {}), [lang]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 italic">
        {T({ en: "Generic editor for this section type", ar: "محرر عام لهذا النوع من الأقسام", ur: "اس سیکشن کی قسم کے لیے عمومی ایڈیٹر" })}
      </p>
      
      {translatableFields.map(([key, value]) => (
        <MultilingualTextField
          key={key}
          label={{ en: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), ar: key, ur: key }}
          value={value}
          onChange={(lang, val) => handleMultilingualUpdate(key, lang, val)}
          language={language}
          isRTL={isRTL}
        />
      ))}
    </div>
  );
}

// ============================================================
// STYLE EDITOR
// ============================================================

function StyleEditor({ sectionType, moduleKey, content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="space-y-6">
      {/* Background */}
      {["hero", "cta", "stats_banner"].includes(sectionType) && (
        <FieldGroup title={T({ en: "Background", ar: "الخلفية", ur: "پس منظر" })} isRTL={isRTL} defaultOpen>
          <SelectField
            label={{ en: "Background Type", ar: "نوع الخلفية", ur: "بیک گراؤنڈ کی قسم" }}
            value={content.background?.type || "gradient"}
            onChange={(val) =>
              onUpdate("background", {
                type: val,
                value:
                  val === "solid"
                    ? content.background?.value || "#1E3A8A"
                    : val === "gradient"
                    ? null
                    : content.background?.value || "",
              })
            }
            options={[
              { value: "gradient", label: "Gradient" },
              { value: "solid", label: "Solid Color" },
              { value: "image", label: "Image" },
            ]}
            language={language}
            isRTL={isRTL}
          />

          {content.background?.type === "solid" && (
            <ColorField
              label={{ en: "Background Color", ar: "لون الخلفية", ur: "بیک گراؤنڈ رنگ" }}
              value={content.background?.value || "#1E3A8A"}
              onChange={(val) =>
                onUpdate("background", {
                  ...content.background,
                  value: val,
                })
              }
              language={language}
              isRTL={isRTL}
            />
          )}

          {content.background?.type === "image" && (
            <TextField
              label={{ en: "Image URL", ar: "رابط الصورة", ur: "امیج URL" }}
              value={content.background?.value || ""}
              onChange={(val) =>
                onUpdate("background", {
                  ...content.background,
                  value: val,
                })
              }
              icon={Image}
              language={language}
              isRTL={isRTL}
            />
          )}

        </FieldGroup>
      )}

      {/* Text Color */}
      {["hero", "cta"].includes(sectionType) && (
        <SelectField
          label={{ en: "Text Color", ar: "لون النص", ur: "ٹیکسٹ کا رنگ" }}
          value={content.text_color || "white"}

          onChange={(val) => onUpdate("text_color", val)}
          options={[
            { value: "white", label: "White" },
            { value: "dark", label: "Dark" },
            { value: "primary", label: "Primary" },
            { value: "secondary", label: "Secondary" },
    
          ]}
          language={language}
          isRTL={isRTL}
        />
      )}

      {/* Footer Background */}
      {sectionType === "footer" && (
        <SelectField
          label={{ en: "Background", ar: "الخلفية", ur: "پس منظر" }}
          value={content.background || "dark"}
          onChange={(val) => onUpdate("background", val)}
          options={[
            { value: "dark", label: "Dark" },
            { value: "light", label: "Light" },
            { value: "gradient", label: "Gradient" },
          ]}
          language={language}
          isRTL={isRTL}
        />
      )}

      {/* Header Style */}
      {sectionType === "header" && (
        <FieldGroup title={T({ en: "Header Style", ar: "نمط الرأس", ur: "ہیڈر اسٹائل" })} isRTL={isRTL} defaultOpen>
          <SelectField
            label={{ en: "Background", ar: "الخلفية", ur: "پس منظر" }}
            value={content.style?.background || "white"}
            onChange={(val) => onUpdate("style", { ...content.style, background: val })}
            options={[
              { value: "white", label: "White" },
              { value: "transparent", label: "Transparent" },
              { value: "blur", label: "Blur" },
            ]}
            language={language}
            isRTL={isRTL}
          />
          <CheckboxField
            label={{ en: "Sticky Header", ar: "رأس ثابت", ur: "سٹکی ہیڈر" }}
            checked={content.style?.sticky !== false}
            onChange={(val) => onUpdate("style", { ...content.style, sticky: val })}
            language={language}
          />
        </FieldGroup>
      )}

      {/* Coming Soon for other sections */}
      {!["hero", "cta", "stats_banner", "footer", "header"].includes(sectionType) && (
        <div className="text-center py-8 text-slate-400">
          <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">{T({ en: "Style options coming soon...", ar: "خيارات النمط قريبًا...", ur: "اسٹائل آپشنز جلد آ رہے ہیں..." })}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADVANCED EDITOR
// ============================================================

function AdvancedEditor({ sectionType, moduleKey, content, onUpdate, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <div className="space-y-6">
      {/* Section ID */}
      <TextField
        label={{ en: "Section ID (for anchors)", ar: "معرف القسم", ur: "سیکشن آئی ڈی" }}
        value={content.id || ""}
        onChange={(val) => onUpdate("id", val)}
        language={language}
        isRTL={isRTL}
      />

      {/* Custom CSS Class */}
      <TextField
        label={{ en: "Custom CSS Class", ar: "فئة CSS مخصصة", ur: "کسٹم CSS کلاس" }}
        value={content.custom_class || ""}
        onChange={(val) => onUpdate("custom_class", val)}
        language={language}
        isRTL={isRTL}
      />

      {/* Visibility */}
      <FieldGroup title={T({ en: "Visibility", ar: "الرؤية", ur: "نمائش" })} isRTL={isRTL}>
        <CheckboxField
          label={{ en: "Hide on Mobile", ar: "إخفاء على الجوال", ur: "موبائل پر چھپائیں" }}
          checked={content.hide_mobile || false}
          onChange={(val) => onUpdate("hide_mobile", val)}
          language={language}
        />
        <CheckboxField
          label={{ en: "Hide on Desktop", ar: "إخفاء على سطح المكتب", ur: "ڈیسک ٹاپ پر چھپائیں" }}
          checked={content.hide_desktop || false}
          onChange={(val) => onUpdate("hide_desktop", val)}
          language={language}
        />
      </FieldGroup>

      {/* Coming Soon */}
      <div className="p-4 bg-slate-50 rounded-xl">
        <p className="text-sm text-slate-600 mb-2">{T({ en: "More Advanced Options", ar: "المزيد من الخيارات المتقدمة", ur: "مزید ایڈوانسڈ آپشنز" })}</p>
        <ul className="text-xs text-slate-500 space-y-1">
          <li>• {T({ en: "Animation settings", ar: "إعدادات الرسوم المتحركة", ur: "انیمیشن سیٹنگز" })}</li>
          <li>• {T({ en: "Custom spacing", ar: "التباعد المخصص", ur: "کسٹم سپیسنگ" })}</li>
          <li>• {T({ en: "Conditional visibility", ar: "الرؤية الشرطية", ur: "مشروط نمائش" })}</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">{T({ en: "Coming soon...", ar: "قريبًا...", ur: "جلد آ رہا ہے..." })}</p>
      </div>
    </div>
  );
}

// ============================================================
// HELPER COMPONENTS
// ============================================================

function FieldGroup({ title, children, isRTL, defaultOpen = false }) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors ${
          isRTL ? "flex-row-reverse" : ""
        }`}
      >
        <span className="text-sm font-medium text-slate-700">{title}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className={`w-4 h-4 text-slate-400 ${isRTL ? "rotate-180" : ""}`} />
        )}
      </button>
      {expanded && <div className="p-3 space-y-3">{children}</div>}
    </div>
  );
}

function TextField({ label, value, onChange, icon: Icon, placeholder, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <div>
      <label className={`block text-xs font-medium text-slate-600 mb-1 ${isRTL ? "text-right" : ""}`}>
        {T(label)}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${
              isRTL ? "right-3" : "left-3"
            }`}
          />
        )}
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir={isRTL ? "rtl" : "ltr"}
          className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none ${
            Icon ? (isRTL ? "pr-9" : "pl-9") : ""
          }`}
        />
      </div>
    </div>
  );
}

function MultilingualTextField({ label, value, onChange, multiline = false, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);
  const [activeLang, setActiveLang] = useState(language);

  const langs = [
    { code: "en", label: "EN", flag: "🇺🇸" },
    { code: "ar", label: "AR", flag: "🇸🇦" },
    { code: "ur", label: "UR", flag: "🇵🇰" },
  ];

  const currentValue = typeof value === "object" ? value[activeLang] || "" : value || "";
  const inputDir = ["ar", "ur", "he", "fa"].includes(activeLang) ? "rtl" : "ltr";

  return (
    <div>
      <div className={`flex items-center justify-between mb-1 ${isRTL ? "flex-row-reverse" : ""}`}>
        <label className="text-xs font-medium text-slate-600">{T(label)}</label>
        <div className="flex gap-1">
          {langs.map((l) => (
            <button
              key={l.code}
              onClick={() => setActiveLang(l.code)}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                activeLang === l.code
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
              title={l.flag}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      {multiline ? (
        <textarea
          value={currentValue}
          onChange={(e) => onChange(activeLang, e.target.value)}
          rows={3}
          dir={inputDir}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
        />
      ) : (
        <input
          type="text"
          value={currentValue}
          onChange={(e) => onChange(activeLang, e.target.value)}
          dir={inputDir}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <div>
      <label className={`block text-xs font-medium text-slate-600 mb-1 ${isRTL ? "text-right" : ""}`}>
        {T(label)}
      </label>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white ${
          isRTL ? "text-right" : ""
        }`}
        dir="ltr"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <div>
      <label className={`block text-xs font-medium text-slate-600 mb-1 ${isRTL ? "text-right" : ""}`}>
        {T(label)}
      </label>
      <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer"
        />
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
          dir="ltr"
        />
      </div>
    </div>
  );
}

function CheckboxField({ label, checked, onChange, language }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
      />
      <span className="text-sm text-slate-700">{T(label)}</span>
    </label>
  );
}

function AddItemButton({ onClick, label, language, isRTL, small = false }) {
  const T = (v) => resolveTranslated(v, language);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-1 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors ${
        isRTL ? "flex-row-reverse" : ""
      } ${small ? "py-1.5 text-xs" : "py-2 text-sm"}`}
    >
      <Plus className={small ? "w-3 h-3" : "w-4 h-4"} />
      {T(label)}
    </button>
  );
}

// ============================================================
// DESTINATION PICKER
// ============================================================
// Visual picker for every navigation destination in the Website Builder.
// All destination types live in /lib/destinationTypes.js — this component
// is purely a UI driver over that registry.
//
// Saves both `destination` (new structured shape) and `url` (legacy
// fallback) so renderers that haven't been migrated still work.

function inferDestinationFromLegacyUrl(url) {
  if (!url || typeof url !== "string") return null;
  if (/^mailto:/i.test(url))
    return { type: "email", value: url.replace(/^mailto:/i, "") };
  if (/^tel:/i.test(url))
    return { type: "phone", value: url.replace(/^tel:/i, "") };
  if (/^https?:\/\//i.test(url))
    return { type: "external", url, open_new_tab: true };
  if (url.startsWith("#"))
    return { type: "section", section_id: url.slice(1) };

  const KNOWN = {
    "/": "home",
    "/services": "services",
    "/my-bookings": "my_bookings",
    "/my-orders": "my_orders",
    "/my-requests": "my_requests",
    "/request-service": "request_service",
  };
  if (KNOWN[url]) return { type: "system_page", page: KNOWN[url] };
  if (url.startsWith("/") && !url.includes("/", 1))
    return { type: "custom_page", slug: url.slice(1) };
  return { type: "external", url, open_new_tab: false };
}

function sectionDisplayLabel(s, lang) {
  const title = s.content?.title;
  const resolved =
    typeof title === "object"
      ? title[lang] || title.en || Object.values(title)[0]
      : title;
  if (resolved) return resolved;
  const moduleLabel = s.module_key || s.content?.module_key;
  return moduleLabel ? `Module: ${moduleLabel}` : s.section_type || "Section";
}

/**
 * Build the picker context: the data each destination type's listChoices
 * needs to populate its dropdown. Sourced from the builder state for now;
 * services/categories will be plugged in by a later phase via a hook.
 */
function useDestinationPickerContext() {
  const { state } = useBuilder();
  const searchParams = useSearchParams();
  const domain = searchParams?.get("domain") || "";

  // Services / categories / availability — fetched once per session per
  // domain and reused across every DestinationPicker instance.
  const navData = useNavigationContext(domain);

  // Sections eligible as anchor targets: content sections only, not
  // header/footer (those don't make sense as nav targets).
  const sections = (state?.sections || [])
    .filter((s) => {
      const t = s.section_type;
      return t && !["header", "footer"].includes(t);
    })
    .map((s) => ({
      id: s.id || s.section_type,
      section_type: s.section_type,
      label: sectionDisplayLabel(s, state?.language || "en"),
    }));

  return {
    sections,
    customPages: state?.pages || [],
    services: navData.services,
    categories: navData.categories,
    availability: navData.availability,
  };
}

function DestinationPicker({ value, onChange, language, isRTL, label }) {
  const T = (v) => resolveTranslated(v, language);
  const ctx = useDestinationPickerContext();

  const effective =
    value?.destination ||
    inferDestinationFromLegacyUrl(value?.url) ||
    { type: "system_page", page: "" };

  const type = effective.type || "system_page";
  const def = getDestinationType(type);

  const emit = (next) => {
    onChange({
      destination: next,
      url: computeLegacyUrlFromRegistry(next),
    });
  };

  const setType = (newType) => {
    if (newType === type) return;
    const reset = { type: newType };
    if (newType === "external") reset.open_new_tab = true;
    emit(reset);
  };

  const types = listDestinationTypes();

  return (
    <div className="space-y-2">
      <label
        className={`block text-xs font-medium text-slate-600 ${
          isRTL ? "text-right" : ""
        }`}
      >
        {T(label || { en: "Destination", ar: "الوجهة", ur: "منزل" })}
      </label>

      {/* Type selector — single dropdown to stay legible with many types */}
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        dir="ltr"
      >
        {types.map((t) => (
          <option key={t.key} value={t.key}>
            {T(t.labels)}
          </option>
        ))}
      </select>

      {/* Type-specific control rendered from the registry */}
      {def && <DestinationFieldControl def={def} value={effective} emit={emit} ctx={ctx} language={language} isRTL={isRTL} />}
    </div>
  );
}

function DestinationFieldControl({ def, value, emit, ctx, language, isRTL }) {
  const T = (v) => resolveTranslated(v, language);
  const picker = def.picker || {};

  if (picker.type === "dropdown") {
    const choices = picker.listChoices(ctx, language) || [];
    const valueField = picker.valueField || "value";
    const current = value?.[valueField] || "";
    const emptyHint = T(picker.emptyHint || { en: "— Select —" });
    return (
      <SelectField
        label={def.labels}
        value={current}
        onChange={(v) =>
          emit({ type: def.key, [valueField]: v })
        }
        options={[
          { value: "", label: choices.length ? "— Select —" : emptyHint },
          ...choices.map((c) => ({
            value: c.value,
            label: c.label + (c.auth ? "  🔒" : "") + (c.available === false ? "  (unavailable)" : ""),
          })),
        ]}
        language={language}
        isRTL={isRTL}
      />
    );
  }

  if (picker.type === "url") {
    return (
      <div className="space-y-2">
        <TextField
          label={{ en: "URL", ar: "الرابط", ur: "URL" }}
          value={value?.url || ""}
          onChange={(url) =>
            emit({
              type: def.key,
              url,
              open_new_tab: value?.open_new_tab !== false,
            })
          }
          icon={ExternalLink}
          placeholder={picker.placeholder}
          language={language}
          isRTL={isRTL}
        />
        {picker.extras?.includes("open_new_tab") && (
          <CheckboxField
            label={{ en: "Open in new tab", ar: "افتح في نافذة جديدة", ur: "نئے ٹیب میں کھولیں" }}
            checked={value?.open_new_tab !== false}
            onChange={(b) =>
              emit({
                type: def.key,
                url: value?.url || "",
                open_new_tab: b,
              })
            }
            language={language}
          />
        )}
      </div>
    );
  }

  if (picker.type === "text") {
    const valueField = picker.valueField || "value";
    return (
      <div>
        <label className={`block text-xs font-medium text-slate-600 mb-1 ${isRTL ? "text-right" : ""}`}>
          {T(def.labels)}
        </label>
        <input
          type={picker.inputType || "text"}
          value={value?.[valueField] || ""}
          onChange={(e) =>
            emit({ type: def.key, [valueField]: e.target.value })
          }
          placeholder={picker.placeholder}
          dir="ltr"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
      </div>
    );
  }

  return null;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getNestedValue(obj, path) {
  return path.split(".").reduce((current, key) => current?.[key], obj);
}