"use client";

import { useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { MoreVertical, DollarSign, Clock } from "lucide-react";
import { DropdownMenu } from "./DropdownMenu";


export function ServiceCard({
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
  const { t, isRTL } = useApp();
  const buttonRef = useRef(null);

  const hasAnyAction = canEdit || canDelete || canCreate;


  /* ===============================
     Order Type Badge (i18n)
     =============================== */
  const getOrderTypeBadge = () => {
    const types = {
      booking: {
        color: "bg-blue-100 text-blue-700",
        label: t("orderType.booking"),
      },
      order: {
        color: "bg-purple-100 text-purple-700",
        label: t("orderType.order"),
      },
      // hybrid: {
      //   color: "bg-orange-100 text-orange-700",
      //   label: t("orderType.hybrid"),
      // },
    };

    return types[service.orderType] || types.booking;
  };

  const orderBadge = getOrderTypeBadge();

  return (
    <div
      className={`relative bg-white border-2 rounded-xl p-5 transition-all ${
        isDeleted
          ? "border-red-100 bg-red-50/30"
          : service.isActive
          ? "border-gray-200 hover:border-[#8B1E3F]/30 hover:shadow-lg"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      {/* ===============================
          Header
         =============================== */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {service.image && (
            <img
              src={service.image}
              alt={service.name}
              className="w-full h-32 object-cover rounded-lg mb-3"
            />
          )}

          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-semibold text-gray-900">{service.name}</h3>

            {/* Order Type Badge */}
            <span
              className={`px-2 py-1 text-xs rounded-full font-medium ${orderBadge.color}`}
            >
              {orderBadge.label}
            </span>

            {isDeleted && (
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                {t("services.deleted")}
              </span>
            )}

            {!isDeleted && !service.isActive && (
              <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                {t("services.inactive")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
              {service.category}
            </span>

            {/* Pricing Type */}
            <span className="px-2 py-1 bg-[#8B1E3F]/10 text-[#8B1E3F] text-xs rounded-md capitalize font-medium">
              {t(`pricing.${service.pricingType || "fixed"}`)}
            </span>

            {service.serviceType === "digital" && (
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md">
                {t("serviceType.digital")}
              </span>
            )}
          </div>
        </div>

        {/* ===============================
            Actions
           =============================== */}
        <div className="relative">
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
              viewMode={viewMode}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              onEdit={() => onEdit(service)}
              onDuplicate={() => onDuplicate(service)}
              onToggleActive={() => onToggleActive(service)}
              onDelete={() => onDelete(service)}
              onRestore={() => onRestore(service)}
              isActive={service.isActive}
              onClose={() => setMenuOpenId(null)}
              triggerRef={buttonRef}
              isRTL={isRTL}
            />
          )}
        </div>
      </div>

      {/* ===============================
          Description
         =============================== */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {service.description}
      </p>

      {/* ===============================
          Footer
         =============================== */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">${service.price}</span>
          </div>

          {service.duration > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>
                {service.duration}
                {t("common.minutesShort")}
              </span>
            </div>
          )}
        </div>

        <span className="text-xs text-gray-400 capitalize">
          {t(`serviceType.${service.serviceType}`)}
        </span>
      </div>
    </div>
  );
}
