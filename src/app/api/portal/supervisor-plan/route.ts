import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// El calendario de planificación es individual por empleado: cualquier empleado
// activo puede leer/guardar su propio plan (la columna supervisor_id guarda el id
// del empleado dueño del plan).
async function requireEmployee() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees')
    .select('id, active')
    .eq('id', user.id)
    .single()
  if (!employee || !employee.active) return null
  return user
}

export async function GET(request: NextRequest) {
  const user = await requireEmployee()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const month = request.nextUrl.searchParams.get('month')
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Mes inválido.' }, { status: 400 })

  const admin = getAdminClient()
  const { data } = await admin
    .from('supervisor_monthly_plans')
    .select('notes, social_programs')
    .eq('supervisor_id', user.id)
    .eq('plan_month', month)
    .single()

  return NextResponse.json({ notes: data?.notes ?? {}, social_programs: data?.social_programs ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await requireEmployee()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { month, notes, social_programs } = body
  if (!month || !/^\d{4}-\d{2}$/.test(month))
    return NextResponse.json({ error: 'Mes inválido.' }, { status: 400 })
  if (!notes || typeof notes !== 'object')
    return NextResponse.json({ error: 'Notas inválidas.' }, { status: 400 })

  // Programas solicitados para apoyo en redes (opcional): solo strings, máx. 50.
  const socialPrograms = Array.isArray(social_programs)
    ? social_programs.filter((p: unknown): p is string => typeof p === 'string').slice(0, 50)
    : undefined

  const admin = getAdminClient()

  // Fetch current notes to compute diff before overwriting
  const { data: current } = await admin
    .from('supervisor_monthly_plans')
    .select('notes')
    .eq('supervisor_id', user.id)
    .eq('plan_month', month)
    .single()
  const oldNotes: Record<string, string> = (current?.notes as Record<string, string>) ?? {}

  const { error } = await admin
    .from('supervisor_monthly_plans')
    .upsert(
      {
        supervisor_id: user.id, plan_month: month, notes, updated_at: new Date().toISOString(),
        ...(socialPrograms !== undefined ? { social_programs: socialPrograms } : {}),
      },
      { onConflict: 'supervisor_id,plan_month' }
    )

  if (error) return NextResponse.json({ error: 'Error al guardar.' }, { status: 500 })

  // Log per-day changes for audit trail
  const incomingNotes = notes as Record<string, string>
  const allDays = Array.from(new Set([...Object.keys(oldNotes), ...Object.keys(incomingNotes)]))
  const changeRows: object[] = []
  for (const dayStr of allDays) {
    const oldVal = (oldNotes[dayStr] ?? '').trim()
    const newVal = (incomingNotes[dayStr] ?? '').trim()
    if (oldVal !== newVal) {
      changeRows.push({
        supervisor_id: user.id,
        plan_month: month,
        day: Number(dayStr),
        old_value: oldVal || null,
        new_value: newVal || null,
      })
    }
  }
  if (changeRows.length > 0) {
    await admin.from('supervisor_plan_changes').insert(changeRows)
  }

  return NextResponse.json({ success: true })
}
