'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle, User, Mail, Phone, MapPin, BookOpen, Clock, Users } from 'lucide-react'
import { ALL_PROGRAMS, cn } from '@/lib/utils'
import type { Activity } from '@/lib/types'

const CAMPUSES = ['Barranquitas', 'Vega Alta', 'No tengo preferencia']
const HORARIOS = ['Diurno', 'Nocturno', 'Sabatino']

function fmtActDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PR', { weekday: 'short', month: 'short', day: 'numeric' })
}

type ModalActivity = Pick<Activity, 'id' | 'name' | 'type' | 'activity_date' | 'location'>

interface AddLeadModalProps {
  employeeId: string
  employeeName: string
  activities: ModalActivity[]
  teamMembers?: { id: string; full_name: string }[]
  onClose: () => void
}

export default function AddLeadModal({ employeeId, employeeName, activities, teamMembers = [], onClose }: AddLeadModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    campus: '', programa_interes: '', horario: '',
    activity_id: '', lead_source_text: '',
    assigned_to: employeeId,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.nombre.trim().length < 2) { setError('El nombre es requerido.'); return }
    if (form.apellido.trim().length < 2) { setError('El apellido es requerido.'); return }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Correo electrónico inválido.'); return }
    if (form.telefono.trim().length < 7) { setError('Teléfono inválido.'); return }
    if (!form.activity_id && !form.lead_source_text.trim()) {
      setError('Selecciona una actividad o escribe el origen del lead.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/portal/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        activity_id: form.activity_id || null,
        lead_source_text: form.lead_source_text || null,
        assigned_to: form.assigned_to || null,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al guardar el lead.')
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  const inputClass = 'portal-input'
  const labelClass = 'portal-label'

  return (
    <div className="portal-modal-overlay overflow-y-auto">
      <div className="portal-modal max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05]">
          <div>
            <h2 className="text-base font-bold text-ink">Agregar Nuevo Lead</h2>
            <p className="text-xs text-ink-muted">Ingresado por <span className="font-medium text-ink">{employeeName}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface transition-colors">
            <X className="h-4 w-4 text-ink-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-accent-soft flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre <span className="text-accent">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10" />
                <input name="nombre" type="text" required value={form.nombre} onChange={handleChange} placeholder="Nombre" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Apellido <span className="text-accent">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10" />
                <input name="apellido" type="text" required value={form.apellido} onChange={handleChange} placeholder="Apellido" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Correo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10" />
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="correo@email.com" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Teléfono <span className="text-accent">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10" />
                <input name="telefono" type="tel" required value={form.telefono} onChange={handleChange} placeholder="(787) 000-0000" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Recinto</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10 pointer-events-none" />
                <select name="campus" value={form.campus} onChange={handleChange} className={cn(inputClass, 'pl-10 appearance-none')}>
                  <option value="">Seleccionar…</option>
                  {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Horario</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10 pointer-events-none" />
                <select name="horario" value={form.horario} onChange={handleChange} className={cn(inputClass, 'pl-10 appearance-none')}>
                  <option value="">Seleccionar…</option>
                  {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Programa de Interés</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10 pointer-events-none" />
                <select name="programa_interes" value={form.programa_interes} onChange={handleChange} className={cn(inputClass, 'pl-10 appearance-none')}>
                  <option value="">Seleccionar programa…</option>
                  {ALL_PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Assign to (supervisor only) */}
          {teamMembers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/[0.05]">
              <p className="text-sm font-semibold text-ink mb-3">Asignar a</p>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted/60 z-10 pointer-events-none" />
                <select
                  value={form.assigned_to}
                  onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                  className={cn(inputClass, 'pl-10 appearance-none')}
                >
                  <option value={employeeId}>{employeeName} (yo)</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>{m.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Lead source */}
          <div className="mt-4 pt-4 border-t border-black/[0.05]">
            <p className="text-sm font-semibold text-ink mb-3">Origen del Lead <span className="text-accent">*</span></p>
            {activities.length > 0 && (
              <div className="mb-3">
                <label className={labelClass}>Actividad del Mes (si aplica)</label>
                <select name="activity_id" value={form.activity_id} onChange={handleChange} className="portal-select">
                  <option value="">No proviene de una actividad</option>
                  {activities.map((a) => {
                    const parts = [a.activity_date ? fmtActDate(a.activity_date) : null, a.location].filter(Boolean)
                    return (
                      <option key={a.id} value={a.id}>
                        {a.name}{parts.length ? ` — ${parts.join(' · ')}` : ''}
                      </option>
                    )
                  })}
                </select>
              </div>
            )}
            {!form.activity_id && (
              <div>
                <label className={labelClass}>¿Dónde obtuviste este lead? <span className="text-accent">*</span></label>
                <input
                  name="lead_source_text"
                  type="text"
                  value={form.lead_source_text}
                  onChange={handleChange}
                  placeholder="Ej: Referido, Evento comunitario, Redes sociales…"
                  className="portal-input"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="portal-btn-ghost flex-1"
            >
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="portal-btn flex-1">
              {loading && <span className="portal-spinner h-4 w-4 border-2 border-white/30 border-t-white" />}
              Guardar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
