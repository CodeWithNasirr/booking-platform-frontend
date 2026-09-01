"use client";

import { useEffect } from "react";
import { X, Plus } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

// A stable, client-only key for React lists. It is stripped before the addon is
// sent to the API (see stripAddonClientFields), so it never leaks as a PK.
function newUid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyAddon() {
  return {
    _uid: newUid(),
    name: { en: "", ar: "", ur: "" },
    price: 0,
    additional_days: 0,
    is_active: true,
  };
}

// Remove client-only fields before sending to the backend.
export function stripAddonClientFields(addons) {
  return (addons || []).map(({ _uid, ...rest }) => rest);
}

// Non-negative number from an <input>, never NaN.
function toNonNegative(value, { integer = false } = {}) {
  const n = integer ? parseInt(value, 10) : parseFloat(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function AddonManager({ addons = [], onChange }) {
  const { t } = useApp();

  // Ensure every row has a stable key without mutating existing objects.
  useEffect(() => {
    if (addons.some((a) => !a || !a._uid)) {
      onChange(
        addons.map((a) =>
          a && a._uid ? a : { ...emptyAddon(), ...(a || {}) , _uid: newUid() }
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addons]);

  const addAddon = () => onChange([...addons, emptyAddon()]);

  const removeAddon = (uid) => onChange(addons.filter((a) => a._uid !== uid));

  // Immutable update of one addon by uid.
  const patchAddon = (uid, patch) =>
    onChange(addons.map((a) => (a._uid === uid ? { ...a, ...patch } : a)));

  const patchName = (uid, lang, value) =>
    onChange(
      addons.map((a) =>
        a._uid === uid ? { ...a, name: { ...(a.name || {}), [lang]: value } } : a
      )
    );

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{t("addons.title")}</h4>
        <button
          type="button"
          onClick={addAddon}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8B1E3F] text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> {t("addons.add")}
        </button>
      </div>

      {addons.length === 0 && (
        <p className="text-sm text-gray-500">{t("addons.empty")}</p>
      )}

      {addons.map((addon) => {
        const name = addon.name || {};
        return (
          <div
            key={addon._uid}
            className="border rounded-xl p-4 bg-gray-50 relative"
          >
            <button
              type="button"
              onClick={() => removeAddon(addon._uid)}
              aria-label={t("addons.remove")}
              className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </button>

            <input
              placeholder={t("addons.namePlaceholder")}
              value={name.en || ""}
              onChange={(e) => patchName(addon._uid, "en", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm mb-2"
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                dir="rtl"
                placeholder={t("addons.nameArPlaceholder")}
                value={name.ar || ""}
                onChange={(e) => patchName(addon._uid, "ar", e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
              <input
                dir="rtl"
                placeholder={t("addons.nameUrPlaceholder")}
                value={name.ur || ""}
                onChange={(e) => patchName(addon._uid, "ur", e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-600">
                {t("addons.price")}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={addon.price}
                  onChange={(e) =>
                    patchAddon(addon._uid, { price: toNonNegative(e.target.value) })
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                />
              </label>

              <label className="text-xs text-gray-600">
                {t("addons.additionalDays")}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={addon.additional_days}
                  onChange={(e) =>
                    patchAddon(addon._uid, {
                      additional_days: toNonNegative(e.target.value, { integer: true }),
                    })
                  }
                  className="mt-1 w-full px-3 py-2 border rounded-lg text-sm"
                />
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );
}
