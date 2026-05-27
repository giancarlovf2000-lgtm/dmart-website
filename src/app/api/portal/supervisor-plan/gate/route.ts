import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { checkSupervisorPlanningGate } from '@/lib/portal/planningGate'

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
  const { data: employee } = await admin
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (!employee || employee.role !== 'supervisor') {
    return NextResponse.json({ required: false, complete: true, calendarDays: 0, activitiesCount: 0 })
  }

  const result = await checkSupervisorPlanningGate(employee.id, admin)
  return NextResponse.json(result)
}
