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
    .select('id, full_name, role, active, campus')
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

  if (employee.role === 'admin') {
    // no filter — sees all leads
  } else if (employee.role === 'supervisor') {
    const { data: team } = await admin.from('employees').select('id').eq('supervisor_id', user.id)
    const teamIds = (team ?? []).map((e: { id: string }) => e.id)
    const allIds = [user.id, ...teamIds]
    query = query.in('assigned_to', allIds)
  } else if (employee.role === 'director') {
    const directorCampus = (employee.campus as string[])[0]
    if (directorCampus) {
      const { data: campusTeam } = await admin.from('employees').select('id').contains('campus', [directorCampus]).eq('active', true)
      const campusIds = (campusTeam ?? []).map((e: { id: string }) => e.id)
      query = query.in('assigned_to', campusIds)
    } else {
      query = query.eq('assigned_to', user.id)
    }
  } else {
    query = query.eq('assigned_to', user.id)
  }
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
    activity_id, lead_source_text, assigned_to: requestedAssignee,
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

  // Supervisors and admins can assign to a different employee
  let finalAssignee = user.id
  if (requestedAssignee && requestedAssignee !== user.id) {
    if (employee.role === 'admin') {
      finalAssignee = requestedAssignee
    } else if (employee.role === 'supervisor') {
      const { data: teamCheck } = await admin
        .from('employees')
        .select('id')
        .eq('id', requestedAssignee)
        .eq('supervisor_id', user.id)
        .single()
      if (teamCheck) finalAssignee = requestedAssignee
    }
  }

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
      assigned_to: finalAssignee,
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
