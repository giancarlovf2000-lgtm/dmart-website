import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function getEmployee() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('id, role, campus').eq('id', user.id).eq('active', true).single()
  if (!emp) return null
  return { user, emp, admin }
}

export async function POST(request: NextRequest) {
  const auth = await getEmployee()
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  const { user, admin } = auth

  const body = await request.json()
  const {
    program, scenario, student_name, student_phone, student_email,
    program_payment, equipment_option,
    initial_payment, weekly_total, total_contract,
    start_date, campus, contract_html,
  } = body

  if (!program || !student_name || !program_payment || !equipment_option)
    return NextResponse.json({ error: 'Faltan campos requeridos.' }, { status: 400 })

  const { data, error } = await admin.from('private_contracts').insert({
    employee_id: user.id,
    program,
    scenario: Number(scenario),
    student_name: String(student_name).trim(),
    student_phone: student_phone?.trim() || null,
    student_email: student_email?.trim().toLowerCase() || null,
    program_payment,
    equipment_option,
    initial_payment: Number(initial_payment),
    weekly_total: Number(weekly_total),
    total_contract: Number(total_contract),
    start_date: start_date || null,
    campus: campus || null,
    contract_html: typeof contract_html === 'string' ? contract_html : null,
  }).select('id').single()

  if (error) {
    console.error('[private-contracts POST]', error)
    return NextResponse.json({ error: 'Error al guardar el contrato.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: data.id }, { status: 201 })
}

export async function GET() {
  const auth = await getEmployee()
  if (!auth) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
  const { user, emp, admin } = auth

  // Lista ligera (sin el HTML pesado del contrato).
  let query = admin
    .from('private_contracts')
    .select('id, employee_id, program, scenario, student_name, initial_payment, weekly_total, total_contract, start_date, campus, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (emp.role === 'admin') {
    // no filter
  } else if (emp.role === 'supervisor') {
    const { data: team } = await admin.from('employees').select('id').eq('supervisor_id', user.id)
    const teamIds = (team ?? []).map((e: { id: string }) => e.id)
    query = query.in('employee_id', [user.id, ...teamIds])
  } else if (emp.role === 'director') {
    const directorCampus = (emp.campus as string[])[0]
    if (directorCampus) {
      const { data: campusTeam } = await admin.from('employees').select('id').contains('campus', [directorCampus]).eq('active', true)
      const campusIds = (campusTeam ?? []).map((e: { id: string }) => e.id)
      query = query.in('employee_id', campusIds)
    } else {
      query = query.eq('employee_id', user.id)
    }
  } else {
    query = query.eq('employee_id', user.id)
  }

  const { data: contracts, error } = await query
  if (error) return NextResponse.json({ error: 'Error al obtener contratos.' }, { status: 500 })

  // Join employee names
  const empIds = Array.from(new Set((contracts ?? []).map((c) => c.employee_id)))
  const empMap = new Map<string, string>()
  if (empIds.length > 0) {
    const { data: emps } = await admin.from('employees').select('id, full_name').in('id', empIds)
    ;(emps ?? []).forEach((e) => empMap.set(e.id, e.full_name))
  }

  const result = (contracts ?? []).map((c) => ({
    ...c,
    employee_name: empMap.get(c.employee_id) ?? '—',
  }))

  return NextResponse.json({ contracts: result })
}
