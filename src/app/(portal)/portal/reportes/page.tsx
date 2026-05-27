'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Plus, CheckCircle, AlertCircle, MapPin, Calendar,
  QrCode, Flag, Trash2, Zap, TrendingUp, Users, GraduationCap, Download,
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

const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function getNextMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().slice(0, 10)
}

function getNextMonthInfo() {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const daysLeft = daysInMonth - now.getDate()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const year = nextMonth.getFullYear()
  const month = nextMonth.getMonth()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`
  const daysInNextMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = nextMonth.getDay()
  return { daysLeft, monthStr, year, month, daysInNextMonth, firstDayOfWeek }
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

interface TeamReportLead {
  id: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  campus: string | null
  programa_interes: string | null
  horario: string | null
  source: string | null
  lead_source_text: string | null
  assignment_source: string | null
  status: string
  created_at: string
  last_action_at: string
  rep_name: string
  activity_name: string | null
  history: { action_type: string; old_status: string | null; new_status: string | null; note: string | null; communication_type: string | null; created_at: string; employee_name: string | null }[]
}

interface TeamReportActivity {
  id: string
  name: string
  type: string
  activity_date: string | null
  location: string | null
  planned_leads: number | null
  actual_leads: number | null
  status: string
  rep_name: string
}

interface TeamReportData {
  month: string
  supervisor_name: string
  team_members: { id: string; full_name: string; campus: string[] }[]
  leads: TeamReportLead[]
  activities: TeamReportActivity[]
}

export default function ReportesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [reports, setReports] = useState<MonthlyReport[]>([])
  const [role, setRole] = useState<string>('empleado')
  const [activeTab, setActiveTab] = useState<'plan' | 'cierre' | 'equipo'>('plan')
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
  const [teamMonth, setTeamMonth] = useState(firstOfMonth(new Date()))
  const [loadingReport, setLoadingReport] = useState(false)
  const [planNotes, setPlanNotes] = useState<Record<string, string>>({})
  const [planSaving, setPlanSaving] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const planSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [gateStatus, setGateStatus] = useState<{ required: boolean; complete: boolean; calendarDays: number; activitiesCount: number } | null>(null)

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
    if (actRes.ok) {
      const d = await actRes.json(); setActivities(d.activities ?? [])
    } else {
      console.error('[reportes] activities fetch failed:', actRes.status)
    }
    if (repRes.ok) {
      const d = await repRes.json()
      setReports(d.reports ?? [])
      if (d.role) {
        setRole(d.role)
        if (d.role === 'supervisor') {
          const { monthStr, daysLeft } = getNextMonthInfo()
          // During planning window, load next month's activities and gate status
          if (daysLeft <= 5) {
            const nextMonthStart = getNextMonthStart()
            const [actNext, planData, gateData] = await Promise.all([
              fetch(`/api/portal/activities?month=${nextMonthStart}`).then((r) => r.json()),
              fetch(`/api/portal/supervisor-plan?month=${monthStr}`).then((r) => r.json()),
              fetch('/api/portal/supervisor-plan/gate').then((r) => r.json()),
            ])
            setActivities(actNext.activities ?? [])
            if (planData.notes) setPlanNotes(planData.notes)
            setGateStatus(gateData)
          } else {
            fetch(`/api/portal/supervisor-plan?month=${monthStr}`)
              .then((r) => r.json())
              .then((pd) => { if (pd.notes) setPlanNotes(pd.notes) })
              .catch(() => {})
          }
        }
      }
    } else {
      console.error('[reportes] reports fetch failed:', repRes.status)
    }
    setLoading(false)
  }, [currentMonth])

  useEffect(() => { loadData() }, [loadData])

  function updatePlanNote(day: number, value: string) {
    const next = { ...planNotes, [String(day)]: value }
    setPlanNotes(next)
    setPlanSaved(false)
    if (planSaveTimer.current) clearTimeout(planSaveTimer.current)
    planSaveTimer.current = setTimeout(async () => {
      setPlanSaving(true)
      const { monthStr } = getNextMonthInfo()
      await fetch('/api/portal/supervisor-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: monthStr, notes: next }),
      })
      setPlanSaving(false)
      setPlanSaved(true)
      // Refresh gate status so banner updates live
      fetch('/api/portal/supervisor-plan/gate').then((r) => r.json()).then(setGateStatus).catch(() => {})
    }, 800)
  }

  function triggerDownload(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  function buildCsv(data: TeamReportData): string {
    const monthLabel = new Date(data.month + 'T00:00:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
    const headers = ['Mes', 'Representante', 'Nombre', 'Apellido', 'Teléfono', 'Correo', 'Recinto', 'Programa de Interés', 'Horario', 'Estado Actual', 'Origen Web', 'Fuente Manual', 'Actividad', 'Tipo Ingreso', 'Fecha de Ingreso', 'Última Actividad']
    const esc = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = data.leads.map((l) => [
      monthLabel, l.rep_name,
      l.nombre, l.apellido, l.telefono, l.email,
      l.campus ?? '', l.programa_interes ?? '', l.horario ?? '',
      l.status, l.source ?? '', l.lead_source_text ?? '',
      l.activity_name ?? '',
      l.assignment_source === 'manual' ? 'Manual' : 'Formulario Web',
      new Date(l.created_at).toLocaleDateString('es-PR'),
      new Date(l.last_action_at).toLocaleDateString('es-PR'),
    ].map(esc).join(','))
    return [headers.map(esc).join(','), ...rows].join('\r\n')
  }

  function buildHtml(data: TeamReportData): string {
    const ml = new Date(data.month + 'T00:00:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
    const total = data.leads.length
    const matriculados = data.leads.filter((l) => l.status === 'Matriculado').length
    const manuales = data.leads.filter((l) => l.assignment_source === 'manual').length
    const deActividades = data.leads.filter((l) => l.activity_name).length

    // Per-rep stats
    const repMap = new Map<string, { leads: TeamReportLead[]; programs: Map<string, number> }>()
    for (const tm of data.team_members) {
      repMap.set(tm.full_name, { leads: [], programs: new Map() })
    }
    for (const l of data.leads) {
      if (!repMap.has(l.rep_name)) repMap.set(l.rep_name, { leads: [], programs: new Map() })
      const r = repMap.get(l.rep_name)!
      r.leads.push(l)
      const prog = l.programa_interes ?? 'No especificado'
      r.programs.set(prog, (r.programs.get(prog) ?? 0) + 1)
    }

    const td = (v: string) => `<td>${v}</td>`
    const th = (v: string) => `<th>${v}</th>`

    const tableStyle = 'border-collapse:collapse;width:100%;font-size:12px;margin-bottom:24px;'
    const thStyle = 'background:#0a1628;color:#fff;padding:6px 8px;text-align:left;'
    const tdStyle = 'padding:5px 8px;border-bottom:1px solid #e5e7eb;'
    const tdAltStyle = 'padding:5px 8px;border-bottom:1px solid #e5e7eb;background:#f9fafb;'

    const activityTypeLabels: Record<string, string> = { feria: 'Feria', visita_escuela: 'Visita a Escuela', evento_comunitario: 'Evento Comunitario', otro: 'Otro' }

    const repRows = Array.from(repMap.entries()).map(([name, d]) => {
      const topProgs = Array.from(d.programs.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([p, c]) => `${p} (${c})`).join(', ')
      const mat = d.leads.filter((l) => l.status === 'Matriculado').length
      const man = d.leads.filter((l) => l.assignment_source === 'manual').length
      const act = d.leads.filter((l) => l.activity_name).length
      return `<tr><td style="${tdStyle}">${name}</td><td style="${tdStyle}">${d.leads.length}</td><td style="${tdStyle}">${man}</td><td style="${tdStyle}">${act}</td><td style="${tdStyle}">${mat}</td><td style="${tdStyle}">${topProgs || '—'}</td></tr>`
    }).join('')

    const actRows = data.activities.map((a, i) => {
      const s = i % 2 === 0 ? tdStyle : tdAltStyle
      return `<tr><td style="${s}">${a.rep_name}</td><td style="${s}">${a.name}</td><td style="${s}">${activityTypeLabels[a.type] ?? a.type}</td><td style="${s}">${a.activity_date ?? '—'}</td><td style="${s}">${a.location ?? '—'}</td><td style="${s}">${a.planned_leads ?? '—'}</td><td style="${s}">${a.actual_leads ?? '—'}</td><td style="${s}">${a.status === 'terminada' ? 'Terminada' : 'Planificada'}</td></tr>`
    }).join('')

    const leadRows = data.leads.map((l, i) => {
      const s = i % 2 === 0 ? tdStyle : tdAltStyle
      const notes = l.history.filter((h) => h.note).map((h) => h.note).join(' | ')
      return `<tr><td style="${s}">${l.rep_name}</td><td style="${s}">${l.nombre} ${l.apellido}</td><td style="${s}">${l.telefono}</td><td style="${s}">${l.campus ?? '—'}</td><td style="${s}">${l.programa_interes ?? '—'}</td><td style="${s}">${l.status}</td><td style="${s}">${l.source ?? l.lead_source_text ?? '—'}</td><td style="${s}">${new Date(l.created_at).toLocaleDateString('es-PR')}</td><td style="${s}">${notes || '—'}</td></tr>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Reporte del Equipo — ${cap(ml)}</title>
<style>body{font-family:Arial,sans-serif;color:#1f2937;margin:32px;} h1{color:#0a1628;} h2{color:#0a1628;border-bottom:2px solid #c9a227;padding-bottom:4px;margin-top:32px;} .summary-grid{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;} .stat{background:#f3f4f6;border-radius:8px;padding:12px 20px;min-width:120px;text-align:center;} .stat-val{font-size:28px;font-weight:bold;color:#0a1628;} .stat-lbl{font-size:12px;color:#6b7280;} table{${tableStyle}} th{${thStyle}} @media print{body{margin:16px;}}</style>
</head>
<body>
<h1>Reporte del Equipo</h1>
<p style="color:#6b7280;margin-top:-8px;">${cap(ml)} &nbsp;·&nbsp; Supervisor: ${data.supervisor_name}</p>

<h2>Resumen Ejecutivo</h2>
<div class="summary-grid">
  <div class="stat"><div class="stat-val">${total}</div><div class="stat-lbl">Leads Totales</div></div>
  <div class="stat"><div class="stat-val">${matriculados}</div><div class="stat-lbl">Matriculados</div></div>
  <div class="stat"><div class="stat-val">${manuales}</div><div class="stat-lbl">Ingresados Manual</div></div>
  <div class="stat"><div class="stat-val">${deActividades}</div><div class="stat-lbl">De Actividades</div></div>
  <div class="stat"><div class="stat-val">${data.activities.length}</div><div class="stat-lbl">Actividades</div></div>
  <div class="stat"><div class="stat-val">${data.team_members.length}</div><div class="stat-lbl">Representantes</div></div>
</div>

<h2>Por Representante</h2>
<table><thead><tr>${[th('Representante'),th('Leads Totales'),th('Manuales'),th('De Actividades'),th('Matriculados'),th('Top Programas')].join('')}</tr></thead><tbody>${repRows}</tbody></table>

<h2>Actividades del Mes</h2>
${data.activities.length === 0 ? '<p style="color:#9ca3af">No hubo actividades este mes.</p>' : `<table><thead><tr>${[th('Representante'),th('Actividad'),th('Tipo'),th('Fecha'),th('Lugar'),th('Leads Esp.'),th('Leads Real'),th('Estado')].join('')}</tr></thead><tbody>${actRows}</tbody></table>`}

<h2>Leads Detallados</h2>
${data.leads.length === 0 ? '<p style="color:#9ca3af">No hubo leads este mes.</p>' : `<table><thead><tr>${[th('Representante'),th('Nombre'),th('Teléfono'),th('Recinto'),th('Programa'),th('Estado'),th('Origen'),th('Fecha Ingreso'),th('Notas / Seguimiento')].join('')}</tr></thead><tbody>${leadRows}</tbody></table>`}

<p style="color:#9ca3af;font-size:11px;margin-top:32px;">Generado el ${new Date().toLocaleDateString('es-PR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} — Data Nest · D'Mart Institute</p>
</body></html>`
  }

  async function downloadReport(format: 'csv' | 'html') {
    setLoadingReport(true)
    const res = await fetch(`/api/portal/reports/team-report?month=${teamMonth}`)
    if (!res.ok) { setLoadingReport(false); return }
    const data: TeamReportData = await res.json()
    const label = teamMonth.slice(0, 7) // YYYY-MM
    if (format === 'csv') {
      triggerDownload(buildCsv(data), `reporte-equipo-${label}.csv`, 'text/csv;charset=utf-8;')
    } else {
      triggerDownload(buildHtml(data), `reporte-equipo-${label}.html`, 'text/html;charset=utf-8;')
    }
    setLoadingReport(false)
  }

  async function createActivity(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/portal/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...activityForm,
        month: (role === 'supervisor' && getNextMonthInfo().daysLeft <= 5) ? getNextMonthStart() : currentMonth,
        planned_leads: activityForm.planned_leads || null,
      }),
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
  const allPerformanceReports = reports.filter((r) => r.report_type === 'performance')
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
          {([
            { key: 'plan',   label: 'Plan del Mes' },
            { key: 'cierre', label: 'Informe de Cierre' },
            ...(role === 'supervisor' ? [{ key: 'equipo', label: 'Equipo' }] : []),
          ] as { key: 'plan' | 'cierre' | 'equipo'; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
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

            {/* Gate progress banner */}
            {gateStatus?.required && !gateStatus.complete && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm font-bold text-red-800 mb-2">⚠ Completa tu plan para acceder a los leads</p>
                <div className="flex flex-wrap gap-4 text-sm text-red-700">
                  <span>{gateStatus.calendarDays >= 5 ? '✓' : `${gateStatus.calendarDays}/5`} días del calendario con texto</span>
                  <span>{gateStatus.activitiesCount >= 2 ? '✓' : `${gateStatus.activitiesCount}/2`} actividades de {MONTH_NAMES_ES[getNextMonthInfo().month]}</span>
                </div>
              </div>
            )}
            {gateStatus?.required && gateStatus.complete && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-bold text-green-800">✓ Plan completado — ya puedes acceder a los leads</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {gateStatus?.required
                  ? `Planifica tus actividades para ${MONTH_NAMES_ES[getNextMonthInfo().month]} ${getNextMonthInfo().year}.`
                  : 'Planifica las actividades que realizarás este mes para generar leads.'}
              </p>
              <button onClick={() => setShowNewActivity(!showNewActivity)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors">
                <Plus className="h-4 w-4" /> Nueva Actividad
              </button>
            </div>

            {/* ── Calendario de planificación — solo supervisores, últimos 5 días del mes ── */}
            {role === 'supervisor' && (() => {
              const { daysLeft, month, year, daysInNextMonth, firstDayOfWeek } = getNextMonthInfo()
              if (daysLeft > 5) return null
              const blanks = Array(firstDayOfWeek).fill(null)
              const days = Array.from({ length: daysInNextMonth }, (_, i) => i + 1)
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900">
                      Planifica tu mes — {MONTH_NAMES_ES[month]} {year}
                    </h3>
                    <div className="ml-auto text-xs">
                      {planSaving && <span className="text-amber-500">Guardando…</span>}
                      {planSaved && !planSaving && <span className="text-green-600">Guardado ✓</span>}
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mb-4">
                    El mes siguiente está por comenzar. Escribe en cada día qué actividades planeas realizar.
                  </p>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map((d) => (
                      <div key={d} className="text-center text-xs font-semibold text-amber-700 py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {blanks.map((_, i) => <div key={`b${i}`} />)}
                    {days.map((day) => (
                      <div key={day} className="bg-white border border-amber-100 rounded-lg p-1.5 min-h-[72px] flex flex-col">
                        <span className="text-xs font-bold text-amber-800 mb-1">{day}</span>
                        <textarea
                          rows={2}
                          value={planNotes[String(day)] ?? ''}
                          onChange={(e) => updatePlanNote(day, e.target.value)}
                          placeholder="…"
                          className="flex-1 text-xs text-gray-700 resize-none border-0 outline-none bg-transparent placeholder-gray-300 leading-tight"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

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

            {/* All submitted reports history */}
            {allPerformanceReports.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Historial de Informes Enviados
                </p>
                <div className="divide-y divide-gray-50">
                  {allPerformanceReports.map((r) => {
                    const cfg = r.performance_score ? SCORE_CONFIG[r.performance_score] : null
                    const isCurrentMonth = r.month === currentMonth
                    return (
                      <div key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800 capitalize">{monthLabel(r.month)}</p>
                            {isCurrentMonth && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">Este mes</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.leads_acquired ?? '—'} leads · {r.leads_enrolled ?? '—'} matriculados · {r.activities_completed ?? '—'} actividades
                          </p>
                          {r.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 italic">{r.notes}</p>}
                          <p className="text-xs text-gray-400 mt-0.5">
                            Enviado: {new Date(r.created_at).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        {cfg && (
                          <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
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

        {/* ── EQUIPO TAB (supervisor only) ─────────────────────────── */}
        {activeTab === 'equipo' && role === 'supervisor' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-5">
                <h2 className="text-sm font-bold text-gray-900">Reporte del Equipo</h2>
                <p className="text-xs text-gray-500 mt-0.5">Descarga el reporte completo de leads del mes seleccionado.</p>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="form-label">Mes</label>
                  <select
                    value={teamMonth}
                    onChange={(e) => setTeamMonth(e.target.value)}
                    className="form-input w-auto text-sm"
                  >
                    {Array.from({ length: 12 }, (_, i) => {
                      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
                      const v = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
                      return <option key={v} value={v}>{monthLabel(v)}</option>
                    })}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => downloadReport('csv')}
                    disabled={loadingReport}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    {loadingReport ? 'Generando…' : 'Descargar CSV'}
                  </button>
                  <button
                    onClick={() => downloadReport('html')}
                    disabled={loadingReport}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40"
                  >
                    <Download className="h-4 w-4" />
                    {loadingReport ? 'Generando…' : 'Descargar HTML'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
              <p className="text-xs text-amber-800">
                <span className="font-semibold">CSV</span> — ideal para análisis en Excel o Google Sheets. Una fila por lead con todos los campos.
              </p>
              <p className="text-xs text-amber-700">
                <span className="font-semibold">HTML</span> — reporte formateado listo para imprimir o compartir con el director. Incluye resumen ejecutivo, desglose por representante, actividades y lista completa de leads.
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body > *:not(.min-h-screen) { display: none !important; }
          nav, header, .print\\:hidden { display: none !important; }
          .min-h-screen { background: white !important; }
        }
      `}</style>
    </div>
  )
}
