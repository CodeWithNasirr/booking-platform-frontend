"use client";

import { useState } from "react";
import {
  MoreVertical,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Video,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export default function ProviderCard({
  provider,
  canEdit,
  canDelete,
  onEdit,
  onToggleActive,
  onDelete,
}) {
  const { t, isRTL } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasAnyAction = canEdit || canDelete;

  const getInitials = (name) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const getActiveDays = (availability) =>
    Object.entries(availability)
      .filter(([_, data]) => data.enabled)
      .map(([day]) => day.slice(0, 3))
      .join(", ");

  return (
    <div
      className={`relative border rounded-2xl p-5 transition-all duration-200 ${
        provider.isActive
          ? "bg-white border-rose-100 shadow-sm hover:shadow-lg hover:border-rose-300"
          : "bg-rose-50/50 border-rose-100"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 shadow-sm">
          {getInitials(provider.name)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {provider.name}
              </h3>
              <p className="text-sm text-rose-700 font-medium">
                {provider.role}
              </p>
            </div>

            {/* Menu */}
            <div className="relative">
              {hasAnyAction && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-gray-500" />
              </button>
              )}

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div
                    className={`absolute top-10 z-20 w-48 bg-white border border-rose-100 rounded-xl shadow-xl overflow-hidden
                  ${isRTL ? "left-0" : "right-0"}
                `}
                  >
                   
                    <button
                      onClick={() => {
                        onEdit(provider);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-gray-700 hover:bg-rose-50"
                    >
                      <Edit className="w-4 h-4 text-rose-700" />
                      {t("provider.edit")}
                    </button>
                   
                
                    <button
                      onClick={() => {
                        onToggleActive(provider.id);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-sm hover:bg-rose-50"
                    >
                      {provider.isActive ? (
                        <>
                          <UserX className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-700">
                            {t("provider.deactivate")}
                          </span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700">
                            {t("provider.activate")}
                          </span>
                        </>
                      )}
                    </button>

                    <div className="h-px bg-rose-100 mx-2" />

                    <button
                      onClick={() => {
                        onDelete(provider.id);
                        setMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("provider.remove")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-rose-400" />
              <span className="truncate">{provider.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-rose-400" />
              <span>{provider.phone || t("provider.noPhone")}</span>
            </div>
          </div>

          {/* Services */}
          {provider.services?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {provider.services.slice(0, 3).map((service, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-rose-50 text-rose-800 text-xs font-medium rounded-lg border border-rose-200"
                >
                  {service}
                </span>
              ))}
              {provider.services.length > 3 && (
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                  +{provider.services.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Schedule Info */}
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
            <Video className="w-3.5 h-3.5 text-rose-500" />
            <span className="capitalize">
              {getActiveDays(provider.availability)}
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-rose-100">
            <div className="flex items-center gap-1.5 text-gray-600 text-sm">
              <Calendar className="w-4 h-4 text-rose-400" />
              <span className="font-medium">
                {provider.completedBookings || 0}
              </span>
              <span className="text-gray-400">{t("provider.sessions")}</span>
            </div>

            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                provider.isActive
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              {provider.isActive
                ? t("provider.active")
                : t("provider.inactive")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
