'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import Cookies from "js-cookie";

export default function BasicInfoTab({ form, setForm, editing }) {
  const { activeTenant, t,isRTL } = useApp()
  const [services, setServices] = useState([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)

  // API Helper
  const authFetch = async (url, options = {}) => {
    if (!activeTenant) throw new Error("Tenant not ready");

    const token = Cookies.get("access_token");
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
        "X-Tenant": activeTenant,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      const messages = Object.values(errorData)
        .filter((v) => Array.isArray(v))
        .flat();
      const error = new Error(messages.join("\n") || "Request failed");
      error.status = res.status;
      error.raw = errorData;
      throw error;
    }

    if (res.status === 204) return null;
    return res.json();
  };

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      if (!activeTenant) return
      
      try {
        const data = await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/services/`
        )
        const list = data.results || data
        setServices(list.filter(service => service.is_active))
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setIsLoadingServices(false)
      }
    }

    fetchServices()
  }, [activeTenant])

  const toggleService = (serviceId) => {
    const currentServices = form.assignedServices || []
    const isAssigned = currentServices.includes(serviceId)

    setForm({
      ...form,
      assignedServices: isAssigned
        ? currentServices.filter(id => id !== serviceId)
        : [...currentServices, serviceId]
    })
  }

  const selectAllServices = () => {
    setForm({
      ...form,
      assignedServices: services.map(s => s.id),
      assignAllServices: true
    })
  }

  const clearAllServices = () => {
    setForm({
      ...form,
      assignedServices: [],
      assignAllServices: false
    })
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("provider.fullName")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder={t("provider.fullNamePlaceholder")}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
        />
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {t("provider.email")} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder={t("provider.emailPlaceholder")}
            value={form.email}
            disabled={!!editing}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            {t("provider.phone")}
          </label>
          <input
            type="tel"
            placeholder={t("provider.phonePlaceholder")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          {t("provider.bio")}
        </label>
        <textarea
          rows={3}
          placeholder={t("provider.bioPlaceholder")}
          value={form.bio || ''}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
        />
      </div>

      {/* Service Assignment */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-semibold text-gray-900">
            {t("provider.assignedServices")} <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAllServices}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t("provider.selectAll")}
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={clearAllServices}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium"
            >
              {t("provider.clear")}
            </button>
          </div>
        </div>

        {isLoadingServices ? (
          <div className="flex items-center justify-center py-8 bg-gray-50 rounded-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-6 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">
              {t("provider.noServices")}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {t("provider.noServicesHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
            {services.map((service) => {
              const isAssigned = (form.assignedServices || []).includes(service.id)
              return (
                <label
                  key={service.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    isAssigned
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => toggleService(service.id)}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      isAssigned ? 'text-indigo-900' : 'text-gray-900'
                    }`}>
                      {service.name?.en || service.name}
                    </p>
                    {service.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {service.description?.en || service.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {service.price} {service.currency || 'SAR'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {service.duration} min
                    </p>
                  </div>
                </label>
              )
            })}
          </div>
        )}

        {(form.assignedServices || []).length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium text-indigo-600">
              {(form.assignedServices || []).length}
            </span>{' '}
            {t("provider.servicesAssigned")}
          </p>
        )}
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <div>
          <label className="block text-sm font-semibold text-gray-900">
            {t("provider.activeStatus")}
          </label>
          <p className="text-sm text-gray-500 mt-0.5">
            {t("provider.activeHint")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, isActive: !form.isActive })}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
             form.isActive ? "bg-[#8B1E3F]" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
        form.isActive
          ? isRTL
            ? "-translate-x-7" // RTL ON → left
            : "translate-x-7" // LTR ON → right
          : isRTL
            ? "-translate-x-1" // ✅ RTL OFF → RIGHT
            : "translate-x-1" // ✅ LTR OFF → LEFT
      }`}
          />
        </button>
      </div>
    </div>
  )
}
