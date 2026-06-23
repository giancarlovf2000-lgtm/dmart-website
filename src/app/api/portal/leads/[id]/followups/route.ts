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

async function authAndAccess(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  leadId: string
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado.', status: 401 as const }
  const admin = getAdminClient()
  const { data: employee } = await admin
    .from('employees').select('id, role, campus').eq('id', user.id).single()
  if (!employee) return { error: 'No autorizado.', status: 401 as const }
  const { data: lead } = await admin.from('leads').select('id, campus').eq('id', leadId).single()
  if (!lead) return { error: 'Lead no encontrado.', status: 404 as const }
  if (!canAccessLeadCampus(employee, lead.campus))
    return { error: 'No autorizado.', status: 403 as const }
  return { user, admin }
}

// Lista de follow-ups del lead.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const ctx = await authAndAccess(supabase, params.id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const { data, error } = await ctx.admin
    .from('lead_followups')
    .select('*, employee:employee_id(full_name)')
    .eq('lead_id', params.id)
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: 'Error al obtener follow-ups.' }, { status: 500 })
  return NextResponse.json({ followups: data ?? [] })
}

// Programar un follow-up.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const ctx = await authAndAccess(supabase, params.id)
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: ctx.status })

  const body = await request.json()
  const dueDate = String(body.due_date ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
    return NextResponse.json({ error: 'Fecha inválida.' }, { status: 400 })
  const note = body.note ? String(body.note).trim().slice(0, 500) : null

  const { error } = await ctx.admin.from('lead_followups').insert({
    lead_id: params.id,
    employee_id: ctx.user.id,
    due_date: dueDate,
    note,
  })
  if (error) return NextResponse.json({ error: 'Error al programar el follow-up.' }, { status: 500 })

  await ctx.admin.from('lead_history').insert({
    lead_id: params.id,
    employee_id: ctx.user.id,
    action_type: 'followup_scheduled',
    note: `Follow-up programado para ${dueDate}${note ? ` — ${note}` : ''}`,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
