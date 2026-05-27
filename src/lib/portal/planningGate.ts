export function getNextMonthStart(): string {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return next.toISOString().slice(0, 10) // 'YYYY-MM-01'
}

export function getDaysLeftInMonth(): number {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return daysInMonth - now.getDate()
}

export interface PlanningGateResult {
  required: boolean
  complete: boolean
  calendarDays: number
  activitiesCount: number
  nextMonthStart: string
  nextMonthStr: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkSupervisorPlanningGate(supervisorId: string, adminClient: any): Promise<PlanningGateResult> {
  const daysLeft = getDaysLeftInMonth()
  const nextMonthStart = getNextMonthStart()
  const nextMonthStr = nextMonthStart.slice(0, 7)

  if (daysLeft > 5) {
    return { required: false, complete: true, calendarDays: 0, activitiesCount: 0, nextMonthStart, nextMonthStr }
  }

  const [planRes, actRes] = await Promise.all([
    adminClient
      .from('supervisor_monthly_plans')
      .select('notes')
      .eq('supervisor_id', supervisorId)
      .eq('plan_month', nextMonthStr)
      .single(),
    adminClient
      .from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('employee_id', supervisorId)
      .eq('month', nextMonthStart),
  ])

  const filledDays = planRes.data
    ? Object.values(planRes.data.notes as Record<string, string>).filter((v: string) => v?.trim()).length
    : 0

  const activitiesCount = actRes.count ?? 0
  const complete = filledDays >= 5 && activitiesCount >= 2

  return { required: true, complete, calendarDays: filledDays, activitiesCount, nextMonthStart, nextMonthStr }
}
