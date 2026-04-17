import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Promotes "Nuevo Lead" leads to "Crítico" if untouched for 24+ hours.
// Runs on dashboard load.
export async function promoteNewLeadsToCritico(employeeId?: string) {
  const supabase = getServiceClient()

  let query = supabase
    .from('leads')
    .select('id, status')
    .eq('status', 'Nuevo Lead')
    .lt('last_action_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  if (employeeId) {
    query = query.eq('assigned_to', employeeId)
  }

  const { data: stale, error } = await query
  if (error || !stale || stale.length === 0) return

  const ids = stale.map((l) => l.id)

  await Promise.all([
    supabase
      .from('leads')
      .update({ status: 'Crítico', last_action_at: new Date().toISOString() })
      .in('id', ids),
    supabase.from('lead_history').insert(
      ids.map((id) => ({
        lead_id: id,
        employee_id: null,
        action_type: 'status_change',
        old_status: 'Nuevo Lead',
        new_status: 'Crítico',
        note: 'Sin actividad por 24 horas — cambio automático',
      }))
    ),
  ])
}

// Returns lead IDs that have been in their current status for 7+ days
// (for any non-terminal, non-new status). Used for visual "Seguimiento pendiente" alerts.
export async function getStaleLeadIds(employeeId?: string): Promise<string[]> {
  const supabase = getServiceClient()

  let query = supabase
    .from('leads')
    .select('id')
    .lt('last_action_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .not('status', 'in', '("Nuevo Lead","Crítico","Matriculado","Desinteresado / Rechazado")')

  if (employeeId) {
    query = query.eq('assigned_to', employeeId)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data.map((l) => l.id)
}
