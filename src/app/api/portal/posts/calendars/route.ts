import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

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

// GET → lista de calendarios (con conteo de posts)
export async function GET() {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { data: calendars, error } = await admin
    .from('post_calendars')
    .select('id, name, month, created_at')
    .order('month', { ascending: false })
  if (error) return NextResponse.json({ error: 'Error al obtener calendarios.' }, { status: 500 })

  // Conteo de posts por calendario.
  const { data: posts } = await admin.from('saved_posts').select('calendar_id')
  const counts: Record<string, number> = {}
  for (const p of posts ?? []) {
    if (p.calendar_id) counts[p.calendar_id] = (counts[p.calendar_id] ?? 0) + 1
  }

  return NextResponse.json({
    calendars: (calendars ?? []).map((c) => ({ ...c, post_count: counts[c.id] ?? 0 })),
  })
}

// POST → crear un calendario { name, month: 'YYYY-MM' }
export async function POST(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim().slice(0, 120) : ''
  const monthRaw = typeof body?.month === 'string' ? body.month.trim() : ''
  if (!name) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
  if (!/^\d{4}-\d{2}$/.test(monthRaw))
    return NextResponse.json({ error: 'Mes inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('post_calendars')
    .insert({ name, month: `${monthRaw}-01`, created_by: caller.id })
    .select('id, name, month, created_at')
    .single()
  if (error) return NextResponse.json({ error: 'Error al crear el calendario.' }, { status: 500 })

  return NextResponse.json({ calendar: { ...data, post_count: 0 } })
}
