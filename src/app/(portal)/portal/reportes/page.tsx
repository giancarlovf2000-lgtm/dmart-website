'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Plus, CheckCircle, AlertCircle, MapPin, Calendar,
  QrCode, Flag, Trash2, Zap, TrendingUp, Users, GraduationCap, Download, Megaphone,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { ALL_PROGRAMS, LEAD_STATUS_ORDER, STATIC_PROGRAMS, PRIVADOS_SABATINOS } from '@/lib/utils'
import type { Activity, MonthlyReport } from '@/lib/types'

// Apoyo en redes: cada programa marcado por el supervisor lleva sección y fecha.
type SocialShift = 'diurno' | 'nocturno' | 'sabatino'
type SocialEntry = { program: string; shift: SocialShift; start_date: string | null }

const SABATINO_TITLES = new Set(PRIVADOS_SABATINOS.map((s) => s.title))

// Normaliza lo que viene del servidor (arreglo de strings antiguo o de objetos nuevo).
function normalizeSocial(raw: unknown): SocialEntry[] {
  if (!Array.isArray(raw)) return []
  const out: SocialEntry[] = []
  for (const e of raw) {
    if (typeof e === 'string') {
      out.push({ program: e, shift: SABATINO_TITLES.has(e) ? 'sabatino' : 'diurno', start_date: null })
    } else if (e && typeof e === 'object') {
      const o = e as Record<string, unknown>
      if (typeof o.program !== 'string') continue
      const shift: SocialShift = o.shift === 'nocturno' ? 'nocturno' : o.shift === 'sabatino' ? 'sabatino' : 'diurno'
      const start_date = typeof o.start_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.start_date) ? o.start_date : null
      out.push({ program: o.program, shift, start_date })
    }
  }
  return out
}

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

const ACTION_LABELS_ES: Record<string, string> = {
  status_change: 'Cambio estado', note_added: 'Nota', lead_created: 'Creado',
  lead_assigned: 'Asignado', followup_scheduled: 'Follow-up', followup_done: 'Follow-up cerrado',
}

type HistEntry = { action_type: string; old_status: string | null; new_status: string | null; note: string | null; communication_type: string | null; created_at: string; employee_name: string | null }

function fmtHistEntry(h: HistEntry): string {
  const d = new Date(h.created_at).toLocaleDateString('es-PR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const tipo = h.communication_type || ACTION_LABELS_ES[h.action_type] || h.action_type
  const arrow = h.old_status && h.new_status ? ` (${h.old_status} → ${h.new_status})` : ''
  return `${d} ${tipo}${arrow}${h.note ? ': ' + h.note : ''}`
}

function seguimientosText(history: HistEntry[]): string {
  return history.length ? history.map(fmtHistEntry).join(' | ') : '—'
}

function rangeLabel(data: { from?: string | null; to?: string | null; month: string }): string {
  const f = data.from || data.month
  const t = data.to
  const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('es-PR', { day: 'numeric', month: 'short', year: 'numeric' })
  return t ? `${fmt(f)} – ${fmt(t)}` : new Date(f + 'T00:00:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
}

// Campos seleccionables del reporte (columnas por lead). 'seguimientos' activa el historial bajo cada lead.
const REPORT_FIELDS: { key: string; label: string }[] = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'email', label: 'Correo' },
  { key: 'programa', label: 'Programa' },
  { key: 'horario', label: 'Horario' },
  { key: 'recinto', label: 'Recinto' },
  { key: 'estatus', label: 'Estatus' },
  { key: 'origen', label: 'Origen' },
  { key: 'fecha', label: 'Fecha de ingreso' },
  { key: 'actividad', label: 'Actividad' },
  { key: 'seguimientos', label: 'Seguimientos' },
]

interface ActivityLead {
  id: string
  nombre: string
  apellido: string
  telefono: string
  programa_interes: string | null
  campus: string | null
  status: string
  created_at: string
  assignment_source: string | null
}

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
  from?: string | null
  to?: string | null
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
  // Reporte de equipo: filtros + vista previa
  const [teamFrom, setTeamFrom] = useState(firstOfMonth(new Date()))
  const [teamTo, setTeamTo] = useState(new Date().toISOString().slice(0, 10))
  const [teamProgram, setTeamProgram] = useState('')
  const [teamStatus, setTeamStatus] = useState('')
  const [teamHorario, setTeamHorario] = useState('')
  const [teamReport, setTeamReport] = useState<TeamReportData | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportFields, setReportFields] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(REPORT_FIELDS.map((f) => [f.key, true]))
  )
  // Modal: leads de una actividad
  const [actLeadsModal, setActLeadsModal] = useState<{ name: string; loading: boolean; leads: ActivityLead[] } | null>(null)
  const [planNotes, setPlanNotes] = useState<Record<string, string>>({})
  const [planSaving, setPlanSaving] = useState(false)
  const [planSaved, setPlanSaved] = useState(false)
  const planSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Programas que el supervisor solicita para apoyo en redes (por mes).
  const [socialPrograms, setSocialPrograms] = useState<SocialEntry[]>([])
  const [socialSaving, setSocialSaving] = useState(false)
  const [socialSaved, setSocialSaved] = useState(false)
  const socialSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const planNotesRef = useRef<Record<string, string>>({})
  const [gateStatus, setGateStatus] = useState<{ required: boolean; complete: boolean; calendarDays: number; activitiesCount: number } | null>(null)
  const [planMonth, setPlanMonth] = useState(() =>
    getNextMonthInfo().daysLeft <= 5 ? getNextMonthStart() : firstOfMonth(new Date())
  )
  const [campusActivities, setCampusActivities] = useState<{
    id: string; employee_name: string | null; name: string; type: string
    description: string | null; activity_date: string | null; location: string | null
    planned_leads: number | null; actual_leads: number | null; status: 'planificada' | 'terminada'
  }[]>([])
  const [campusCalendars, setCampusCalendars] = useState<{
    supervisor_id: string; full_name: string; role: string; campus: string[]
    plan_month: string; notes: Record<string, string>
  }[]>([])

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
      fetch(`/api/portal/activities?month=${planMonth}`),
      fetch('/api/portal/reports'),
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
        // El admin solo usa la pestaña de reporte de equipo.
        if (d.role === 'admin') setActiveTab('equipo')
        // El calendario de planificación es para empleados y supervisores.
        if (d.role === 'empleado' || d.role === 'supervisor') {
          fetch(`/api/portal/supervisor-plan?month=${planMonth.slice(0, 7)}`)
            .then((r) => r.json())
            .then((pd) => { if (pd.notes) setPlanNotes(pd.notes); setSocialPrograms(normalizeSocial(pd.social_programs)) })
            .catch(() => {})
        }
        // El gate de planificación solo aplica a supervisores.
        if (d.role === 'supervisor') {
          fetch('/api/portal/supervisor-plan/gate').then((r) => r.json()).then(setGateStatus).catch(() => {})
        }
      }
    } else {
      console.error('[reportes] reports fetch failed:', repRes.status)
    }
    setLoading(false)
  }, [planMonth])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (role !== 'empleado' && role !== 'supervisor') return
    setPlanNotes({})
    setSocialPrograms([])
    fetch(`/api/portal/supervisor-plan?month=${planMonth.slice(0, 7)}`)
      .then((r) => r.json())
      .then((pd) => { if (pd.notes) setPlanNotes(pd.notes); setSocialPrograms(normalizeSocial(pd.social_programs)) })
      .catch(() => {})
  }, [role, planMonth])

  useEffect(() => {
    if (role !== 'director') return
    const calendarMonthStr = planMonth.slice(0, 7)
    Promise.all([
      fetch(`/api/portal/admin/activities?month=${planMonth}`).then((r) => r.json()),
      fetch(`/api/portal/admin/calendars?month=${calendarMonthStr}`).then((r) => r.json()),
    ]).then(([actData, calData]) => {
      setCampusActivities(actData.activities ?? [])
      setCampusCalendars(calData.plans ?? [])
    }).catch(() => {})
  }, [role, planMonth])

  // Mantener una referencia fresca de las notas para el guardado de programas de redes.
  useEffect(() => { planNotesRef.current = planNotes }, [planNotes])

  function saveSocial(next: SocialEntry[]) {
    setSocialPrograms(next)
    setSocialSaved(false)
    if (socialSaveTimer.current) clearTimeout(socialSaveTimer.current)
    socialSaveTimer.current = setTimeout(async () => {
      setSocialSaving(true)
      await fetch('/api/portal/supervisor-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: planMonth.slice(0, 7), notes: planNotesRef.current, social_programs: next }),
      })
      setSocialSaving(false)
      setSocialSaved(true)
    }, 600)
  }

  function getEntry(program: string, shift: SocialShift): SocialEntry | undefined {
    return socialPrograms.find((e) => e.program === program && e.shift === shift)
  }

  function toggleSection(program: string, shift: SocialShift) {
    const exists = getEntry(program, shift)
    const next = exists
      ? socialPrograms.filter((e) => !(e.program === program && e.shift === shift))
      : [...socialPrograms, { program, shift, start_date: null }]
    saveSocial(next)
  }

  function setSectionDate(program: string, shift: SocialShift, date: string) {
    const start_date = date || null
    const exists = getEntry(program, shift)
    const next = exists
      ? socialPrograms.map((e) => (e.program === program && e.shift === shift ? { ...e, start_date } : e))
      : [...socialPrograms, { program, shift, start_date }]
    saveSocial(next)
  }

  function updatePlanNote(day: number, value: string) {
    const next = { ...planNotes, [String(day)]: value }
    setPlanNotes(next)
    setPlanSaved(false)
    if (planSaveTimer.current) clearTimeout(planSaveTimer.current)
    planSaveTimer.current = setTimeout(async () => {
      setPlanSaving(true)
      await fetch('/api/portal/supervisor-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: planMonth.slice(0, 7), notes: next }),
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

  // Valor de un campo seleccionable para un lead.
  function fieldVal(l: TeamReportLead, key: string): string {
    switch (key) {
      case 'nombre': return `${l.nombre} ${l.apellido}`.trim()
      case 'telefono': return l.telefono ?? '—'
      case 'email': return l.email || '—'
      case 'programa': return l.programa_interes ?? '—'
      case 'horario': return l.horario ?? '—'
      case 'recinto': return l.campus ?? '—'
      case 'estatus': return l.status
      case 'origen': return l.source ?? l.lead_source_text ?? '—'
      case 'fecha': return new Date(l.created_at).toLocaleDateString('es-PR')
      case 'actividad': return l.activity_name ?? '—'
      default: return ''
    }
  }
  const selectedCols = () => REPORT_FIELDS.filter((f) => f.key !== 'seguimientos' && reportFields[f.key])
  const showSegs = () => !!reportFields['seguimientos']

  function buildCsv(data: TeamReportData): string {
    const periodo = rangeLabel(data)
    const cols = selectedCols()
    const headers = ['Periodo', 'Representante', ...cols.map((c) => c.label), ...(showSegs() ? ['Seguimientos (con fechas)'] : [])]
    const esc = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const rows = data.leads.map((l) => [
      periodo, l.rep_name,
      ...cols.map((c) => fieldVal(l, c.key)),
      ...(showSegs() ? [seguimientosText(l.history)] : []),
    ].map(esc).join(','))
    return [headers.map(esc).join(','), ...rows].join('\r\n')
  }

  // Reporte segmentado por empleado (estilo imprimible para PDF).
  function buildHtml(data: TeamReportData): string {
    const ml = rangeLabel(data)
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const cols = selectedCols()
    const segs = showSegs()
    const ncols = cols.length || 1

    // Agrupar leads por representante.
    const byRep = new Map<string, TeamReportLead[]>()
    for (const tm of data.team_members) byRep.set(tm.full_name, [])
    for (const l of data.leads) {
      if (!byRep.has(l.rep_name)) byRep.set(l.rep_name, [])
      byRep.get(l.rep_name)!.push(l)
    }
    const actsByRep = (name: string) => data.activities.filter((a) => a.rep_name === name).length
    const matByRep = (leads: TeamReportLead[]) => leads.filter((l) => l.status === 'Matriculado').length

    const reps = Array.from(byRep.entries())
    const totalLeads = data.leads.length
    const totalMat = data.leads.filter((l) => l.status === 'Matriculado').length
    const totalActs = data.activities.length

    // Resumen general (cabecera oscura).
    const summaryRows = reps.map(([name, leads]) =>
      `<tr><td>${esc(name)}</td><td style="text-align:center">${leads.length}</td><td style="text-align:center">${actsByRep(name)}</td><td style="text-align:center">${matByRep(leads)}</td></tr>`
    ).join('')

    // Secciones por empleado (solo los que tienen leads).
    const sections = reps.filter(([, leads]) => leads.length > 0).map(([name, leads], idx) => {
      const head = cols.map((c) => `<th>${esc(c.label)}</th>`).join('')
      const body = leads.map((l) => {
        const cells = cols.map((c) => `<td>${esc(fieldVal(l, c.key))}</td>`).join('')
        const segRow = segs
          ? `<tr class="segrow"><td colspan="${ncols}"><div class="segbox">${l.history.length ? l.history.map((h) => `<div>${esc(fmtHistEntry(h))}</div>`).join('') : '<span style="color:#9ca3af">Sin seguimientos.</span>'}</div></td></tr>`
          : ''
        return `<tr class="leadrow">${cells}</tr>${segRow}`
      }).join('')
      return `<section class="emp">
        <div class="emp-head">
          <div class="emp-name"><span class="emp-idx">${String(idx + 1).padStart(2, '0')}</span> ${esc(name)}</div>
          <div class="emp-chips"><span>${leads.length} leads</span><span>${matByRep(leads)} matriculados</span><span>${actsByRep(name)} actividades</span></div>
        </div>
        <table class="leads"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
      </section>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Reporte de Leads — ${esc(ml)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,"Segoe UI",Arial,sans-serif;color:#1f2937;margin:0;padding:28px;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .doc-head{border-bottom:3px solid #D40000;padding-bottom:12px;margin-bottom:18px}
  .doc-head h1{margin:0;font-size:22px;color:#141414}
  .doc-head p{margin:4px 0 0;color:#6b7280;font-size:12px}
  .sumtitle{font-size:13px;font-weight:700;color:#141414;margin:18px 0 8px}
  table{border-collapse:collapse;width:100%}
  .summary{margin-bottom:8px}
  .summary th{background:#141414;color:#fff;padding:8px 10px;text-align:left;font-size:11px}
  .summary th:not(:first-child){text-align:center}
  .summary td{padding:7px 10px;border-bottom:1px solid #e5e7eb}
  .summary tr:last-child td{font-weight:700;background:#f6f5f3}
  .emp{margin-top:18px;page-break-inside:avoid}
  .emp-head{background:#141414;color:#fff;border-radius:10px 10px 0 0;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .emp-name{font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:.3px}
  .emp-idx{display:inline-block;background:#D40000;border-radius:50%;width:24px;height:24px;line-height:24px;text-align:center;font-size:11px;margin-right:8px}
  .emp-chips span{font-size:11px;color:#e9b9b9;margin-left:14px}
  table.leads{border:1px solid #e5e7eb;border-top:0}
  table.leads th{background:#f6f5f3;color:#374151;padding:6px 9px;text-align:left;font-size:10.5px;border-bottom:1px solid #e5e7eb}
  table.leads td{padding:6px 9px;border-bottom:1px solid #eef0f2;vertical-align:top}
  tr.leadrow td{font-size:11.5px}
  .segbox{background:#fff8e6;border:1px solid #ffe2a8;border-radius:8px;padding:8px 10px;margin:2px 0 6px;font-size:10.5px;line-height:1.5;color:#5b4a1a}
  .segbox div{margin:1px 0}
  .foot{margin-top:24px;color:#9ca3af;font-size:10px;text-align:center;border-top:1px solid #eee;padding-top:10px}
  @media print{ body{padding:14px} .emp{page-break-inside:avoid} .no-print{display:none} }
</style></head>
<body>
<div class="doc-head">
  <h1>Reporte de Leads — D'Mart Institute</h1>
  <p>Periodo: ${esc(ml)} &nbsp;·&nbsp; Generado por: ${esc(data.supervisor_name)} &nbsp;·&nbsp; ${new Date().toLocaleDateString('es-PR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
</div>

<div class="sumtitle">Resumen general por empleado</div>
<table class="summary">
  <thead><tr><th>Empleado</th><th>Leads</th><th>Actividades</th><th>Matriculados</th></tr></thead>
  <tbody>
    ${summaryRows || '<tr><td colspan="4" style="color:#9ca3af">Sin datos.</td></tr>'}
    <tr><td>TOTAL</td><td style="text-align:center">${totalLeads}</td><td style="text-align:center">${totalActs}</td><td style="text-align:center">${totalMat}</td></tr>
  </tbody>
</table>

${sections || '<p style="color:#9ca3af;margin-top:20px">No hay leads para los filtros seleccionados.</p>'}

<div class="foot">Data Nest · D'Mart Institute</div>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}</script>
</body></html>`
  }

  function teamQueryString() {
    const p = new URLSearchParams()
    if (teamFrom) p.set('from', teamFrom)
    if (teamTo) p.set('to', teamTo)
    if (teamProgram) p.set('program', teamProgram)
    if (teamStatus) p.set('status', teamStatus)
    if (teamHorario) p.set('horario', teamHorario)
    return p.toString()
  }

  async function generateReport() {
    setLoadingReport(true)
    setTeamReport(null)
    const res = await fetch(`/api/portal/reports/team-report?${teamQueryString()}`)
    if (!res.ok) { setLoadingReport(false); return }
    const data: TeamReportData = await res.json()
    setTeamReport(data)
    setLoadingReport(false)
  }

  async function downloadReport(format: 'csv' | 'pdf') {
    // Usa el informe ya generado si existe; si no, lo genera con los filtros actuales.
    let data = teamReport
    if (!data) {
      setLoadingReport(true)
      const res = await fetch(`/api/portal/reports/team-report?${teamQueryString()}`)
      if (!res.ok) { setLoadingReport(false); return }
      data = await res.json()
      setTeamReport(data)
      setLoadingReport(false)
    }
    if (!data) return
    if (format === 'csv') {
      const label = `${teamFrom}_a_${teamTo}`
      triggerDownload(buildCsv(data), `reporte-equipo-${label}.csv`, 'text/csv;charset=utf-8;')
    } else {
      // Abre el reporte estilizado en ventana nueva (auto-imprime → guardar como PDF).
      const win = window.open('', '_blank')
      if (win) { win.document.write(buildHtml(data)); win.document.close() }
    }
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
        month: planMonth,
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

  async function openActivityLeads(actId: string, actName: string) {
    setActLeadsModal({ name: actName, loading: true, leads: [] })
    const res = await fetch(`/api/portal/activities/${actId}/leads`)
    if (!res.ok) { setActLeadsModal({ name: actName, loading: false, leads: [] }); return }
    const d = await res.json()
    setActLeadsModal({ name: actName, loading: false, leads: d.leads ?? [] })
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
    <div className="min-h-screen bg-surface">
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900">Plan y Reportes</h1>
          <a href="/portal/dashboard" className="text-sm text-ink hover:underline">← Dashboard</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* Tabs */}
        <div className="overflow-x-auto no-scrollbar mb-6">
        <div className="portal-tabs">
          {((role === 'admin'
            ? [{ key: 'equipo', label: 'Equipo' }]
            : [
                { key: 'plan',   label: 'Plan del Mes' },
                { key: 'cierre', label: 'Informe de Cierre' },
                ...((role === 'supervisor' || role === 'director') ? [{ key: 'equipo', label: 'Equipo' }] : []),
              ]) as { key: 'plan' | 'cierre' | 'equipo'; label: string }[]).map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`portal-tab ${activeTab === key ? 'portal-tab--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
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

            {/* Month selector */}
            {(() => {
              const opts: string[] = []
              for (let i = 3; i >= -3; i--) {
                const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i)
                opts.push(d.toISOString().slice(0, 10))
              }
              return (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Mes:</span>
                  <select
                    value={planMonth}
                    onChange={(e) => setPlanMonth(e.target.value)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring capitalize"
                  >
                    {opts.map((m) => (
                      <option key={m} value={m} className="capitalize">{monthLabel(m)}</option>
                    ))}
                  </select>
                </div>
              )
            })()}

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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
                <Plus className="h-4 w-4" /> Nueva Actividad
              </button>
            </div>

            {/* ── Calendario de planificación — empleados y supervisores ── */}
            {(role === 'empleado' || role === 'supervisor') && (() => {
              const calDate = new Date(planMonth + 'T00:00:00')
              const calYear = calDate.getFullYear()
              const calMonth = calDate.getMonth()
              const daysInCalMonth = new Date(calYear, calMonth + 1, 0).getDate()
              const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay()
              const blanks = Array(firstDayOfWeek).fill(null)
              const days = Array.from({ length: daysInCalMonth }, (_, i) => i + 1)

              // Actividades del mes mostrado, agrupadas por día (aparecen solas en el calendario).
              const actsByDay: Record<number, Activity[]> = {}
              for (const a of activities) {
                if (!a.activity_date) continue
                const ad = new Date(a.activity_date + 'T00:00:00')
                if (ad.getFullYear() === calYear && ad.getMonth() === calMonth) {
                  const d = ad.getDate()
                  ;(actsByDay[d] ??= []).push(a)
                }
              }

              // Contadores del mes: total de actividades y leads generados por ellas.
              const totalActs = activities.length
              const totalLeads = activities.reduce((s, a) => s + (a.actual_leads ?? 0), 0)

              return (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-amber-900">
                      Calendario de planificación — {MONTH_NAMES_ES[calMonth]} {calYear}
                    </h3>
                    <div className="ml-auto text-xs">
                      {planSaving && <span className="text-amber-500">Guardando…</span>}
                      {planSaved && !planSaving && <span className="text-green-600">Guardado ✓</span>}
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mb-4">
                    Escribe en cada día qué actividades planeas realizar. Las actividades que creas aparecen marcadas en su fecha.
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
                        {actsByDay[day]?.map((a) => (
                          <span
                            key={a.id}
                            title={a.name}
                            className="mb-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-accent-soft text-accent text-[10px] font-semibold leading-tight truncate"
                          >
                            <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                            <span className="truncate">{a.name}</span>
                          </span>
                        ))}
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

                  {/* Contadores del mes */}
                  <div className="flex flex-wrap justify-end gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-amber-800">
                      <Calendar className="h-3.5 w-3.5 text-amber-600" />
                      Actividades · {totalActs}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-amber-200 text-xs font-semibold text-amber-800">
                      <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                      Leads generados · {totalLeads}
                    </span>
                  </div>
                </div>
              )
            })()}

            {/* ── Programas que necesitan apoyo en redes (solo supervisores) ── */}
            {role === 'supervisor' && (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Megaphone className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold text-gray-900">¿Qué programas necesitan apoyo en redes este mes?</h3>
                  <div className="ml-auto text-xs">
                    {socialSaving && <span className="text-amber-500">Guardando…</span>}
                    {socialSaved && !socialSaving && <span className="text-green-600">Guardado ✓</span>}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Marca la sección (Diurno / Nocturno) y la fecha de comienzo de cada programa. Si aún no hay fecha, déjala vacía (saldrá como &quot;Pendiente&quot;). Esto le llega al administrador para priorizar el contenido de tu recinto.
                </p>

                {/* Programas regulares: Diurno / Nocturno con su fecha */}
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Programas Regulares</p>
                <div className="space-y-1.5 mb-5">
                  {STATIC_PROGRAMS.map((p) => (
                    <div key={p.slug} className="flex items-center gap-2 flex-wrap py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-800 font-medium flex-1 min-w-[140px]">{p.name}</span>
                      {(['diurno', 'nocturno'] as const).map((shift) => {
                        const entry = getEntry(p.name, shift)
                        const active = !!entry
                        return (
                          <div key={shift} className="flex items-center gap-1">
                            <button type="button" onClick={() => toggleSection(p.name, shift)}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-accent text-white border-accent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                              {shift === 'diurno' ? 'Diurno' : 'Nocturno'}
                            </button>
                            {active && (
                              <input type="date" value={entry?.start_date ?? ''} onChange={(e) => setSectionDate(p.name, shift, e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Cursos sabatinos: seleccionar + fecha (sin D/N) */}
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Cursos Sabatinos</p>
                <div className="space-y-1.5">
                  {PRIVADOS_SABATINOS.map((s) => {
                    const entry = getEntry(s.title, 'sabatino')
                    const active = !!entry
                    return (
                      <div key={s.id} className="flex items-center gap-2 flex-wrap py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-gray-800 font-medium flex-1 min-w-[140px]">{s.title}</span>
                        <button type="button" onClick={() => toggleSection(s.title, 'sabatino')}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-accent text-white border-accent' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                          {active ? 'Seleccionado' : 'Seleccionar'}
                        </button>
                        {active && (
                          <input type="date" value={entry?.start_date ?? ''} onChange={(e) => setSectionDate(s.title, 'sabatino', e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {showNewActivity && (
              <form onSubmit={createActivity} className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5 space-y-3">
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
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-10 flex justify-center">
                <div className="animate-spin h-6 w-6 rounded-full border-4 border-ink border-t-transparent" />
              </div>
            ) : activities.length === 0 && !showNewActivity ? (
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-10 text-center">
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
                    <div key={act.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5 flex flex-col gap-4">
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
                        <button
                          type="button"
                          onClick={() => openActivityLeads(act.id, act.name)}
                          className="inline-flex items-center gap-1 text-accent hover:underline font-semibold disabled:no-underline disabled:text-gray-400"
                          disabled={!act.actual_leads}
                          title="Ver los leads generados"
                        >
                          Generados: <strong className={act.actual_leads ? 'text-green-700' : 'text-gray-400'}>{act.actual_leads ?? 0}</strong>
                          {!!act.actual_leads && <span className="text-accent">· Ver →</span>}
                        </button>
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
                          className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-ink text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40"
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

            {/* ── Director: campus activities (read-only) ── */}
            {role === 'director' && (
              <div className="pt-2 border-t border-gray-200 space-y-3">
                <h3 className="text-sm font-bold text-gray-700">Actividades del Recinto</h3>
                {campusActivities.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-8 text-center">
                    <p className="text-sm text-gray-400">No hay actividades en tu recinto para este mes.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {campusActivities.map((act) => (
                      <div key={act.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-4 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{act.name}</p>
                            {act.status === 'terminada'
                              ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium"><CheckCircle className="h-3 w-3" /> Terminada</span>
                              : <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">Planificada</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {act.employee_name ?? 'Empleado'}{act.activity_date ? ` · ${formatDate(act.activity_date)}` : ''}
                            {act.location ? ` · ${act.location}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openActivityLeads(act.id, act.name)}
                          disabled={!act.actual_leads}
                          className="text-xs whitespace-nowrap flex-shrink-0 text-accent font-semibold hover:underline disabled:text-gray-500 disabled:no-underline"
                          title="Ver los leads generados"
                        >
                          {act.actual_leads ?? 0} / {act.planned_leads ?? '—'} leads{!!act.actual_leads && ' · Ver'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Director: campus planning calendars (read-only) ── */}
                {(() => {
                  const calMonthStr = planMonth.slice(0, 7)
                  const [y, m] = calMonthStr.split('-').map(Number)
                  const daysInM = new Date(y, m, 0).getDate()
                  return (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-gray-700">Calendarios de Planificación — {monthLabel(planMonth)}</h3>
                      {campusCalendars.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-8 text-center">
                          <p className="text-sm text-gray-400">Ningún supervisor ha completado su calendario para este mes.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {campusCalendars.map((plan) => (
                            <div key={plan.supervisor_id} className="bg-white rounded-2xl border border-black/[0.06] shadow-soft overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-surface text-ink flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {plan.full_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-900 text-sm">{plan.full_name}</p>
                                  <p className="text-xs text-gray-500">{plan.role === 'director' ? 'Director de Recinto' : 'Supervisor'}</p>
                                </div>
                                <span className="ml-auto text-xs text-gray-400">
                                  {Object.values(plan.notes ?? {}).filter(Boolean).length} días
                                </span>
                              </div>
                              <div className="p-3">
                                <div className="grid grid-cols-7 gap-1">
                                  {Array.from({ length: daysInM }, (_, i) => i + 1).map((day) => {
                                    const note = (plan.notes ?? {})[String(day)] ?? ''
                                    return (
                                      <div key={day} className={`rounded p-1 min-h-[44px] ${note ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-100'}`}>
                                        <p className={`text-xs font-semibold ${note ? 'text-amber-700' : 'text-gray-400'}`}>{day}</p>
                                        {note && <p className="text-xs text-gray-700 leading-tight line-clamp-2">{note}</p>}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── CIERRE TAB ──────────────────────────────────────────── */}
        {activeTab === 'cierre' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
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
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-40 mb-5"
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
                      { icon: Users,         label: 'Total Leads',        value: autoStats.leads_acquired,         color: 'text-ink' },
                      { icon: TrendingUp,    label: 'De Actividades',     value: autoStats.leads_from_activities,  color: 'text-accent' },
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
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
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
              <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
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
                              <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink font-medium">Este mes</span>
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

        {/* ── EQUIPO TAB (supervisor / director / admin) ───────────────────── */}
        {activeTab === 'equipo' && (role === 'supervisor' || role === 'director' || role === 'admin') && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
              <div className="mb-4">
                <h2 className="text-sm font-bold text-gray-900">Reporte del Equipo</h2>
                <p className="text-xs text-gray-500 mt-0.5">Filtra, genera y revisa el informe antes de descargarlo.</p>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="form-label">Desde</label>
                  <input type="date" value={teamFrom} onChange={(e) => setTeamFrom(e.target.value)} className="form-input text-sm" />
                </div>
                <div>
                  <label className="form-label">Hasta</label>
                  <input type="date" value={teamTo} onChange={(e) => setTeamTo(e.target.value)} className="form-input text-sm" />
                </div>
                <div>
                  <label className="form-label">Horario</label>
                  <select value={teamHorario} onChange={(e) => setTeamHorario(e.target.value)} className="form-input text-sm">
                    <option value="">Todos</option>
                    <option value="Diurno">Diurno</option>
                    <option value="Nocturno">Nocturno</option>
                    <option value="Sabatino">Sabatino</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Estatus</label>
                  <select value={teamStatus} onChange={(e) => setTeamStatus(e.target.value)} className="form-input text-sm">
                    <option value="">Todos</option>
                    {LEAD_STATUS_ORDER.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="form-label">Programa</label>
                  <select value={teamProgram} onChange={(e) => setTeamProgram(e.target.value)} className="form-input text-sm">
                    <option value="">Todos</option>
                    {ALL_PROGRAMS.filter((p) => p !== 'No sé aún').map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Campos del reporte */}
              <div className="mb-4">
                <label className="form-label">Campos del reporte</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
                  {REPORT_FIELDS.map((f) => (
                    <label key={f.key} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!reportFields[f.key]}
                        onChange={(e) => setReportFields((prev) => ({ ...prev, [f.key]: e.target.checked }))}
                        className="rounded border-gray-300 text-ink"
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={generateReport}
                  disabled={loadingReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40"
                >
                  <TrendingUp className="h-4 w-4" />
                  {loadingReport ? 'Generando…' : 'Generar informe'}
                </button>
                <button
                  onClick={() => downloadReport('pdf')}
                  disabled={loadingReport || !teamReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> Imprimir / Guardar PDF
                </button>
                <button
                  onClick={() => downloadReport('csv')}
                  disabled={loadingReport || !teamReport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> Descargar Excel (CSV)
                </button>
              </div>
            </div>

            {/* Vista previa */}
            {teamReport && (() => {
              const lds = teamReport.leads
              const matriculados = lds.filter((l) => l.status === 'Matriculado').length
              const manuales = lds.filter((l) => l.assignment_source === 'manual').length
              const deAct = lds.filter((l) => l.activity_name).length
              const stats = [
                ['Leads', lds.length], ['Matriculados', matriculados], ['Manuales', manuales],
                ['De actividades', deAct], ['Actividades', teamReport.activities.length], ['Representantes', teamReport.team_members.length],
              ] as [string, number][]
              return (
                <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-ink font-display">Vista previa · {rangeLabel(teamReport)}</h3>
                    <span className="text-xs text-gray-400">{lds.length} lead{lds.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {stats.map(([label, value]) => (
                      <div key={label} className="px-3 py-2 rounded-xl bg-surface border border-black/[0.05] text-center min-w-[90px]">
                        <p className="text-lg font-bold text-ink font-display leading-none">{value}</p>
                        <p className="text-[11px] text-ink-muted mt-1">{label}</p>
                      </div>
                    ))}
                  </div>

                  {lds.length === 0 ? (
                    <p className="text-sm text-gray-400">No hay leads para los filtros seleccionados.</p>
                  ) : (
                    <div className="overflow-x-auto -mx-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 bg-gray-50 text-left">
                            {['Representante','Nombre','Teléfono','Recinto','Programa','Horario','Estatus','Ingreso','Seguimientos (con fechas)'].map((h) => (
                              <th key={h} className="px-2.5 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 align-top">
                          {lds.map((l) => (
                            <tr key={l.id} className="hover:bg-gray-50">
                              <td className="px-2.5 py-2 whitespace-nowrap text-gray-600">{l.rep_name}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap font-medium text-gray-900">{l.nombre} {l.apellido}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap font-mono text-gray-500">{l.telefono}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap text-gray-600">{l.campus ?? '—'}</td>
                              <td className="px-2.5 py-2 text-gray-600 max-w-[150px] truncate" title={l.programa_interes ?? ''}>{l.programa_interes ?? '—'}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap text-gray-600">{l.horario ?? '—'}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap text-gray-700">{l.status}</td>
                              <td className="px-2.5 py-2 whitespace-nowrap text-gray-400">{new Date(l.created_at).toLocaleDateString('es-PR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                              <td className="px-2.5 py-2 text-gray-600 min-w-[220px]">
                                {l.history.length === 0 ? <span className="text-gray-300">—</span> : (
                                  <ul className="space-y-0.5">
                                    {l.history.map((h, idx) => <li key={idx} className="leading-snug">{fmtHistEntry(h)}</li>)}
                                  </ul>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-1">
              <p className="text-xs text-amber-800"><span className="font-semibold">Imprimir / Guardar PDF</span> — abre un reporte formateado (resumen general + segmentado por empleado, con el historial de cada lead) y el diálogo de impresión; elige "Guardar como PDF".</p>
              <p className="text-xs text-amber-700"><span className="font-semibold">Excel (CSV)</span> — los datos crudos (según los campos seleccionados) para abrir en Excel o Google Sheets.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal: leads de una actividad */}
      {actLeadsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setActLeadsModal(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-ink font-display truncate">Leads de la actividad</h3>
                <p className="text-xs text-gray-500 truncate">{actLeadsModal.name}</p>
              </div>
              <button onClick={() => setActLeadsModal(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <span className="text-gray-500 text-lg leading-none">×</span>
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              {actLeadsModal.loading ? (
                <div className="py-10 flex justify-center"><div className="animate-spin h-6 w-6 rounded-full border-4 border-ink border-t-transparent" /></div>
              ) : actLeadsModal.leads.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No hay leads ligados a esta actividad.</p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {actLeadsModal.leads.map((l) => (
                    <a key={l.id} href={`/portal/leads/${l.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-gray-50 rounded-lg px-2 -mx-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{l.nombre} {l.apellido}</p>
                        <p className="text-xs text-gray-500">{l.telefono}{l.programa_interes ? ` · ${l.programa_interes}` : ''}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-700">{l.status}</p>
                        <p className="text-[11px] text-gray-400">{new Date(l.created_at).toLocaleDateString('es-PR', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
