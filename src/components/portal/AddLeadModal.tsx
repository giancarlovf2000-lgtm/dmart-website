'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle, User, Mail, Phone, MapPin, BookOpen, Clock } from 'lucide-react'
import Button from '@/components/ui/Button'
import { ALL_PROGRAMS, cn } from '@/lib/utils'
import type { Activity } from '@/lib/types'

const CAMPUSES = ['Barranquitas', 'Vega Alta', 'No tengo preferencia']
const HORARIOS = ['Diurno', 'Nocturno', 'Sabatino']

interface AddLeadModalProps {
  employeeName: string
  activities: Pick<Activity, 'id' | 'name'>[]
  onClose: () => void
}

export default function AddLeadModal({ employeeName, activities, onClose }: AddLeadModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', telefono: '',
    campus: '', programa_interes: '', horario: '',
    activity_id: '', lead_source_text: '',
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError('Correo electrónico inválido.'); return }
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

  const inputClass = 'form-input'
  const labelClass = 'form-label'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Agregar Nuevo Lead</h2>
            <p className="text-xs text-gray-500">Ingresado por <span className="font-medium text-navy">{employeeName}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nombre <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="nombre" type="text" required value={form.nombre} onChange={handleChange} placeholder="Nombre" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Apellido <span className="text-red-500">*</span></label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="apellido" type="text" required value={form.apellido} onChange={handleChange} placeholder="Apellido" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Correo <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="correo@email.com" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Teléfono <span className="text-red-500">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="telefono" type="tel" required value={form.telefono} onChange={handleChange} placeholder="(787) 000-0000" className={cn(inputClass, 'pl-10')} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Recinto</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select name="campus" value={form.campus} onChange={handleChange} className={cn(inputClass, 'pl-10 appearance-none')}>
                  <option value="">Seleccionar…</option>
                  {CAMPUSES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Horario</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select name="horario" value={form.horario} onChange={handleChange} className={cn(inputClass, 'pl-10 appearance-none')}>
                  <option value="">Seleccionar…</option>
                  {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Programa de Interés</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <select name="programa_interes" value={form.programa_interes} onChange={handleChange} className={cn(inputClass, 'pl-10 appearance-none')}>
                  <option value="">Seleccionar programa…</option>
                  {ALL_PROGRAMS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Lead source */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-semibold text-gray-700 mb-3">Origen del Lead <span className="text-red-500">*</span></p>
            {activities.length > 0 && (
              <div className="mb-3">
                <label className={labelClass}>Actividad del Mes (si aplica)</label>
                <select name="activity_id" value={form.activity_id} onChange={handleChange} className="form-input">
                  <option value="">No proviene de una actividad</option>
                  {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            )}
            {!form.activity_id && (
              <div>
                <label className={labelClass}>¿Dónde obtuviste este lead? <span className="text-red-500">*</span></label>
                <input
                  name="lead_source_text"
                  type="text"
                  value={form.lead_source_text}
                  onChange={handleChange}
                  placeholder="Ej: Referido, Evento comunitario, Redes sociales…"
                  className="form-input"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" variant="gold" size="sm" loading={loading} className="flex-1">
              Guardar Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
