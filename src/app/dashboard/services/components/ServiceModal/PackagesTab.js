"use client";

import { useApp } from "@/contexts/AppContext";
import { PackageManager } from "../PackageManager";
import { AddonManager } from "../AddonManager";

export function PackagesTab({ form, setForm }) {
  const { t } = useApp();

  return (
    <>
      {form.pricingType === "package" ? (
        <PackageManager
          packages={form.packages}
          onChange={(pkgs) => setForm({ ...form, packages: pkgs })}
        />
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <strong>{t("services.packages.addonsTitle")}</strong>{" "}
              {t("services.packages.addonsDesc")}
            </p>
          </div>

          <AddonManager
            addons={form.addons}
            onChange={(addons) => setForm({ ...form, addons })}
          />
        </div>
      )}
    </>
  );
}
