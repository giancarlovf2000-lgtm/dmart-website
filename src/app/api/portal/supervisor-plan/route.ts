import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireSupervisor() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('id, role')
    .eq('id', user.id)
    .single()
  if (!employee || employee.role !== 'supervisor') return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireSupervisor()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const month = request.nextUrl.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Mes inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data } = await admin
    .from('supervisor_monthly_plans')
    .select('notes')
    .eq('supervisor_id', user.id)
    .eq('plan_month', month)
    .single()

  return NextResponse.json({ notes: data?.notes ?? {} })
}

export async function POST(request: NextRequest) {
  const user = await requireSupervisor()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { month, notes } = body
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Mes inválido.' }, { status: 400 })
  if (!notes || typeof notes !== 'object')
    return NextResponse.json({ error: 'Notas inválidas.' }, { status: 400 })

  const admin = getAdminClient()
  const { error } = await admin
    .from('supervisor_monthly_plans')
    .upsert(
      { supervisor_id: user.id, plan_month: month, notes, updated_at: new Date().toISOString() },
      { onConflict: 'supervisor_id,plan_month' }
    )

  if (error) return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
