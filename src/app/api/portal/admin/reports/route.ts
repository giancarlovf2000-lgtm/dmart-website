import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  // Verify admin role
  const { data: selfEmployee } = await admin.from('employees').select('role').eq('id', user.id).single()
  if (!selfEmployee || selfEmployee.role !== 'admin')
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  // Fetch all performance reports and all employees in parallel
  const [reportsRes, employeesRes] = await Promise.all([
    admin
      .from('monthly_reports')
      .select('id, employee_id, month, report_type, leads_acquired, leads_contacted, leads_enrolled, activities_completed, performance_score, notes, created_at')
      .eq('report_type', 'performance')
      .order('month', { ascending: false })
      .order('created_at', { ascending: false }),
    admin
      .from('employees')
      .select('id, full_name, campus'),
  ])

  if (reportsRes.error) {
    console.error('[admin/reports] reports error:', reportsRes.error)
    return NextResponse.json({ error: 'Error al obtener los informes.' }, { status: 500 })
  }

  // Build employee lookup map
  const empMap = new Map<string, { full_name: string; campus: string[] }>()
  ;(employeesRes.data ?? []).forEach((e) => empMap.set(e.id, { full_name: e.full_name, campus: e.campus }))

  // Merge
  const reports = (reportsRes.data ?? []).map((r) => ({
    ...r,
    employee: empMap.get(r.employee_id) ?? null,
  }))

  return NextResponse.json({ reports })
}
