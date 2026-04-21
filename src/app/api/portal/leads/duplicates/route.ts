import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { findDuplicatePairs, canonicalPairKey } from '@/lib/portal/duplicates'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getEmployee(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .single()
  if (!employee) return null
  return { user, employee }
}

// GET — returns all duplicate pairs with full lead data
export async function GET() {
  const supabase = await createServerSupabase()
  const auth = await getEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { user, employee } = auth
  const isAdmin = employee.role === 'admin'

  // Fetch all leads (key fields for detection + display fields)
  let leadsQuery = admin
    .from('leads')
    .select('id, nombre, apellido, email, telefono, campus, programa_interes, status, source, assigned_to, created_at, last_action_at, assignment_source')
    .range(0, 1999)
  if (!isAdmin) leadsQuery = leadsQuery.eq('assigned_to', user.id)
  const { data: leads } = await leadsQuery

  // Fetch dismissed pairs
  let dismissedQuery = admin.from('dismissed_lead_pairs').select('lead_id_a, lead_id_b')
  const { data: dismissed } = await dismissedQuery
  const dismissedSet = new Set(
    (dismissed ?? []).map((p) => canonicalPairKey(p.lead_id_a, p.lead_id_b))
  )

  const pairs = findDuplicatePairs(leads ?? [], dismissedSet)

  // Build a map of lead data for fast lookup
  const leadMap = new Map((leads ?? []).map((l) => [l.id, l]))

  // Fetch employee names for assigned_to display
  const assignedIds = Array.from(new Set((leads ?? []).map((l) => l.assigned_to).filter(Boolean)))
  let employeeNames: Record<string, string> = {}
  if (assignedIds.length > 0) {
    const { data: emps } = await admin
      .from('employees')
      .select('id, full_name')
      .in('id', assignedIds as string[])
    emps?.forEach((e) => { employeeNames[e.id] = e.full_name })
  }

  const result = pairs.map(({ key, id_a, id_b, reason }) => {
    const a = leadMap.get(id_a)
    const b = leadMap.get(id_b)
    if (!a || !b) return null
    return {
      key,
      reason,
      lead_a: { ...a, employee_name: a.assigned_to ? (employeeNames[a.assigned_to] ?? null) : null },
      lead_b: { ...b, employee_name: b.assigned_to ? (employeeNames[b.assigned_to] ?? null) : null },
    }
  }).filter((x): x is NonNullable<typeof x> => x !== null)

  return NextResponse.json({ pairs: result })
}

// POST — dismiss a pair as not duplicates
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const auth = await getEmployee(supabase)
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { lead_id_a, lead_id_b } = body
  if (!lead_id_a || !lead_id_b)
    return NextResponse.json({ error: 'IDs requeridos.' }, { status: 400 })

  const [a, b] = [lead_id_a, lead_id_b].sort()

  const admin = getAdminClient()
  const { error } = await admin.from('dismissed_lead_pairs').upsert({
    lead_id_a: a,
    lead_id_b: b,
    dismissed_by: auth.user.id,
  }, { onConflict: 'lead_id_a,lead_id_b' })

  if (error) {
    console.error('[dismiss pair]', error)
    return NextResponse.json({ error: 'Error al descartar el par.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
