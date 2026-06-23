import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { canAccessLeadCampus } from '@/lib/portal/leadAccess'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Marcar un follow-up como completado o cancelado.
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; fid: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees').select('id, role, campus').eq('id', user.id).single()
  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data: lead } = await admin.from('leads').select('id, campus').eq('id', params.id).single()
  if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })
  if (!canAccessLeadCampus(employee, lead.campus))
    return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })

  const body = await request.json()
  const status = String(body.status ?? '')
  if (status !== 'completado' && status !== 'cancelado')
    return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })

  const { error } = await admin.from('lead_followups')
    .update({ status, completed_at: new Date().toISOString(), completed_by: user.id })
    .eq('id', params.fid)
    .eq('lead_id', params.id)
  if (error) return NextResponse.json({ error: 'Error al actualizar el follow-up.' }, { status: 500 })

  await admin.from('lead_history').insert({
    lead_id: params.id,
    employee_id: user.id,
    action_type: 'followup_done',
    note: status === 'completado' ? 'Follow-up marcado como hecho' : 'Follow-up cancelado',
  })

  return NextResponse.json({ success: true })
}
