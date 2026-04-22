'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Plus, CheckCircle, AlertCircle, MapPin, Calendar,
  QrCode, Flag, Trash2, Zap, TrendingUp, Users, GraduationCap,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import type { Activity, MonthlyReport } from '@/lib/types'

const ACTIVITY_TYPES = [
  { value: 'feria',             label: 'Feria de Empleo / Educación' },
  { value: 'visita_escuela',    label: 'Visita a Escuela' },
  { value: 'evento_comunitario',label: 'Evento Comunitario' },
  { value: 'otro',              label: 'Otro' },
]

const SCORE_CONFIG = {
  excelente: { label: 'Excelente',  bg: 'bg-green-50',  border: 'border-green-200', text: 'text-green-700',  badge: 'bg-green-600' },
  bueno:     { label: 'Bueno',      bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',   badge: 'bg-blue-600' },
  basico:    { label: 'Básico',     bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-700',  badge: 'bg-amber-500' },
  deficiente:{ label: 'Deficiente', bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-700',    badge: 'bg-red-600' },
}

function firstOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10)
}

function monthLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PR', { weekday: 'short', month: 'short', day: 'numeric' })
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

// QR Code canvas component
function QRCanvas({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!url || !canvasRef.current) return
    let cancelled = false
    import('qrcode').then((QRCode) => {
      if (cancelled || !canvasRef.current) return
      QRCode.toCanvas(canvasRef.current, url, { width: 160, margin: 1 }, () => {
        if (!cancelled) setReady(true)
      })
    })
    return () => { cancelled = true }
  }, [url])

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas ref={canvasRef} className={ready ? '' : 'opacity-0'} />
      {!ready && <div className="w-40 h-40 bg-gray-100 rounded animate-pulse" />}
    </div>
  )
}

interface AutoStats {
  leads_acquired: number
  leads_from_activities: number
  leads_manual: number
  leads_enrolled: number
  activities_completed: number
  performance_score: 'deficiente' | 'basico' | 'bueno' | 'excelente'
}

export default function ReportesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [activeTab, setActiveTab] = useState<'plan' | 'cierre'>('plan')
  const [showNewActivity, setShowNewActivity] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [autoStats, setAutoStats] = useState<AutoStats | null>(null)
  const [loadingAuto, setLoadingAuto] = useState(false)
  const [notes, setNotes] = useState('')
  const [terminating, setTerminating] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [])

  const currentMonth = firstOfMonth(new Date())

  const [activityForm, setActivityForm] = useState({
    name: '', type: 'feria', description: '', planned_leads: '',
    activity_date: '', location: '',
  })

  const loadData = useCallback(async () => {
    const [actRes, repRes] = await Promise.all([
      fetch(`/api/portal/activities?month=${currentMonth}`),
      fetch('/api/portal/reports'), // all months for history
    ])
    if (actRes.ok) { const d = await actRes.json(); setActivities(d.activities ?? []) }
    if (repRes.ok) { const d = await repRes.json(); setReports(d.reports ?? []) }
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { loadData() }, [loadData])

  async function createActivity(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/portal/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...activityForm, month: currentMonth, planned_leads: activityForm.planned_leads || null }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error.'); setSaving(false); return }
    setActivityForm({ name: '', type: 'feria', description: '', planned_leads: '', activity_date: '', location: '' })
    setShowNewActivity(false)
    await loadData()
    setSaving(false)
  }

  async function markTerminada(actId: string) {
    setTerminating(actId)
    const res = await fetch(`/api/portal/activities/${actId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'terminada' }),
    })
    if (res.ok) await loadData()
    setTerminating(null)
  }

  async function deleteActivity(actId: string) {
    if (!confirm('¿Eliminar esta actividad?')) return
    await fetch(`/api/portal/activities/${actId}`, { method: 'DELETE' })
    await loadData()
  }

  async function loadAutoStats() {
    setLoadingAuto(true)
    const res = await fetch('/api/portal/reports', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: currentMonth }),
    })
    if (res.ok) { const d = await res.json(); setAutoStats(d) }
    setLoadingAuto(false)
  }

  async function submitPerformance() {
    if (!autoStats) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/portal/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: currentMonth,
        report_type: 'performance',
        leads_acquired: autoStats.leads_acquired,
        leads_enrolled: autoStats.leads_enrolled,
        activities_completed: autoStats.activities_completed,
        auto_calculate: true,
        notes,
      }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Error.'); setSaving(false); return }
    setSuccess('Informe de cierre enviado exitosamente.')
    await loadData()
    setSaving(false)
  }

  const performanceReport = reports.find((r) => r.report_type === 'performance' && r.month === currentMonth)
  const pastReports = reports.filter((r) => r.report_type === 'performance' && r.month !== currentMonth)
  const score = autoStats?.performance_score ?? performanceReport?.performance_score ?? null
  const scoreCfg = score ? SCORE_CONFIG[score] : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Plan y Reportes</h1>
          <a href="/portal/dashboard" className="text-sm text-navy hover:underline">← Dashboard</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-5 text-sm text-gray-500">
          Mes actual: <span className="font-semibold text-gray-800 capitalize">{monthLabel(currentMonth)}</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['plan', 'cierre'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'plan' ? 'Plan del Mes' : 'Informe de Cierre'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2 items-start">
            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* ── PLAN TAB ────────────────────────────────────────────── */}
        {activeTab === 'plan' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Planifica las actividades que realizarás este mes para generar leads.</p>
              <button onClick={() => setShowNewActivity(!showNewActivity)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors">
                <Plus className="h-4 w-4" /> Nueva Actividad
              </button>
            </div>

            {showNewActivity && (
              <form onSubmit={createActivity} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Nueva Actividad</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Nombre <span className="text-red-500">*</span></label>
                    <input type="text" required value={activityForm.name} onChange={(e) => setActivityForm((p) => ({ ...p, name: e.target.value }))} className="form-input" placeholder="Nombre de la actividad" />
                  </div>
                  <div>
                    <label className="form-label">Tipo <span className="text-red-500">*</span></label>
                    <select value={activityForm.type} onChange={(e) => setActivityForm((p) => ({ ...p, type: e.target.value }))} className="form-input">
                      {ACTIVITY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Fecha de la Actividad</label>
                    <input type="date" value={activityForm.activity_date} onChange={(e) => setActivityForm((p) => ({ ...p, activity_date: e.target.value }))} className="form-input" />
                  </div>
                  <div>
                    <label className="form-label">Lugar</label>
                    <input type="text" value={activityForm.location} onChange={(e) => setActivityForm((p) => ({ ...p, location: e.target.value }))} className="form-input" placeholder="Ej: Escuela Superior de Barranquitas" />
                  </div>
                  <div>
                    <label className="form-label">Leads Esperados</label>
                    <input type="number" min={0} value={activityForm.planned_leads} onChange={(e) => setActivityForm((p) => ({ ...p, planned_leads: e.target.value }))} className="form-input" placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Descripción</label>
                    <input type="text" value={activityForm.description} onChange={(e) => setActivityForm((p) => ({ ...p, description: e.target.value }))} className="form-input" placeholder="Opcional" />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowNewActivity(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                  <Button type="submit" variant="gold" size="sm" loading={saving}>Guardar Actividad</Button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 flex justify-center">
                <div className="animate-spin h-6 w-6 rounded-full border-4 border-navy border-t-transparent" />
              </div>
            ) : activities.length === 0 && !showNewActivity ? (
              <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                <QrCode className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hay actividades planificadas para este mes.</p>
                <p className="text-xs text-gray-400 mt-1">Agrega una actividad para generar un código QR de captación.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activities.map((act) => {
                  const qrUrl = origin ? `${origin}/intake?activity_id=${act.id}` : ''
                  const isTerminating = terminating === act.id
                  return (
                    <div key={act.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{act.name}</p>
                            {act.status === 'terminada' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                <CheckCircle className="h-3 w-3" /> Terminada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
                                Planificada
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {ACTIVITY_TYPES.find((t) => t.value === act.type)?.label ?? act.type}
                          </p>
                          {act.activity_date && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Calendar className="h-3 w-3" /> {formatDate(act.activity_date)}
                            </span>
                          )}
                          {act.location && (
                            <span className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <MapPin className="h-3 w-3" /> {act.location}
                            </span>
                          )}
                          {act.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{act.description}</p>
                          )}
                        </div>
                        <button onClick={() => deleteActivity(act.id)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Lead count */}
                      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        <span>Leads esperados: <strong className="text-gray-700">{act.planned_leads ?? '—'}</strong></span>
                        <span>Generados: <strong className={act.actual_leads != null ? 'text-green-700' : 'text-gray-400'}>{act.actual_leads ?? '—'}</strong></span>
                      </div>

                      {/* QR Code */}
                      {qrUrl && (
                        <div className="flex flex-col items-center gap-2 pt-1 border-t border-gray-100">
                          <p className="text-xs text-gray-500 font-medium">Código QR de captación</p>
                          <QRCanvas url={qrUrl} />
                          <p className="text-xs text-gray-400 text-center break-all max-w-full">{qrUrl}</p>
                        </div>
                      )}

                      {/* Terminada button */}
                      {act.status === 'planificada' && (
                        <button
                          onClick={() => markTerminada(act.id)}
                          disabled={isTerminating}
                          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40"
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {isTerminating ? 'Marcando…' : 'Marcar como terminada'}
                        </button>
                      )}
                      {act.status === 'terminada' && act.actual_leads != null && (
                        <p className="text-center text-xs text-green-600 font-medium">
                          ✓ {act.actual_leads} lead{act.actual_leads !== 1 ? 's' : ''} generados en esta actividad
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CIERRE TAB ──────────────────────────────────────────── */}
        {activeTab === 'cierre' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Informe de Cierre del Mes</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Resumen de tu desempeño durante {monthLabel(currentMonth)}.</p>
                </div>
                {performanceReport && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> Enviado
                  </span>
                )}
              </div>

              {/* Auto-calculate button */}
              {!autoStats && (
                <button
                  onClick={loadAutoStats}
                  disabled={loadingAuto}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40 mb-5"
                >
                  <Zap className="h-4 w-4" />
                  {loadingAuto ? 'Calculando…' : 'Generar reporte automático'}
                </button>
              )}

              {/* Stats display */}
              {autoStats && (
                <div className="space-y-5">
                  {/* Score badge */}
                  {scoreCfg && (
                    <div className={`rounded-xl border p-4 ${scoreCfg.bg} ${scoreCfg.border}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold ${scoreCfg.badge}`}>
                          {autoStats.performance_score === 'excelente' ? '★' :
                           autoStats.performance_score === 'bueno' ? '▲' :
                           autoStats.performance_score === 'basico' ? '●' : '▼'}
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Puntuación de Desempeño</p>
                          <p className={`text-2xl font-bold capitalize ${scoreCfg.text}`}>{scoreCfg.label}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: Users,         label: 'Total Leads',        value: autoStats.leads_acquired,         color: 'text-navy' },
                      { icon: TrendingUp,    label: 'De Actividades',     value: autoStats.leads_from_activities,  color: 'text-gold' },
                      { icon: Users,         label: 'Manuales',           value: autoStats.leads_manual,           color: 'text-gray-600' },
                      { icon: GraduationCap, label: 'Matriculados',       value: autoStats.leads_enrolled,         color: 'text-green-600' },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                        <p className="text-xl font-bold text-gray-900">{value}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Progress toward targets */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Progreso hacia metas</p>
                    {[
                      { label: 'Meta Básico (100 leads)', max: 100, value: autoStats.leads_acquired, color: 'bg-amber-400' },
                      { label: 'Meta Bueno (150 leads)',  max: 150, value: autoStats.leads_acquired, color: 'bg-blue-500' },
                      { label: 'Meta Excelente (200 leads)', max: 200, value: autoStats.leads_acquired, color: 'bg-green-500' },
                      { label: 'Matriculados · Meta Básico (10)', max: 10, value: autoStats.leads_enrolled, color: 'bg-amber-400' },
                      { label: 'Matriculados · Meta Excelente (20)', max: 20, value: autoStats.leads_enrolled, color: 'bg-green-500' },
                    ].map(({ label, max, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{label}</span>
                          <span>{value} / {max}</span>
                        </div>
                        <ProgressBar value={value} max={max} color={color} />
                      </div>
                    ))}
                  </div>

                  {/* Actividades completadas */}
                  <p className="text-xs text-gray-500">
                    Actividades completadas este mes: <span className="font-semibold text-gray-700">{autoStats.activities_completed}</span>
                  </p>

                  {/* Notes */}
                  <div>
                    <label className="form-label">Notas / Observaciones (opcional)</label>
                    <textarea
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="form-input resize-none"
                      placeholder="Describe los logros, retos y observaciones del mes…"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={loadAutoStats}
                      disabled={loadingAuto}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                      Recalcular
                    </button>
                    <Button variant="gold" size="sm" loading={saving} onClick={submitPerformance}>
                      {performanceReport ? 'Actualizar Informe' : 'Enviar Informe de Cierre'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Show saved report if no autoStats yet */}
              {!autoStats && performanceReport && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Leads Adquiridos', value: performanceReport.leads_acquired },
                      { label: 'Leads Matriculados', value: performanceReport.leads_enrolled },
                      { label: 'Actividades', value: performanceReport.activities_completed },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                        <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
                        <p className="text-xs text-gray-500">{label}</p>
                      </div>
                    ))}
                  </div>
                  {performanceReport.performance_score && (() => {
                    const cfg = SCORE_CONFIG[performanceReport.performance_score]
                    return (
                      <div className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
                        <p className="text-xs text-gray-500">Puntuación guardada</p>
                        <p className={`text-xl font-bold capitalize ${cfg.text}`}>{cfg.label}</p>
                      </div>
                    )
                  })()}
                  {performanceReport.notes && (
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{performanceReport.notes}</p>
                  )}
                </div>
              )}
            </div>

            {/* Scoring rubric */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Tabla de Puntuación</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-600">Puntuación</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-600">Leads Generados</th>
                      <th className="text-left py-2 font-semibold text-gray-600">Matriculados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {[
                      { score: 'excelente', leads: '≥ 200',   enrolled: '≥ 20' },
                      { score: 'bueno',     leads: '150–199', enrolled: '15–19' },
                      { score: 'basico',    leads: '100–149', enrolled: '10–14' },
                      { score: 'deficiente',leads: '< 100',   enrolled: '< 10' },
                    ].map(({ score, leads, enrolled }) => {
                      const cfg = SCORE_CONFIG[score as keyof typeof SCORE_CONFIG]
                      return (
                        <tr key={score}>
                          <td className="py-2 pr-4">
                            <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-white ${cfg.badge}`}>{cfg.label}</span>
                          </td>
                          <td className="py-2 pr-4 text-gray-600">{leads}</td>
                          <td className="py-2 text-gray-600">{enrolled}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">Ambas condiciones (leads Y matriculados) deben cumplirse para la puntuación más alta.</p>
            </div>

            {/* Past reports history */}
            {pastReports.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">Historial de Informes Anteriores</p>
                <div className="space-y-3">
                  {pastReports.map((r) => {
                    const cfg = r.performance_score ? SCORE_CONFIG[r.performance_score] : null
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-gray-800 capitalize">{monthLabel(r.month)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.leads_acquired ?? '—'} leads · {r.leads_enrolled ?? '—'} matriculados · {r.activities_completed ?? '—'} actividades
                          </p>
                          {r.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{r.notes}</p>}
                        </div>
                        {cfg && (
                          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
