"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export function CategoryManager({ categories, onSave, onDelete }) {
  const { t, isRTL } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert(t("services.categoryRequired"));
      return;
    }

    setIsSaving(true);
    try {
      await onSave(form);
      setIsOpen(false);
      setForm({ name: "", description: "", icon: "" });
    } catch (err) {
      console.error("Failed to save category", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t("services.categories")}
          </h3>
          <p className="text-xs text-gray-500">
            {t("services.categoriesDesc")}
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-[#8B1E3F] text-white rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t("services.addCategory")}
        </button>
      </div>

      {/* Create Category */}
      {isOpen && (
        <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
          <h4 className="text-sm font-medium mb-3">
            {t("services.newCategory")}
          </h4>

          <input
            placeholder={t("services.categoryName")}
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B1E3F]"
          />

          <input
            placeholder={t("services.categoryIcon")}
            value={form.icon}
            onChange={(e) =>
              setForm({ ...form, icon: e.target.value })
            }
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
          />

          <input
            placeholder={t("services.categoryDescription")}
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg"
          />

          <div className={`flex gap-2 ${isRTL ? "justify-start" : ""}`}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving
                ? t("common.saving")
                : t("common.save")}
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              {t("modal.cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Category List */}
      <div className="flex flex-wrap gap-2">
        {categories.length === 0 && (
          <span className="text-sm text-gray-400 italic">
            {t("services.noCategories")}
          </span>
        )}

        {categories.map((cat) => (
          <div
            key={cat.id}
            className="px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full flex items-center gap-2 text-sm"
          >
            <span>{cat.icon || "📁"}</span>
            <span className="font-medium">
              {cat.name?.en || cat.name}
            </span>

            <button
              onClick={() => {
                if (
                  confirm(
                    t("services.deleteCategoryConfirm", {
                      name: cat.name?.en || cat.name,
                    })
                  )
                ) {
                  onDelete(cat.slug);
                }
              }}
              className="text-red-400 hover:text-red-600 ml-1 p-0.5 hover:bg-red-50 rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
