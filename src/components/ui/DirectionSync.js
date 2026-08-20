"use client";

import { useEffect } from "react";
import { getLanguage, getDir } from "@/lib/t";

/**
 * DirectionSync — applies the persisted language's direction and
 * lang attribute to <html> on mount, so RTL languages render
 * correctly on first load without forcing dynamic rendering.
 * Subsequent switches are handled by setLanguage() in @/lib/t.
 */
export default function DirectionSync() {
  useEffect(() => {
    const lang = getLanguage();
    const dir = getDir(lang);
    const el = document.documentElement;
    if (el.getAttribute("dir") !== dir) el.setAttribute("dir", dir);
    if (el.getAttribute("lang") !== lang) el.setAttribute("lang", lang);
  }, []);

  return null;
}
