"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { RotateCcw, Trash2, Edit, Copy, Eye } from "lucide-react";

export function DropdownMenu({
  viewMode,
  canCreate,
  canEdit,
  canDelete,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  onRestore,
  isActive,
  onClose,
  triggerRef,
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);
  const { t, isRTL } = useApp();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose, triggerRef]);

  useEffect(() => {
    if (!triggerRef?.current || !menuRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;
    const menuHeight = menuRect.height || 200;
    const menuWidth = menuRect.width || 176;

    let top =
      spaceBelow >= menuHeight
        ? triggerRect.bottom + 8
        : Math.max(triggerRect.top - menuHeight - 8, 8);

    let left = isRTL ? triggerRect.left : triggerRect.right - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > viewportWidth - 8) {
      left = viewportWidth - menuWidth - 8;
    }

    setPosition({ top, left });
  }, [triggerRef, isRTL]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 9999,
      }}
      className="w-44 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
    >
      {viewMode === "deleted" ? (
        <>
          <button
            onClick={() => {
              onRestore();
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-green-700 hover:bg-green-50"
          >
            <RotateCcw className="w-4 h-4" />
            {t("services.buttons.restore")}
          </button>
          <div className="border-t my-1" />
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            {t("services.buttons.deleteForever")}
          </button>
        </>
      ) : (
        <>
        {canEdit && (
          <button
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            {t("services.buttons.edit")}
          </button>
        )}

        {canCreate && (
          <button
            onClick={() => {
              onDuplicate();
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-50"
          >
            <Copy className="w-4 h-4" />
            {t("services.buttons.duplicate")}
          </button>
        )}

        {canEdit && (
          <button
            onClick={() => {
              onToggleActive();
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            {isActive ? t("services.buttons.deactivate") : t("services.buttons.activate")}
          </button>
          )}

          <div className="border-t my-1" />
        {canDelete && (
          <button
            onClick={() => {
              onDelete();
              onClose();
            }}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            {t("services.buttons.moveToBin")}
          </button>
          )}
        </>
      )}
    </div>
  );
}