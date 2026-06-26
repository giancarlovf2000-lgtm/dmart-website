'use client'

import { useEffect } from 'react'

// Registra el service worker del portal (scope /portal) para que sea instalable.
export default function PwaRegister() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js', { scope: '/portal' }).catch(() => {})
  }, [])
  return null
}
