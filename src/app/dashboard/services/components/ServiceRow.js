"use client";

import { useEffect, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { MoreVertical } from "lucide-react";
import { DropdownMenu } from "./DropdownMenu";
import { formatCurrency } from "@/lib/currency";
export function ServiceRow({
  service,
  canCreate,
  canEdit,
  canDelete,
  viewMode,
  menuOpenId,
  setMenuOpenId,
  onEdit,
  onDuplicate,
  onToggleActive,
  onDelete,
  onRestore,
}) {
  const isDeleted = viewMode === "deleted";
  const { t, isRTL,tenants } = useApp();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const hasAnyAction = canEdit || canDelete || canCreate;
  const tenantCurrency =  tenants[0]?.default_currency || "SAR";

  const getOrderTypeColor = (type) => {
    const colors = {
      booking: "bg-blue-100 text-blue-700",
      milestone: "bg-purple-100 text-purple-700",
      hybrid: "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  useEffect(() => {
    if (menuOpenId !== service.id) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setMenuOpenId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpenId, service.id, setMenuOpenId]);

  return (
    <tr className={isDeleted ? "bg-red-50/30" : !service.isActive ? "bg-gray-50" : "hover:bg-gray-50"}>
      <td className={`px-6 py-4 ${isRTL ? "text-right" : "text-left"}`}>
        <div className="font-medium text-gray-900">{service.name}</div>
        <div className="text-sm text-gray-500 truncate max-w-xs">{service.description}</div>
      </td>

      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? "text-right" : "text-left"}`}>
        <span className={`px-2 py-1 text-xs rounded-md font-medium ${getOrderTypeColor(service.orderType)}`}>
          {t(`orderType.${service.orderType || "booking"}`)}
        </span>
      </td>

      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? "text-right" : "text-left"}`}>
        <span className="px-2 py-1 bg-[#8B1E3F]/10 text-[#8B1E3F] text-xs rounded-md font-medium">
          {t(`pricing.${service.pricingType || "fixed"}`)}
        </span>
      </td>

      <td className={`px-6 py-4 whitespace-nowrap font-medium ${isRTL ? "text-right" : "text-left"}`}>
        {formatCurrency(
          service.price,
          tenantCurrency,
        )}
      </td>

      {viewMode !== "deleted" && (
        <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? "text-right" : "text-left"}`}>
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              service.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {service.isActive ? t("status.active") : t("status.inactive")}
          </span>
        </td>
      )}

      <td className={`px-6 py-4 whitespace-nowrap ${isRTL ? "text-left" : "text-right"}`}>
        <div className="relative inline-block" ref={menuRef}>
        {hasAnyAction && (
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenId(menuOpenId === service.id ? null : service.id);
            }}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
            )}

          {menuOpenId === service.id && (
            <DropdownMenu
              onClose={() => setMenuOpenId(null)}
              viewMode={viewMode}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={() => {
                onEdit(service);
                setMenuOpenId(null);
              }}
              onDuplicate={() => {
                onDuplicate(service);
                setMenuOpenId(null);
              }}
              onToggleActive={() => {
                onToggleActive(service);
                setMenuOpenId(null);
              }}
              onDelete={() => {
                onDelete(service);
                setMenuOpenId(null);
              }}
              onRestore={() => {
                onRestore(service);
                setMenuOpenId(null);
              }}
              isActive={service.isActive}
              triggerRef={buttonRef}
            />
          )}
        </div>
      </td>
    </tr>
  );
}