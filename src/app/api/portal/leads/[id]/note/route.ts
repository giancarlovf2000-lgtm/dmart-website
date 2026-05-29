import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { CommunicationType } from '@/lib/types'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const VALID_COMM_TYPES: CommunicationType[] = [
  'Llamada', 'Mensaje de texto', 'Email', 'Visita presencial', 'WhatsApp', 'Otro',
]

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { communication_type, note } = body

  if (!VALID_COMM_TYPES.includes(communication_type))
    return NextResponse.json({ error: 'Tipo de comunicación inválido.' }, { status: 400 })
  if (!note || typeof note !== 'string' || note.trim().length < 20)
    return NextResponse.json({ error: 'La nota debe tener al menos 20 caracteres.' }, { status: 400 })

  const admin = getAdminClient()

  const { data: employee } = await admin
    .from('employees')
    .select('id, role, campus')
    .eq('id', user.id)
    .single()

  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { data: lead } = await admin
    .from('leads')
    .select('id, assigned_to')
    .eq('id', params.id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead no encontrado.' }, { status: 404 })

  if (employee.role !== 'admin') {
    if (employee.role === 'supervisor') {
      const { data: teamMember } = await admin
        .from('employees')
        .select('id')
        .eq('id', lead.assigned_to)
        .eq('supervisor_id', user.id)
        .single()
      if (lead.assigned_to !== user.id && !teamMember)
        return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    } else if (employee.role === 'director') {
      const { data: campusMember } = await admin.from('employees').select('id')
        .eq('id', lead.assigned_to).contains('campus', employee.campus as string[]).single()
      if (!campusMember)
        return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    } else if (lead.assigned_to !== user.id) {
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
    }
  }

  const now = new Date().toISOString()

  const [updateResult, historyResult] = await Promise.all([
    admin.from('leads').update({ last_action_at: now }).eq('id', params.id),
    admin.from('lead_history').insert({
      lead_id: params.id,
      employee_id: user.id,
      action_type: 'note_added',
      communication_type,
      note: note.trim(),
    }),
  ])

  if (updateResult.error || historyResult.error)
    return NextResponse.json({ error: 'Error al guardar la nota.' }, { status: 500 })

  return NextResponse.json({ success: true })
}
