'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Building2, CheckCircle, XCircle, AlertCircle, X, Upload, FileText } from 'lucide-react'
import PortalHeader from '@/components/portal/PortalHeader'
import Button from '@/components/ui/Button'
import type { Employee } from '@/lib/types'

interface EmployeeWithCount extends Employee {
  leads_this_month: number
}

const CAMPUSES = ['Barranquitas', 'Vega Alta']

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

// ─── CSV parsing helpers ────────────────────────────────────────────────────

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

// Detect which CSV header index maps to which field
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

// ─── CSV Import Modal ────────────────────────────────────────────────────────

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

              {/* Preview */}
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

              {/* Column mapping */}
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

export default function AdminPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<EmployeeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)

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

  // Need a way to get current employee info for header
  // For simplicity, find admin from list
  const adminEmployee = employees.find((e) => e.role === 'admin') as Employee | undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {adminEmployee && <PortalHeader employee={adminEmployee} />}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestión de Empleados</h1>
            <p className="text-sm text-gray-500 mt-0.5">{employees.length} empleado{employees.length !== 1 ? 's' : ''} registrado{employees.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-3">
            <a href="/portal/dashboard" className="text-sm text-navy hover:underline font-medium py-2">
              ← Dashboard
            </a>
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
          </div>
        </div>

        {loading ? (
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
        )}
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
