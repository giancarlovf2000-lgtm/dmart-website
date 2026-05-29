import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function nextMonthStart(month: string): string {
  const d = new Date(month + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  const { data: selfEmp } = await admin
    .from('employees')
    .select('id, role, full_name, campus')
    .eq('id', user.id)
    .single()

  if (!selfEmp || !['supervisor', 'director', 'admin'].includes(selfEmp.role))
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })

  const monthEnd = nextMonthStart(month)

  // Get team members
  let teamQuery = admin.from('employees').select('id, full_name, campus').eq('active', true)
  if (selfEmp.role === 'supervisor') {
    teamQuery = teamQuery.eq('supervisor_id', user.id)
  } else if (selfEmp.role === 'director') {
    const directorCampus = (selfEmp.campus as string[])[0]
    teamQuery = directorCampus
      ? teamQuery.contains('campus', [directorCampus]).neq('id', user.id)
      : teamQuery.eq('id', user.id)
  } else {
    // Admin: no restriction
    teamQuery = teamQuery.neq('role', 'admin')
  }
  const { data: supervisedMembers } = await teamQuery

  const teamMembers = [
    { id: selfEmp.id, full_name: selfEmp.full_name, campus: [] as string[] },
    ...(supervisedMembers ?? []),
  ]
  const teamIds = teamMembers.map((m) => m.id)

  if (teamIds.length === 0)
    return NextResponse.json({ month, supervisor_name: selfEmp.full_name, team_members: [], leads: [], activities: [] })

  // Fetch leads + activities in parallel
  const [leadsRes, activitiesRes] = await Promise.all([
    admin
      .from('leads')
      .select('id, nombre, apellido, telefono, email, campus, programa_interes, horario, source, lead_source_text, assignment_source, status, created_at, last_action_at, activity_id, assigned_to, employee:assigned_to(full_name), activity:activity_id(name)')
      .in('assigned_to', teamIds)
      .gte('created_at', month)
      .lt('created_at', monthEnd)
      .order('assigned_to')
      .order('created_at'),
    admin
      .from('activities')
      .select('id, employee_id, name, type, activity_date, location, planned_leads, actual_leads, status, employee:employee_id(full_name)')
      .in('employee_id', teamIds)
      .eq('month', month)
      .order('employee_id')
      .order('activity_date'),
  ])

  const rawLeads = leadsRes.data ?? []
  const leadIds = rawLeads.map((l) => l.id)

  // Fetch history for those leads in the month range
  const historyRes = leadIds.length > 0
    ? await admin
        .from('lead_history')
        .select('lead_id, action_type, old_status, new_status, note, communication_type, created_at, employee:employee_id(full_name)')
        .in('lead_id', leadIds)
        .gte('created_at', month)
        .lt('created_at', monthEnd)
        .order('created_at')
    : { data: [] }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const historyByLead = new Map<string, any[]>()
  for (const h of (historyRes.data ?? []) as any[]) {
    if (!historyByLead.has(h.lead_id)) historyByLead.set(h.lead_id, [])
    historyByLead.get(h.lead_id)!.push(h)
  }

  const leads = rawLeads.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    apellido: l.apellido,
    telefono: l.telefono,
    email: l.email,
    campus: l.campus,
    programa_interes: l.programa_interes,
    horario: l.horario,
    source: l.source,
    lead_source_text: l.lead_source_text,
    assignment_source: l.assignment_source,
    status: l.status,
    created_at: l.created_at,
    last_action_at: l.last_action_at,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rep_name: (l.employee as any)?.full_name ?? '—',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activity_name: (l.activity as any)?.name ?? null,
    history: (historyByLead.get(l.id) ?? []).map((h) => ({
      action_type: h.action_type,
      old_status: h.old_status,
      new_status: h.new_status,
      note: h.note,
      communication_type: h.communication_type,
      created_at: h.created_at,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      employee_name: (h.employee as any)?.full_name ?? null,
    })),
  }))

  const activities = (activitiesRes.data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    activity_date: a.activity_date,
    location: a.location,
    planned_leads: a.planned_leads,
    actual_leads: a.actual_leads,
    status: a.status,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rep_name: (a.employee as any)?.full_name ?? '—',
  }))

  // Update team_members with actual supervisor's campus from their own employee record
  const { data: supervisorFull } = await admin.from('employees').select('campus').eq('id', user.id).single()
  teamMembers[0].campus = supervisorFull?.campus ?? []

  return NextResponse.json({
    month,
    supervisor_name: selfEmp.full_name,
    team_members: teamMembers,
    leads,
    activities,
  })
}
