import { Phone, Clock, CheckCircle, XCircle, AlertCircle, Voicemail } from 'lucide-react'

interface CallRecord {
  id: string
  created_at: string
  nombre: string | null
  phone_number: string
  programa_interes: string | null
  campus: string | null
  status: string
  duration_seconds: number | null
  outcome: string | null
  transcript: string | null
  recording_url: string | null
  cost_usd: number | null
}

async function getCalls(): Promise<CallRecord[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('calls')
      .select('id, created_at, nombre, phone_number, programa_interes, campus, status, duration_seconds, outcome, transcript, recording_url, cost_usd')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Error fetching calls:', error)
      return []
    }
    return (data ?? []) as CallRecord[]
  } catch {
    return []
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('es-PR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    initiated:   { label: 'Iniciada',    className: 'bg-blue-100 text-blue-800' },
    ringing:     { label: 'Timbrando',   className: 'bg-yellow-100 text-yellow-800' },
    'in-progress': { label: 'En curso',  className: 'bg-green-100 text-green-800' },
    completed:   { label: 'Completada',  className: 'bg-gray-100 text-gray-700' },
    failed:      { label: 'Fallida',     className: 'bg-red-100 text-red-700' },
    'no-answer': { label: 'Sin respuesta', className: 'bg-orange-100 text-orange-700' },
    voicemail:   { label: 'Buzón',       className: 'bg-purple-100 text-purple-700' },
  }
  const config = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function OutcomeIcon({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-gray-300">—</span>
  const map: Record<string, React.ReactNode> = {
    completed:       <CheckCircle className="h-4 w-4 text-green-500" />,
    interested:      <CheckCircle className="h-4 w-4 text-green-600" />,
    not_interested:  <XCircle className="h-4 w-4 text-red-500" />,
    no_answer:       <AlertCircle className="h-4 w-4 text-orange-500" />,
    voicemail:       <Voicemail className="h-4 w-4 text-purple-500" />,
    error:           <XCircle className="h-4 w-4 text-gray-400" />,
  }
  return (
    <span className="flex items-center gap-1">
      {map[outcome] ?? <span className="text-xs text-gray-500">{outcome}</span>}
      <span className="text-xs text-gray-500 capitalize">{outcome.replace('_', ' ')}</span>
    </span>
  )
}

export default async function LlamadasPage() {
  const isConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const calls = await getCalls()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Phone className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Llamadas — Agente de Voz</h1>
            <p className="text-sm text-gray-500">Historial de llamadas realizadas por el agente AI de D'Mart Institute</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Not configured notice */}
        {!isConfigured && (
          <div className="mb-8 p-6 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800">Base de datos no configurada</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Configura <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y{' '}
                  <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para ver las llamadas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats summary */}
        {isConfigured && calls.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total llamadas', value: calls.length, icon: Phone, color: 'blue' },
              { label: 'Completadas', value: calls.filter(c => c.status === 'completed').length, icon: CheckCircle, color: 'green' },
              { label: 'Sin respuesta', value: calls.filter(c => c.status === 'no-answer' || c.outcome === 'no_answer').length, icon: AlertCircle, color: 'orange' },
              {
                label: 'Costo total',
                value: `$${calls.reduce((sum, c) => sum + (c.cost_usd ?? 0), 0).toFixed(2)}`,
                icon: Clock,
                color: 'purple',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`inline-flex p-2 rounded-lg bg-${color}-50 mb-2`}>
                  <Icon className={`h-4 w-4 text-${color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Calls table */}
        {isConfigured && calls.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No hay llamadas todavía</h3>
            <p className="text-sm text-gray-400 mt-1">
              Las llamadas aparecerán aquí una vez que el agente de voz haya realizado contactos.
            </p>
          </div>
        )}

        {isConfigured && calls.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Nombre</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Teléfono</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Programa</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Recinto</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Estado</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Duración</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Resultado</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Transcripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {calls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {call.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {call.phone_number}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate" title={call.programa_interes ?? ''}>
                        {call.programa_interes ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {call.campus ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={call.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 tabular-nums">
                        {formatDuration(call.duration_seconds)}
                      </td>
                      <td className="px-4 py-3">
                        <OutcomeIcon outcome={call.outcome} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(call.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {call.transcript ? (
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:underline text-xs">Ver</summary>
                            <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-700 max-w-sm max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                              {call.transcript}
                            </div>
                          </details>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Placeholder when not configured */}
        {!isConfigured && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-50 pointer-events-none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nombre', 'Teléfono', 'Programa', 'Recinto', 'Estado', 'Duración', 'Resultado', 'Fecha', 'Transcripción'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
