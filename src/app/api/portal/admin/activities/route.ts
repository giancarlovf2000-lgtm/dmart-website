import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

    const admin = getAdminClient()

    const { data: selfEmployee } = await admin.from('employees').select('role').eq('id', user.id).single()
    if (!selfEmployee || selfEmployee.role !== 'admin')
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    let query = admin
      .from('activities')
      .select('*')
      .order('month', { ascending: false })
      .order('created_at', { ascending: false })

    if (month) query = query.eq('month', month)

    const { data: activities, error } = await query
    if (error) {
      console.error('[admin/activities] error:', error)
      return NextResponse.json({ error: 'Error al obtener actividades.' }, { status: 500 })
    }

    // Fetch employee names
    const empIds = Array.from(new Set((activities ?? []).map((a) => a.employee_id)))
    const empMap = new Map<string, string>()
    if (empIds.length > 0) {
      const { data: emps } = await admin.from('employees').select('id, full_name').in('id', empIds)
      ;(emps ?? []).forEach((e) => empMap.set(e.id, e.full_name))
    }

    const result = (activities ?? []).map((a) => ({
      ...a,
      employee_name: empMap.get(a.employee_id) ?? null,
    }))

    return NextResponse.json({ activities: result })
  } catch (err) {
    console.error('[admin/activities] unexpected error:', err)
    return NextResponse.json({ error: 'Error interno.' }, { status: 500 })
  }
}
