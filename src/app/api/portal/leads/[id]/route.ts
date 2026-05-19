import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

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
    .select('id, role')
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

  // Access check: admin sees all; supervisor sees own + team; employee sees own
  if (employee.role !== 'admin') {
    if (employee.role === 'supervisor') {
      const { data: teamMember } = await admin
        .from('employees')
        .select('id')
        .eq('id', lead.assigned_to)
        .eq('supervisor_id', user.id)
        .single()
      if (lead.assigned_to !== user.id && !teamMember)
        return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    } else if (lead.assigned_to !== user.id) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }
  }

  const { data: history } = await admin
    .from('lead_history')
    .select('*, employee:employee_id(full_name)')
    .eq('lead_id', params.id)
    .order('created_at', { ascending: false })

  // Build list of employees this user can reassign to
  let assignableEmployees: { id: string; full_name: string }[] = []
  if (employee.role === 'admin') {
    const { data: all } = await admin.from('employees').select('id, full_name').eq('active', true).order('full_name')
    assignableEmployees = all ?? []
  } else if (employee.role === 'supervisor') {
    const { data: team } = await admin.from('employees').select('id, full_name').eq('supervisor_id', user.id).eq('active', true).order('full_name')
    const { data: self } = await admin.from('employees').select('id, full_name').eq('id', user.id).single()
    assignableEmployees = [self, ...(team ?? [])].filter(Boolean) as { id: string; full_name: string }[]
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
  const { assigned_to: newAssignee } = body
  if (!newAssignee) return NextResponse.json({ error: 'assigned_to es requerido.' }, { status: 400 })

  const admin = getAdminClient()

  const { data: employee } = await admin.from('employees').select('id, role, full_name').eq('id', user.id).single()
  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  // Validate the target assignee is accessible to this user
  if (employee.role !== 'admin') {
    if (employee.role === 'supervisor') {
      if (newAssignee !== user.id) {
        const { data: teamCheck } = await admin.from('employees').select('id').eq('id', newAssignee).eq('supervisor_id', user.id).single()
        if (!teamCheck) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }
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
