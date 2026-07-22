import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const BUCKET = 'student-content'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('id, role').eq('id', user.id).single()
  if (!emp || emp.role !== 'admin') return null
  return emp
}

// GET → todos los envíos (con datos del autor + URL firmada). Filtro opcional ?status=
export async function GET(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const status = new URL(request.url).searchParams.get('status')
  const admin = getAdminClient()

  let query = admin
    .from('content_submissions')
    .select('id, contributor_id, kind, storage_path, mime, size_bytes, title, caption, consent_granted, is_minor, guardian_ack, guardian_name, consent_text, consent_version, consent_at, status, review_note, reviewed_at, created_at')
    .order('created_at', { ascending: false })
  if (status && ['pendiente', 'aprobado', 'rechazado'].includes(status)) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener el contenido.' }, { status: 500 })

  const rows = data ?? []
  // Datos del autor (no hay FK directa a content_contributors → se resuelve aparte).
  const ids = Array.from(new Set(rows.map((r) => r.contributor_id)))
  const { data: contribs } = ids.length
    ? await admin.from('content_contributors').select('id, full_name, email, type').in('id', ids)
    : { data: [] }
  const byId = new Map((contribs ?? []).map((c) => [c.id, c]))

  // Email autoritativo desde auth.users (por si no hay perfil de contribuidor).
  const authById = new Map<string, { email: string | null; name: string | null }>()
  await Promise.all(ids.map(async (id) => {
    try {
      const { data } = await admin.auth.admin.getUserById(id)
      authById.set(id, {
        email: data.user?.email ?? null,
        name: (data.user?.user_metadata?.full_name as string) ?? null,
      })
    } catch { /* usuario borrado: se queda sin datos de auth */ }
  }))

  const submissions = await Promise.all(rows.map(async (s) => {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(s.storage_path, 3600)
    const c = byId.get(s.contributor_id)
    const au = authById.get(s.contributor_id)
    const email = c?.email ?? au?.email ?? null
    return {
      ...s,
      url: signed?.signedUrl ?? null,
      author_name: c?.full_name ?? au?.name ?? email ?? 'Sin perfil',
      author_email: email,
      author_type: c?.type ?? null,
    }
  }))
  return NextResponse.json({ submissions })
}

// PATCH → aprobar/rechazar un envío { id, status, review_note? }
export async function PATCH(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id : null
  const status = body?.status
  const reviewNote = typeof body?.review_note === 'string' ? body.review_note.trim().slice(0, 500) || null : null

  if (!id) return NextResponse.json({ error: 'Falta el id.' }, { status: 400 })
  if (!['pendiente', 'aprobado', 'rechazado'].includes(status)) return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('content_submissions')
    .update({ status, review_note: reviewNote, reviewed_by: caller.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, status')
    .single()
  if (error) return NextResponse.json({ error: 'No se pudo actualizar.' }, { status: 500 })
  return NextResponse.json({ submission: data })
}
