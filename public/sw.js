/* Service worker mínimo del Portal D'Mart.
   Objetivo: que el portal sea instalable (PWA) + página offline.
   NO cachea datos dinámicos, API ni sesión → nunca sirve información vieja. */

const CACHE = 'dmart-portal-v1'
const PRECACHE = ['/offline.html', '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  // Navegaciones (páginas): red primero; si falla (offline) → página offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    )
    return
  }

  // Íconos del app: cache-first (estáticos).
  const url = new URL(req.url)
  if (url.origin === self.location.origin && url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
        return res
      }).catch(() => hit))
    )
    return
  }

  // Todo lo demás (JS/CSS de Next, API, Supabase): directo a la red, sin cachear.
})
