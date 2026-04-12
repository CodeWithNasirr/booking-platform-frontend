// src/app/api/whatsapp/[action]/route.js
//
// WhatsApp Web API Routes (runs inside Next.js)
//
// Endpoints:
//   POST /api/whatsapp/start      → Start session, get QR
//   GET  /api/whatsapp/status     → Session status
//   GET  /api/whatsapp/qr         → Get QR code
//   POST /api/whatsapp/disconnect → Destroy session
//   POST /api/whatsapp/send       → Send message
//   GET  /api/whatsapp/health     → Health check
//
// These are called by the Django backend (WHATSAPP_SERVICE_URL)
// OR directly by the frontend for QR polling.

import { NextResponse } from 'next/server'

// Dynamic import to avoid build errors if deps not installed
let sessionManager = null
async function getManager() {
  if (!sessionManager) {
    sessionManager = await import('@/lib/whatsapp/sessionManager')
  }
  return sessionManager
}

export async function POST(request, { params }) {
  const { action } = await params
  const manager = await getManager()

  try {
    if (action === 'start') {
     let body = {}

    try {
        body = await request.json()
        } catch (err) {
        console.warn('Empty or invalid JSON body')
        }

    const { session_id, tenant_id } = body || {}


      if (!session_id) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 })
      }

      const result = await manager.startSession(session_id, tenant_id)
      return NextResponse.json(result)
    }

    if (action === 'disconnect') {
      const body = await request.json()
      const { session_id } = body

      if (!session_id) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 })
      }

      await manager.destroySession(session_id)
      return NextResponse.json({ status: 'destroyed' })
    }

    if (action === 'send') {
      const body = await request.json()
      const { session_id, to, message } = body

      if (!session_id || !to || !message) {
        return NextResponse.json({ error: 'session_id, to, message required' }, { status: 400 })
      }

      const result = await manager.sendMessage(session_id, to, message)
      return NextResponse.json({ sent: true, ...result })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 404 })
  } catch (err) {
    console.error(`[WhatsApp API] ${action} error:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request, { params }) {
  const { action } = await params
  const manager = await getManager()
  const url = new URL(request.url)

  try {
    if (action === 'health') {
      return NextResponse.json(manager.health())
    }

    const sessionId = url.searchParams.get('session_id')

    if (action === 'status') {
      if (!sessionId) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 })
      }
      const result = manager.getStatus(sessionId)
      if (!result) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    if (action === 'qr') {
      if (!sessionId) {
        return NextResponse.json({ error: 'session_id required' }, { status: 400 })
      }
      const result = manager.getQR(sessionId)
      if (!result) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 404 })
  } catch (err) {
    console.error(`[WhatsApp API] ${action} error:`, err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Ensure this route runs on Node.js runtime (not edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'