// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTeamMemberIds(employee: { id: string; role: string; campus: string[] }, adminClient: any): Promise<string[]> {
  if (employee.role === 'supervisor') {
    const { data: team } = await adminClient.from('employees').select('id').eq('supervisor_id', employee.id).eq('active', true)
    return (team ?? []).map((e: { id: string }) => e.id)
  }
  if (employee.role === 'director') {
    const directorCampus = employee.campus[0]
    if (!directorCampus) return []
    const { data: team } = await adminClient.from('employees').select('id').contains('campus', [directorCampus]).eq('active', true).neq('id', employee.id)
    return (team ?? []).map((e: { id: string }) => e.id)
  }
  return []
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function isCampusMember(leadAssignedTo: string, directorCampus: string[], adminClient: any): Promise<boolean> {
  if (!directorCampus.length) return false
  const { data } = await adminClient.from('employees').select('id').eq('id', leadAssignedTo).contains('campus', directorCampus).single()
  return !!data
}
