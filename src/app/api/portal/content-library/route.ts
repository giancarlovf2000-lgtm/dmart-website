import { NextResponse } from 'next/server'
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

// GET → imágenes APROBADAS para usarlas como foto en el generador de posts.
export async function GET() {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('content_submissions')
    .select('id, storage_path, title, created_at')
    .eq('status', 'aprobado')
    .eq('kind', 'imagen')
    .order('created_at', { ascending: false })
    .limit(60)
  if (error) return NextResponse.json({ error: 'Error al obtener la biblioteca.' }, { status: 500 })

  const items = await Promise.all((data ?? []).map(async (s) => {
    const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(s.storage_path, 3600)
    return { id: s.id, title: s.title, url: signed?.signedUrl ?? null }
  }))
  return NextResponse.json({ items: items.filter((i) => i.url) })
}
