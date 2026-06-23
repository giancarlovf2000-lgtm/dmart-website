import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { canAccessLeadCampus } from '@/lib/portal/leadAccess'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  const { data: employee } = await admin
    .from('employees')
    .select('id, role, campus')
    .eq('id', user.id)
    .single()

  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('*, employee:assigned_to(full_name), activity:activity_id(name)')
    .eq('id', params.id)
    .single()

  if (leadError || !lead)
    return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })

  // Access check: admin ve todo; el resto ve los leads de su(s) recinto(s).
  if (!canAccessLeadCampus(employee, lead.campus))
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { data: history } = await admin
    .from('lead_history')
    .select('*, employee:employee_id(full_name)')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  // Empleados a los que se puede reasignar: admin → todos; el resto → colegas de su(s) recinto(s).
  let assignableEmployees: { id: string; full_name: string }[] = []
  if (employee.role === 'admin') {
    const { data: all } = await admin.from('employees').select('id, full_name').eq('active', true).order('full_name')
    assignableEmployees = all ?? []
  } else {
    const { data: campusEmps } = await admin.from('employees').select('id, full_name')
      .overlaps('campus', employee.campus as string[]).eq('active', true).order('full_name')
    assignableEmployees = campusEmps ?? []
  }

  return NextResponse.json({ lead, history: history ?? [], currentEmployeeRole: employee.role, assignableEmployees })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const admin = getAdminClient()

  const { data: employee } = await admin.from('employees').select('id, role, full_name, campus').eq('id', user.id).single()
  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  // ── Reassignment ────────────────────────────────────────────────────────────
  if (body.assigned_to !== undefined) {
    const newAssignee: string = body.assigned_to

    if (employee.role !== 'admin') {
      // No-admin solo puede reasignar a un empleado activo que comparta su(s) recinto(s).
      const { data: campusCheck } = await admin.from('employees').select('id')
        .eq('id', newAssignee).eq('active', true).overlaps('campus', employee.campus as string[]).single()
      if (!campusCheck) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    const { data: targetEmp } = await admin.from('employees').select('full_name').eq('id', newAssignee).single()

    const { error } = await admin.from('leads').update({ assigned_to: newAssignee, last_action_at: new Date().toISOString() }).eq('id', params.id)
    if (error) return NextResponse.json({ error: 'Error al reasignar el lead.' }, { status: 500 })

    await admin.from('lead_history').insert({
      lead_id: params.id,
      employee_id: user.id,
      action_type: 'lead_assigned',
      note: `Lead reasignado a ${targetEmp?.full_name ?? newAssignee} por ${employee.full_name}`,
    })

    return NextResponse.json({ success: true })
  }

  // ── Contact / profile info update ──
  if (body.telefono !== undefined || body.email !== undefined ||
      body.campus !== undefined || body.programa_interes !== undefined || body.horario !== undefined ||
      body.nombre !== undefined || body.apellido !== undefined || body.start_date !== undefined) {
    // Verify this employee has access to the lead (por recinto)
    const { data: lead } = await admin.from('leads')
      .select('assigned_to, campus, nombre, apellido, start_date').eq('id', params.id).single()
    if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })

    if (!canAccessLeadCampus(employee, lead.campus))
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

    const updates: Record<string, unknown> = { last_action_at: new Date().toISOString() }
    const changes: string[] = []

    // Nombre / apellido — se registra el cambio de qué a qué.
    if (body.nombre !== undefined || body.apellido !== undefined) {
      const newNombre = body.nombre !== undefined ? String(body.nombre).trim().slice(0, 100) : lead.nombre
      const newApellido = body.apellido !== undefined ? String(body.apellido).trim().slice(0, 100) : lead.apellido
      const oldFull = `${lead.nombre} ${lead.apellido}`.trim()
      const newFull = `${newNombre} ${newApellido}`.trim()
      if (newNombre.length >= 1 && newApellido.length >= 1 && newFull !== oldFull) {
        updates.nombre = newNombre
        updates.apellido = newApellido
        changes.push(`Nombre actualizado: "${oldFull}" → "${newFull}"`)
      }
    }

    // Fecha de comienzo — editable, se registra el cambio.
    if (body.start_date !== undefined) {
      const val = String(body.start_date).trim()
      const newDate = val || null
      if (newDate !== (lead.start_date ?? null)) {
        updates.start_date = newDate
        changes.push(`Fecha de comienzo: ${lead.start_date ?? '—'} → ${newDate ?? '—'}`)
      }
    }

    if (body.telefono !== undefined) {
      const tel = String(body.telefono).trim()
      updates.telefono = tel
      changes.push(`Teléfono actualizado a ${tel}`)
    }
    if (body.email !== undefined) {
      const em = String(body.email).trim().toLowerCase()
      updates.email = em || null
      if (em) changes.push(`Correo actualizado a ${em}`)
    }
    if (body.campus !== undefined) {
      const val = String(body.campus).trim()
      updates.campus = val || null
      if (val) changes.push(`Recinto actualizado a ${val}`)
    }
    if (body.programa_interes !== undefined) {
      const val = String(body.programa_interes).trim()
      updates.programa_interes = val || null
      if (val) changes.push(`Programa actualizado a ${val}`)
    }
    if (body.horario !== undefined) {
      const val = String(body.horario).trim()
      updates.horario = val || null
      if (val) changes.push(`Horario actualizado a ${val}`)
    }

    if (changes.length === 0)
      return NextResponse.json({ success: true })

    const { error } = await admin.from('leads').update(updates).eq('id', params.id)
    if (error) return NextResponse.json({ error: 'Error al actualizar el lead.' }, { status: 500 })

    await admin.from('lead_history').insert({
      lead_id: params.id,
      employee_id: user.id,
      action_type: 'note_added',
      note: changes.join(' · '),
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  const { data: employee } = await admin
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!employee || employee.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  const { error } = await admin
    .from('leads')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('[leads DELETE] error:', error)
    return NextResponse.json({ error: 'Error al eliminar el lead.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
