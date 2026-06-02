import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { data: caller } = await admin.from('employees').select('id, role, campus').eq('id', user.id).single()
  if (!caller || !['admin', 'director'].includes(caller.role))
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const supervisorId = searchParams.get('supervisor_id')
  const month = searchParams.get('month')

  if (!supervisorId || !month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Parámetros inválidos.' }, { status: 400 })

  // Directors can only view supervisors from their campus
  if (caller.role === 'director') {
    const directorCampus = (caller.campus as string[])[0]
    if (directorCampus) {
      const { data: emp } = await admin.from('employees').select('id')
        .eq('id', supervisorId).contains('campus', [directorCampus]).single()
      if (!emp) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }
  }

  const { data: changes, error } = await admin
    .from('supervisor_plan_changes')
    .select('id, day, old_value, new_value, changed_at')
    .eq('supervisor_id', supervisorId)
    .eq('plan_month', month)
    .order('changed_at', { ascending: false })

  if (error) return NextResponse.json({ error: 'Error al obtener historial.' }, { status: 500 })

  return NextResponse.json({ changes: changes ?? [] })
}
