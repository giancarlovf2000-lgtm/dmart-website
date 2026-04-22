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
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('[admin/reports] no user:', userError)
      return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })
    }

    const admin = getAdminClient()

    const { data: selfEmployee, error: empError } = await admin
      .from('employees')
      .select('role')
      .eq('id', user.id)
      .single()

    if (empError || !selfEmployee) {
      console.error('[admin/reports] employee lookup error:', empError, 'user id:', user.id)
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    if (selfEmployee.role !== 'admin') {
      console.error('[admin/reports] not admin, role:', selfEmployee.role)
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }

    // Fetch reports and employees in parallel
    const [reportsRes, employeesRes] = await Promise.all([
      admin.from('monthly_reports').select('*').eq('report_type', 'performance').order('month', { ascending: false }),
      admin.from('employees').select('id, full_name, campus'),
    ])

    if (reportsRes.error) {
      console.error('[admin/reports] query error:', reportsRes.error)
      return NextResponse.json({ error: 'Error al obtener los informes.' }, { status: 500 })
    }

    console.log('[admin/reports] found:', reportsRes.data?.length ?? 0, 'reports')

    const empMap = new Map<string, { full_name: string; campus: string[] }>()
    ;(employeesRes.data ?? []).forEach((e) => empMap.set(e.id, { full_name: e.full_name, campus: e.campus }))

    const reports = (reportsRes.data ?? []).map((r) => ({
      ...r,
      employee: empMap.get(r.employee_id) ?? null,
    }))

    return NextResponse.json({ reports })
  } catch (err) {
    console.error('[admin/reports] unexpected error:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
