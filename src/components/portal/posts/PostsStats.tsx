'use client'

import { useEffect, useState } from 'react'
import {
  TrendingUp, Users, Megaphone, Target, Lightbulb, Globe, Filter,
  ArrowDownRight, AlertTriangle, CheckCircle2, Building2,
} from 'lucide-react'

interface Stats {
  range: { from: string; to: string }
  totals: { leads: number; enrolled: number; conversion: number; saved_posts: number; calendars: number }
  programs: {
    program: string; kind: 'regular' | 'privado' | 'otro'; leads: number; enrolled: number
    statuses: Record<string, number>; conversion: number; next_start: string | null; start_count: number; posts: number
  }[]
  funnel: { stage: string; count: number }[]
  statuses: Record<string, number>
  sources: { source: string; total: number; enrolled: number; conversion: number }[]
  reps: { id: string; name: string; leads: number; enrolled: number; stale: number; overdue: number; completed: number; conversion: number }[]
  traffic: {
    collecting: boolean; total_views: number; unique_visitors: number; no_form_visitors: number
    visitor_conversion: number; top_pages: { path: string; count: number }[]
  }
  recommendations: { kind: string; title: string; detail: string }[]
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`
const sourceLabel: Record<string, string> = {
  website: 'Sitio web', manual: 'Manual', actividad: 'Actividad', import: 'Importado', desconocido: 'Desconocido',
}

export default function PostsStats() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(90)

  useEffect(() => {
    setLoading(true)
    const to = new Date()
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const qs = `from=${from.toISOString().slice(0, 10)}&to=${to.toISOString().slice(0, 10)}`
    fetch(`/api/portal/stats?${qs}`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoading(false))
  }, [days])

  if (loading || !stats) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-muted py-16 justify-center">
        <span className="portal-spinner h-4 w-4" /> Calculando estadísticas…
      </div>
    )
  }

  const maxProgLeads = Math.max(1, ...stats.programs.map((p) => p.leads))
  const maxFunnel = Math.max(1, ...stats.funnel.map((f) => f.count))

  return (
    <div className="space-y-6">
      {/* Posts por hacer este mes (pedidos de los supervisores por recinto) */}
      <SocialRequests />

      {/* Rango */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-ink font-display">Estadísticas de la plataforma</h2>
          <p className="text-xs text-ink-muted">Datos de los últimos {days} días para guiar tus decisiones.</p>
        </div>
        <div className="portal-tabs">
          <Filter className="h-3.5 w-3.5 text-ink-muted ml-2 self-center" />
          {[30, 90, 180, 365].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`portal-tab text-xs ${days === d ? 'portal-tab--active' : ''}`}>
              {d === 365 ? '1 año' : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={Users} label="Leads" value={stats.totals.leads} />
        <Kpi icon={CheckCircle2} label="Matriculados" value={stats.totals.enrolled} />
        <Kpi icon={Target} label="Conversión" value={pct(stats.totals.conversion)} />
        <Kpi icon={Megaphone} label="Posts guardados" value={stats.totals.saved_posts} />
        <Kpi icon={Globe} label="Visitantes web" value={stats.traffic.unique_visitors} />
      </div>

      {/* Recomendaciones */}
      {stats.recommendations.length > 0 && (
        <div className="rounded-neu bg-surface p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-ink-muted" />
            <h3 className="text-sm font-bold text-ink">Recomendaciones</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {stats.recommendations.map((r, i) => (
              <div key={i} className="portal-tile p-3">
                <p className="text-sm font-semibold text-ink">{r.title}</p>
                <p className="text-xs text-ink-muted mt-1">{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ranking de programas */}
        <Panel title="Ranking de programas" icon={TrendingUp}>
          <div className="space-y-2.5">
            {stats.programs.slice(0, 12).map((p) => (
              <div key={p.program}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-ink truncate flex items-center gap-1.5">
                    {p.program}
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface text-ink-muted">
                      {p.kind === 'privado' ? 'Privado' : p.kind === 'regular' ? 'Regular' : 'Otro'}
                    </span>
                  </span>
                  <span className="text-ink-muted flex-shrink-0 ml-2">{p.leads} · {pct(p.conversion)}</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-ink rounded-full" style={{ width: `${(p.leads / maxProgLeads) * 100}%` }} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-ink-muted">
                  <span>{p.enrolled} matriculados</span>
                  {p.next_start && <span>Próx. inicio: {p.next_start}</span>}
                  <span>{p.posts} post{p.posts === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
            {stats.programs.length === 0 && <Empty />}
          </div>
        </Panel>

        {/* Embudo */}
        <Panel title="Embudo de conversión" icon={ArrowDownRight}>
          <div className="space-y-2">
            {stats.funnel.map((f) => (
              <div key={f.stage} className="flex items-center gap-3">
                <span className="text-xs text-ink-muted w-24 flex-shrink-0">{f.stage}</span>
                <div className="flex-1 h-6 bg-surface rounded-md overflow-hidden">
                  <div className="h-full bg-ink/80 rounded-md flex items-center justify-end px-2"
                    style={{ width: `${Math.max(8, (f.count / maxFunnel) * 100)}%` }}>
                    <span className="text-[10px] font-semibold text-white">{f.count}</span>
                  </div>
                </div>
              </div>
            ))}
            {stats.funnel.length === 0 && <Empty />}
          </div>
          {/* Por origen */}
          {stats.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/[0.05]">
              <p className="text-[11px] font-semibold text-ink-muted mb-2">Por origen</p>
              <div className="space-y-1.5">
                {stats.sources.map((s) => (
                  <div key={s.source} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">{sourceLabel[s.source] ?? s.source}</span>
                    <span className="text-ink-muted">{s.total} leads · {pct(s.conversion)} conv.</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Seguimiento por representante */}
        <Panel title="Calidad de seguimiento por representante" icon={Users}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-ink-muted text-left">
                  <th className="py-1.5 font-semibold">Representante</th>
                  <th className="py-1.5 font-semibold text-center">Leads</th>
                  <th className="py-1.5 font-semibold text-center">Matr.</th>
                  <th className="py-1.5 font-semibold text-center">Conv.</th>
                  <th className="py-1.5 font-semibold text-center">Estancados</th>
                  <th className="py-1.5 font-semibold text-center">Venc.</th>
                </tr>
              </thead>
              <tbody>
                {stats.reps.map((r) => (
                  <tr key={r.id} className="border-t border-black/[0.05]">
                    <td className="py-2 font-medium text-ink truncate max-w-[120px]">{r.name}</td>
                    <td className="py-2 text-center text-ink-muted">{r.leads}</td>
                    <td className="py-2 text-center text-ink-muted">{r.enrolled}</td>
                    <td className="py-2 text-center text-ink-muted">{pct(r.conversion)}</td>
                    <td className="py-2 text-center">
                      {r.stale > 0 ? <span className="inline-flex items-center gap-0.5 text-accent font-semibold"><AlertTriangle className="h-3 w-3" />{r.stale}</span> : <span className="text-ink-muted/50">0</span>}
                    </td>
                    <td className="py-2 text-center">
                      {r.overdue > 0 ? <span className="text-ink font-semibold">{r.overdue}</span> : <span className="text-ink-muted/50">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.reps.length === 0 && <Empty />}
          </div>
        </Panel>

        {/* Tráfico web */}
        <Panel title="Tráfico web" icon={Globe}>
          {stats.traffic.collecting ? (
            <div className="text-center py-8">
              <Globe className="h-8 w-8 text-ink-muted/50 mx-auto mb-2" />
              <p className="text-sm text-ink-muted">Recolectando datos…</p>
              <p className="text-xs text-ink-muted mt-1">Las estadísticas de visitas empezarán a aparecer a medida que los usuarios naveguen el sitio público.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <MiniStat label="Vistas" value={stats.traffic.total_views} />
                <MiniStat label="Visitantes" value={stats.traffic.unique_visitors} />
                <MiniStat label="Sin form" value={stats.traffic.no_form_visitors} />
              </div>
              <p className="text-[11px] text-ink-muted mb-2">
                Conversión de visitante a lead: <span className="font-semibold text-ink">{pct(stats.traffic.visitor_conversion)}</span>
              </p>
              <p className="text-[11px] font-semibold text-ink-muted mb-2">Páginas más visitadas</p>
              <div className="space-y-1.5">
                {stats.traffic.top_pages.map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted truncate max-w-[200px]">{p.path}</span>
                    <span className="text-ink-muted flex-shrink-0 ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number }) {
  return (
    <div className="portal-tile p-4">
      <Icon className="h-4 w-4 text-ink-muted mb-2" />
      <p className="text-xl font-bold text-ink font-display">{value}</p>
      <p className="text-xs text-ink-muted">{label}</p>
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="portal-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-ink-muted" />
        <h3 className="text-sm font-bold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-ink">{value}</p>
      <p className="text-[10px] text-ink-muted">{label}</p>
    </div>
  )
}

function Empty() {
  return <p className="text-xs text-ink-muted py-4 text-center">Sin datos en este período.</p>
}

// ── Posts por hacer este mes — pedidos de los supervisores por recinto ────────
interface SocialCampus {
  campus: string
  programs: {
    program: string; kind: 'regular' | 'privado' | 'otro'
    shift: 'diurno' | 'nocturno' | 'sabatino'; start_date: string | null; supervisors: string[]
  }[]
}

const SHIFT_LABEL: Record<'diurno' | 'nocturno' | 'sabatino', string> = {
  diurno: 'D', nocturno: 'N', sabatino: 'Sab',
}

function fmtStart(d: string | null): string {
  if (!d) return 'Pendiente'
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('es-PR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function SocialRequests() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [campuses, setCampuses] = useState<SocialCampus[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/portal/posts/social-requests?month=${month}`)
      .then((r) => r.json())
      .then((d) => setCampuses(d.campuses ?? []))
      .finally(() => setLoading(false))
  }, [month])

  return (
    <div className="rounded-neu bg-surface p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-ink-muted" />
          <h3 className="text-sm font-bold text-ink">Posts por hacer este mes — por recinto</h3>
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="portal-filter text-xs" />
      </div>
      <p className="text-xs text-ink-muted mb-4">Programas que los supervisores de cada recinto pidieron para redes.</p>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-muted py-6 justify-center">
          <span className="portal-spinner h-4 w-4" /> Cargando…
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {campuses.map((c) => (
            <div key={c.campus} className="portal-tile p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Building2 className="h-3.5 w-3.5 text-ink-muted" />
                <p className="text-sm font-bold text-ink">{c.campus}</p>
                <span className="ml-auto text-xs text-ink-muted">{c.programs.length} programa{c.programs.length === 1 ? '' : 's'}</span>
              </div>
              {c.programs.length === 0 ? (
                <p className="text-xs text-ink-muted py-2">Ningún supervisor ha pedido apoyo para este recinto este mes.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-ink-muted text-left border-b border-black/[0.05]">
                      <th className="py-1.5 font-semibold">Programa</th>
                      <th className="py-1.5 font-semibold text-center w-12">Secc.</th>
                      <th className="py-1.5 font-semibold text-right">Comienzo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.programs.map((p, i) => (
                      <tr key={`${p.program}-${p.shift}-${p.start_date}-${i}`} className="border-b border-black/[0.05] last:border-0">
                        <td className="py-2 pr-2">
                          <span className="font-medium text-ink">{p.program}</span>
                          {p.supervisors.length > 0 && (
                            <span className="block text-[10px] text-ink-muted truncate">{p.supervisors.join(', ')}</span>
                          )}
                        </td>
                        <td className="py-2 text-center">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-surface text-ink-muted">
                            {SHIFT_LABEL[p.shift]}
                          </span>
                        </td>
                        <td className={`py-2 text-right whitespace-nowrap ${p.start_date ? 'text-ink font-medium' : 'text-ink-muted italic'}`}>
                          {fmtStart(p.start_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
