'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { LeadStatus, CommunicationType } from '@/lib/types'

const STATUSES: LeadStatus[] = [
  'Nuevo Lead',
  'Crítico',
  'Contacto Inicial (Pendiente de Respuesta)',
  'Contacto Establecido',
  'Cita Programada',
  'No Asistió a la Cita',
  'Reagendado',
  'En Espera de Documentos',
  'Orientado (En Proceso de Matricularse)',
  'Seguimiento a Futuro',
  'Matriculado',
  'Desinteresado / Rechazado',
]

const COMMUNICATION_TYPES: CommunicationType[] = [
  'Llamada',
  'Mensaje de texto',
  'Email',
  'Visita presencial',
  'WhatsApp',
  'Otro',
]

interface StatusChangeModalProps {
  leadId: string
  currentStatus: LeadStatus
  onClose: () => void
}

export default function StatusChangeModal({ leadId, currentStatus, onClose }: StatusChangeModalProps) {
  const router = useRouter()
  const [newStatus, setNewStatus] = useState<LeadStatus>(currentStatus)
  const [communicationType, setCommunicationType] = useState<CommunicationType | ''>('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newStatus === currentStatus) {
      setError('Selecciona un estado diferente al actual.')
      return
    }
    if (!communicationType) {
      setError('Selecciona el tipo de comunicación realizado.')
      return
    }
    if (note.trim().length < 20) {
      setError(`La nota debe tener al menos 20 caracteres. (${note.trim().length}/20)`)
      return
    }

    setLoading(true)

    const res = await fetch(`/api/portal/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_status: newStatus, communication_type: communicationType, note: note.trim() }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al actualizar el estado.')
      setLoading(false)
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Cambiar Estado del Lead</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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
            <label className="form-label">Nuevo Estado <span className="text-red-500">*</span></label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
              className="form-input"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Tipo de Comunicación <span className="text-red-500">*</span></label>
            <select
              value={communicationType}
              onChange={(e) => setCommunicationType(e.target.value as CommunicationType)}
              className="form-input"
            >
              <option value="">Seleccionar tipo…</option>
              {COMMUNICATION_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              Nota de Seguimiento <span className="text-red-500">*</span>
              <span className="text-gray-400 font-normal ml-1">(mín. 20 caracteres)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Describe el tipo de contacto realizado y el resultado de la comunicación…"
              className="form-input resize-none"
            />
            <p className={`text-xs mt-1 ${note.trim().length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
              {note.trim().length}/20 caracteres mínimos
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <Button type="submit" variant="gold" size="sm" loading={loading} className="flex-1">
              Guardar Cambio
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
