// src/contexts/UpgradeContext.js
"use client";

import { createContext, useContext, useCallback, useState } from "react";
import UpgradeModal from "@/components/billing/UpgradeModal";
import { parseUpgradeError } from "@/lib/upgradeError";

/**
 * P0 frontend enforcement surface. Any dashboard code can trigger the
 * upgrade modal from a caught API error:
 *
 *   const { handleUpgradeError } = useUpgrade();
 *   catch (err) {
 *     if (handleUpgradeError(err)) return;   // showed the modal
 *     showToast(err.message, "error");
 *   }
 *
 * Or open it directly:  const { openUpgrade } = useUpgrade();
 */
const UpgradeContext = createContext(null);

export function UpgradeProvider({ children }) {
  const [info, setInfo] = useState(null);

  const openUpgrade = useCallback((upgradeInfo) => {
    if (upgradeInfo) setInfo(upgradeInfo);
  }, []);

  const close = useCallback(() => setInfo(null), []);

  // Returns true if the error was a plan-gate error (and the modal opened),
  // so callers can early-return instead of also showing a toast.
  const handleUpgradeError = useCallback((err) => {
    const parsed = parseUpgradeError(err);
    if (parsed) {
      setInfo(parsed);
      return true;
    }
    return false;
  }, []);

  return (
    <UpgradeContext.Provider value={{ openUpgrade, handleUpgradeError, close }}>
      {children}
      <UpgradeModal info={info} onClose={close} />
    </UpgradeContext.Provider>
  );
}

export function useUpgrade() {
  const ctx = useContext(UpgradeContext);
  if (!ctx) {
    // Safe no-op fallback so consumers never crash outside the provider.
    return {
      openUpgrade: () => {},
      handleUpgradeError: () => false,
      close: () => {},
    };
  }
  return ctx;
}
