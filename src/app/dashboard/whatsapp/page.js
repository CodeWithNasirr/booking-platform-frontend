// src/app/dashboard/whatsapp/page.js
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import {
  startWhatsAppSession, getWhatsAppStatus, getWhatsAppQR, disconnectWhatsApp,
} from '../integrations/lib/integrationsApi'


import {
  MessageCircle, QrCode, Phone, Wifi, WifiOff, RefreshCw,
  Loader2, X, Check, AlertTriangle, Link2, Unplug, Smartphone,
} from 'lucide-react'
import useBlockBackNavigation from '@/lib/useBlockBackNavigation'

export default function ManageWhatsAppPage() {
  const { user, loadingUser, requiresOnboarding, activeTenant } = useApp()
  const router = useRouter()

  const [session, setSession] = useState(null) // { status, phone, session_id }
  const [loading, setLoading] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)

  useBlockBackNavigation(!!user)

  useEffect(() => {
    if (!loadingUser && !user) router.replace('/')
  }, [loadingUser, user, router])

  useEffect(() => {
    if (requiresOnboarding) router.replace('/auth/onboarding?step=1')
  }, [requiresOnboarding, router])

  // Load session status
  const loadStatus = useCallback(async () => {
    if (!activeTenant) return
    try {
      const data = await getWhatsAppStatus(activeTenant)
      setSession(data)
    } catch {
      setSession({ status: 'disconnected' })
    } finally {
      setLoading(false)
    }
  }, [activeTenant])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleDisconnect = async () => {
    if (!confirm('Disconnect WhatsApp? You will stop receiving notifications.')) return
    try {
      await disconnectWhatsApp(activeTenant)
      setSession({ status: 'disconnected' })
    } catch (err) {
      alert(err.message)
    }
  }

  if (requiresOnboarding || loadingUser) return null

  const isConnected = session?.status === 'authenticated'
  const isDisconnected = !session || session.status === 'disconnected'
  const hasError = session?.status === 'error'

  return (
    <div className="space-y-6">
      {/* Session Alert Banner */}
      {(hasError || (session?.phone && !isConnected)) && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-300">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Your WhatsApp session has stopped working!</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Please click{' '}
              <button onClick={() => setShowQRModal(true)} className="underline font-medium text-amber-800 hover:text-amber-900">
                here
              </button>{' '}
              to relink your WhatsApp to continue the notifications.
            </p>
            {session?.phone && (
              <p className="text-sm font-bold text-amber-900 mt-1">{session.phone}</p>
            )}
          </div>
          <button className="text-amber-400 hover:text-amber-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-1">Home → WhatsApp</p>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-[#8B1E3F]" />
        </div>
      ) : isConnected ? (
        /* ═══ CONNECTED STATE ═══ */
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center">
              <Wifi className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">WhatsApp Connected</h2>
              <p className="text-sm text-gray-600">Session is active and ready to send messages</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700">Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="text-lg font-bold text-gray-900">{session.phone || 'Unknown'}</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</p>
              <p className="text-lg font-bold text-green-700">Connected</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Session</p>
              <p className="text-sm font-mono text-gray-600 truncate">{session.session_id || '-'}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all text-sm">
              <RefreshCw className="w-4 h-4" /> Relink Session
            </button>
            <button onClick={handleDisconnect}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 text-red-600 font-medium hover:bg-red-50 transition-all text-sm">
              <Unplug className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </div>
      ) : (
        /* ═══ DISCONNECTED / EMPTY STATE ═══ */
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex flex-col items-center justify-center py-16 px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add a session to get started.</h2>

            <button onClick={() => setShowQRModal(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white bg-gradient-to-br from-[#8B1E3F] to-[#6B1630] hover:opacity-90 transition-all shadow-lg font-medium">
              <QrCode className="w-5 h-5" /> Link New Session
            </button>

            {/* Illustration placeholder */}
            <div className="mt-10 w-80 h-60 flex items-center justify-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-green-50 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-green-300 mx-auto mb-2" />
                    <Smartphone className="w-10 h-10 text-green-400 mx-auto" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-4 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QR MODAL ═══ */}
      {showQRModal && (
        <QRLinkModal
          activeTenant={activeTenant}
          onClose={() => setShowQRModal(false)}
          onConnected={() => {
            setShowQRModal(false)
            loadStatus()
          }}
        />
      )}
    </div>
  )
}

// ─── QR Link Modal (matches Rekaz exactly) ──────────────────────

function QRLinkModal({ activeTenant, onClose, onConnected }) {
  const [phase, setPhase] = useState('loading')
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState(null)

  const startSession = async () => {
    setPhase('loading')
    setError(null)
    try {
      const data = await startWhatsAppSession(activeTenant)
      if (data.status === 'already_connected') {
        onConnected()
        return
      }
      setPhase('qr')
      setQrCode(data.qr_code || '')
    } catch (err) {
      setError(err.message)
      setPhase('error')
    }
  }

  // Poll for auth
  useEffect(() => {
    if (phase !== 'qr') return
    const interval = setInterval(async () => {
      try {
        const data = await getWhatsAppStatus(activeTenant)
        if (data.status === 'authenticated') {
          clearInterval(interval)
          onConnected()
        }
      } catch {}
    }, 3000)
    return () => clearInterval(interval)
  }, [phase, activeTenant, onConnected])

  // Refresh QR
  useEffect(() => {
    if (phase !== 'qr') return
    const interval = setInterval(async () => {
      try {
        const data = await getWhatsAppQR(activeTenant)
        if (data.qr_code) setQrCode(data.qr_code)
      } catch {}
    }, 15000)
    return () => clearInterval(interval)
  }, [phase, activeTenant])

  useEffect(() => { startSession() }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Link New Session</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {phase === 'loading' && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#8B1E3F] mb-3" />
              <p className="text-sm text-gray-500">Generating QR code...</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button onClick={startSession}
                className="px-4 py-2 rounded-xl bg-[#8B1E3F] text-white text-sm font-medium">
                Retry
              </button>
            </div>
          )}

          {phase === 'qr' && (
            <div className="flex flex-col items-center">
              {/* QR Code */}
              <div className="border-2 border-gray-200 rounded-xl p-2 mb-4">
                {qrCode ? (
                  <img src={`data:image/png;base64,${qrCode}`} alt="QR Code" className="w-56 h-56" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                  </div>
                )}
              </div>

              <p className="text-sm font-medium text-gray-900 mb-4">
                Scan the QR code to sync with WhatsApp
              </p>

              {/* Instructions */}
              <div className="w-full text-left space-y-1.5 mb-5">
                <p className="text-sm text-gray-600">1. Open WhatsApp on your phone</p>
                <p className="text-sm text-gray-600">2. Tap Menu on Android, or Settings on iPhone</p>
                <p className="text-sm text-gray-600">3. Tap Linked devices and then Link a device</p>
                <p className="text-sm text-gray-600">4. Point your phone at this screen to capture the QR code</p>
              </div>

              {/* Phone linking option */}
              <button className="text-sm text-[#8B1E3F] font-medium hover:text-[#6B1630]">
                Link with phone number
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}