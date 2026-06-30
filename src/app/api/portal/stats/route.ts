import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { STATIC_PROGRAMS, PRIVADOS_SABATINOS } from '@/lib/utils'

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

// ── Categorización de programas ──────────────────────────────────────────────
const REGULAR_NAMES = new Set(STATIC_PROGRAMS.map((p) => p.name))
const PRIVADO_TITLES = PRIVADOS_SABATINOS.map((p) => p.title)
const PRIVADO_SET = new Set(PRIVADO_TITLES)

function programKind(name: string | null | undefined): 'regular' | 'privado' | 'otro' {
  if (!name) return 'otro'
  if (REGULAR_NAMES.has(name)) return 'regular'
  if (PRIVADO_SET.has(name) || /privado/i.test(name)) return 'privado'
  return 'otro'
}

// Estados que cuentan como "matriculado/cerrado ganado".
const ENROLLED = new Set(['Matriculado', 'Graduado', 'Graduado con Reválida'])
const LOST = new Set(['Desinteresado / Rechazado'])
const NEW_STATES = new Set(['Nuevo Lead', 'Crítico'])
const TERMINAL = new Set(['Matriculado', 'Graduado', 'Graduado con Reválida', 'Desinteresado / Rechazado'])

// Buckets de embudo (de arriba hacia abajo).
function funnelBucket(status: string): string {
  if (NEW_STATES.has(status)) return 'Nuevo'
  if (status === 'Contacto Inicial (Pendiente de Respuesta)' || status === 'Contacto Establecido') return 'Contactado'
  if (status === 'Cita Programada' || status === 'Reagendado' || status === 'No Asistió a la Cita') return 'Cita'
  if (status === 'En Espera de Documentos' || status === 'Orientado (En Proceso de Matricularse)') return 'En proceso'
  if (status === 'Seguimiento a Futuro') return 'Seguimiento'
  if (ENROLLED.has(status)) return 'Matriculado'
  if (LOST.has(status)) return 'Perdido'
  return 'Otro'
}
const FUNNEL_ORDER = ['Nuevo', 'Contactado', 'Cita', 'En proceso', 'Seguimiento', 'Matriculado', 'Perdido']

export async function GET(request: NextRequest) {
  const caller = await requireAdmin()
  if (!caller) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const now = Date.now()
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')
  const from = fromParam && /^\d{4}-\d{2}-\d{2}$/.test(fromParam)
    ? new Date(fromParam + 'T00:00:00')
    : new Date(now - 90 * 24 * 60 * 60 * 1000)
  const to = toParam && /^\d{4}-\d{2}-\d{2}$/.test(toParam)
    ? new Date(toParam + 'T23:59:59')
    : new Date(now)
  const fromISO = from.toISOString()
  const toISO = to.toISOString()
  const today = new Date(now).toISOString().slice(0, 10)

  const admin = getAdminClient()

  const [leadsRes, empsRes, followupsRes, viewsRes, postsRes, calendarsRes] = await Promise.all([
    admin.from('leads')
      .select('id, programa_interes, status, start_date, created_at, last_action_at, assignment_source, assigned_to')
      .gte('created_at', fromISO).lte('created_at', toISO),
    admin.from('employees').select('id, full_name, role, active'),
    admin.from('lead_followups').select('id, employee_id, due_date, status, completed_at'),
    admin.from('page_views').select('path, session_id, created_at').gte('created_at', fromISO).lte('created_at', toISO),
    admin.from('saved_posts').select('id, title, config, post_date, created_at'),
    admin.from('post_calendars').select('id, name, month'),
  ])

  type Lead = {
    id: string; programa_interes: string | null; status: string; start_date: string | null
    created_at: string; last_action_at: string; assignment_source: string | null; assigned_to: string | null
  }
  const leads = (leadsRes.data ?? []) as Lead[]
  const employees = (empsRes.data ?? []) as { id: string; full_name: string; role: string; active: boolean }[]
  const followups = (followupsRes.data ?? []) as { id: string; employee_id: string | null; due_date: string; status: string; completed_at: string | null }[]
  const views = (viewsRes.data ?? []) as { path: string; session_id: string | null; created_at: string }[]
  const posts = (postsRes.data ?? []) as { id: string; title: string | null; config: Record<string, unknown> | null; post_date: string; created_at: string }[]
  const calendars = (calendarsRes.data ?? []) as { id: string; name: string; month: string }[]

  const empName = new Map(employees.map((e) => [e.id, e.full_name]))
  const totalLeads = leads.length
  const enrolledTotal = leads.filter((l) => ENROLLED.has(l.status)).length
  const conversionRate = totalLeads ? enrolledTotal / totalLeads : 0

  // ── Ranking de programas ──────────────────────────────────────────────────
  type ProgAgg = {
    program: string; kind: 'regular' | 'privado' | 'otro'; leads: number; enrolled: number
    statuses: Record<string, number>; start_dates: string[]; posts: number
  }
  const progMap = new Map<string, ProgAgg>()
  function progEntry(name: string): ProgAgg {
    let e = progMap.get(name)
    if (!e) {
      e = { program: name, kind: programKind(name), leads: 0, enrolled: 0, statuses: {}, start_dates: [], posts: 0 }
      progMap.set(name, e)
    }
    return e
  }
  for (const l of leads) {
    const name = (l.programa_interes && l.programa_interes.trim()) || 'Sin especificar'
    const e = progEntry(name)
    e.leads++
    if (ENROLLED.has(l.status)) e.enrolled++
    e.statuses[l.status] = (e.statuses[l.status] ?? 0) + 1
    if (l.start_date) e.start_dates.push(l.start_date)
  }
  // Posts por programa (match del título del post al nombre del programa).
  for (const p of posts) {
    const title = (p.title || (p.config?.title as string) || '').trim()
    if (!title) continue
    for (const name of Array.from(progMap.keys())) {
      if (name !== 'Sin especificar' && title.toLowerCase().includes(name.toLowerCase())) {
        progEntry(name).posts++
      }
    }
  }
  const programs = Array.from(progMap.values())
    .map((e) => ({
      ...e,
      conversion: e.leads ? e.enrolled / e.leads : 0,
      next_start: e.start_dates.sort()[0] ?? null,
      start_count: e.start_dates.length,
    }))
    .sort((a, b) => b.leads - a.leads)

  // ── Embudo de conversión ──────────────────────────────────────────────────
  const funnelMap: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  const bySource: Record<string, { total: number; enrolled: number }> = {}
  for (const l of leads) {
    const b = funnelBucket(l.status)
    funnelMap[b] = (funnelMap[b] ?? 0) + 1
    byStatus[l.status] = (byStatus[l.status] ?? 0) + 1
    const src = l.assignment_source || 'desconocido'
    if (!bySource[src]) bySource[src] = { total: 0, enrolled: 0 }
    bySource[src].total++
    if (ENROLLED.has(l.status)) bySource[src].enrolled++
  }
  const funnel = FUNNEL_ORDER.filter((b) => funnelMap[b]).map((b) => ({ stage: b, count: funnelMap[b] }))
  const sources = Object.entries(bySource).map(([source, v]) => ({
    source, total: v.total, enrolled: v.enrolled, conversion: v.total ? v.enrolled / v.total : 0,
  })).sort((a, b) => b.total - a.total)

  // ── Calidad de seguimiento por representante ──────────────────────────────
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
  type RepAgg = { id: string; name: string; leads: number; enrolled: number; stale: number; overdue: number; completed: number }
  const repMap = new Map<string, RepAgg>()
  function repEntry(id: string | null): RepAgg {
    const key = id ?? 'unassigned'
    let e = repMap.get(key)
    if (!e) {
      e = { id: key, name: id ? (empName.get(id) ?? 'Desconocido') : 'Sin asignar', leads: 0, enrolled: 0, stale: 0, overdue: 0, completed: 0 }
      repMap.set(key, e)
    }
    return e
  }
  for (const l of leads) {
    const e = repEntry(l.assigned_to)
    e.leads++
    if (ENROLLED.has(l.status)) e.enrolled++
    const isStale = !NEW_STATES.has(l.status) && !TERMINAL.has(l.status) &&
      new Date(l.last_action_at).getTime() < sevenDaysAgo
    if (isStale) e.stale++
  }
  for (const f of followups) {
    if (!f.employee_id) continue
    const e = repMap.get(f.employee_id)
    if (!e) continue // followups de leads fuera del rango actual
    if (f.status === 'completado') e.completed++
    else if (f.status === 'programado' && f.due_date <= today) e.overdue++
  }
  const reps = Array.from(repMap.values())
    .map((e) => ({ ...e, conversion: e.leads ? e.enrolled / e.leads : 0 }))
    .sort((a, b) => b.leads - a.leads)

  // ── Tráfico web ────────────────────────────────────────────────────────────
  const totalViews = views.length
  const uniqueVisitors = new Set(views.map((v) => v.session_id ?? '')).size
  const pageMap: Record<string, number> = {}
  for (const v of views) pageMap[v.path] = (pageMap[v.path] ?? 0) + 1
  const topPages = Object.entries(pageMap)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
  const noFormVisitors = Math.max(0, uniqueVisitors - totalLeads)
  const visitorConversion = uniqueVisitors ? totalLeads / uniqueVisitors : 0
  const traffic = {
    collecting: totalViews === 0,
    total_views: totalViews,
    unique_visitors: uniqueVisitors,
    no_form_visitors: noFormVisitors,
    visitor_conversion: visitorConversion,
    top_pages: topPages,
  }

  // ── Recomendaciones automáticas ───────────────────────────────────────────
  const recommendations: { kind: string; title: string; detail: string }[] = []

  // 1) Programa con más demanda pero pocos posts.
  const topByLeads = programs.filter((p) => p.program !== 'Sin especificar' && p.leads > 0)
  if (topByLeads.length) {
    const t = topByLeads[0]
    if (t.posts <= 1) {
      recommendations.push({
        kind: 'posts',
        title: `Crea más posts de "${t.program}"`,
        detail: `Es el programa con más leads (${t.leads}) pero solo tiene ${t.posts} post${t.posts === 1 ? '' : 's'} guardado${t.posts === 1 ? '' : 's'}. Aprovecha la demanda con más contenido.`,
      })
    }
  }
  // 2) Programa regular con muy pocos leads → campaña/actividad.
  const weak = programs
    .filter((p) => p.kind === 'regular' && p.program !== 'Sin especificar')
    .sort((a, b) => a.leads - b.leads)[0]
  if (weak && weak.leads <= Math.max(1, Math.round(totalLeads * 0.03))) {
    recommendations.push({
      kind: 'programa',
      title: `Impulsa "${weak.program}"`,
      detail: `Genera pocos leads (${weak.leads}) en el período. Considera una campaña o actividad enfocada en este programa.`,
    })
  }
  // 3) Representantes con leads estancados.
  const staleReps = reps.filter((r) => r.id !== 'unassigned' && r.stale > 0).sort((a, b) => b.stale - a.stale)
  if (staleReps.length) {
    const r = staleReps[0]
    recommendations.push({
      kind: 'seguimiento',
      title: `${r.name} tiene ${r.stale} lead${r.stale === 1 ? '' : 's'} estancado${r.stale === 1 ? '' : 's'}`,
      detail: `Hay leads sin actividad por más de 7 días. Refuerza el seguimiento para no perder oportunidades.`,
    })
  }
  // 4) Seguimientos vencidos en total.
  const totalOverdue = reps.reduce((s, r) => s + r.overdue, 0)
  if (totalOverdue > 0) {
    recommendations.push({
      kind: 'seguimiento',
      title: `${totalOverdue} seguimiento${totalOverdue === 1 ? '' : 's'} vencido${totalOverdue === 1 ? '' : 's'}`,
      detail: `Hay seguimientos programados cuya fecha ya pasó y siguen pendientes. Complétalos o reprográmalos.`,
    })
  }
  // 5) Leads sin asignar.
  const unassigned = repMap.get('unassigned')
  if (unassigned && unassigned.leads > 0) {
    recommendations.push({
      kind: 'asignacion',
      title: `${unassigned.leads} lead${unassigned.leads === 1 ? '' : 's'} sin asignar`,
      detail: `Asigna estos leads a un representante para que reciban seguimiento.`,
    })
  }
  // 6) Conversión de tráfico baja (si hay datos).
  if (!traffic.collecting && uniqueVisitors >= 30 && visitorConversion < 0.02) {
    recommendations.push({
      kind: 'web',
      title: 'Baja conversión del sitio web',
      detail: `${uniqueVisitors} visitantes y solo ${totalLeads} leads (${(visitorConversion * 100).toFixed(1)}%). Revisa los formularios y llamadas a la acción de las páginas más visitadas.`,
    })
  }
  // 7) Estado del tracking web.
  if (traffic.collecting) {
    recommendations.push({
      kind: 'web',
      title: 'El tracking web acaba de iniciar',
      detail: 'Aún no hay datos de tráfico. Las estadísticas de visitas se irán llenando a medida que los usuarios naveguen el sitio público.',
    })
  }

  return NextResponse.json({
    range: { from: fromISO, to: toISO },
    totals: {
      leads: totalLeads,
      enrolled: enrolledTotal,
      conversion: conversionRate,
      saved_posts: posts.length,
      calendars: calendars.length,
    },
    programs,
    funnel,
    statuses: byStatus,
    sources,
    reps,
    traffic,
    recommendations,
  })
}
