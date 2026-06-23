import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { canAccessLeadCampus } from '@/lib/portal/leadAccess'
import { resolveCommunicationType, autoCompleteDueFollowups } from '@/lib/portal/followups'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { communication_type, note } = body

  if (!note || typeof note !== 'string' || note.trim().length < 20)
    return NextResponse.json({ error: 'La nota debe tener al menos 20 caracteres.' }, { status: 400 })

  const admin = getAdminClient()

  const commType = await resolveCommunicationType(admin, communication_type)
  if (!commType)
    return NextResponse.json({ error: 'Tipo de comunicación inválido.' }, { status: 400 })

  const { data: employee } = await admin
    .from('employees')
    .select('id, role, campus')
    .eq('id', user.id)
    .single()

  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data: lead } = await admin
    .from('leads')
    .select('id, assigned_to, campus')
    .eq('id', params.id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })

  if (!canAccessLeadCampus(employee, lead.campus))
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const now = new Date().toISOString()

  const [updateResult, historyResult] = await Promise.all([
    admin.from('leads').update({ last_action_at: now }).eq('id', params.id),
    admin.from('lead_history').insert({
      lead_id: params.id,
      employee_id: user.id,
      action_type: 'note_added',
      communication_type: commType,
      note: note.trim(),
    }),
  ])

  if (updateResult.error || historyResult.error)
    return NextResponse.json({ error: 'Error al guardar la nota.' }, { status: 500 })

  // Cierre automático de follow-ups vencidos al registrar actividad.
  await autoCompleteDueFollowups(admin, params.id, user.id)

  return NextResponse.json({ success: true })
}
