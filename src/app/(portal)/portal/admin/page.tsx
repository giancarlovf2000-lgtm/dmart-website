'use client'

import { useEffect, useRef, useState } from 'react'
import {
  UserPlus, Building2, CheckCircle, XCircle, AlertCircle, X, Upload,
  FileText, Users, ClipboardList, CalendarDays, MapPin, BarChart3,
  GraduationCap, TrendingUp, Zap, Briefcase, Phone, Mail, Pencil, Download, Megaphone,
} from 'lucide-react'
import PortalHeader from '@/components/portal/PortalHeader'
import PostsHub from '@/components/portal/posts/PostsHub'
import ContentSubmissionsPanel from '@/components/portal/ContentSubmissionsPanel'
import type { Employee } from '@/lib/types'

interface EmployeeWithCount extends Employee {
  leads_this_month: number
}

const CAMPUSES = ['Barranquitas', 'Vega Alta']

interface CalendarPlan {
  supervisor_id: string
  full_name: string
  role: string
  campus: string[]
  plan_month: string
  notes: Record<string, string>
}

function getNextMonthStr(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getDaysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

function calendarMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-PR', { month: 'long', year: 'numeric' })
}

const SCORE_CONFIG = {
  excelente: { label: 'Excelente',  bg: 'bg-ink/[0.08]',  text: 'text-ink' },
  bueno:     { label: 'Bueno',      bg: 'bg-surface',     text: 'text-ink' },
  basico:    { label: 'Básico',     bg: 'bg-surface',     text: 'text-ink-muted' },
  deficiente:{ label: 'Deficiente', bg: 'bg-accent-soft', text: 'text-accent' },
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

function CreateEmployeeModal({ onClose, onCreated, allEmployees }: { onClose: () => void; onCreated: () => void; allEmployees: EmployeeWithCount[] }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'empleado', campus: [] as string[], supervisee_ids: [] as string[] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCampus = (c: string) =>
    setForm((prev) => ({
      ...prev,
      campus: prev.campus.includes(c) ? prev.campus.filter((x) => x !== c) : [...prev.campus, c],
    }))

  const toggleSupervisee = (id: string) =>
    setForm((prev) => ({
      ...prev,
      supervisee_ids: prev.supervisee_ids.includes(id) ? prev.supervisee_ids.filter((x) => x !== id) : [...prev.supervisee_ids, id],
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

  const empleados = allEmployees.filter((e) => e.role === 'empleado' && e.active)

  return (
    <div className="portal-modal-overlay">
      <div className="portal-modal max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] flex-shrink-0">
          <h2 className="text-base font-bold text-ink">Agregar Empleado</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-accent-soft flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent">{error}</p>
            </div>
          )}

          <div>
            <label className="portal-label">Nombre Completo <span className="text-accent">*</span></label>
            <input type="text" required value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} className="portal-input" placeholder="Nombre Apellido" />
          </div>
          <div>
            <label className="portal-label">Correo Electrónico <span className="text-accent">*</span></label>
            <input type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="portal-input" placeholder="correo@dmartinstitute.edu" />
          </div>
          <div>
            <label className="portal-label">Contraseña Inicial <span className="text-accent">*</span></label>
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="portal-input" placeholder="Mín. 8 caracteres" />
          </div>
          <div>
            <label className="portal-label">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as typeof p.role, supervisee_ids: [] }))} className="portal-select">
              <option value="empleado">Representante de Admisiones</option>
              <option value="supervisor">Supervisor de Admisiones</option>
              <option value="director">Director de Recinto</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {form.role === 'director' && (
            <div className="p-3 rounded-lg bg-surface">
              <p className="text-xs text-ink-muted">El Director supervisará automáticamente a todos los empleados del recinto asignado — no es necesario seleccionarlos individualmente.</p>
            </div>
          )}
          {form.role === 'supervisor' && (
            <div>
              <label className="portal-label">Empleados a supervisar</label>
              {empleados.length === 0 ? (
                <p className="text-xs text-ink-muted mt-1">No hay representantes activos disponibles.</p>
              ) : (
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto bg-surface rounded-xl p-2 shadow-neu-inset">
                  {empleados.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.supervisee_ids.includes(emp.id)}
                        onChange={() => toggleSupervisee(emp.id)}
                        className="rounded border-black/[0.15] text-ink"
                      />
                      <span className="text-sm text-ink">{emp.full_name}</span>
                      <span className="text-xs text-ink-muted ml-auto">{(emp.campus as string[]).join(', ')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="portal-label">Recinto(s) <span className="text-accent">*</span></label>
            <div className="flex gap-3 mt-1">
              {CAMPUSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCampus(c)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${form.campus.includes(c) ? 'bg-ink text-white shadow-soft' : 'bg-surface text-ink-muted shadow-neu-inset hover:text-ink'}`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="portal-btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="portal-btn flex-1">
              {loading && <span className="portal-spinner h-4 w-4 border-2 border-white/30 border-t-white" />}
              Crear Empleado
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Employee Modal ─────────────────────────────────────────────────────

function EditEmployeeModal({ employee, allEmployees, onClose, onSaved }: {
  employee: EmployeeWithCount
  allEmployees: EmployeeWithCount[]
  onClose: () => void
  onSaved: () => void
}) {
  const currentSupervisees = allEmployees.filter((e) => e.supervisor_id === employee.id).map((e) => e.id)
  const [form, setForm] = useState({
    full_name: employee.full_name,
    role: employee.role,
    campus: (employee.campus as string[]).slice(),
    supervisee_ids: currentSupervisees,
    web_intake: !!employee.web_intake,
  })
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleCampus = (c: string) =>
    setForm((prev) => ({
      ...prev,
      campus: prev.campus.includes(c) ? prev.campus.filter((x) => x !== c) : [...prev.campus, c],
    }))

  const toggleSupervisee = (id: string) =>
    setForm((prev) => ({
      ...prev,
      supervisee_ids: prev.supervisee_ids.includes(id) ? prev.supervisee_ids.filter((x) => x !== id) : [...prev.supervisee_ids, id],
    }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.campus.length === 0) { setError('Selecciona al menos un recinto.'); return }
    if (newPassword && newPassword.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setLoading(true)

    const body: Record<string, unknown> = { full_name: form.full_name, role: form.role, campus: form.campus, supervisee_ids: form.supervisee_ids, web_intake: form.web_intake }
    if (newPassword) body.password = newPassword

    const res = await fetch(`/api/portal/admin/employees/${employee.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al actualizar el empleado.')
      setLoading(false)
      return
    }

    onSaved()
    onClose()
  }

  const empleados = allEmployees.filter((e) => e.id !== employee.id && e.role !== 'admin' && e.active)

  return (
    <div className="portal-modal-overlay">
      <div className="portal-modal max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-ink">Editar Empleado</h2>
            <p className="text-xs text-ink-muted mt-0.5">{employee.full_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-accent-soft flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent">{error}</p>
            </div>
          )}

          <div>
            <label className="portal-label">Nombre Completo <span className="text-accent">*</span></label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              className="portal-input"
            />
          </div>

          <div>
            <label className="portal-label">Rol</label>
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as typeof p.role, supervisee_ids: [] }))} className="portal-select">
              <option value="empleado">Representante de Admisiones</option>
              <option value="supervisor">Supervisor de Admisiones</option>
              <option value="director">Director de Recinto</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          {form.role === 'director' && (
            <div className="p-3 rounded-lg bg-surface">
              <p className="text-xs text-ink-muted">El Director supervisará automáticamente a todos los empleados del recinto asignado — no es necesario seleccionarlos individualmente.</p>
            </div>
          )}
          {form.role === 'supervisor' && (
            <div>
              <label className="portal-label">Empleados a supervisar</label>
              {empleados.length === 0 ? (
                <p className="text-xs text-ink-muted mt-1">No hay representantes activos disponibles.</p>
              ) : (
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto bg-surface rounded-xl p-2 shadow-neu-inset">
                  {empleados.map((emp) => (
                    <label key={emp.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.supervisee_ids.includes(emp.id)}
                        onChange={() => toggleSupervisee(emp.id)}
                        className="rounded border-black/[0.15] text-ink"
                      />
                      <span className="text-sm text-ink">{emp.full_name}</span>
                      <span className="text-xs text-ink-muted ml-auto">{(emp.campus as string[]).join(', ')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          <div>
            <label className="portal-label">Recinto(s) <span className="text-accent">*</span></label>
            <div className="flex gap-3 mt-1">
              {CAMPUSES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCampus(c)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${form.campus.includes(c) ? 'bg-ink text-white shadow-soft' : 'bg-surface text-ink-muted shadow-neu-inset hover:text-ink'}`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {c}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface shadow-neu-inset cursor-pointer hover:bg-surface-soft">
            <input
              type="checkbox"
              checked={form.web_intake}
              onChange={(e) => setForm((prev) => ({ ...prev, web_intake: e.target.checked }))}
              className="mt-0.5 rounded border-black/[0.15] text-ink"
            />
            <span>
              <span className="block text-sm font-medium text-ink">Recibe leads del website</span>
              <span className="block text-xs text-ink-muted">Los leads del formulario público se reparten (round-robin) solo entre los empleados con esta opción activada.</span>
            </span>
          </label>

          <div className="pt-2 border-t border-black/[0.05]">
            <label className="portal-label">Nueva Contraseña <span className="text-ink-muted font-normal">(opcional)</span></label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="portal-input"
              placeholder="Dejar en blanco para no cambiar · mín. 8 caracteres"
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="portal-btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="portal-btn flex-1">
              {loading && <span className="portal-spinner h-4 w-4 border-2 border-white/30 border-t-white" />}
              Guardar Cambios
            </button>
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
    <div className="portal-modal-overlay">
      <div className="portal-modal max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] flex-shrink-0">
          <h2 className="text-base font-bold text-ink">Importar Leads desde CSV</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 'upload' && (
            <div>
              <p className="text-sm text-ink-muted mb-4">
                Selecciona un archivo CSV exportado de Airtable. Las columnas serán detectadas automáticamente.
              </p>
              <div
                className="bg-surface rounded-xl2 shadow-neu-inset p-10 text-center cursor-pointer transition-all hover:shadow-soft"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                <Upload className="h-8 w-8 text-ink-muted mx-auto mb-3" />
                <p className="text-sm font-medium text-ink">Arrastra tu CSV aquí o haz clic para seleccionar</p>
                <p className="text-xs text-ink-muted mt-1">Solo archivos .csv</p>
              </div>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          {step === 'map' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4 text-ink" />
                <p className="text-sm text-ink font-medium">{rows.length} filas detectadas</p>
              </div>

              <div className="mb-5 overflow-x-auto rounded-xl bg-white shadow-soft">
                <table className="text-xs w-full">
                  <thead>
                    <tr className="bg-surface border-b border-black/[0.05]">
                      {headers.map((h, i) => <th key={i} className="px-3 py-2 text-left font-semibold text-ink-muted whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 3).map((row, ri) => (
                      <tr key={ri} className="border-b border-black/[0.05]">
                        {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-ink max-w-[120px] truncate" title={cell}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm font-semibold text-ink mb-3">Mapeo de columnas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(FIELD_LABELS) as (keyof ColMap)[]).map((field) => (
                  <div key={field}>
                    <label className="text-xs text-ink-muted font-medium block mb-1">{FIELD_LABELS[field]}</label>
                    <select
                      value={colMap[field] !== undefined ? String(colMap[field]) : ''}
                      onChange={(e) => updateColMap(field, e.target.value)}
                      className="portal-select"
                    >
                      <option value="">— No incluir —</option>
                      {headers.map((h, i) => <option key={i} value={String(i)}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>

              <div className="mt-5 p-3 rounded-xl bg-surface shadow-neu-inset">
                <p className="text-xs text-ink font-medium">Nota sobre Representantes</p>
                <p className="text-xs text-ink-muted mt-0.5">
                  Los leads de <strong>Melisa Tirado</strong> y <strong>Zuleika Ortiz Velez</strong> serán asignados automáticamente a Carmen Peña con una nota en el historial.
                </p>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-8 text-center">
              <div className="portal-spinner h-8 w-8 mx-auto mb-4" />
              <p className="text-sm font-medium text-ink">Importando leads…</p>
              <p className="text-xs text-ink-muted mt-1">
                {progress.imported + progress.skipped} / {progress.total} procesados
              </p>
              <div className="mt-4 h-2 bg-surface shadow-neu-inset rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? ((progress.imported + progress.skipped) / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="py-4">
              <div className="flex flex-col items-center text-center mb-5">
                <CheckCircle className="h-10 w-10 text-ink mb-3" />
                <p className="text-base font-bold text-ink">Importación completada</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-surface rounded-xl p-4 text-center shadow-neu-inset">
                  <p className="text-2xl font-bold text-ink">{progress.imported}</p>
                  <p className="text-xs text-ink-muted mt-0.5">Leads importados</p>
                </div>
                <div className="bg-surface rounded-xl p-4 text-center shadow-neu-inset">
                  <p className="text-2xl font-bold text-ink-muted">{progress.skipped}</p>
                  <p className="text-xs text-ink-muted mt-0.5">Omitidos / errores</p>
                </div>
              </div>
              {finalErrors.length > 0 && (
                <div className="bg-accent-soft rounded-xl p-4 max-h-40 overflow-y-auto">
                  <p className="text-xs font-semibold text-accent mb-2">Detalles de errores:</p>
                  {finalErrors.slice(0, 50).map((e, i) => (
                    <p key={i} className="text-xs text-accent">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-black/[0.05] flex justify-end gap-3 flex-shrink-0">
          {step === 'done' ? (
            <button onClick={onClose} className="portal-btn">Cerrar</button>
          ) : step === 'map' ? (
            <>
              <button onClick={() => setStep('upload')} className="portal-btn-ghost">
                Volver
              </button>
              <button onClick={startImport} disabled={!colMap.full_name && !colMap.phone} className="portal-btn">
                Importar {rows.length} leads
              </button>
            </>
          ) : step === 'upload' ? (
            <button onClick={onClose} className="portal-btn-ghost">
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

interface PlanChange {
  id: string
  day: number
  old_value: string | null
  new_value: string | null
  changed_at: string
}

function ActivitiesPanel() {
  const [activitiesMonth, setActivitiesMonth] = useState(firstOfMonth())
  const [activities, setActivities] = useState<AdminActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [calendarMonth, setCalendarMonth] = useState(getNextMonthStr())
  const [calendarPlans, setCalendarPlans] = useState<CalendarPlan[]>([])
  const [calendarLoading, setCalendarLoading] = useState(true)
  const [historyState, setHistoryState] = useState<Record<string, { open: boolean; loading: boolean; changes: PlanChange[] }>>({})

  useEffect(() => {
    setLoading(true)
    setFetchError('')
    fetch(`/api/portal/admin/activities?month=${activitiesMonth}`)
      .then(async (r) => {
        const d = await r.json()
        if (!r.ok) { setFetchError(d.error ?? 'Error al cargar actividades.'); setLoading(false); return }
        setActivities(d.activities ?? [])
        setLoading(false)
      })
      .catch(() => { setFetchError('Error de conexión.'); setLoading(false) })
  }, [activitiesMonth])

  useEffect(() => {
    setCalendarLoading(true)
    setHistoryState({})
    fetch(`/api/portal/admin/calendars?month=${calendarMonth}`)
      .then(async (r) => {
        const d = await r.json()
        setCalendarPlans(d.plans ?? [])
        setCalendarLoading(false)
      })
      .catch(() => setCalendarLoading(false))
  }, [calendarMonth])

  // Month options: 3 past + current + 3 future
  const monthOptions: string[] = []
  for (let i = 3; i >= -3; i--) {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - i)
    monthOptions.push(d.toISOString().slice(0, 10))
  }

  const calendarMonthOptions: string[] = []
  for (let i = -3; i <= 3; i++) {
    const d = new Date()
    d.setMonth(d.getMonth() + i)
    calendarMonthOptions.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  // Group activities by employee
  const byEmployee = new Map<string, AdminActivity[]>()
  activities.forEach((a) => {
    const key = a.employee_name ?? a.employee_id
    if (!byEmployee.has(key)) byEmployee.set(key, [])
    byEmployee.get(key)!.push(a)
  })

  const daysInMonth = getDaysInMonth(calendarMonth)

  async function toggleHistory(supervisorId: string) {
    const current = historyState[supervisorId]
    if (current?.open) {
      setHistoryState((p) => ({ ...p, [supervisorId]: { ...p[supervisorId], open: false } }))
      return
    }
    if (current?.changes.length > 0) {
      setHistoryState((p) => ({ ...p, [supervisorId]: { ...p[supervisorId], open: true } }))
      return
    }
    setHistoryState((p) => ({ ...p, [supervisorId]: { open: true, loading: true, changes: [] } }))
    try {
      const r = await fetch(`/api/portal/admin/plan-changes?supervisor_id=${supervisorId}&month=${calendarMonth}`)
      const d = await r.json()
      setHistoryState((p) => ({ ...p, [supervisorId]: { open: true, loading: false, changes: d.changes ?? [] } }))
    } catch {
      setHistoryState((p) => ({ ...p, [supervisorId]: { open: true, loading: false, changes: [] } }))
    }
  }

  return (
    <div className="space-y-8">
      {/* Activities section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink">Actividades</h2>
          <select
            value={activitiesMonth}
            onChange={(e) => setActivitiesMonth(e.target.value)}
            className="portal-filter capitalize"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m} className="capitalize">{monthLabel(m)}</option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="portal-card p-12 flex justify-center">
            <div className="portal-spinner h-7 w-7" />
          </div>
        ) : fetchError ? (
          <div className="portal-card p-10 text-center">
            <AlertCircle className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-sm text-accent">{fetchError}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="portal-card p-14 text-center">
            <CalendarDays className="h-10 w-10 text-ink-muted/50 mx-auto mb-3" />
            <p className="font-medium text-ink-muted">No hay actividades planificadas este mes.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(byEmployee.entries()).map(([empName, acts]) => (
              <div key={empName}>
                <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">{empName}</h3>
                <div className="portal-card overflow-hidden">
                  <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/[0.05] bg-surface">
                        <th className="text-left px-4 py-3 font-semibold text-ink-muted">Actividad</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-muted hidden sm:table-cell">Tipo</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-muted hidden md:table-cell">Fecha · Lugar</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-muted">Leads</th>
                        <th className="text-left px-4 py-3 font-semibold text-ink-muted">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.05]">
                      {acts.map((act) => (
                        <tr key={act.id} className="hover:bg-surface">
                          <td className="px-4 py-3">
                            <p className="font-medium text-ink">{act.name}</p>
                            {act.description && <p className="text-xs text-ink-muted truncate max-w-[200px]">{act.description}</p>}
                          </td>
                          <td className="px-4 py-3 text-ink-muted hidden sm:table-cell text-xs">
                            {ACTIVITY_TYPE_LABELS[act.type] ?? act.type}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <div className="space-y-0.5">
                              {act.activity_date && (
                                <p className="text-xs text-ink-muted flex items-center gap-1">
                                  <CalendarDays className="h-3 w-3 text-ink-muted" />
                                  {new Date(act.activity_date + 'T00:00:00').toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}
                                </p>
                              )}
                              {act.location && (
                                <p className="text-xs text-ink-muted flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-ink-muted" />
                                  {act.location}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-ink-muted">
                            <span>{act.actual_leads ?? '—'} / {act.planned_leads ?? '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            {act.status === 'terminada'
                              ? <span className="inline-flex items-center gap-1 text-xs text-ink"><CheckCircle className="h-3.5 w-3.5" />Terminada</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-ink-muted">Planificada</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendars section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-ink">Calendarios de Planificación</h2>
          <select
            value={calendarMonth}
            onChange={(e) => setCalendarMonth(e.target.value)}
            className="portal-filter capitalize"
          >
            {calendarMonthOptions.map((m) => (
              <option key={m} value={m} className="capitalize">{calendarMonthLabel(m)}</option>
            ))}
          </select>
        </div>

        {calendarLoading ? (
          <div className="portal-card p-10 flex justify-center">
            <div className="portal-spinner h-6 w-6" />
          </div>
        ) : calendarPlans.length === 0 ? (
          <div className="portal-card p-12 text-center">
            <CalendarDays className="h-9 w-9 text-ink-muted/50 mx-auto mb-2" />
            <p className="text-sm text-ink-muted">Ningún supervisor ha completado su calendario para este mes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {calendarPlans.map((plan) => {
              const hs = historyState[plan.supervisor_id]
              return (
                <div key={plan.supervisor_id} className="portal-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-black/[0.05] flex items-center gap-3">
                    <div className="portal-chip">
                      {plan.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-ink text-sm">{plan.full_name}</p>
                      <p className="text-xs text-ink-muted capitalize">
                        {plan.role === 'director' ? 'Director de Recinto' : 'Supervisor'} · {(plan.campus as string[]).join(', ')}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <span className="text-xs text-ink-muted">
                        {Object.values(plan.notes ?? {}).filter(Boolean).length} días planificados
                      </span>
                      <button
                        onClick={() => toggleHistory(plan.supervisor_id)}
                        className="text-xs text-ink hover:underline"
                      >
                        {hs?.open ? 'Ocultar historial' : 'Ver historial'}
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const note = (plan.notes ?? {})[String(day)] ?? ''
                        return (
                          <div
                            key={day}
                            className={`rounded-lg p-1.5 min-h-[52px] ${note ? 'bg-white shadow-neu-sm' : 'bg-surface shadow-neu-inset'}`}
                          >
                            <p className={`text-xs font-semibold mb-0.5 ${note ? 'text-ink' : 'text-ink-muted'}`}>{day}</p>
                            {note && <p className="text-xs text-ink leading-tight line-clamp-2">{note}</p>}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* History panel */}
                  {hs?.open && (
                    <div className="border-t border-black/[0.05] px-5 py-4">
                      <p className="text-xs font-semibold text-ink mb-3">Historial de ediciones</p>
                      {hs.loading ? (
                        <div className="flex justify-center py-4">
                          <div className="portal-spinner h-5 w-5" />
                        </div>
                      ) : hs.changes.length === 0 ? (
                        <p className="text-xs text-ink-muted">Sin historial de ediciones para este mes.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-black/[0.05]">
                                <th className="text-left pb-2 font-semibold text-ink-muted pr-4">Día</th>
                                <th className="text-left pb-2 font-semibold text-ink-muted pr-4">Antes</th>
                                <th className="text-left pb-2 font-semibold text-ink-muted pr-4">Después</th>
                                <th className="text-left pb-2 font-semibold text-ink-muted">Fecha y Hora</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/[0.05]">
                              {hs.changes.map((ch) => (
                                <tr key={ch.id} className="align-top">
                                  <td className="py-2 pr-4 font-medium text-ink">{ch.day}</td>
                                  <td className="py-2 pr-4 text-ink-muted line-through max-w-[160px] whitespace-pre-wrap break-words">{ch.old_value ?? <span className="text-ink-muted/60 italic no-underline">vacío</span>}</td>
                                  <td className="py-2 pr-4 text-ink max-w-[160px] whitespace-pre-wrap break-words">{ch.new_value ?? <span className="text-ink-muted italic">vacío</span>}</td>
                                  <td className="py-2 text-ink-muted whitespace-nowrap">
                                    {new Date(ch.changed_at).toLocaleString('es-PR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
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
      <div className="portal-card p-12 flex justify-center">
        <div className="portal-spinner h-7 w-7" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="portal-card p-10 text-center">
        <AlertCircle className="h-8 w-8 text-accent mx-auto mb-2" />
        <p className="text-sm text-accent">{fetchError}</p>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="portal-card p-14 text-center">
        <ClipboardList className="h-10 w-10 text-ink-muted/50 mx-auto mb-3" />
        <p className="font-medium text-ink-muted">No hay informes de cierre enviados aún.</p>
        <p className="text-sm text-ink-muted mt-1">Aparecerán aquí cuando los representantes envíen sus informes mensuales.</p>
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
          <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3 capitalize">
            {monthLabel(month)}
          </h3>
          <div className="space-y-3">
            {monthReports.map((report) => {
              const scoreCfg = report.performance_score ? SCORE_CONFIG[report.performance_score] : null
              const isExpanded = expanded === report.id
              return (
                <div key={report.id} className="portal-card overflow-hidden">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : report.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="portal-chip">
                        {report.employee?.full_name.charAt(0).toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-ink text-sm">{report.employee?.full_name ?? 'Empleado'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {report.employee?.campus.map((c) => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink font-medium">{c}</span>
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
                      <div className="text-right text-xs text-ink-muted hidden sm:block">
                        <p><span className="font-medium text-ink">{report.leads_acquired ?? '—'}</span> leads</p>
                        <p><span className="font-medium text-ink">{report.leads_enrolled ?? '—'}</span> matriculados</p>
                      </div>
                      <span className={`text-ink-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-black/[0.05]">
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { label: 'Leads Adquiridos',     value: report.leads_acquired },
                          { label: 'Matriculados',          value: report.leads_enrolled },
                          { label: 'Actividades completadas', value: report.activities_completed },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-surface rounded-xl p-3 text-center shadow-neu-inset">
                            <p className="text-xl font-bold text-ink">{value ?? '—'}</p>
                            <p className="text-xs text-ink-muted mt-0.5">{label}</p>
                          </div>
                        ))}
                      </div>
                      {report.notes && (
                        <div className="mt-4 bg-surface rounded-xl p-4 shadow-neu-inset">
                          <p className="text-xs font-semibold text-ink-muted mb-1">Notas del representante</p>
                          <p className="text-sm text-ink whitespace-pre-wrap">{report.notes}</p>
                        </div>
                      )}
                      <p className="text-xs text-ink-muted mt-3">
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
  excelente: { label: 'Excelente',  bg: 'bg-ink/[0.08]',  text: 'text-ink' },
  bueno:     { label: 'Bueno',      bg: 'bg-surface',     text: 'text-ink' },
  basico:    { label: 'Básico',     bg: 'bg-surface',     text: 'text-ink-muted' },
  deficiente:{ label: 'Deficiente', bg: 'bg-accent-soft', text: 'text-accent' },
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
  activities: {
    id: string; name: string; type: string; activity_date: string | null
    planned_leads: number; actual_leads: number; status: string
  }[]
  report_submitted: boolean
  performance_score: string | null
  report_notes: string | null
  // enriched
  status_breakdown: Record<string, number>
  source_breakdown: Record<string, number>
  programs_breakdown: Record<string, number>
  contracts_count: number
  contracts_total: number
}

interface SummaryTotals {
  total_leads: number
  total_matriculados: number
  total_activities_planned: number
  total_activities_completed: number
  reports_submitted: number
  total_employees: number
  total_contracts: number
  duplicate_pairs_count: number
}

interface SummaryLead {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  email: string | null
  campus: string | null
  programa_interes: string | null
  status: string
  created_at: string
  employee_name: string
  source_label: string
}

interface DupPair {
  lead1: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null; employee_name: string }
  lead2: { id: string; nombre: string; apellido: string; telefono: string | null; email: string | null; employee_name: string }
  match_type: 'phone' | 'email'
}

interface SummaryData {
  month: string
  totals: SummaryTotals
  employees: EmpStat[]
  leads: SummaryLead[]
  duplicate_pairs: DupPair[]
}

// ─── Admin HTML report builder ───────────────────────────────────────────────

const ACT_TYPE_LABELS: Record<string, string> = {
  feria: 'Feria',
  visita_escuela: 'Visita a Escuela',
  evento_comunitario: 'Evento Comunitario',
  otro: 'Otro',
}

function buildAdminHtml(data: SummaryData, label: string): string {
  const now = new Date().toLocaleDateString('es-PR', { day: 'numeric', month: 'long', year: 'numeric' })
  const navy = '#0a1628'
  const gold = '#c9a227'

  const tblStyle = `border-collapse:collapse;width:100%;font-size:11px;margin-bottom:16px;`
  const thStyle = `background:${navy};color:#fff;padding:6px 8px;text-align:left;font-size:11px;`
  const tdStyle = `padding:5px 8px;border-bottom:1px solid #e5e7eb;vertical-align:top;`
  const tdAlt   = `padding:5px 8px;border-bottom:1px solid #e5e7eb;background:#f9fafb;vertical-align:top;`

  function tr(cells: string[], alt = false): string {
    return `<tr>${cells.map((c) => `<td style="${alt ? tdAlt : tdStyle}">${c}</td>`).join('')}</tr>`
  }
  function thead(cols: string[]): string {
    return `<thead><tr>${cols.map((c) => `<th style="${thStyle}">${c}</th>`).join('')}</tr></thead>`
  }
  function kpi(label: string, value: string | number, sub?: string): string {
    return `<div style="background:#f3f4f6;border-radius:10px;padding:12px 16px;text-align:center;flex:1;min-width:120px;">
      <div style="font-size:22px;font-weight:800;color:${navy};">${value}</div>
      <div style="font-size:11px;color:#6b7280;margin-top:2px;">${label}</div>
      ${sub ? `<div style="font-size:10px;color:#9ca3af;margin-top:1px;">${sub}</div>` : ''}
    </div>`
  }
  function noData(msg = 'Sin datos para este período'): string {
    return `<p style="font-size:11px;color:#9ca3af;font-style:italic;margin:6px 0 16px;">${msg}</p>`
  }
  function pct(num: number, den: number): string {
    return den === 0 ? '0%' : `${Math.round((num / den) * 100)}%`
  }

  const sortedEmps = [...data.employees].sort((a, b) => b.leads_count - a.leads_count)

  // §3 — Per-employee sections
  const empSections = sortedEmps.map((emp) => {
    const conv = pct(emp.matriculados_count, emp.leads_count)
    const campusStr = emp.campus.join(', ') || '—'
    const statusEntries = Object.entries(emp.status_breakdown).sort((a, b) => b[1] - a[1])
    const sourceEntries = Object.entries(emp.source_breakdown).sort((a, b) => b[1] - a[1])
    const programEntries = Object.entries(emp.programs_breakdown).sort((a, b) => b[1] - a[1])

    const statusTable = statusEntries.length === 0 ? noData() : `
      <table style="${tblStyle}">
        ${thead(['Estado', 'Cantidad'])}
        <tbody>${statusEntries.map(([s, n], i) => tr([s, String(n)], i % 2 === 1)).join('')}</tbody>
      </table>`

    const sourceTable = sourceEntries.length === 0 ? noData() : `
      <table style="${tblStyle}">
        ${thead(['Fuente', 'Cantidad'])}
        <tbody>${sourceEntries.map(([s, n], i) => tr([s, String(n)], i % 2 === 1)).join('')}</tbody>
      </table>`

    const programTable = programEntries.length === 0 ? noData() : `
      <table style="${tblStyle}">
        ${thead(['Programa de Interés', 'Leads'])}
        <tbody>${programEntries.map(([p, n], i) => tr([p, String(n)], i % 2 === 1)).join('')}</tbody>
      </table>`

    const actsRows = (emp.activities ?? []).map((a, i) => tr([
      a.name ?? '—',
      ACT_TYPE_LABELS[a.type] ?? a.type,
      a.activity_date ? new Date(a.activity_date + 'T12:00:00').toLocaleDateString('es-PR') : '—',
      String(a.planned_leads ?? 0),
      String(a.actual_leads ?? 0),
      a.status === 'terminada' ? 'Terminada' : 'Planificada',
    ], i % 2 === 1))
    const actTable = actsRows.length === 0 ? noData() : `
      <table style="${tblStyle}">
        ${thead(['Actividad', 'Tipo', 'Fecha', 'Planificados', 'Realizados', 'Estado'])}
        <tbody>${actsRows.join('')}</tbody>
      </table>`

    const scoreLabel = emp.performance_score
      ? ({ excelente: 'Excelente', bueno: 'Bueno', basico: 'Básico', deficiente: 'Deficiente' }[emp.performance_score] ?? emp.performance_score)
      : 'Sin informe enviado'

    return `
<div style="page-break-inside:avoid;border:1px solid #e5e7eb;border-radius:10px;padding:20px;margin-bottom:20px;">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
    <div>
      <h2 style="margin:0 0 2px;font-size:14px;color:${navy};">${emp.full_name}${!emp.active ? ' <span style="font-size:10px;color:#9ca3af;">(Inactivo)</span>' : ''}</h2>
      <p style="margin:0;font-size:11px;color:#6b7280;">Recinto(s): ${campusStr}</p>
    </div>
    <span style="font-size:11px;background:#f3f4f6;padding:4px 10px;border-radius:20px;color:#374151;">${scoreLabel}</span>
  </div>
  <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
    ${kpi('Leads', emp.leads_count)}
    ${kpi('Matriculados', emp.matriculados_count, `${conv} conversión`)}
    ${kpi('Actividades', `${emp.activities_completed}/${emp.activities_planned}`, 'terminadas/planif.')}
    ${kpi('Contratos privados', emp.contracts_count, emp.contracts_total > 0 ? `$${emp.contracts_total.toFixed(2)} total` : undefined)}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div>
      <h3 style="font-size:12px;color:${navy};margin:0 0 6px;border-bottom:1px solid ${gold};padding-bottom:3px;">Distribución por Estado</h3>
      ${statusTable}
    </div>
    <div>
      <h3 style="font-size:12px;color:${navy};margin:0 0 6px;border-bottom:1px solid ${gold};padding-bottom:3px;">Origen de Leads</h3>
      ${sourceTable}
    </div>
  </div>

  <h3 style="font-size:12px;color:${navy};margin:12px 0 6px;border-bottom:1px solid ${gold};padding-bottom:3px;">Programas más Solicitados (Top 5)</h3>
  ${programTable}

  <h3 style="font-size:12px;color:${navy};margin:12px 0 6px;border-bottom:1px solid ${gold};padding-bottom:3px;">Actividades del Mes</h3>
  ${actTable}

  ${emp.report_notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;margin-top:8px;"><p style="font-size:10px;font-weight:600;color:#6b7280;margin:0 0 4px;">Notas del informe de cierre:</p><p style="font-size:11px;color:#374151;margin:0;">${emp.report_notes}</p></div>` : ''}
</div>`
  }).join('')

  // §4 — Duplicados
  const dupRows = data.duplicate_pairs.map((p, i) => tr([
    p.match_type === 'phone' ? 'Teléfono' : 'Correo',
    `${p.lead1.nombre} ${p.lead1.apellido}`,
    p.match_type === 'phone' ? (p.lead1.telefono ?? '—') : (p.lead1.email ?? '—'),
    p.lead1.employee_name,
    `${p.lead2.nombre} ${p.lead2.apellido}`,
    p.match_type === 'phone' ? (p.lead2.telefono ?? '—') : (p.lead2.email ?? '—'),
    p.lead2.employee_name,
  ], i % 2 === 1))

  const dupSection = dupRows.length === 0
    ? `<p style="font-size:12px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;">✓ No se detectaron duplicados en el período.</p>`
    : `<table style="${tblStyle}">
        ${thead(['Coincidencia', 'Lead 1 — Nombre', 'Valor', 'Representante', 'Lead 2 — Nombre', 'Valor', 'Representante'])}
        <tbody>${dupRows.join('')}</tbody>
      </table>`

  // §5 — Leads detallados
  const leadRows = data.leads.map((l, i) => tr([
    l.employee_name,
    `${l.nombre} ${l.apellido}`,
    l.telefono ?? '—',
    l.email ?? '—',
    l.campus ?? '—',
    l.programa_interes ?? '—',
    l.status,
    l.source_label,
    new Date(l.created_at).toLocaleDateString('es-PR'),
  ], i % 2 === 1))

  const leadsTable = leadRows.length === 0
    ? noData()
    : `<table style="${tblStyle}">
        ${thead(['Representante', 'Nombre', 'Teléfono', 'Correo', 'Recinto', 'Programa', 'Estado', 'Fuente', 'Fecha'])}
        <tbody>${leadRows.join('')}</tbody>
      </table>`

  const convGlobal = pct(data.totals.total_matriculados, data.totals.total_leads)

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe General — ${label}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; color: #1f2937; margin: 0; padding: 32px; font-size: 12px; }
  h1 { font-size: 20px; color: ${navy}; margin: 0 0 4px; }
  h2 { font-size: 14px; color: ${navy}; margin: 20px 0 8px; border-bottom: 2px solid ${gold}; padding-bottom: 4px; }
  h3 { font-size: 12px; color: ${navy}; margin: 12px 0 6px; }
  @media print { body { padding: 16px; } h2 { page-break-after: avoid; } }
</style>
</head>
<body>

<div style="text-align:center;margin-bottom:24px;">
  <p style="font-size:11px;font-weight:700;letter-spacing:2px;color:${navy};text-transform:uppercase;margin:0 0 4px;">D'MART INSTITUTE</p>
  <h1>INFORME GENERAL DE DESEMPEÑO</h1>
  <p style="font-size:12px;color:#6b7280;margin:2px 0;">Período: <strong>${label}</strong> &nbsp;·&nbsp; Generado el ${now}</p>
</div>

<h2>Resumen Ejecutivo</h2>
<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
  ${kpi('Representantes activos', data.totals.total_employees)}
  ${kpi('Total leads', data.totals.total_leads)}
  ${kpi('Matriculados', data.totals.total_matriculados, `${convGlobal} conversión`)}
  ${kpi('Actividades completadas', data.totals.total_activities_completed)}
  ${kpi('Contratos privados', data.totals.total_contracts)}
  ${kpi('Duplicados detectados', data.totals.duplicate_pairs_count)}
</div>

<h2>Desglose por Representante</h2>
${empSections || noData('No hay representantes con datos en este período.')}

<h2>Duplicados Detectados</h2>
${dupSection}

<h2>Leads Detallados (${data.leads.length} leads)</h2>
${leadsTable}

<p style="font-size:9px;color:#9ca3af;text-align:center;margin-top:32px;">
  D'MART Institute · Informe generado automáticamente — uso interno.
</p>

</body>
</html>`
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
      <div className="portal-card p-5">
        <h2 className="text-sm font-bold text-ink mb-1">Informe General del Mes</h2>
        <p className="text-xs text-ink-muted mb-4">
          Resumen de actividades, leads y matriculados de todos los representantes para el mes seleccionado.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="portal-filter capitalize"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m} className="capitalize">{monthLabel(m)}</option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={loading}
            className="portal-btn"
          >
            <Zap className="h-4 w-4" />
            {loading ? 'Generando…' : 'Generar Informe'}
          </button>

          {data && (
            <button
              onClick={() => {
                const label = monthLabel(data.month)
                const html = buildAdminHtml(data, label)
                const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `informe-general-${selectedMonth}.html`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              className="portal-btn-ghost"
            >
              <Download className="h-4 w-4" />
              Descargar HTML
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-accent-soft flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
            <p className="text-sm text-accent">{error}</p>
          </div>
        )}
      </div>

      {data && (
        <>
          {/* Global totals */}
          <div className="portal-card p-5">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4 capitalize">
              {monthLabel(data.month)} · Resumen general
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { icon: Users,         label: 'Representantes',    value: data.totals.total_employees,             color: 'text-ink' },
                { icon: TrendingUp,    label: 'Total Leads',       value: data.totals.total_leads,                 color: 'text-ink' },
                { icon: GraduationCap, label: 'Matriculados',      value: data.totals.total_matriculados,          color: 'text-ink' },
                { icon: CalendarDays,  label: 'Actividades Plan.', value: data.totals.total_activities_planned,    color: 'text-ink-muted' },
                { icon: CheckCircle,   label: 'Actividades Term.', value: data.totals.total_activities_completed,  color: 'text-ink' },
                { icon: ClipboardList, label: 'Informes Enviados', value: data.totals.reports_submitted,           color: 'text-ink-muted' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-surface rounded-xl p-3 text-center shadow-neu-inset">
                  <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
                  <p className="text-xl font-bold text-ink">{value}</p>
                  <p className="text-xs text-ink-muted leading-tight">{label}</p>
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
                  <div key={emp.id} className="portal-card p-5">
                    {/* Employee header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="portal-chip h-10 w-10">
                          {emp.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-ink text-sm">{emp.full_name}</p>
                            {!emp.active && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink-muted">Inactivo</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {emp.campus.map((c) => (
                              <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink font-medium">{c}</span>
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
                          <span className="px-2.5 py-1 rounded-full text-xs bg-surface text-ink-muted">
                            Sin informe
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Leads Generados',   value: emp.leads_count,            icon: TrendingUp,    color: 'text-ink' },
                        { label: 'Matriculados',       value: emp.matriculados_count,      icon: GraduationCap, color: 'text-ink' },
                        { label: 'Actividades Plan.',  value: emp.activities_planned,      icon: CalendarDays,  color: 'text-ink-muted' },
                        { label: 'Actividades Term.',  value: emp.activities_completed,    icon: CheckCircle,   color: 'text-ink' },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-surface rounded-xl p-3 text-center shadow-neu-inset">
                          <Icon className={`h-4 w-4 mx-auto mb-1 ${color}`} />
                          <p className="text-xl font-bold text-ink">{value}</p>
                          <p className="text-xs text-ink-muted leading-tight">{label}</p>
                        </div>
                      ))}
                    </div>

                    {emp.report_notes && (
                      <div className="mt-3 bg-surface rounded-xl px-4 py-3 shadow-neu-inset">
                        <p className="text-xs font-semibold text-ink-muted mb-0.5">Notas del representante</p>
                        <p className="text-sm text-ink">{emp.report_notes}</p>
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
  pendiente:  { label: 'Pendiente',   bg: 'bg-surface',    text: 'text-ink-muted' },
  en_proceso: { label: 'En proceso',  bg: 'bg-surface',    text: 'text-ink' },
  completado: { label: 'Completado',  bg: 'bg-ink/[0.08]', text: 'text-ink' },
  cancelado:  { label: 'Cancelado',   bg: 'bg-surface',    text: 'text-ink-muted' },
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
      <div className="portal-card p-12 flex justify-center">
        <div className="portal-spinner h-7 w-7" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="portal-card p-10 text-center">
        <AlertCircle className="h-8 w-8 text-accent mx-auto mb-2" />
        <p className="text-sm text-accent">{fetchError}</p>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="portal-card p-16 text-center">
        <Briefcase className="h-10 w-10 text-ink-muted/50 mx-auto mb-3" />
        <p className="text-ink-muted font-medium">No hay solicitudes de empleo aún.</p>
        <p className="text-ink-muted text-sm mt-1">Las solicitudes aparecerán aquí cuando alguien contacte a un egresado desde /egresados.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => {
        const cfg = JOB_STATUS_CONFIG[req.status]
        return (
          <div key={req.id} className="portal-card p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                  {req.graduate && (
                    <span className="text-sm font-semibold text-ink">
                      {req.graduate.full_name}
                    </span>
                  )}
                  {req.graduate && (
                    <span className="text-xs text-ink-muted">{req.graduate.program}</span>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  {new Date(req.created_at).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {req.preferred_date && ` · Fecha preferida: ${new Date(req.preferred_date + 'T00:00:00').toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>
              <select
                value={req.status}
                onChange={(e) => updateStatus(req.id, e.target.value)}
                className="portal-filter flex-shrink-0"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-ink">
                <Users className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                {req.client_name}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Mail className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                <a href={`mailto:${req.client_email}`} className="hover:underline truncate">{req.client_email}</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-muted">
                <Phone className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                <a href={`tel:${req.client_phone}`} className="hover:underline">{req.client_phone}</a>
              </div>
            </div>

            <div className="bg-surface rounded-xl px-4 py-3 shadow-neu-inset">
              <p className="text-xs font-semibold text-ink-muted mb-0.5">Descripción del servicio</p>
              <p className="text-sm text-ink">{req.service_description}</p>
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
  const [editEmployee, setEditEmployee] = useState<EmployeeWithCount | null>(null)
  const [activeTab, setActiveTab] = useState<'empleados' | 'actividades' | 'informes' | 'informe_general' | 'solicitudes' | 'posts' | 'contenido'>('actividades')

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
    <div className="min-h-screen bg-surface">
      {adminEmployee && <PortalHeader employee={adminEmployee} />}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink font-display">Administración</h1>
            <p className="text-sm text-ink-muted mt-0.5">{employees.length} empleado{employees.length !== 1 ? 's' : ''} registrado{employees.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <a href="/portal/dashboard" className="text-sm text-ink hover:underline font-medium py-2">
              ← Dashboard
            </a>
            {activeTab === 'empleados' && (
              <>
                <button
                  onClick={() => setShowImport(true)}
                  className="portal-btn-ghost"
                >
                  <Upload className="h-4 w-4" />
                  Importar CSV
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="portal-btn"
                >
                  <UserPlus className="h-4 w-4" />
                  Agregar Empleado
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="portal-tabs flex mb-6 overflow-x-auto no-scrollbar">
          {([
            { key: 'empleados',       label: 'Empleados',          icon: Users },
            { key: 'actividades',     label: 'Actividades',         icon: CalendarDays },
            { key: 'informes',        label: 'Informes Enviados',   icon: ClipboardList },
            { key: 'informe_general', label: 'Informe General',     icon: BarChart3 },
            { key: 'solicitudes',     label: 'Solicitudes',         icon: Briefcase },
            { key: 'posts',           label: 'Posts',               icon: Megaphone },
            { key: 'contenido',       label: 'Contenido',           icon: GraduationCap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`portal-tab flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap ${activeTab === key ? 'portal-tab--active' : ''}`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Employees tab */}
        {activeTab === 'empleados' && (
          loading ? (
            <div className="portal-card p-12 text-center">
              <div className="portal-spinner h-8 w-8 mx-auto" />
            </div>
          ) : (
            <div className="portal-card overflow-hidden">
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.05] bg-surface">
                    <th className="text-left px-4 py-3 font-semibold text-ink-muted">Empleado</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-muted hidden sm:table-cell">Recinto(s)</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-muted">Rol</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-muted hidden md:table-cell">Leads este mes</th>
                    <th className="text-left px-4 py-3 font-semibold text-ink-muted">Estado</th>
                    <th className="px-4 py-3 w-32"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.05]">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-surface transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="portal-chip h-8 w-8">
                            {emp.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-ink">{emp.full_name}</span>
                          {emp.web_intake && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-soft text-accent font-semibold" title="Recibe leads del website">Web</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {emp.campus.map((c) => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full bg-surface text-ink font-medium">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        <div>
                          <span>{emp.role === 'admin' ? 'Administrador' : emp.role === 'supervisor' ? 'Supervisor de Adm.' : emp.role === 'director' ? 'Director de Recinto' : 'Representante'}</span>
                          {emp.role === 'supervisor' && (
                            <p className="text-xs text-ink-muted mt-0.5">
                              Supervisando: {employees.filter((e) => e.supervisor_id === emp.id).length}
                            </p>
                          )}
                          {emp.role === 'director' && (
                            <p className="text-xs text-ink-muted mt-0.5">
                              Recinto: {(emp.campus as string[]).join(', ')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted hidden md:table-cell">
                        {emp.leads_this_month}
                      </td>
                      <td className="px-4 py-3">
                        {emp.active
                          ? <span className="flex items-center gap-1 text-xs text-ink"><CheckCircle className="h-3.5 w-3.5" />Activo</span>
                          : <span className="flex items-center gap-1 text-xs text-ink-muted"><XCircle className="h-3.5 w-3.5" />Inactivo</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditEmployee(emp)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleActive(emp)}
                            className="text-xs text-ink-muted hover:text-ink underline"
                          >
                            {emp.active ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
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

        {activeTab === 'posts' && <PostsHub />}

        {activeTab === 'contenido' && <ContentSubmissionsPanel />}
      </div>

      {showModal && (
        <CreateEmployeeModal
          onClose={() => setShowModal(false)}
          onCreated={loadEmployees}
          allEmployees={employees}
        />
      )}

      {editEmployee && (
        <EditEmployeeModal
          employee={editEmployee}
          allEmployees={employees}
          onClose={() => setEditEmployee(null)}
          onSaved={loadEmployees}
        />
      )}

      {showImport && (
        <CsvImportModal onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
