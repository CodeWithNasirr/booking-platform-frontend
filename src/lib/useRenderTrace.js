"use client";

/**
 * useRenderTrace — TEMPORARY diagnostic. Logs every render, mount, and
 * unmount of a component, and screams if a component re-renders runaway
 * (the signature of an infinite render / "never finishes rendering").
 *
 * Filter the console by `[AUTH-TRACE]` while reproducing the blank index
 * route. The component that logs "render #25 … INFINITE RENDER" (or mounts
 * but whose children never log "mounted") is the offender.
 *
 * Remove this file and its call sites once the culprit is identified.
 */

import { useEffect } from "react";

// Module-level render tallies (keyed by trace name) — avoids mutating a ref
// during render, which React 19 disallows.
const renderCounts = new Map();

export default function useRenderTrace(name, extra) {
  const next = (renderCounts.get(name) || 0) + 1;
  renderCounts.set(name, next);

  if (typeof window !== "undefined") {
    console.log(`[AUTH-TRACE] render #${next} — ${name}`, extra ?? "");
    if (next === 25) {
      console.error(
        `[AUTH-TRACE] 🔴 ${name} rendered 25× — INFINITE RENDER. ` +
          `This component never settles; it is the blank-screen culprit.`
      );
    }
  }

  useEffect(() => {
    console.log(`[AUTH-TRACE] ✅ mounted — ${name}`);
    return () => {
      console.log(`[AUTH-TRACE] ❌ unmounted — ${name}`);
    };
  }, [name]);
}
