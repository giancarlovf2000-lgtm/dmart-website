import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import type { LeadStatus } from '@/lib/types'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Higher number = more advanced status
const STATUS_PRIORITY: Record<string, number> = {
  'Matriculado': 12,
  'Orientado (En Proceso de Matricularse)': 11,
  'En Espera de Documentos': 10,
  'Cita Programada': 9,
  'Reagendado': 8,
  'No Asistió a la Cita': 7,
  'Contacto Establecido': 6,
  'Contacto Inicial (Pendiente de Respuesta)': 5,
  'Seguimiento a Futuro': 4,
  'Nuevo Lead': 3,
  'Crítico': 2,
  'Desinteresado / Rechazado': 1,
}

function pickField(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return a.length >= b.length ? a : b
}

function mergePrograms(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) return a
  // Combine unique programs
  const parts = [
    ...a.split(/[,·\n]+/).map((s) => s.trim()).filter(Boolean),
    ...b.split(/[,·\n]+/).map((s) => s.trim()).filter(Boolean),
  ]
  const seen = new Map<string, string>()
  parts.forEach((p) => { if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), p) })
  const unique = Array.from(seen.values())
  return unique.join(', ')
}

function pickStatus(a: string, b: string): LeadStatus {
  const pa = STATUS_PRIORITY[a] ?? 0
  const pb = STATUS_PRIORITY[b] ?? 0
  return (pa >= pb ? a : b) as LeadStatus
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const admin = getAdminClient()

  const { data: employee } = await admin
    .from('employees')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()
  if (!employee) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const body = await request.json()
  const { lead_id_a, lead_id_b } = body
  if (!lead_id_a || !lead_id_b)
    return NextResponse.json({ error: 'Se requieren los IDs de ambos leads.' }, { status: 400 })
  if (lead_id_a === lead_id_b)
    return NextResponse.json({ error: 'Los IDs deben ser distintos.' }, { status: 400 })

  // Fetch both leads
  const [{ data: la }, { data: lb }] = await Promise.all([
    admin.from('leads').select('*').eq('id', lead_id_a).single(),
    admin.from('leads').select('*').eq('id', lead_id_b).single(),
  ])

  if (!la || !lb)
    return NextResponse.json({ error: 'Uno o ambos leads no encontrados.' }, { status: 404 })

  // Non-admins can only merge leads assigned to them
  if (employee.role !== 'admin') {
    if (la.assigned_to !== user.id && lb.assigned_to !== user.id)
      return NextResponse.json({ error: 'No autorizado.' }, { status: 403 })
  }

  // Primary = older lead (lower created_at); secondary will be deleted
  const [primary, secondary] = new Date(la.created_at) <= new Date(lb.created_at)
    ? [la, lb]
    : [lb, la]

  // Build merged field values — most complete wins
  const merged = {
    nombre:           pickField(primary.nombre, secondary.nombre),
    apellido:         pickField(primary.apellido, secondary.apellido),
    email:            pickField(primary.email, secondary.email),
    telefono:         pickField(primary.telefono, secondary.telefono),
    campus:           pickField(primary.campus, secondary.campus),
    programa_interes: mergePrograms(primary.programa_interes, secondary.programa_interes),
    horario:          pickField(primary.horario, secondary.horario),
    source:           pickField(primary.source, secondary.source),
    utm_source:       pickField(primary.utm_source, secondary.utm_source),
    utm_medium:       pickField(primary.utm_medium, secondary.utm_medium),
    utm_campaign:     pickField(primary.utm_campaign, secondary.utm_campaign),
    status:           pickStatus(primary.status, secondary.status),
    assigned_to:      primary.assigned_to ?? secondary.assigned_to,
    assignment_source: primary.assignment_source ?? secondary.assignment_source,
    notes:            pickField(primary.notes, secondary.notes),
    last_action_at:   new Date(primary.last_action_at) >= new Date(secondary.last_action_at)
                        ? primary.last_action_at
                        : secondary.last_action_at,
  }

  // Update primary lead with merged fields
  const { error: updateError } = await admin
    .from('leads')
    .update(merged)
    .eq('id', primary.id)

  if (updateError) {
    console.error('[merge] update error:', updateError)
    return NextResponse.json({ error: 'Error al actualizar el lead.' }, { status: 500 })
  }

  // Move all history from secondary to primary
  await admin
    .from('lead_history')
    .update({ lead_id: primary.id })
    .eq('lead_id', secondary.id)

  // Add merge note to primary's history
  await admin.from('lead_history').insert({
    lead_id: primary.id,
    employee_id: user.id,
    action_type: 'note_added',
    new_status: merged.status,
    note: `Lead fusionado por ${employee.full_name}. Lead duplicado eliminado: ${secondary.nombre} ${secondary.apellido} (ID: ${secondary.id.slice(0, 8)}…)`,
  })

  // Remove any dismissed pair records involving the secondary lead (they'll be gone)
  await admin
    .from('dismissed_lead_pairs')
    .delete()
    .or(`lead_id_a.eq.${secondary.id},lead_id_b.eq.${secondary.id}`)

  // Delete secondary lead
  const { error: deleteError } = await admin
    .from('leads')
    .delete()
    .eq('id', secondary.id)

  if (deleteError) {
    console.error('[merge] delete error:', deleteError)
    return NextResponse.json({ error: 'Lead actualizado pero no se pudo eliminar el duplicado.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, surviving_id: primary.id })
}
