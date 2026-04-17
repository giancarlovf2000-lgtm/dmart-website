import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthUser(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') // e.g. '2026-04-01'

  const admin = getAdminClient()
  let query = admin
    .from('activities')
    .select('*')
    .eq('employee_id', user.id)
    .order('created_at', { ascending: false })

  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener actividades.' }, { status: 500 })
  return NextResponse.json({ activities: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const user = await getAuthUser(supabase)
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { name, type, description, planned_leads, month } = body

  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
  if (!['feria', 'visita_escuela', 'evento_comunitario', 'otro'].includes(type))
    return NextResponse.json({ error: 'Tipo de actividad inválido.' }, { status: 400 })
  if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('activities')
    .insert({
      employee_id: user.id,
      name: name.trim(),
      type,
      description: description?.trim() || null,
      planned_leads: planned_leads ? parseInt(planned_leads, 10) : null,
      month,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Error al crear la actividad.' }, { status: 500 })
  return NextResponse.json({ activity: data }, { status: 201 })
}
