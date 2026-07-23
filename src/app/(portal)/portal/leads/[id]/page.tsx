'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, BookOpen, Clock, Calendar, CalendarClock, CalendarPlus, User, AlertCircle, Trash2, Pencil, Check, X, MessageSquarePlus, FileText } from 'lucide-react'
import LeadStatusBadge from '@/components/portal/LeadStatusBadge'
import StatusChangeModal from '@/components/portal/StatusChangeModal'
import CommTypeSelect from '@/components/portal/CommTypeSelect'
import type { Lead, LeadHistory, LeadFollowup } from '@/lib/types'
import { formatPhone, ALL_PROGRAMS } from '@/lib/utils'

const CAMPUSES = ['Barranquitas', 'Vega Alta', 'No tengo preferencia']
const HORARIOS = ['Diurno', 'Nocturno', 'Sabatino']

const PRIVATE_PROGRAM_KEYS: Record<string, string> = {
  'Corte y Estilo Caballeros': 'caballeros',
  'Corte y Estilo Damas': 'damas',
  'Técnica de Uñas': 'unas',
  'Facturación a Planes Médicos': 'facturacion',
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('es-PR', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_LABELS: Record<string, string> = {
  status_change: 'Cambio de estado',
  note_added: 'Nota',
  lead_created: 'Lead creado',
  lead_assigned: 'Lead asignado',
  followup_scheduled: 'Follow-up programado',
  followup_done: 'Follow-up cerrado',
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PR', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  })
}

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [history, setHistory] = useState<LeadHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isSupervisor, setIsSupervisor] = useState(false)
  const [assignableEmployees, setAssignableEmployees] = useState<{ id: string; full_name: string }[]>([])
  const [reassigning, setReassigning] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editContact, setEditContact] = useState<{
    nombre: string; apellido: string; start_date: string
    telefono: string; email: string
    campus: string; programa_interes: string; horario: string
  } | null>(null)
  const [savingContact, setSavingContact] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [noteForm, setNoteForm] = useState({ communication_type: 'Llamada', note: '' })
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState('')
  // Follow-ups
  const [followups, setFollowups] = useState<LeadFollowup[]>([])
  const [fuForm, setFuForm] = useState({ due_date: addDays(7), note: '' })
  const [savingFu, setSavingFu] = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/portal/leads/${params.id}`)
    if (!res.ok) {
      setError('No se pudo cargar el lead.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setLead(data.lead)
    setHistory(data.history)
    setIsAdmin(data.currentEmployeeRole === 'admin')
    setIsSupervisor(data.currentEmployeeRole === 'supervisor')
    setAssignableEmployees(data.assignableEmployees ?? [])

    fetch(`/api/portal/leads/${params.id}/followups`)
      .then((r) => r.ok ? r.json() : { followups: [] })
      .then((d) => setFollowups(d.followups ?? []))
      .catch(() => {})

    if (data.currentEmployeeRole === 'supervisor') {
      fetch('/api/portal/supervisor-plan/gate')
        .then((r) => r.json())
        .then((g) => { if (g.required && !g.complete) router.push('/portal/reportes?planning=required') })
        .catch(() => {})
    }
    setLoading(false)
  }

  async function handleReassign(newAssigneeId: string) {
    if (!lead || newAssigneeId === lead.assigned_to) return
    setReassigning(true)
    const res = await fetch(`/api/portal/leads/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: newAssigneeId }),
    })
    if (res.ok) {
      await load()
    } else {
      alert('Error al reasignar el lead.')
    }
    setReassigning(false)
  }

  async function handleDelete() {
    if (!confirm('¿Estás seguro de que quieres eliminar este lead? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    const res = await fetch(`/api/portal/leads/${params.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/portal/dashboard')
    } else {
      alert('Error al eliminar el lead. Intenta de nuevo.')
      setDeleting(false)
    }
  }

  async function handleSaveContact() {
    if (!editContact || !lead) return
    setSavingContact(true)
    const res = await fetch(`/api/portal/leads/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: editContact.nombre,
        apellido: editContact.apellido,
        start_date: editContact.start_date,
        telefono: editContact.telefono,
        email: editContact.email,
        campus: editContact.campus,
        programa_interes: editContact.programa_interes,
        horario: editContact.horario,
      }),
    })
    if (res.ok) {
      await load()
      setEditContact(null)
    } else {
      alert('Error al guardar los cambios.')
    }
    setSavingContact(false)
  }

  async function handleScheduleFollowup() {
    if (!fuForm.due_date) return
    setSavingFu(true)
    const res = await fetch(`/api/portal/leads/${params.id}/followups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fuForm),
    })
    if (res.ok) {
      setFuForm({ due_date: addDays(7), note: '' })
      await load()
    } else {
      alert('Error al programar el follow-up.')
    }
    setSavingFu(false)
  }

  async function handleCloseFollowup(fid: string, status: 'completado' | 'cancelado') {
    const res = await fetch(`/api/portal/leads/${params.id}/followups/${fid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) await load()
    else alert('Error al actualizar el follow-up.')
  }

  async function handleSaveNote() {
    setNoteError('')
    if (noteForm.note.trim().length < 20) { setNoteError('La nota debe tener al menos 20 caracteres.'); return }
    setSavingNote(true)
    const res = await fetch(`/api/portal/leads/${params.id}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteForm),
    })
    if (res.ok) {
      await load()
      setShowNoteForm(false)
      setNoteForm({ communication_type: 'Llamada', note: '' })
    } else {
      const data = await res.json()
      setNoteError(data.error ?? 'Error al guardar la nota.')
    }
    setSavingNote(false)
  }

  useEffect(() => { load() }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="portal-spinner h-8 w-8" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="portal-empty text-center">
          <AlertCircle className="h-12 w-12 text-accent mx-auto mb-3" />
          <p className="text-ink-muted">{error || 'Lead no encontrado.'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-ink hover:underline">← Volver</button>
        </div>
      </div>
    )
  }

  const sourceDisplay = () => {
    if (lead.assignment_source === 'manual') {
      if (lead.activity?.name) {
        return `Ingresado por ${lead.employee?.full_name ?? 'empleado'} desde actividad: ${lead.activity.name}`
      }
      return `Ingresado por ${lead.employee?.full_name ?? 'empleado'}${lead.lead_source_text ? ` · ${lead.lead_source_text}` : ''}`
    }
    const parts = [lead.source, lead.utm_source, lead.utm_campaign].filter(Boolean)
    return parts.length > 0 ? `Formulario web · ${parts.join(' / ')}` : 'Formulario web'
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Nav bar */}
      <div className="bg-white border-b border-black/[0.05] px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="portal-btn-danger"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            )}
            <button
              onClick={() => setShowStatusModal(true)}
              className="portal-btn"
            >
              Cambiar Estado
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Lead info card */}
        <div className="portal-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h1 className="text-2xl font-bold text-ink font-display">{lead.nombre} {lead.apellido}</h1>
              <p className="text-sm text-ink-muted mt-0.5">{sourceDisplay()}</p>
            </div>
            <LeadStatusBadge status={lead.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editContact ? (
              <>
                <EditField icon={User} label="Nombre">
                  <input
                    type="text"
                    value={editContact.nombre}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, nombre: e.target.value }))}
                    className="portal-input"
                  />
                </EditField>
                <EditField icon={User} label="Apellido">
                  <input
                    type="text"
                    value={editContact.apellido}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, apellido: e.target.value }))}
                    className="portal-input"
                  />
                </EditField>
                <EditField icon={Phone} label="Teléfono">
                  <input
                    type="tel"
                    value={editContact.telefono}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, telefono: e.target.value }))}
                    className="portal-input"
                  />
                </EditField>
                <EditField icon={Mail} label="Correo">
                  <input
                    type="email"
                    value={editContact.email}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, email: e.target.value }))}
                    className="portal-input"
                  />
                </EditField>
                <EditField icon={MapPin} label="Recinto">
                  <select
                    value={editContact.campus}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, campus: e.target.value }))}
                    className="portal-select"
                  >
                    <option value="">Sin especificar</option>
                    {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </EditField>
                <EditField icon={Clock} label="Horario">
                  <select
                    value={editContact.horario}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, horario: e.target.value }))}
                    className="portal-select"
                  >
                    <option value="">Sin especificar</option>
                    {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
                  </select>
                </EditField>
                <EditField icon={CalendarPlus} label="Fecha de comienzo">
                  <input
                    type="date"
                    value={editContact.start_date}
                    onChange={(e) => setEditContact((p) => p && ({ ...p, start_date: e.target.value }))}
                    className="portal-input"
                  />
                </EditField>
                <div className="sm:col-span-2">
                  <EditField icon={BookOpen} label="Programa de Interés">
                    <select
                      value={editContact.programa_interes}
                      onChange={(e) => setEditContact((p) => p && ({ ...p, programa_interes: e.target.value }))}
                      className="portal-select"
                    >
                      <option value="">Sin especificar</option>
                      {ALL_PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </EditField>
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={Phone} label="Teléfono" value={formatPhone(lead.telefono)} />
                <InfoRow icon={Mail} label="Correo" value={lead.email} />
                <InfoRow icon={MapPin} label="Recinto" value={lead.campus ?? '—'} />
                <InfoRow icon={Clock} label="Horario" value={lead.horario ?? '—'} />
                <InfoRow icon={BookOpen} label="Programa de Interés" value={lead.programa_interes ?? '—'} />
                <InfoRow icon={CalendarPlus} label="Fecha de comienzo" value={lead.start_date ? formatDate(lead.start_date) : '—'} />
              </>
            )}
            <InfoRow icon={Calendar} label="Fecha del Lead" value={formatDateTime(lead.created_at)} />
            {(isAdmin || isSupervisor) && assignableEmployees.length > 1 ? (
              <div>
                <p className="text-xs text-ink-muted mb-1">Asignado a</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-ink-muted flex-shrink-0" />
                  <select
                    value={lead.assigned_to ?? ''}
                    onChange={(e) => handleReassign(e.target.value)}
                    disabled={reassigning}
                    className="portal-filter disabled:opacity-50"
                  >
                    {assignableEmployees.map((e) => (
                      <option key={e.id} value={e.id}>{e.full_name}</option>
                    ))}
                  </select>
                  {reassigning && <span className="text-xs text-ink-muted">Guardando…</span>}
                </div>
              </div>
            ) : (
              <InfoRow icon={User} label="Asignado a" value={lead.employee?.full_name ?? '—'} />
            )}
            <InfoRow icon={Calendar} label="Última Actividad" value={formatDateTime(lead.last_action_at)} />
          </div>

          {/* Contact edit controls */}
          <div className="mt-4 pt-4 border-t border-black/[0.05] flex items-center justify-end gap-2">
            {editContact ? (
              <>
                <button
                  onClick={() => setEditContact(null)}
                  disabled={savingContact}
                  className="portal-btn-ghost"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveContact}
                  disabled={savingContact}
                  className="portal-btn"
                >
                  <Check className="h-4 w-4" />
                  {savingContact ? 'Guardando…' : 'Guardar'}
                </button>
              </>
            ) : (
              <>
                {lead.programa_interes && PRIVATE_PROGRAM_KEYS[lead.programa_interes] && (
                  <a
                    href={`/portal/contratos-privados?program=${PRIVATE_PROGRAM_KEYS[lead.programa_interes]}&nombre=${encodeURIComponent(`${lead.nombre} ${lead.apellido}`)}&telefono=${encodeURIComponent(lead.telefono ?? '')}&email=${encodeURIComponent(lead.email ?? '')}`}
                    className="portal-btn"
                  >
                    <FileText className="h-4 w-4" />
                    Generar Contrato
                  </a>
                )}
                <button
                  onClick={() => setEditContact({
                    nombre: lead.nombre ?? '',
                    apellido: lead.apellido ?? '',
                    start_date: lead.start_date ?? '',
                    telefono: lead.telefono ?? '',
                    email: lead.email ?? '',
                    campus: lead.campus ?? '',
                    programa_interes: lead.programa_interes ?? '',
                    horario: lead.horario ?? '',
                  })}
                  className="portal-btn-ghost"
                >
                  <Pencil className="h-4 w-4" />
                  Editar contacto
                </button>
              </>
            )}
          </div>
        </div>

        {/* Follow-up scheduler */}
        <div className="portal-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="h-4 w-4 text-ink-muted" />
            <h2 className="text-sm font-bold text-ink font-display">Follow-up programado</h2>
          </div>

          {/* Lista de follow-ups */}
          {followups.length > 0 && (
            <div className="space-y-2 mb-5">
              {followups.map((fu) => {
                const isProg = fu.status === 'programado'
                const isDue = isProg && fu.due_date <= new Date().toISOString().slice(0, 10)
                return (
                  <div key={fu.id} className={`flex items-start justify-between gap-3 rounded-xl border px-3.5 py-2.5 ${
                    isDue ? 'bg-accent-soft border-accent/20' : isProg ? 'bg-surface border-black/[0.05]' : 'bg-surface border-black/[0.05] opacity-70'
                  }`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink">{formatDate(fu.due_date)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          fu.status === 'programado' ? (isDue ? 'bg-accent text-white' : 'bg-ink/[0.06] text-ink-muted')
                          : fu.status === 'completado' ? 'bg-ink/[0.06] text-ink' : 'bg-ink/[0.06] text-ink-muted'
                        }`}>
                          {fu.status === 'programado' ? (isDue ? 'Pendiente hoy' : 'Programado') : fu.status === 'completado' ? 'Hecho' : 'Cancelado'}
                        </span>
                      </div>
                      {fu.note && <p className="text-sm text-ink-muted mt-0.5">{fu.note}</p>}
                      <p className="text-xs text-ink-muted mt-0.5">Programado por {fu.employee?.full_name ?? 'empleado'}</p>
                    </div>
                    {isProg && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleCloseFollowup(fu.id, 'completado')}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ink text-white text-xs font-semibold hover:bg-black transition-colors" title="Marcar como hecho">
                          <Check className="h-3 w-3" /> Hecho
                        </button>
                        <button onClick={() => handleCloseFollowup(fu.id, 'cancelado')}
                          className="p-1.5 rounded-lg text-ink-muted hover:bg-surface transition-colors" title="Cancelar">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Formulario para programar */}
          <div className="p-4 rounded-xl border border-black/[0.05] bg-surface space-y-3">
            <p className="text-xs font-semibold text-ink">Programar un follow-up</p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Fecha</label>
                <input
                  type="date"
                  value={fuForm.due_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setFuForm((p) => ({ ...p, due_date: e.target.value }))}
                  className="portal-filter"
                />
              </div>
              <div className="flex items-center gap-1.5">
                {[7, 10, 30].map((n) => (
                  <button key={n} type="button" onClick={() => setFuForm((p) => ({ ...p, due_date: addDays(n) }))}
                    className="portal-pill">
                    +{n} días
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Nota (opcional)</label>
              <input
                type="text"
                value={fuForm.note}
                onChange={(e) => setFuForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Motivo o recordatorio…"
                maxLength={500}
                className="portal-input"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleScheduleFollowup}
                disabled={savingFu || !fuForm.due_date}
                className="portal-btn"
              >
                <CalendarPlus className="h-4 w-4" />
                {savingFu ? 'Programando…' : 'Programar follow-up'}
              </button>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="portal-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink">Historial de Actividad</h2>
            {!showNoteForm && (
              <button
                onClick={() => setShowNoteForm(true)}
                className="portal-btn-ghost"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Agregar seguimiento
              </button>
            )}
          </div>

          {/* Inline note form */}
          {showNoteForm && (
            <div className="mb-5 p-4 rounded-xl border border-black/[0.05] bg-surface space-y-3">
              <p className="text-xs font-semibold text-ink">Nuevo seguimiento</p>
              {noteError && (
                <div className="flex items-center gap-2 text-xs text-accent bg-accent-soft border border-accent/20 rounded-lg px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  {noteError}
                </div>
              )}
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Tipo de seguimiento</label>
                <CommTypeSelect
                  value={noteForm.communication_type}
                  onChange={(v) => setNoteForm((p) => ({ ...p, communication_type: v }))}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted mb-1 block">Nota <span className="text-ink-muted">(mín. 20 caracteres)</span></label>
                <textarea
                  rows={3}
                  value={noteForm.note}
                  onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Describe el seguimiento realizado…"
                  className="portal-textarea resize-none"
                />
                <p className={`text-xs mt-0.5 ${noteForm.note.trim().length >= 20 ? 'text-ink' : 'text-ink-muted'}`}>
                  {noteForm.note.trim().length}/20 caracteres mínimos
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => { setShowNoteForm(false); setNoteForm({ communication_type: 'Llamada', note: '' }); setNoteError('') }}
                  disabled={savingNote}
                  className="portal-btn-ghost"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={savingNote}
                  className="portal-btn"
                >
                  <Check className="h-4 w-4" />
                  {savingNote ? 'Guardando…' : 'Guardar seguimiento'}
                </button>
              </div>
            </div>
          )}

          {history.length === 0 ? (
            <p className="portal-empty text-sm text-ink-muted">Sin actividad registrada aún.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-ink mt-1.5 flex-shrink-0" />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-black/[0.05] mt-1" />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-ink">
                        {ACTION_LABELS[entry.action_type] ?? entry.action_type}
                      </span>
                      {entry.old_status && entry.new_status && (
                        <span className="text-xs text-ink-muted">
                          {entry.old_status} → {entry.new_status}
                        </span>
                      )}
                      {entry.communication_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-ink/[0.06] text-ink-muted">
                          {entry.communication_type}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-sm text-ink mt-1 leading-relaxed">{entry.note}</p>
                    )}
                    <p className="text-xs text-ink-muted mt-1.5">
                      {entry.employee?.full_name ?? 'Sistema'} · {formatDateTime(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showStatusModal && (
        <StatusChangeModal
          leadId={lead.id}
          leadName={`${lead.nombre} ${lead.apellido}`}
          leadProgram={lead.programa_interes}
          leadCampus={lead.campus}
          currentStatus={lead.status}
          onClose={() => { setShowStatusModal(false); load() }}
        />
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-ink-muted mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink break-all">{value}</p>
      </div>
    </div>
  )
}

function EditField({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-ink-muted mt-2.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-muted mb-1">{label}</p>
        {children}
      </div>
    </div>
  )
}
