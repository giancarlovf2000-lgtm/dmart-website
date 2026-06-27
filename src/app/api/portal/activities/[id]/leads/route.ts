import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Devuelve los leads ligados a una actividad (para "ver los leads generados").
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('id, role, campus').eq('id', user.id).single()
  if (!emp) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data: activity } = await admin.from('activities').select('id, employee_id').eq('id', params.id).single()
  if (!activity) return NextResponse.json({ error: 'Actividad no encontrada.' }, { status: 404 })

  // Acceso: dueño, admin, supervisor del dueño, o director del recinto del dueño.
  let allowed = emp.role === 'admin' || activity.employee_id === user.id
  if (!allowed && emp.role === 'supervisor') {
    const { data: m } = await admin.from('employees').select('id').eq('id', activity.employee_id).eq('supervisor_id', user.id).single()
    allowed = !!m
  }
  if (!allowed && emp.role === 'director') {
    const { data: m } = await admin.from('employees').select('id').eq('id', activity.employee_id).contains('campus', emp.campus as string[]).single()
    allowed = !!m
  }
  if (!allowed) return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const { data: leads } = await admin
    .from('leads')
    .select('id, nombre, apellido, telefono, programa_interes, campus, status, created_at, assignment_source')
    .eq('activity_id', params.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ leads: leads ?? [] })
}
