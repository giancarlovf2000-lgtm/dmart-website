'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { AlertTriangle, Plus, ChevronRight, Filter, Trash2, Search, CalendarClock } from 'lucide-react'
import LeadStatusBadge from './LeadStatusBadge'
import AddLeadModal from './AddLeadModal'
import type { Lead, Activity, LeadStatus, Employee } from '@/lib/types'
import { formatPhone, ALL_PROGRAMS } from '@/lib/utils'

const HORARIOS = ['Diurno', 'Nocturno', 'Sabatino']

const ALL_STATUSES: LeadStatus[] = [
  'Nuevo Lead', 'Crítico', 'Contacto Inicial (Pendiente de Respuesta)',
  'Contacto Establecido', 'Cita Programada', 'No Asistió a la Cita',
  'Reagendado', 'En Espera de Documentos', 'Orientado (En Proceso de Matricularse)',
  'Seguimiento a Futuro', 'Matriculado', 'Desinteresado / Rechazado',
  'Graduado', 'Graduado con Reválida',
]

interface LeadTableProps {
  leads: Lead[]
  staleLeadIds: string[]
  followupLeadIds?: string[]
  employee: Pick<Employee, 'id' | 'full_name' | 'campus' | 'role'>
  activities: Pick<Activity, 'id' | 'name' | 'type' | 'activity_date' | 'location'>[]
  sources?: string[]
  currentSource?: string
  teamMembers?: { id: string; full_name: string }[]
  reps?: { id: string; full_name: string }[]
  currentRep?: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PR', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function initials(name?: string | null): string {
  if (!name) return '—'
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('')
}

// Origen legible del lead para la tabla.
function leadOrigin(lead: Lead): string {
  const rep = lead.employee?.full_name
  const act = lead.activity?.name
  if (lead.assignment_source === 'manual') {
    if (act) return `${initials(rep)} · ${act} · Manual`
    return rep ? `${rep} · Manual` : 'Manual'
  }
  if (lead.assignment_source === 'actividad') {
    return `${initials(rep)} · ${act ?? 'Actividad'} · QR`
  }
  return lead.source ?? '—'
}

export default function LeadTable({ leads, staleLeadIds, followupLeadIds = [], employee, activities, sources = [], currentSource = '', teamMembers = [], reps = [], currentRep = '' }: LeadTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [showAddModal, setShowAddModal] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [searchName, setSearchName] = useState('')

  const isAdmin = employee.role === 'admin'
  const staleSet = new Set(staleLeadIds)
  const followupSet = new Set(followupLeadIds)

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) { params.set(key, value) } else { params.delete(key) }
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  const currentStatus = searchParams.get('status') ?? ''
  const currentCampus = searchParams.get('campus') ?? ''
  const currentProgram = searchParams.get('programa') ?? ''
  const currentHorario = searchParams.get('horario') ?? ''
  const currentDateFrom = searchParams.get('date_from') ?? ''
  const currentDateTo = searchParams.get('date_to') ?? ''

  const filteredLeads = searchName.trim()
    ? leads.filter((l) =>
        `${l.nombre} ${l.apellido}`.toLowerCase().includes(searchName.trim().toLowerCase())
      )
    : leads

  const allSelected = filteredLeads.length > 0 && selected.size === filteredLeads.length

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filteredLeads.map((l) => l.id)))
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
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="flex items-center gap-1.5 text-sm text-ink-muted">
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filtrar:</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted/60 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Buscar por nombre…"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="portal-filter pl-8 w-44"
          />
        </div>

        <select
          value={currentStatus}
          onChange={(e) => updateFilter('status', e.target.value)}
          className="portal-filter"
        >
          <option value="">Todos los estados</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={currentCampus}
          onChange={(e) => updateFilter('campus', e.target.value)}
          className="portal-filter"
        >
          <option value="">Todos los recintos</option>
          <option value="Barranquitas">Barranquitas</option>
          <option value="Vega Alta">Vega Alta</option>
        </select>

        {sources.length > 0 && (
          <select
            value={currentSource}
            onChange={(e) => updateFilter('source', e.target.value)}
            className="portal-filter"
          >
            <option value="">Todos los orígenes</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {reps.length > 0 && (
          <select
            value={currentRep}
            onChange={(e) => updateFilter('rep', e.target.value)}
            className="portal-filter"
          >
            <option value="">Todos los representantes</option>
            {reps.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
            <option value="none">Sin asignar</option>
          </select>
        )}

        <select
          value={currentProgram}
          onChange={(e) => updateFilter('programa', e.target.value)}
          className="portal-filter max-w-[200px]"
        >
          <option value="">Todos los programas</option>
          {ALL_PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select
          value={currentHorario}
          onChange={(e) => updateFilter('horario', e.target.value)}
          className="portal-filter"
        >
          <option value="">Todos los horarios</option>
          {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>

        <div className="flex items-center gap-1.5 text-sm text-ink-muted">
          <span className="text-xs text-ink-muted/70">Fecha:</span>
          <input
            type="date"
            value={currentDateFrom}
            max={currentDateTo || undefined}
            onChange={(e) => updateFilter('date_from', e.target.value)}
            title="Desde"
            className="portal-filter"
          />
          <span className="text-ink-muted/60">–</span>
          <input
            type="date"
            value={currentDateTo}
            min={currentDateFrom || undefined}
            onChange={(e) => updateFilter('date_to', e.target.value)}
            title="Hasta"
            className="portal-filter"
          />
        </div>

        <div className="flex-1" />

        {isAdmin && selected.size > 0 && (
          <button
            onClick={deleteSelected}
            disabled={deleting}
            className="portal-btn-danger"
          >
            <Trash2 className="h-4 w-4" />
            {deleting ? 'Eliminando…' : `Eliminar (${selected.size})`}
          </button>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="portal-btn"
        >
          <Plus className="h-4 w-4" />
          Agregar Lead
        </button>
      </div>

      {/* Table */}
      {filteredLeads.length === 0 ? (
        <div className="portal-card p-12 text-center">
          <p className="text-ink-muted font-medium">No hay leads que mostrar.</p>
          <p className="text-sm text-ink-muted/60 mt-1">Ajusta los filtros o agrega un nuevo lead.</p>
        </div>
      ) : (
        <div className="portal-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.05] bg-surface text-left">
                  {isAdmin && (
                    <th className="px-3 py-3 w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-ink-muted/30 text-ink focus:ring-accent-ring cursor-pointer"
                        title={allSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap">Nombre</th>
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap">Teléfono</th>
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap hidden md:table-cell">Programa</th>
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap hidden sm:table-cell">Recinto</th>
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap">Estado</th>
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap hidden xl:table-cell">Origen</th>
                  <th className="px-4 py-3 font-semibold text-ink-muted whitespace-nowrap hidden lg:table-cell">Fecha</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04]">
                {filteredLeads.map((lead) => {
                  const isStale = staleSet.has(lead.id)
                  const hasFollowup = followupSet.has(lead.id)
                  const isChecked = selected.has(lead.id)
                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-surface/60 transition-colors ${isStale ? 'bg-accent-soft/30' : ''} ${isChecked ? 'bg-surface' : ''}`}
                    >
                      {isAdmin && (
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleOne(lead.id)}
                            className="h-4 w-4 rounded border-ink-muted/30 text-ink focus:ring-accent-ring cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 font-medium text-ink cursor-pointer" onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        <div className="flex items-center gap-2">
                          {isStale && (
                            <span title="Seguimiento pendiente (7+ días sin actividad)">
                              <AlertTriangle className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                            </span>
                          )}
                          {hasFollowup && (
                            <span title="Follow-up programado para hoy o antes">
                              <CalendarClock className="h-3.5 w-3.5 text-ink-muted flex-shrink-0" />
                            </span>
                          )}
                          <span className="max-w-[180px] truncate" title={`${lead.nombre} ${lead.apellido}`}>{lead.nombre} {lead.apellido}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink-muted font-mono text-xs whitespace-nowrap cursor-pointer" onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        {formatPhone(lead.telefono)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted max-w-[180px] truncate hidden md:table-cell cursor-pointer" title={lead.programa_interes ?? ''} onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        {lead.programa_interes ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap hidden sm:table-cell cursor-pointer" onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        {lead.campus ?? '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap cursor-pointer" onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        <LeadStatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-3 text-ink-muted text-xs whitespace-nowrap hidden xl:table-cell cursor-pointer max-w-[160px] truncate" title={leadOrigin(lead)} onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        {leadOrigin(lead)}
                      </td>
                      <td className="px-4 py-3 text-ink-muted/70 text-xs whitespace-nowrap hidden lg:table-cell cursor-pointer" onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-4 py-3 cursor-pointer" onClick={() => router.push(`/portal/leads/${lead.id}`)}>
                        <ChevronRight className="h-4 w-4 text-ink-muted/40" />
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
          employeeId={employee.id}
          employeeName={employee.full_name}
          activities={activities}
          teamMembers={teamMembers}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
