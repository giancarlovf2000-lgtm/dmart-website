// Visibilidad de leads por recinto (campus), no por empleado asignado.
//
// Regla (no-admin): un empleado con campus C[] ve un lead si
//   lead.campus ∈ C   o   lead.campus ∈ {'Ambos','No tengo preferencia'}   o   lead.campus IS NULL.
// Lo único que se le oculta a un empleado de un recinto son los leads marcados
// explícitamente con OTRO recinto. El admin ve todo.

// Recintos "neutrales" que ven los empleados de cualquier recinto.
const CAMPUS_NEUTRAL = ['Ambos', 'No tengo preferencia']

type EmployeeLike = { role: string; campus: string[] }

// Lista de valores de campus visibles para un empleado (su(s) recinto(s) + neutrales).
export function visibleCampusValues(campus: string[]): string[] {
  return Array.from(new Set([...(campus ?? []), ...CAMPUS_NEUTRAL]))
}

// Construye el filtro PostgREST `.or(...)` para la visibilidad por recinto.
// Los valores van entre comillas dobles porque contienen espacios.
export function leadCampusOrFilter(campus: string[]): string {
  const values = visibleCampusValues(campus)
    .map((c) => `"${c.replace(/"/g, '')}"`)
    .join(',')
  return `campus.in.(${values}),campus.is.null`
}

// Aplica la visibilidad por recinto a un query de Supabase.
// Admin: sin filtro. Resto: filtra por recinto. Se combina con otros `.eq()` por AND.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyCampusVisibility(query: any, employee: EmployeeLike) {
  if (employee.role === 'admin') return query
  return query.or(leadCampusOrFilter(employee.campus as string[]))
}

// Chequeo en memoria para un lead individual.
export function canAccessLeadCampus(employee: EmployeeLike, leadCampus: string | null): boolean {
  if (employee.role === 'admin') return true
  if (leadCampus == null) return true
  return visibleCampusValues(employee.campus as string[]).includes(leadCampus)
}
