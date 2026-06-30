'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// Identificador de sesión efímero (por pestaña), para contar visitantes únicos.
function getSessionId(): string {
  try {
    const KEY = 'dmart_sid'
    let sid = sessionStorage.getItem(KEY)
    if (!sid) {
      sid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(KEY, sid)
    }
    return sid
  } catch {
    return 'anon'
  }
}

function send(payload: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    if (navigator.sendBeacon && navigator.sendBeacon('/api/track', blob)) return
  } catch {
    /* sendBeacon no disponible — fallback abajo */
  }
  // Fallback: fetch keepalive.
  fetch('/api/track', {
    method: 'POST',
    body: JSON.stringify(payload),
    keepalive: true,
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {})
}

/**
 * Beacon de analítica web first-party. Registra una vista por cambio de ruta
 * en el sitio público (no en /portal). Montado en el layout público.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname || pathname.startsWith('/portal')) return
    send({
      path: pathname,
      referrer: typeof document !== 'undefined' ? document.referrer : null,
      session_id: getSessionId(),
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
    })
  }, [pathname, searchParams])

  return null
}
