import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function clean(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim().slice(0, max)
  return t.length ? t : null
}

// POST público: registra una vista de página del sitio público.
// El cuerpo llega vía navigator.sendBeacon (text/plain) o fetch JSON.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {}
  try {
    const text = await request.text()
    if (text) body = JSON.parse(text)
  } catch {
    return new NextResponse(null, { status: 204 })
  }

  const path = clean(body.path, 500)
  if (!path) return new NextResponse(null, { status: 204 })

  // Ignorar rutas del portal (solo medimos el sitio público).
  if (path.startsWith('/portal')) return new NextResponse(null, { status: 204 })

  try {
    const supabase = getServiceClient()
    await supabase.from('page_views').insert({
      path,
      referrer: clean(body.referrer, 500),
      session_id: clean(body.session_id, 100),
      utm_source: clean(body.utm_source, 120),
      utm_medium: clean(body.utm_medium, 120),
      utm_campaign: clean(body.utm_campaign, 120),
    })
  } catch {
    // No bloquear la navegación del usuario por un fallo de tracking.
  }

  return new NextResponse(null, { status: 204 })
}
