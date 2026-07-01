import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { STATIC_PROGRAMS, PRIVADOS_SABATINOS, STATIC_CAMPUSES } from '@/lib/utils'

function getAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = getAdminClient()
  const { data: emp } = await admin.from('employees').select('id, role').eq('id', user.id).single()
  if (!emp || emp.role !== 'admin') return null
  return emp
}

const REGULAR_NAMES = new Set(STATIC_PROGRAMS.map((p) => p.name))
const PRIVADO_SET = new Set(PRIVADOS_SABATINOS.map((p) => p.title))
function programKind(name: string): 'regular' | 'privado' | 'otro' {
  if (REGULAR_NAMES.has(name)) return 'regular'
  if (PRIVADO_SET.has(name) || /privado/i.test(name)) return 'privado'
  return 'otro'
}

// GET ?month=YYYY-MM → programas que los supervisores pidieron para redes, por recinto.
export async function GET(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const monthParam = searchParams.get('month')
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam
    : new Date().toISOString().slice(0, 7)

  const admin = getAdminClient()
  const { data: plans } = await admin
    .from('supervisor_monthly_plans')
    .select('supervisor_id, social_programs')
    .eq('plan_month', month)

  const supervisorIds = (plans ?? []).map((p) => p.supervisor_id)
  const empById = new Map<string, { full_name: string; campus: string[]; role: string }>()
  if (supervisorIds.length) {
    const { data: emps } = await admin
      .from('employees')
      .select('id, full_name, campus, role')
      .in('id', supervisorIds)
      .eq('role', 'supervisor')
    for (const e of emps ?? []) empById.set(e.id, { full_name: e.full_name, campus: (e.campus ?? []) as string[], role: e.role })
  }

  // Agrupa por recinto → programa → lista de supervisores.
  type ProgAgg = { program: string; kind: 'regular' | 'privado' | 'otro'; supervisors: string[] }
  const byCampus = new Map<string, Map<string, ProgAgg>>()
  // Siembra siempre los recintos conocidos.
  for (const c of STATIC_CAMPUSES) byCampus.set(c.name, new Map())

  for (const plan of plans ?? []) {
    const emp = empById.get(plan.supervisor_id)
    if (!emp) continue // no es supervisor o no existe
    const programs = Array.isArray(plan.social_programs) ? (plan.social_programs as string[]) : []
    if (!programs.length) continue
    const campuses = emp.campus.length ? emp.campus : ['Sin recinto']
    for (const campus of campuses) {
      if (!byCampus.has(campus)) byCampus.set(campus, new Map())
      const progMap = byCampus.get(campus)!
      for (const program of programs) {
        if (typeof program !== 'string' || !program.trim()) continue
        let entry = progMap.get(program)
        if (!entry) { entry = { program, kind: programKind(program), supervisors: [] }; progMap.set(program, entry) }
        if (!entry.supervisors.includes(emp.full_name)) entry.supervisors.push(emp.full_name)
      }
    }
  }

  const campuses = Array.from(byCampus.entries()).map(([campus, progMap]) => ({
    campus,
    programs: Array.from(progMap.values()).sort((a, b) => a.program.localeCompare(b.program)),
  }))

  return NextResponse.json({ month, campuses })
}
