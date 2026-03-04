"use client";

import {
  Plus,
  Search,
  Grid,
  List,
  Package,
  Eye,
  Archive,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import useBlockBackNavigation from "@/lib/useBlockBackNavigation";
import { useServices } from "./hooks/useServices";
import { ServiceCard } from "./components/ServiceCard";
import { ServiceRow } from "./components/ServiceRow";
import { ServiceModal } from "./components/ServiceModal";
import { CategoryManager } from "./components/CategoryManager";

export default function ServicesPage() {
  const {
    t,
    isRTL,
    loadingUser,
    requiresOnboarding,
    services,
    filtered,
    search,
    setSearch,
    view,
    setView,
    viewMode,
    setViewMode,
    selectedCategory,
    setSelectedCategory,
    modalOpen,
    setModalOpen,
    setEditing,
    editing,
    menuOpenId,
    setMenuOpenId,
    activeTab,
    setActiveTab,
    serviceCategories,
    deletedCount,
    form,
    setForm,
    openAddModal,
    handleSave,
    handleEdit,
    handleDuplicate,
    handleToggleActive,
    handleDelete,
    handleRestore,
    handleSaveCategory,
    handleDeleteCategory,
  } = useServices();

  useBlockBackNavigation(true);

  if (requiresOnboarding || loadingUser) return null;
  
  const stats = [
    {
      label: viewMode === "deleted" ? "Deleted" : "Total",
      value: services.length,
      icon: viewMode === "deleted" ? Archive : Package,
      bgColor: viewMode === "deleted" ? "bg-red-100" : "bg-[#8B1E3F]/10",
      textColor: viewMode === "deleted" ? "text-red-600" : "text-[#8B1E3F]",
    },
    {
      label: "Active",
      value: viewMode === "deleted" ? 0 : services.filter((s) => s.isActive).length,
      icon: Eye,
      bgColor: "bg-green-100",
      textColor: "text-green-600",
    },
    {
      label: "Inactive",
      value: viewMode === "deleted" ? 0 : services.filter((s) => !s.isActive).length,
      icon: Eye,
      bgColor: "bg-gray-100",
      textColor: "text-gray-600",
    },
    {
      label: viewMode === "deleted" ? "Restore" : "Recycle Bin",
      value: viewMode === "deleted" ? services.length : deletedCount,
      icon: viewMode === "deleted" ? RotateCcw : Archive,
      bgColor: "bg-purple-100",
      textColor: "text-purple-600",
      onClick: () => setViewMode(viewMode === "deleted" ? "active" : "deleted"),
      clickable: true,
    },
  ];
  

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {viewMode === "deleted" ? t("services.recycleBin"): t("services.title")}
          </h1>
          <p className="text-gray-600 mt-1">
            {viewMode === "deleted"
              ? t("services.recycleDesc")
              : t("services.manageDesc")}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode(viewMode === "deleted" ? "active" : "deleted")}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl font-medium shadow-sm transition-all ${
              viewMode === "deleted" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            {viewMode === "deleted" ? (
              <><Eye className="w-4 h-4" /> {t("services.viewActive")}</>
            ) : (
              <><Archive className="w-4 h-4" /> {t("services.recycleBin")} {deletedCount > 0 && `(${deletedCount})`}</>
            )}
          </button>
          {viewMode === "active" && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#A8325A] hover:opacity-90 font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" /> {t("services.addNewService")}
            </button>
          )}
        </div>
      </div>

      {/* Category Management */}
      {viewMode === "active" && (
        <CategoryManager
          categories={serviceCategories}
          onSave={handleSaveCategory}
          onDelete={handleDeleteCategory}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              onClick={stat.clickable ? stat.onClick : undefined}
              className={`bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow ${
                stat.clickable ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning for deleted view */}
      {viewMode === "deleted" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">{t("services.recycleBin")}</p>
            <p>{t("services.recycleWarningDesc")}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B1E3F]"
            />
          </div>
          {viewMode === "active" && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#8B1E3F] bg-white"
            >
              <option value="all">{t("services.allCategories")}</option>
              {serviceCategories.map((cat) => (
                <option key={cat.id} value={cat.name.en}>
                  {cat.name.en}
                </option>
              ))}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setView("grid")}
              className={`p-3 rounded-xl border ${
                view === "grid" ? "bg-[#8B1E3F] text-white border-[#8B1E3F]" : "bg-white text-gray-700"
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-3 rounded-xl border ${
                view === "list" ? "bg-[#8B1E3F] text-white border-[#8B1E3F]" : "bg-white text-gray-700"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === "deleted" && services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed">
          <Archive className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">{t("services.recycleEmpty")}</h3>
          <button
            onClick={() => setViewMode("active")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[#8B1E3F] bg-rose-50 hover:bg-rose-100"
          >
            {t("services.backToServices")}
          </button>
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  viewMode={viewMode}
                  menuOpenId={menuOpenId}
                  setMenuOpenId={setMenuOpenId}
                  onEdit={handleEdit}
                  onDuplicate={handleDuplicate}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              
               <table
                dir={isRTL ? "rtl" : "ltr"}
                className="w-full table-fixed text-sm"
              >
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {t("table.service")}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {t("table.type")}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {t("table.priceModel")}
                    </th>
                    <th
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {t("table.price")}
                    </th>
                    {viewMode !== "deleted" && (
                      <th
                        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase ${isRTL ? "text-right" : "text-left"}`}
                      >
                        {t("table.status")}
                      </th>
                    )}
                    <th
                      className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase ${isRTL ? "text-right" : "text-left"}`}
                    >
                      {t("table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((service) => (
                    <ServiceRow
                      key={service.id}
                      service={service}
                      viewMode={viewMode}
                      menuOpenId={menuOpenId}
                      setMenuOpenId={setMenuOpenId}
                      onEdit={handleEdit} 
                      onDuplicate={handleDuplicate}
                      onToggleActive={handleToggleActive}
                      onDelete={handleDelete}
                      onRestore={handleRestore}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && viewMode === "active" && (
        <ServiceModal
          editing={editing}
          form={form}
          setForm={setForm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          categories={serviceCategories}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}