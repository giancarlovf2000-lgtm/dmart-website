'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitMerge, Users, AlertCircle } from 'lucide-react'
import LeadStatusBadge from './LeadStatusBadge'
import { formatPhone } from '@/lib/utils'

interface DupLead {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  campus: string | null
  programa_interes: string | null
  status: string
  source: string | null
  assigned_to: string | null
  employee_name: string | null
  created_at: string
  last_action_at: string
}

interface Pair {
  key: string
  reason: string
  lead_a: DupLead
  lead_b: DupLead
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('es-PR', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LeadCard({ lead }: { lead: DupLead }) {
  return (
    <div className="flex-1 min-w-0 bg-surface rounded-xl2 p-4 space-y-2 shadow-neu-inset">
      <div>
        <p className="font-semibold text-ink text-sm">{lead.nombre} {lead.apellido}</p>
        <LeadStatusBadge status={lead.status as never} />
      </div>
      <div className="space-y-1 text-xs text-ink-muted">
        <p><span className="text-ink-muted/60">Tel:</span> {formatPhone(lead.telefono)}</p>
        <p><span className="text-ink-muted/60">Correo:</span> {lead.email || '—'}</p>
        <p><span className="text-ink-muted/60">Recinto:</span> {lead.campus ?? '—'}</p>
        <p className="line-clamp-2"><span className="text-ink-muted/60">Programa:</span> {lead.programa_interes ?? '—'}</p>
        <p><span className="text-ink-muted/60">Origen:</span> {lead.source ?? '—'}</p>
        <p><span className="text-ink-muted/60">Asignado a:</span> {lead.employee_name ?? '—'}</p>
        <p><span className="text-ink-muted/60">Fecha:</span> {formatDate(lead.created_at)}</p>
      </div>
    </div>
  )
}

export default function DuplicatesView() {
  const router = useRouter()
  const [pairs, setPairs] = useState<Pair[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/portal/leads/duplicates')
    if (!res.ok) { setError('Error al cargar duplicados.'); setLoading(false); return }
    const data = await res.json()
    setPairs(data.pairs ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDismiss(pair: Pair) {
    setActionLoading(pair.key)
    const res = await fetch('/api/portal/leads/duplicates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id_a: pair.lead_a.id, lead_id_b: pair.lead_b.id }),
    })
    if (res.ok) {
      setPairs((prev) => prev.filter((p) => p.key !== pair.key))
    } else {
      alert('Error al descartar el par.')
    }
    setActionLoading(null)
  }

  async function handleMerge(pair: Pair) {
    const msg = `¿Fusionar a ${pair.lead_a.nombre} ${pair.lead_a.apellido} y ${pair.lead_b.nombre} ${pair.lead_b.apellido}?\n\nSe preservarán los campos más completos de ambos. El lead más antiguo sobrevivirá y el historial de ambos se unirá. Esta acción no se puede deshacer.`
    if (!confirm(msg)) return

    setActionLoading(pair.key)
    const res = await fetch('/api/portal/leads/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_id_a: pair.lead_a.id, lead_id_b: pair.lead_b.id }),
    })
    if (res.ok) {
      const data = await res.json()
      setPairs((prev) => prev.filter((p) => p.key !== pair.key))
      // Navigate to the surviving lead
      router.push(`/portal/leads/${data.surviving_id}`)
    } else {
      const data = await res.json()
      alert(data.error ?? 'Error al fusionar los leads.')
    }
    setActionLoading(null)
  }

  if (loading) {
    return (
      <div className="portal-card p-16 flex items-center justify-center">
        <div className="portal-spinner" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-card p-10 text-center">
        <AlertCircle className="h-8 w-8 text-accent mx-auto mb-2" />
        <p className="text-sm text-ink-muted">{error}</p>
      </div>
    )
  }

  if (pairs.length === 0) {
    return (
      <div className="portal-card p-16 text-center">
        <Users className="h-10 w-10 text-ink-muted/40 mx-auto mb-3" />
        <p className="font-medium text-ink-muted">No hay leads duplicados detectados</p>
        <p className="text-sm text-ink-muted/60 mt-1">Todos los leads han sido revisados o no hay coincidencias.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink-muted">{pairs.length} par{pairs.length !== 1 ? 'es' : ''} de posibles duplicados detectados. Revisa cada par y decide si fusionarlos o mantenerlos separados.</p>

      {pairs.map((pair) => {
        const isActing = actionLoading === pair.key
        return (
          <div key={pair.key} className="portal-card p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="portal-badge portal-badge--urgent">
                <AlertCircle className="h-3.5 w-3.5" />
                {pair.reason}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDismiss(pair)}
                  disabled={isActing}
                  className="px-3 py-1.5 rounded-full bg-white shadow-neu-sm text-xs font-medium text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
                >
                  {isActing ? '…' : 'Mantener ambos'}
                </button>
                <button
                  onClick={() => handleMerge(pair)}
                  disabled={isActing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-40"
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  {isActing ? 'Fusionando…' : 'Fusionar'}
                </button>
              </div>
            </div>

            {/* Side by side lead cards */}
            <div className="flex gap-3 flex-col sm:flex-row">
              <LeadCard lead={pair.lead_a} />
              <div className="hidden sm:flex items-center text-ink-muted/40 text-lg font-light">vs</div>
              <div className="flex sm:hidden items-center justify-center text-ink-muted/40 text-xs">vs</div>
              <LeadCard lead={pair.lead_b} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
