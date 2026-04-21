// src/hooks/useServiceIntegrationGuard.js
"use client";

/**
 * useServiceIntegrationGuard
 *
 * Thin wrapper around useFeatureCheck specifically for the service
 * creation/edit form. Watches serviceType + orderType and auto-checks
 * when the combination requires integrations.
 *
 * Manages three states:
 *   1. checkResult    — the backend response
 *   2. showModal      — whether the IntegrationRequiredModal is visible
 *   3. acknowledged   — user clicked "I'll do this later"
 *
 * Usage in ServiceModal:
 *
 *   const guard = useServiceIntegrationGuard(form.serviceType, form.orderType);
 *
 *   // Show modal
 *   {guard.showModal && (
 *     <IntegrationRequiredModal
 *       checkResult={guard.checkResult}
 *       onConnect={guard.handleConnect}
 *       onSkip={guard.handleSkip}
 *       onClose={guard.dismissModal}
 *     />
 *   )}
 *
 *   // Block or warn on save button
 *   const saveDisabled = guard.isBlocked && !guard.acknowledged;
 *
 *   // Warning badge on save button
 *   guard.hasWarning  → show ⚠ icon next to Save
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFeatureCheck, getPrimaryResolution } from "../hooks/useFeatureCheck";

/**
 * @param {string} serviceType - "online" | "digital"
 * @param {string} orderType   - "booking" | "order"
 */
export function useServiceIntegrationGuard(serviceType, orderType) {
  const router = useRouter();
  const { checkService, serviceResult, loading, reset } = useFeatureCheck();

  const [showModal, setShowModal] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Track previous combo to avoid re-checking on every render
  const prevComboRef = useRef("");

  // ── Auto-check when service type changes to online+booking ──
  useEffect(() => {
    const combo = `${serviceType}:${orderType}`;

    // Skip if same combo already checked
    if (combo === prevComboRef.current) return;
    prevComboRef.current = combo;

    // Reset state when combo changes
    setAcknowledged(false);
    setCheckResult(null);
    setShowModal(false);

    // Only check for online booking services
    if (serviceType !== "online" || orderType !== "booking") {
      reset();
      return;
    }

    // Trigger the check
    checkService({
      service_type: serviceType,
      order_type: orderType,
    }).then((result) => {
      if (!result) return;

      setCheckResult(result);

      // Auto-show modal if can't proceed
      if (!result.can_proceed) {
        setShowModal(true);
      }
    });
  }, [serviceType, orderType, checkService, reset]);

  // ── Derived state ──────────────────────────────────────────
  const isBlocked = checkResult?.can_proceed === false;
  const hasWarning = checkResult?.has_warnings === true || isBlocked;

  // Get the first blocking check for the modal
  const blockingCheck = checkResult?.checks?.find(
    (c) => !c.satisfied && c.blocking
  );

  // Get first warning check
  const warningCheck = checkResult?.checks?.find(
    (c) => !c.satisfied && !c.blocking
  );

  // The check result to pass to the modal (blocking takes priority)
  const modalCheckResult = blockingCheck || warningCheck || null;

  // ── Handlers ───────────────────────────────────────────────

  const handleConnect = useCallback(
    (resolution) => {
      setShowModal(false);

      if (resolution.action === "oauth" || resolution.action === "redirect") {
        // Navigate to integrations page
        router.push(resolution.target);
      }

      // For modal-type actions (provider panel), the parent component
      // handles opening the specific modal via the resolution.target
      // which contains a modal ID like "google_calendar_modal"
    },
    [router]
  );

  const handleSkip = useCallback(() => {
    setAcknowledged(true);
    setShowModal(false);
  }, []);

  const dismissModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // ── Re-check after returning from integrations page ────────
  const recheck = useCallback(() => {
    if (serviceType === "online" && orderType === "booking") {
      prevComboRef.current = ""; // Force re-check
      setAcknowledged(false);

      checkService({
        service_type: serviceType,
        order_type: orderType,
      }).then((result) => {
        if (result) {
          setCheckResult(result);
          if (!result.can_proceed) {
            setShowModal(true);
          }
        }
      });
    }
  }, [serviceType, orderType, checkService]);

  // ── Pre-save validation ────────────────────────────────────
  /**
   * Call before submitting the form.
   * Returns true if save should proceed, false if blocked.
   *
   * Shows modal if blocked and not yet acknowledged.
   */
  const validateBeforeSave = useCallback(() => {
    // Not an online booking service — always allow
    if (serviceType !== "online" || orderType !== "booking") {
      return true;
    }

    // Already acknowledged — allow (with warnings in response)
    if (acknowledged) {
      return true;
    }

    // Blocking issue exists — show modal
    if (isBlocked && modalCheckResult) {
      setShowModal(true);
      return false;
    }

    // No blocking issues — allow
    return true;
  }, [serviceType, orderType, acknowledged, isBlocked, modalCheckResult]);

  return {
    // State
    checkResult: modalCheckResult,
    serviceCheckResult: checkResult,
    loading,
    showModal,
    isBlocked,
    hasWarning,
    acknowledged,

    // Actions
    handleConnect,
    handleSkip,
    dismissModal,
    recheck,
    validateBeforeSave,
  };
}