'use client'

import { useEffect, useRef, useState } from 'react'
import {
  UserPlus, Building2, CheckCircle, XCircle, AlertCircle, X, Upload,
  FileText, Users, ClipboardList, CalendarDays, MapPin, BarChart3,
  GraduationCap, TrendingUp, Zap, Briefcase, Phone, Mail,
} from 'lucide-react'
import PortalHeader from '@/components/portal/PortalHeader'
import Button from '@/components/ui/Button'
import type { Employee } from '@/lib/types'

interface EmployeeWithCount extends Employee {
  leads_this_month: number
}

const CAMPUSES = ['Barranquitas', 'Vega Alta']

const SCORE_CONFIG = {
  excelente: { label: 'Excelente',  bg: 'bg-green-100', text: 'text-green-700' },
  bueno:     { label: 'Bueno',      bg: 'bg-blue-100',  text: 'text-blue-700' },
  basico:    { label: 'Básico',     bg: 'bg-amber-100', text: 'text-amber-700' },
  deficiente:{ label: 'Deficiente', bg: 'bg-red-100',   text: 'text-red-700' },
}

function monthLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
}

function firstOfMonth(offset = 0) {
  const d = new Date()
  d.setMonth(d.getMonth() - offset, 1)
  return d.toISOString().slice(0, 10)
}

// ─── Create Employee Modal ───────────────────────────────────────────────────

function CreateEmployeeModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'empleado', campus: [] as string[] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCampus = (c: string) =>
    setForm((prev) => ({
      ...prev,
      campus: prev.campus.includes(c) ? prev.campus.filter((x) => x !== c) : [...prev.campus, c],
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.campus.length === 0) { setError('Selecciona al menos un recinto.'); return }
    setLoading(true)

    const res = await fetch('/api/portal/admin/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al crear el empleado.')
      setLoading(false)
      return
    }

    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Agregar Empleado</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="form-label">Nombre Completo <span className="text-red-500">*</span></label>
            <input type="text" required value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className="form-input" placeholder="Nombre Apellido" />
          </div>
          <div>
            <label className="form-label">Correo Electrónico <span className="text-red-500">*</span></label>
            <input type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="form-input" placeholder="correo@dmartinstitute.edu" />
          </div>
          <div>
            <label className="form-label">Contraseña Inicial <span className="text-red-500">*</span></label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="form-input" placeholder="Mín. 8 caracteres" />
          </div>
          <div>
            <label className="form-label">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} className="form-input">
              <option value="empleado">Consejera de Admisiones</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="form-label">Recinto(s) <span className="text-red-500">*</span></label>
            <div className="flex gap-3 mt-1">
              {CAMPUSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCampus(c)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${form.campus.includes(c) ? 'bg-navy text-white border-navy' : 'bg-white text-gray-700 border-gray-200 hover:border-navy/40'}`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <Button type="submit" variant="gold" size="sm" loading={loading} className="flex-1">
              Crear Empleado
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CSV parsing helpers ─────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCsvLine(lines[0])
  const rows = lines.slice(1).map((l) => parseCsvLine(l))
  return { headers, rows }
}

interface ColMap {
  full_name: number
  lead_date: number
  from: number
  representante: number
  status: number
  interest: number
  seguimiento: number
  phone: number
  email: number
}

function autoDetectColumns(headers: string[]): Partial<ColMap> {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const map: Partial<ColMap> = {}
  const patterns: [keyof ColMap, string[]][] = [
    ['full_name', ['fullname', 'nombre', 'name']],
    ['lead_date', ['leaddate', 'fecha', 'date']],
    ['from', ['from', 'origen', 'fuente', 'source']],
    ['representante', ['representante', 'rep', 'empleado', 'assigned']],
    ['status', ['status', 'estado']],
    ['interest', ['interest', 'interes', 'programa']],
    ['seguimiento', ['seguimiento', 'notes', 'nota', 'notas', 'followup']],
    ['phone', ['phone', 'telefono', 'tel', 'celular', 'phonenumber']],
    ['email', ['email', 'correo']],
  ]
  headers.forEach((h, idx) => {
    const n = norm(h)
    for (const [field, candidates] of patterns) {
      if (map[field] === undefined && candidates.some((c) => n.includes(c))) {
        map[field] = idx
      }
    }
  })
  return map
}

const FIELD_LABELS: Record<keyof ColMap, string> = {
  full_name: 'Nombre Completo',
  lead_date: 'Fecha del Lead',
  from: 'Origen (From)',
  representante: 'Representante',
  status: 'Estado',
  interest: 'Programa de Interés',
  seguimiento: 'Seguimiento / Notas',
  phone: 'Teléfono',
  email: 'Correo',
}

function CsvImportModal({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'map' | 'importing' | 'done'>('upload')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [colMap, setColMap] = useState<Partial<ColMap>>({})
  const [progress, setProgress] = useState({ imported: 0, skipped: 0, total: 0 })
  const [finalErrors, setFinalErrors] = useState<string[]>([])

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const { headers: h, rows: r } = parseCsv(text)
      setHeaders(h)
      setRows(r)
      setColMap(autoDetectColumns(h))
      setStep('map')
    }
    reader.readAsText(file, 'UTF-8')
  }

  function updateColMap(field: keyof ColMap, idx: string) {
    setColMap((prev) => ({ ...prev, [field]: idx === '' ? undefined : parseInt(idx) }))
  }

  async function startImport() {
    setStep('importing')
    const batchSize = 100
    let totalImported = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    setProgress({ imported: 0, skipped: 0, total: rows.length })

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const payload = batch.map((row) => ({
        full_name: colMap.full_name !== undefined ? row[colMap.full_name] : '',
        lead_date: colMap.lead_date !== undefined ? row[colMap.lead_date] : '',
        from: colMap.from !== undefined ? row[colMap.from] : '',
        representante: colMap.representante !== undefined ? row[colMap.representante] : '',
        status: colMap.status !== undefined ? row[colMap.status] : '',
        interest: colMap.interest !== undefined ? row[colMap.interest] : '',
        seguimiento: colMap.seguimiento !== undefined ? row[colMap.seguimiento] : '',
        phone: colMap.phone !== undefined ? row[colMap.phone] : '',
        email: colMap.email !== undefined ? row[colMap.email] : '',
      }))

      const res = await fetch('/api/portal/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      })
      const data = await res.json()
      totalImported += data.imported ?? 0
      totalSkipped += data.skipped ?? 0
      if (data.errors) allErrors.push(...data.errors)
      setProgress({ imported: totalImported, skipped: totalSkipped, total: rows.length })
    }

    setFinalErrors(allErrors)
    setStep('done')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Importar Leads desde CSV</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'upload' && (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Selecciona un archivo CSV exportado de Airtable. Las columnas serán detectadas automáticamente.
              </p>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-navy/40 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700">Arrastra tu CSV aquí o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-1">Solo archivos .csv</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          {step === 'map' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-navy" />
                <p className="text-sm text-gray-700 font-medium">{rows.length} filas detectadas</p>
              </div>

              <div className="mb-5 overflow-x-auto rounded-lg border border-gray-100">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((row, ri) => (
                      <tr key={ri} className="border-b border-gray-50">
                        {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-gray-700 max-w-[120px] truncate" title={cell}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-3">Mapeo de columnas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(FIELD_LABELS) as (keyof ColMap)[]).map((field) => (
                  <div key={field}>
                    <label className="text-xs text-gray-500 font-medium block mb-1">{FIELD_LABELS[field]}</label>
                    <select
                      value={colMap[field] !== undefined ? String(colMap[field]) : ''}
                      onChange={(e) => updateColMap(field, e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20"
                    >
                      <option value="">— No incluir —</option>
                      {headers.map((h, i) => <option key={i} value={String(i)}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">Nota sobre Representantes</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Los leads de <strong>Melisa Tirado</strong> y <strong>Zuleika Ortiz Velez</strong> serán asignados automáticamente a Carmen Peña con una nota en el historial.
                </p>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-8 text-center">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-navy border-t-transparent mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-700">Importando leads…</p>
              <p className="text-xs text-gray-500 mt-1">
                {progress.imported + progress.skipped} / {progress.total} procesados
              </p>
              <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-navy transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? ((progress.imported + progress.skipped) / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="py-4">
              <div className="flex flex-col items-center text-center mb-5">
                <CheckCircle className="h-10 w-10 text-green-500 mb-3" />
                <p className="text-base font-bold text-gray-900">Importación completada</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-700">{progress.imported}</p>
                  <p className="text-xs text-green-600 mt-0.5">Leads importados</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                  <p className="text-2xl font-bold text-gray-600">{progress.skipped}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Omitidos / errores</p>
                </div>
              </div>
              {finalErrors.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-red-700 mb-2">Detalles de errores:</p>
                  {finalErrors.slice(0, 50).map((e, i) => (
                    <p key={i} className="text-xs text-red-600">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          {step === 'done' ? (
            <Button variant="gold" size="sm" onClick={onClose}>Cerrar</Button>
          ) : step === 'map' ? (
            <>
              <button onClick={() => setStep('upload')} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Volver
              </button>
              <Button variant="gold" size="sm" onClick={startImport} disabled={!colMap.full_name && !colMap.phone}>
                Importar {rows.length} leads
              </Button>
            </>
          ) : step === 'upload' ? (
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Reports Panel ───────────────────────────────────────────────────────────

interface AdminReport {
  id: string
  employee_id: string
  month: string
  leads_acquired: number | null
  leads_enrolled: number | null
  activities_completed: number | null
  performance_score: 'deficiente' | 'basico' | 'bueno' | 'excelente' | null
  notes: string | null
  created_at: string
  employee: { full_name: string; campus: string[] } | null
}

// ─── Activities Panel ────────────────────────────────────────────────────────

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  feria: 'Feria',
  visita_escuela: 'Visita a Escuela',
  evento_comunitario: 'Evento Comunitario',
  otro: 'Otro',
}

interface AdminActivity {
  id: string
  employee_id: string
  employee_name: string | null
  month: string
  name: string
  type: string
  description: string | null
  activity_date: string | null
  location: string | null
  planned_leads: number | null
  actual_leads: number | null
  status: 'planificada' | 'terminada'
  created_at: string
}

function ActivitiesPanel() {
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const currentMonth = firstOfMonth()

  useEffect(() => {
    fetch(`/api/portal/admin/activities?month=${currentMonth}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) { setFetchError(d.error ?? 'Error al cargar actividades.'); setLoading(false); return }
        setActivities(d.activities ?? [])
        setLoading(false)
      })
      .catch(() => { setFetchError('Error de conexión.'); setLoading(false) })
  }, [currentMonth])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <div className="animate-spin h-7 w-7 rounded-full border-4 border-navy border-t-transparent" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{fetchError}</p>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
        <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-500">No hay actividades planificadas este mes.</p>
      </div>
    )
  }

  // Group by employee
  const byEmployee = new Map<string, AdminActivity[]>()
  activities.forEach((a) => {
    const key = a.employee_name ?? a.employee_id
    if (!byEmployee.has(key)) byEmployee.set(key, [])
    byEmployee.get(key)!.push(a)
  })

  return (
    <div className="space-y-6">
      {Array.from(byEmployee.entries()).map(([empName, acts]) => (
        <div key={empName}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{empName}</h3>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Actividad</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Tipo</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Fecha · Lugar</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Leads</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {acts.map((act) => (
                  <tr key={act.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{act.name}</p>
                      {act.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{act.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">
                      {ACTIVITY_TYPE_LABELS[act.type] ?? act.type}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {act.activity_date && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-gray-400" />
                            {new Date(act.activity_date + 'T00:00:00').toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        {act.location && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            {act.location}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <span>{act.actual_leads ?? '—'} / {act.planned_leads ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {act.status === 'terminada'
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" />Terminada</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-blue-600">Planificada</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Reports Panel ───────────────────────────────────────────────────────────

function ReportsPanel() {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/portal/admin/reports')
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) { setFetchError(d.error ?? 'Error al cargar los informes.'); setLoading(false); return }
        setReports(d.reports ?? [])
        setLoading(false)
      })
      .catch(() => { setFetchError('Error de conexión.'); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <div className="animate-spin h-7 w-7 rounded-full border-4 border-navy border-t-transparent" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{fetchError}</p>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
        <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-medium text-gray-500">No hay informes de cierre enviados aún.</p>
        <p className="text-sm text-gray-400 mt-1">Aparecerán aquí cuando los representantes envíen sus informes mensuales.</p>
      </div>
    )
  }

  // Group by month
  const byMonth = new Map<string, AdminReport[]>()
  reports.forEach((r) => {
    if (!byMonth.has(r.month)) byMonth.set(r.month, [])
    byMonth.get(r.month)!.push(r)
  })

  return (
    <div className="space-y-6">
      {Array.from(byMonth.entries()).map(([month, monthReports]) => (
        <div key={month}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 capitalize">
            {monthLabel(month)}
          </h3>
          <div className="space-y-3">
            {monthReports.map((report) => {
              const scoreCfg = report.performance_score ? SCORE_CONFIG[report.performance_score] : null
              const isExpanded = expanded === report.id
              return (
                <div key={report.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : report.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-navy/10 text-navy flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {report.employee?.full_name.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{report.employee?.full_name ?? 'Empleado'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {report.employee?.campus.map((c) => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {scoreCfg && (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${scoreCfg.bg} ${scoreCfg.text}`}>
                          {scoreCfg.label}
                        </span>
                      )}
                      <div className="text-right text-xs text-gray-500 hidden sm:block">
                        <p><span className="font-medium text-gray-700">{report.leads_acquired ?? '—'}</span> leads</p>
                        <p><span className="font-medium text-gray-700">{report.leads_enrolled ?? '—'}</span> matriculados</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { label: 'Leads Adquiridos',     value: report.leads_acquired },
                          { label: 'Matriculados',          value: report.leads_enrolled },
                          { label: 'Actividades completadas', value: report.activities_completed },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                            <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      {report.notes && (
                        <div className="mt-4 bg-gray-50 rounded-xl p-4">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Notas del representante</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-3">
                        Enviado: {new Date(report.created_at).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Summary Panel (Admin monthly report) ───────────────────────────────────

const SCORE_CONFIG_SUMMARY = {
  excelente: { label: 'Excelente',  bg: 'bg-green-100', text: 'text-green-700' },
  bueno:     { label: 'Bueno',      bg: 'bg-blue-100',  text: 'text-blue-700' },
  basico:    { label: 'Básico',     bg: 'bg-amber-100', text: 'text-amber-700' },
  deficiente:{ label: 'Deficiente', bg: 'bg-red-100',   text: 'text-red-700' },
}

interface EmpStat {
  id: string
  full_name: string
  campus: string[]
  active: boolean
  leads_count: number
  matriculados_count: number
  activities_planned: number
  activities_completed: number
  report_submitted: boolean
  performance_score: string | null
  report_notes: string | null
}

interface SummaryTotals {
  total_leads: number
  total_matriculados: number
  total_activities_planned: number
  total_activities_completed: number
  reports_submitted: number
  total_employees: number
}

interface SummaryData {
  month: string
  totals: SummaryTotals
  employees: EmpStat[]
}

function SummaryPanel() {
  const [selectedMonth, setSelectedMonth] = useState(firstOfMonth())
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setData(null)
    try {
      const res = await fetch(`/api/portal/admin/summary?month=${selectedMonth}`)
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? 'Error al generar el informe.'); setLoading(false); return }
      setData(d)
    } catch {
      setError('Error de conexión.')
    }
    setLoading(false)
  }

  // Month options: current + 5 previous months
  const monthOptions: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    monthOptions.push(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10))
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Informe General del Mes</h2>
        <p className="text-xs text-gray-500 mb-4">
          Resumen de actividades, leads y matriculados de todos los representantes para el mes seleccionado.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="form-input w-auto text-sm"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m} className="capitalize">{monthLabel(m)}</option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors disabled:opacity-40"
          >
            <Zap className="h-4 w-4" />
            {loading ? 'Generando…' : 'Generar Informe'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Global totals */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 capitalize">
              {monthLabel(data.month)} · Resumen general
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: Users,         label: 'Representantes',    value: data.totals.total_employees,             color: 'text-navy' },
                { icon: TrendingUp,    label: 'Total Leads',       value: data.totals.total_leads,                 color: 'text-blue-600' },
                { icon: GraduationCap, label: 'Matriculados',      value: data.totals.total_matriculados,          color: 'text-green-600' },
                { icon: CalendarDays,  label: 'Actividades Plan.', value: data.totals.total_activities_planned,    color: 'text-indigo-600' },
                { icon: CheckCircle,   label: 'Actividades Term.', value: data.totals.total_activities_completed,  color: 'text-emerald-600' },
                { icon: ClipboardList, label: 'Informes Enviados', value: data.totals.reports_submitted,           color: 'text-amber-600' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Per-employee breakdown */}
          <div className="space-y-3">
            {data.employees
              .sort((a, b) => b.leads_count - a.leads_count)
              .map((emp) => {
                const scoreCfg = emp.performance_score
                  ? SCORE_CONFIG_SUMMARY[emp.performance_score as keyof typeof SCORE_CONFIG_SUMMARY]
                  : null
                return (
                  <div key={emp.id} className="bg-white rounded-xl border border-gray-200 p-5">
                    {/* Employee header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-navy/10 text-navy flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{emp.full_name}</p>
                            {!emp.active && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {emp.campus.map((c) => (
                              <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {scoreCfg ? (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${scoreCfg.bg} ${scoreCfg.text}`}>
                            {scoreCfg.label}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                            Sin informe
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Leads Generados',   value: emp.leads_count,            icon: TrendingUp,    color: 'text-blue-600' },
                        { label: 'Matriculados',       value: emp.matriculados_count,      icon: GraduationCap, color: 'text-green-600' },
                        { label: 'Actividades Plan.',  value: emp.activities_planned,      icon: CalendarDays,  color: 'text-indigo-600' },
                        { label: 'Actividades Term.',  value: emp.activities_completed,    icon: CheckCircle,   color: 'text-emerald-600' },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                          <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                          <p className="text-xl font-bold text-gray-900">{value}</p>
                          <p className="text-xs text-gray-500 leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>

                    {emp.report_notes && (
                      <div className="mt-3 bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Notas del representante</p>
                        <p className="text-sm text-gray-700">{emp.report_notes}</p>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Solicitudes Panel ───────────────────────────────────────────────────────

const JOB_STATUS_CONFIG = {
  pendiente:  { label: 'Pendiente',   bg: 'bg-amber-100',  text: 'text-amber-700' },
  en_proceso: { label: 'En proceso',  bg: 'bg-blue-100',   text: 'text-blue-700' },
  completado: { label: 'Completado',  bg: 'bg-green-100',  text: 'text-green-700' },
  cancelado:  { label: 'Cancelado',   bg: 'bg-gray-100',   text: 'text-gray-500' },
}

interface JobRequestRow {
  id: string
  graduate_id: string
  client_name: string
  client_email: string
  client_phone: string
  service_description: string
  preferred_date: string | null
  status: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado'
  notes: string | null
  created_at: string
  graduate: { full_name: string; program: string } | null
}

function SolicitudesPanel() {
  const [requests, setRequests] = useState<JobRequestRow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  async function load() {
    const res = await fetch('/api/portal/admin/job-requests')
    const d = await res.json()
    if (!res.ok) { setFetchError(d.error ?? 'Error al cargar solicitudes.'); setLoading(false); return }
    setRequests(d.requests ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function updateStatus(id: string, status: string) {
    await fetch('/api/portal/admin/job-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    load()
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 flex justify-center">
        <div className="animate-spin h-7 w-7 rounded-full border-4 border-navy border-t-transparent" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-10 text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm text-red-600">{fetchError}</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
        <Briefcase className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay solicitudes de empleo aún.</p>
        <p className="text-gray-400 text-sm mt-1">Las solicitudes aparecerán aquí cuando alguien contacte a un egresado desde /egresados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const cfg = JOB_STATUS_CONFIG[req.status]
        return (
          <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  {req.graduate && (
                    <span className="text-sm font-semibold text-gray-900">
                      {req.graduate.full_name}
                    </span>
                  )}
                  {req.graduate && (
                    <span className="text-xs text-gray-500">{req.graduate.program}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(req.created_at).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {req.preferred_date && ` · Fecha preferida: ${new Date(req.preferred_date + 'T00:00:00').toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
              <select
                value={req.status}
                onChange={(e) => updateStatus(req.id, e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-navy/20 flex-shrink-0"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                {req.client_name}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <a href={`mailto:${req.client_email}`} className="hover:underline truncate">{req.client_email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <a href={`tel:${req.client_phone}`} className="hover:underline">{req.client_phone}</a>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-gray-500 mb-0.5">Descripción del servicio</p>
              <p className="text-sm text-gray-700">{req.service_description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [employees, setEmployees] = useState<EmployeeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [activeTab, setActiveTab] = useState<'empleados' | 'actividades' | 'informes' | 'informe_general' | 'solicitudes'>('actividades')

  async function loadEmployees() {
    const res = await fetch('/api/portal/admin/employees')
    if (res.ok) {
      const data = await res.json()
      setEmployees(data.employees ?? [])
    }
    setLoading(false)
  }

  async function toggleActive(emp: EmployeeWithCount) {
    await fetch(`/api/portal/admin/employees/${emp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !emp.active }),
    })
    loadEmployees()
  }

  useEffect(() => { loadEmployees() }, [])

  const adminEmployee = employees.find((e) => e.role === 'admin') as Employee | undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {adminEmployee && <PortalHeader employee={adminEmployee} />}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Administración</h1>
            <p className="text-sm text-gray-500 mt-0.5">{employees.length} empleado{employees.length !== 1 ? 's' : ''} registrado{employees.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <a href="/portal/dashboard" className="text-sm text-navy hover:underline font-medium py-2">
              ← Dashboard
            </a>
            {activeTab === 'empleados' && (
              <>
                <button
                  onClick={() => setShowImport(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-navy text-navy text-sm font-semibold hover:bg-navy/5 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Importar CSV
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar Empleado
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {([
            { key: 'empleados',       label: 'Empleados',          icon: Users },
            { key: 'actividades',     label: 'Actividades',         icon: CalendarDays },
            { key: 'informes',        label: 'Informes Enviados',   icon: ClipboardList },
            { key: 'informe_general', label: 'Informe General',     icon: BarChart3 },
            { key: 'solicitudes',     label: 'Solicitudes',         icon: Briefcase },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === key ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Employees tab */}
        {activeTab === 'empleados' && (
          loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-navy border-t-transparent mx-auto" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Empleado</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Recinto(s)</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Rol</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Leads este mes</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-navy/10 text-navy flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {emp.campus.map((c) => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {emp.role === 'admin' ? 'Administrador' : 'Consejera'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                        {emp.leads_this_month}
                      </td>
                      <td className="px-4 py-3">
                        {emp.active
                          ? <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="h-3.5 w-3.5" />Activo</span>
                          : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="h-3.5 w-3.5" />Inactivo</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(emp)}
                          className="text-xs text-gray-500 hover:text-gray-800 underline"
                        >
                          {emp.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Activities tab */}
        {activeTab === 'actividades' && <ActivitiesPanel />}

        {/* Reports tab */}
        {activeTab === 'informes' && <ReportsPanel />}

        {/* General summary tab */}
        {activeTab === 'informe_general' && <SummaryPanel />}

        {/* Job requests tab */}
        {activeTab === 'solicitudes' && <SolicitudesPanel />}
      </div>

      {showModal && (
        <CreateEmployeeModal
          onClose={() => setShowModal(false)}
          onCreated={loadEmployees}
        />
      )}

      {showImport && (
        <CsvImportModal onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
