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

type Shift = 'diurno' | 'nocturno' | 'sabatino'
type SocialEntry = { program: string; shift: Shift; start_date: string | null }

// Normaliza el jsonb (strings antiguos u objetos nuevos) a entradas con sección/fecha.
function normalizeSocial(raw: unknown): SocialEntry[] {
  if (!Array.isArray(raw)) return []
  const out: SocialEntry[] = []
  for (const e of raw) {
    if (typeof e === 'string') {
      out.push({ program: e, shift: PRIVADO_SET.has(e) ? 'sabatino' : 'diurno', start_date: null })
    } else if (e && typeof e === 'object') {
      const o = e as Record<string, unknown>
      if (typeof o.program !== 'string') continue
      const shift: Shift = o.shift === 'nocturno' ? 'nocturno' : o.shift === 'sabatino' ? 'sabatino' : 'diurno'
      const start_date = typeof o.start_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.start_date) ? o.start_date : null
      out.push({ program: o.program, shift, start_date })
    }
  }
  return out
}

const SHIFT_ORDER: Record<Shift, number> = { diurno: 0, nocturno: 1, sabatino: 2 }

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

  // Agrupa por recinto → (programa, sección, fecha) → lista de supervisores.
  type ItemAgg = { program: string; kind: 'regular' | 'privado' | 'otro'; shift: Shift; start_date: string | null; supervisors: string[] }
  const byCampus = new Map<string, Map<string, ItemAgg>>()
  // Siembra siempre los recintos conocidos.
  for (const c of STATIC_CAMPUSES) byCampus.set(c.name, new Map())

  for (const plan of plans ?? []) {
    const emp = empById.get(plan.supervisor_id)
    if (!emp) continue // no es supervisor o no existe
    const entries = normalizeSocial(plan.social_programs)
    if (!entries.length) continue
    const campuses = emp.campus.length ? emp.campus : ['Sin recinto']
    for (const campus of campuses) {
      if (!byCampus.has(campus)) byCampus.set(campus, new Map())
      const itemMap = byCampus.get(campus)!
      for (const en of entries) {
        if (!en.program.trim()) continue
        const key = `${en.program}||${en.shift}||${en.start_date ?? ''}`
        let item = itemMap.get(key)
        if (!item) { item = { program: en.program, kind: programKind(en.program), shift: en.shift, start_date: en.start_date, supervisors: [] }; itemMap.set(key, item) }
        if (!item.supervisors.includes(emp.full_name)) item.supervisors.push(emp.full_name)
      }
    }
  }

  const campuses = Array.from(byCampus.entries()).map(([campus, itemMap]) => ({
    campus,
    programs: Array.from(itemMap.values()).sort((a, b) =>
      a.program.localeCompare(b.program) || SHIFT_ORDER[a.shift] - SHIFT_ORDER[b.shift]
    ),
  }))

  return NextResponse.json({ month, campuses })
}
