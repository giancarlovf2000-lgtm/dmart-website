'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AlertTriangle, Plus, ChevronRight, Filter, Trash2 } from 'lucide-react'
import LeadStatusBadge from './LeadStatusBadge'
import AddLeadModal from './AddLeadModal'
import type { Lead, Activity, LeadStatus, Employee } from '@/lib/types'
import { formatPhone } from '@/lib/utils'

const ALL_STATUSES: LeadStatus[] = [
  'Nuevo Lead', 'Crítico', 'Contacto Inicial (Pendiente de Respuesta)',
  'Contacto Establecido', 'Cita Programada', 'No Asistió a la Cita',
  'Reagendado', 'En Espera de Documentos', 'Orientado (En Proceso de Matricularse)',
  'Seguimiento a Futuro', 'Matriculado', 'Desinteresado / Rechazado',
]

interface LeadTableProps {
  leads: Lead[]
  staleLeadIds: string[]
  employee: Pick<Employee, 'full_name' | 'campus' | 'role'>
  activities: Pick<Activity, 'id' | 'name'>[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PR', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function LeadTable({ leads, staleLeadIds, employee, activities }: LeadTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const isAdmin = employee.role === 'admin'
  const staleSet = new Set(staleLeadIds)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const currentStatus = searchParams.get('status') ?? ''
  const currentCampus = searchParams.get('campus') ?? ''

  const allSelected = leads.length > 0 && selected.size === leads.length

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(leads.map((l) => l.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function deleteSelected() {
    if (selected.size === 0) return
    const confirmMsg = `¿Eliminar ${selected.size} lead${selected.size > 1 ? 's' : ''}? Esta acción no se puede deshacer.`
    if (!confirm(confirmMsg)) return

    setDeleting(true)
    const res = await fetch('/api/portal/leads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected) }),
    })

    if (res.ok) {
      setSelected(new Set())
      router.refresh()
    } else {
      alert('Error al eliminar los leads. Intenta de nuevo.')
    }
    setDeleting(false)
  }

  return (
    <div>
      {/* Filters + action bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtrar:</span>
        </div>

        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={currentCampus}
          onChange={(e) => updateFilter('campus', e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="">Todos los recintos</option>
          <option value="Barranquitas">Barranquitas</option>
          <option value="Vega Alta">Vega Alta</option>
        </select>

        <div className="flex-1" />

        {isAdmin && selected.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Eliminando…' : `Eliminar (${selected.size})`}
          </button>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold/90 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Agregar Lead
        </button>
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 font-medium">No hay leads que mostrar.</p>
          <p className="text-sm text-gray-400 mt-1">Ajusta los filtros o agrega un nuevo lead.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  {isAdmin && (
                    <th className="px-3 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy/20 cursor-pointer"
                        title={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Teléfono</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden md:table-cell">Programa</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden sm:table-cell">Recinto</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 whitespace-nowrap hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map((lead) => {
                  const isStale = staleSet.has(lead.id)
                  const isChecked = selected.has(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-gray-50 transition-colors ${isStale ? 'bg-amber-50/40' : ''} ${isChecked ? 'bg-blue-50/50' : ''}`}
                    >
                      {isAdmin && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(lead.id)}
                            className="h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy/20 cursor-pointer"
                          />
                        </td>
                      )}
                      <td
                        className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap cursor-pointer"
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          {isStale && (
                            <span title="Seguimiento pendiente (7+ días sin actividad)">
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                            </span>
                          )}
                          {lead.nombre} {lead.apellido}
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600 font-mono text-xs whitespace-nowrap cursor-pointer"
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        {formatPhone(lead.telefono)}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600 max-w-[180px] truncate hidden md:table-cell cursor-pointer"
                        title={lead.programa_interes ?? ''}
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        {lead.programa_interes ?? '—'}
                      </td>
                      <td
                        className="px-4 py-3 text-gray-600 whitespace-nowrap hidden sm:table-cell cursor-pointer"
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        {lead.campus ?? '—'}
                      </td>
                      <td
                        className="px-4 py-3 whitespace-nowrap cursor-pointer"
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td
                        className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap hidden lg:table-cell cursor-pointer"
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        {formatDate(lead.created_at)}
                      </td>
                      <td
                        className="px-4 py-3 cursor-pointer"
                        onClick={() => router.push(`/portal/leads/${lead.id}`)}
                      >
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddLeadModal
          employeeName={employee.full_name}
          activities={activities}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
