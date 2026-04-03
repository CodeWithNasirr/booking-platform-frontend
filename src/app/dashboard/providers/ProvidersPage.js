'use client'

import { useState,useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'
import { useProviders } from './hooks/useProviders'
import StatsCards from './components/StatsCards'
import ProviderCard from './components/ProviderCard'
import ProviderModal from './components/ProviderModal'
import { useTenantPermission } from "@/lib/useTenantPermission";


const defaultAvailability = {
  monday: { enabled: true, start: '09:00', end: '17:00' },
  tuesday: { enabled: true, start: '09:00', end: '17:00' },
  wednesday: { enabled: true, start: '09:00', end: '17:00' },
  thursday: { enabled: true, start: '09:00', end: '17:00' },
  friday: { enabled: true, start: '09:00', end: '17:00' },
  saturday: { enabled: false, start: '', end: '' },
  sunday: { enabled: false, start: '', end: '' },
}

const initialForm = {
  name: '',
  email: '',
  phone: '',
  bio: '',
  isActive: true,
  assignedServices: [],
  availability: defaultAvailability,
  completedBookings: 0,
}

export default function ProvidersPage() {
  const { user, loadingUser, requiresOnboarding, t } = useApp()
  const router = useRouter()

  const {
    providers,
    isLoading,
    addProvider,
    refresh,
    editProvider,
    saveAvailability,
    toggleStatus,
    removeProvider,
  } = useProviders()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [form, setForm] = useState(initialForm)
  const [isSaving, setIsSaving] = useState(false)

  const { allowed: canCreate } = useTenantPermission("providers.manage");
  const { allowed: canEdit } = useTenantPermission("providers.manage");
  const { allowed: canDelete } = useTenantPermission("providers.manage");

  useBlockBackNavigation(!!user)

  useEffect(() => {
    if (!loadingUser && !user) {
      router.push("/auth/login");
    }
  }, [loadingUser, router,user]);


  useEffect(() => {
    if (requiresOnboarding) {
        router.replace('/auth/onboarding?step=1');
    }
    }, [requiresOnboarding]);

  const filtered = providers.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      (p.role || '').toLowerCase().includes(search.toLowerCase())
  )


  const [toast, setToast] = useState(null)

  const showToast = (msg, type = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }


  const handleSave = async () => {
    setIsSaving(true)

    try {
      let provider

      if (editing) {
        provider = await editProvider(editing.id, form)
        showToast(t('providers.updated') || "Provider updated")
      } else {
        provider = await addProvider(form)
        showToast(t('providers.created') || "Provider created")
      }

      await saveAvailability(provider.id, form.availability)
      await refresh() // ONE reload
      setModalOpen(false)   // ✅ only on success
      setForm(initialForm)

  } catch (err) {
    showToast(err.message, "error")   // ← now works
    setForm(initialForm)
    if (err.data?.upgrade_required) {
    // console.log(err.data,"ERROR")
    // console.log("Trigger upgrade modal here")
   }

    } finally {
      setIsSaving(false)
    }
  }


  const handleEdit = (provider) => {
    setEditing(provider)
    setForm({
      name: provider.name,
      originalEmail: provider.email,
      phone: provider.phone,
      bio: provider.bio || '',
      isActive: provider.isActive,
      assignedServices: provider.assignedServices || [],
      availability: provider.availability,
    })
    setActiveTab('basic')
    setModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (!confirm(t('providers.confirmDelete'))) return
    await removeProvider(id)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('providers.title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('providers.subtitle')}
          </p>
        </div>
        {canCreate && (
        <button
          onClick={() => {
            setEditing(null)
            setForm(initialForm)
            setModalOpen(true)
          }}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-[#8B1E3F] to-[#A8325A]"
        >
          <Plus className="w-5 h-5" />
          {t('providers.add')}
        </button>
        )}
      </div>
    

      {/* Stats */}
      <StatsCards providers={providers} />

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('providers.search')}
          className="w-full pl-12 pr-4 py-3 border rounded-xl"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((provider) => (
          <ProviderCard
            key={provider.id}
            canEdit={canEdit}
            canDelete={canDelete}
            provider={provider}
            onEdit={handleEdit}
            onToggleActive={toggleStatus}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16">
          <h3 className="text-lg font-semibold">
            {t('providers.empty.title')}
          </h3>
          <p className="text-gray-500">
            {t('providers.empty.subtitle')}
          </p>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ProviderModal
          editing={editing}
          form={form}
          setForm={setForm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`px-6 py-3 rounded-xl shadow-lg text-white font-medium
            ${toast.type === "error"
              ? "bg-red-600"
              : "bg-green-600"
            }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

    </div>
  )
}
