import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function nextMonth(month: string): string {
  const d = new Date(month + 'T00:00:00')
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

    const admin = getAdminClient()

    const { data: selfEmp } = await admin.from('employees').select('role').eq('id', user.id).single()
    if (!selfEmp || selfEmp.role !== 'admin')
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    if (!month) return NextResponse.json({ error: 'El mes es requerido.' }, { status: 400 })

    const monthEnd = nextMonth(month)

    // Fetch everything in parallel
    const [employeesRes, leadsRes, activitiesRes, reportsRes] = await Promise.all([
      admin.from('employees').select('id, full_name, campus, role, active').order('full_name'),
      admin.from('leads')
        .select('assigned_to, status')
        .gte('created_at', month)
        .lt('created_at', monthEnd)
        .not('assigned_to', 'is', null),
      admin.from('activities').select('*').eq('month', month),
      admin.from('monthly_reports')
        .select('employee_id, performance_score, leads_acquired, leads_enrolled, activities_completed, notes')
        .eq('month', month)
        .eq('report_type', 'performance'),
    ])

    const employees = (employeesRes.data ?? []).filter((e) => e.role !== 'admin')
    const leads = leadsRes.data ?? []
    const activities = activitiesRes.data ?? []
    const reports = reportsRes.data ?? []

    // Build lookups
    const reportMap = new Map(reports.map((r) => [r.employee_id, r]))

    // Count leads per employee
    const leadsCountMap = new Map<string, number>()
    const matriculadosMap = new Map<string, number>()
    leads.forEach((l) => {
      if (!l.assigned_to) return
      leadsCountMap.set(l.assigned_to, (leadsCountMap.get(l.assigned_to) ?? 0) + 1)
      if (l.status === 'Matriculado') {
        matriculadosMap.set(l.assigned_to, (matriculadosMap.get(l.assigned_to) ?? 0) + 1)
      }
    })

    // Group activities per employee
    const activitiesMap = new Map<string, typeof activities>()
    activities.forEach((a) => {
      if (!activitiesMap.has(a.employee_id)) activitiesMap.set(a.employee_id, [])
      activitiesMap.get(a.employee_id)!.push(a)
    })

    const employeeStats = employees.map((emp) => {
      const empActivities = activitiesMap.get(emp.id) ?? []
      const report = reportMap.get(emp.id) ?? null
      return {
        id: emp.id,
        full_name: emp.full_name,
        campus: emp.campus,
        active: emp.active,
        leads_count: leadsCountMap.get(emp.id) ?? 0,
        matriculados_count: matriculadosMap.get(emp.id) ?? 0,
        activities_planned: empActivities.length,
        activities_completed: empActivities.filter((a) => a.status === 'terminada').length,
        activities: empActivities,
        report_submitted: !!report,
        performance_score: report?.performance_score ?? null,
        report_notes: report?.notes ?? null,
      }
    })

    const totals = {
      total_leads: leads.length,
      total_matriculados: leads.filter((l) => l.status === 'Matriculado').length,
      total_activities_planned: activities.length,
      total_activities_completed: activities.filter((a) => a.status === 'terminada').length,
      reports_submitted: reports.length,
      total_employees: employees.length,
    }

    return NextResponse.json({ month, totals, employees: employeeStats })
  } catch (err) {
    console.error('[admin/summary] error:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
