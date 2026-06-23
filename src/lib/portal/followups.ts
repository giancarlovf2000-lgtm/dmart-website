import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Valida que un tipo de comunicación/seguimiento exista en la tabla
 * communication_types (case-insensitive). Devuelve el nombre canónico o null.
 */
export async function resolveCommunicationType(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  raw: unknown
): Promise<string | null> {
  const name = String(raw ?? '').trim()
  if (!name) return null
  const { data } = await admin
    .from('communication_types')
    .select('name')
    .ilike('name', name)
    .maybeSingle()
  return data?.name ?? null
}

/**
 * Cierre automático de follow-ups: al registrar cualquier actividad en un lead
 * (nota o cambio de estado), marca como 'completado' los follow-ups programados
 * de ese lead cuya fecha ya venció (due_date <= hoy).
 */
export async function autoCompleteDueFollowups(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  leadId: string,
  employeeId: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  await admin
    .from('lead_followups')
    .update({
      status: 'completado',
      completed_at: new Date().toISOString(),
      completed_by: employeeId,
    })
    .eq('lead_id', leadId)
    .eq('status', 'programado')
    .lte('due_date', today)
}
