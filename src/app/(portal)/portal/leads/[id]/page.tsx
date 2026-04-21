'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, BookOpen, Clock, Calendar, User, AlertCircle, Trash2 } from 'lucide-react'
import LeadStatusBadge from '@/components/portal/LeadStatusBadge'
import StatusChangeModal from '@/components/portal/StatusChangeModal'
import type { Lead, LeadHistory } from '@/lib/types'
import { formatPhone } from '@/lib/utils'

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
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [history, setHistory] = useState<LeadHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setLoading(false)
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

  useEffect(() => { load() }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-navy border-t-transparent" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">{error || 'Lead no encontrado.'}</p>
          <button onClick={() => router.back()} className="mt-4 text-sm text-navy hover:underline">← Volver</button>
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
    <div className="min-h-screen bg-gray-50">
      {/* Nav bar */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            )}
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy/90 transition-colors"
            >
              Cambiar Estado
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Lead info card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{lead.nombre} {lead.apellido}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{sourceDisplay()}</p>
            </div>
            <LeadStatusBadge status={lead.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Phone} label="Teléfono" value={formatPhone(lead.telefono)} />
            <InfoRow icon={Mail} label="Correo" value={lead.email} />
            <InfoRow icon={MapPin} label="Recinto" value={lead.campus ?? '—'} />
            <InfoRow icon={Clock} label="Horario" value={lead.horario ?? '—'} />
            <InfoRow icon={BookOpen} label="Programa de Interés" value={lead.programa_interes ?? '—'} />
            <InfoRow icon={Calendar} label="Fecha del Lead" value={formatDateTime(lead.created_at)} />
            <InfoRow icon={User} label="Asignado a" value={lead.employee?.full_name ?? '—'} />
            <InfoRow icon={Calendar} label="Última Actividad" value={formatDateTime(lead.last_action_at)} />
          </div>
        </div>

        {/* History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Historial de Actividad</h2>

          {history.length === 0 ? (
            <p className="text-sm text-gray-400">Sin actividad registrada aún.</p>
          ) : (
            <div className="space-y-4">
              {history.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-navy mt-1.5 flex-shrink-0" />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {ACTION_LABELS[entry.action_type] ?? entry.action_type}
                      </span>
                      {entry.old_status && entry.new_status && (
                        <span className="text-xs text-gray-400">
                          {entry.old_status} → {entry.new_status}
                        </span>
                      )}
                      {entry.communication_type && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {entry.communication_type}
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{entry.note}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1.5">
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
      <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 break-all">{value}</p>
      </div>
    </div>
  )
}
