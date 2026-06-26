import type { MetadataRoute } from 'next'

// PWA del portal de empleados (manejo de leads). Scope limitado a /portal para que
// la instalación solo se ofrezca dentro del portal, no en el sitio público.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Portal D'Mart — Leads",
    short_name: "Portal D'Mart",
    description: "Portal de manejo de leads de D'Mart Institute para el personal.",
    start_url: '/portal/dashboard',
    scope: '/portal',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4F3F1',
    theme_color: '#D40000',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
