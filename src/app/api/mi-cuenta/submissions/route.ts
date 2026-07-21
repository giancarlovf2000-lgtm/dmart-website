import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { CONSENT_TEXT, CONSENT_VERSION } from '@/lib/content/consent'

const BUCKET = 'student-content'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireUser() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// GET → los envíos del usuario autenticado, con URL firmada (privado).
export async function GET() {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('content_submissions')
    .select('id, kind, storage_path, title, caption, status, review_note, created_at')
    .eq('contributor_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Error al obtener tus envíos.' }, { status: 500 })

  const submissions = await Promise.all((data ?? []).map(async (s) => {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(s.storage_path, 3600)
    return { ...s, url: signed?.signedUrl ?? null }
  }))
  return NextResponse.json({ submissions })
}

// POST → registra un envío (el archivo ya se subió al bucket desde el navegador).
export async function POST(request: NextRequest) {
  const user = await requireUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const storagePath = typeof body?.storage_path === 'string' ? body.storage_path : ''
  const kind = body?.kind === 'video' ? 'video' : body?.kind === 'imagen' ? 'imagen' : null
  const mime = typeof body?.mime === 'string' ? body.mime.slice(0, 120) : null
  const sizeBytes = Number.isFinite(body?.size_bytes) ? Math.round(body.size_bytes) : null
  const title = typeof body?.title === 'string' ? body.title.trim().slice(0, 160) || null : null
  const caption = typeof body?.caption === 'string' ? body.caption.trim().slice(0, 600) || null : null
  const consentGranted = body?.consent_granted === true
  const isMinor = body?.is_minor === true
  const guardianAck = body?.guardian_ack === true
  const guardianName = typeof body?.guardian_name === 'string' ? body.guardian_name.trim().slice(0, 120) || null : null

  // El path debe estar dentro de la carpeta del propio usuario (defensa en profundidad).
  if (!storagePath || !storagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Archivo inválido.' }, { status: 400 })
  }
  if (!kind) return NextResponse.json({ error: 'Tipo de contenido inválido.' }, { status: 400 })
  if (!consentGranted) return NextResponse.json({ error: 'Debes autorizar el uso del contenido.' }, { status: 400 })
  if (isMinor && !guardianAck) return NextResponse.json({ error: 'Falta la autorización del tutor.' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('content_submissions')
    .insert({
      contributor_id: user.id,
      kind, storage_path: storagePath, mime, size_bytes: sizeBytes, title, caption,
      consent_granted: true, is_minor: isMinor, guardian_ack: guardianAck, guardian_name: guardianName,
      consent_text: CONSENT_TEXT, consent_version: CONSENT_VERSION, consent_at: new Date().toISOString(),
      status: 'pendiente',
    })
    .select('id')
    .single()
  if (error) {
    console.error('[submissions] insert', error)
    return NextResponse.json({ error: 'No se pudo guardar el envío.' }, { status: 500 })
  }
  return NextResponse.json({ id: data.id }, { status: 201 })
}
