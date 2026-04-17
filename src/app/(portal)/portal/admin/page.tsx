'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Building2, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'
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

export default function AdminPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [employees, setEmployees] = useState<EmployeeWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  async function loadEmployees() {
    const res = await fetch('/api/portal/admin/employees')
    if (!res.ok) return
    const data = await res.json()
    setEmployees(data.employees ?? [])
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
    </div>
  )
}
