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

export async function GET(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const month = request.nextUrl.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Mes inválido.' }, { status: 400 })

  const admin = getAdminClient()

  // Get all supervisor/director plans for this month
  const { data: plans, error } = await admin
    .from('supervisor_monthly_plans')
    .select('supervisor_id, plan_month, notes')
    .eq('plan_month', month)

  if (error) return NextResponse.json({ error: 'Error al obtener calendarios.' }, { status: 500 })

  if (!plans || plans.length === 0) return NextResponse.json({ plans: [] })

  // Fetch employee info for each plan
  const supervisorIds = plans.map((p) => p.supervisor_id)
  const { data: employees } = await admin
    .from('employees')
    .select('id, full_name, role, campus')
    .in('id', supervisorIds)

  const empMap = new Map((employees ?? []).map((e) => [e.id, e]))

  const result = plans.map((p) => {
    const emp = empMap.get(p.supervisor_id)
    return {
      supervisor_id: p.supervisor_id,
      full_name: emp?.full_name ?? 'Desconocido',
      role: emp?.role ?? 'supervisor',
      campus: emp?.campus ?? [],
      plan_month: p.plan_month,
      notes: p.notes ?? {},
    }
  })

  return NextResponse.json({ plans: result })
}
