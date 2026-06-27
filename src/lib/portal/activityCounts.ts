import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Conteo EN VIVO de leads por actividad (por activity_id). Reemplaza al valor
 * congelado `actual_leads` (que solo se calculaba al marcar la actividad como
 * terminada), para que los leads manuales y de QR ligados a una actividad
 * siempre cuenten.
 */
export async function liveLeadCountsByActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: SupabaseClient<any, any, any>,
  activityIds: string[]
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {}
  if (activityIds.length === 0) return counts
  const { data } = await admin
    .from('leads')
    .select('activity_id')
    .in('activity_id', activityIds)
  for (const row of data ?? []) {
    const id = (row as { activity_id: string | null }).activity_id
    if (id) counts[id] = (counts[id] ?? 0) + 1
  }
  return counts
}
