import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedEmployee(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('id, full_name, role, active')
    .eq('id', user.id)
    .single()
  if (!employee || !employee.active) return null
  return { user, employee }
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const auth = await getAuthenticatedEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { user, employee } = auth
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const campus = searchParams.get('campus')
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = 50
  const offset = (page - 1) * pageSize

  const admin = getAdminClient()
  let query = admin
    .from('leads')
    .select('*, employee:assigned_to(full_name), activity:activity_id(name)')
    .order('last_action_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (employee.role !== 'admin') query = query.eq('assigned_to', user.id)
  if (status) query = query.eq('status', status)
  if (campus) query = query.eq('campus', campus)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener leads.' }, { status: 500 })
  return NextResponse.json({ leads: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const auth = await getAuthenticatedEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { user, employee } = auth
  const body = await request.json()

  const {
    nombre, apellido, email, telefono,
    campus, programa_interes, horario,
    activity_id, lead_source_text,
  } = body

  if (!nombre?.trim() || nombre.trim().length < 2)
    return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 })
  if (!apellido?.trim() || apellido.trim().length < 2)
    return NextResponse.json({ error: 'El apellido es requerido.' }, { status: 400 })
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'Correo electrónico inválido.' }, { status: 400 })
  if (!telefono?.trim() || telefono.trim().length < 7)
    return NextResponse.json({ error: 'Teléfono inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const now = new Date().toISOString()

  const { data: lead, error } = await admin
    .from('leads')
    .insert({
      nombre: nombre.trim().slice(0, 100),
      apellido: apellido.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 254),
      telefono: telefono.trim().slice(0, 20),
      campus: campus?.trim() || null,
      programa_interes: programa_interes?.trim() || null,
      horario: horario?.trim() || null,
      source: 'portal-manual',
      status: 'Nuevo Lead',
      assigned_to: user.id,
      assignment_source: 'manual',
      last_action_at: now,
      activity_id: activity_id || null,
      lead_source_text: lead_source_text?.trim() || null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Manual lead insert error:', error)
    return NextResponse.json({ error: 'Error al guardar el lead.' }, { status: 500 })
  }

  await admin.from('lead_history').insert({
    lead_id: lead.id,
    employee_id: user.id,
    action_type: 'lead_created',
    new_status: 'Nuevo Lead',
    note: `Lead ingresado manualmente por ${employee.full_name}`,
  })

  return NextResponse.json({ success: true, lead_id: lead.id }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase()
  const auth = await getAuthenticatedEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  if (auth.employee.role !== 'admin') return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const body = await request.json()
  const ids: string[] = body.ids

  if (!Array.isArray(ids) || ids.length === 0)
    return NextResponse.json({ error: 'IDs requeridos.' }, { status: 400 })

  const admin = getAdminClient()
  const { error } = await admin.from('leads').delete().in('id', ids)

  if (error) {
    console.error('[leads bulk DELETE] error:', error)
    return NextResponse.json({ error: 'Error al eliminar los leads.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: ids.length })
}
