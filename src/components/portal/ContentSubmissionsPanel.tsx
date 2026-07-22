'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Loader2, CheckCircle2, XCircle, Clock, Download, ShieldCheck, GraduationCap, BookOpen,
  Image as ImageIcon, Film, UserRound, Mail,
} from 'lucide-react'

interface Submission {
  id: string; contributor_id: string; kind: 'imagen' | 'video'; url: string | null
  title: string | null; caption: string | null; mime: string | null; size_bytes: number | null
  consent_granted: boolean; is_minor: boolean; guardian_ack: boolean; guardian_name: string | null
  consent_version: string | null; consent_at: string | null
  status: 'pendiente' | 'aprobado' | 'rechazado'; review_note: string | null; created_at: string
  author_name: string; author_email: string | null; author_type: 'estudiante' | 'profesor' | null
}

const FILTERS = [
  { key: 'pendiente', label: 'Pendientes', Icon: Clock },
  { key: 'aprobado', label: 'Aprobados', Icon: CheckCircle2 },
  { key: 'rechazado', label: 'No aprobados', Icon: XCircle },
  { key: 'todos', label: 'Todos', Icon: null },
] as const

const fmtDate = (s: string | null) => s ? new Date(s).toLocaleDateString('es-PR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
const fmtSize = (n: number | null) => n ? `${(n / 1024 / 1024).toFixed(1)} MB` : ''

export default function ContentSubmissionsPanel() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('pendiente')
  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = filter === 'todos' ? '' : `?status=${filter}`
      const res = await fetch(`/api/portal/content-submissions${q}`)
      const data = await res.json()
      setSubs(data.submissions ?? [])
    } catch { setSubs([]) }
    setLoading(false)
  }, [filter])
  useEffect(() => { load() }, [load])

  async function review(id: string, status: 'aprobado' | 'rechazado') {
    let note: string | null = null
    if (status === 'rechazado') {
      note = window.prompt('Motivo (opcional) que verá quien lo subió:') ?? ''
    }
    setBusyId(id)
    await fetch('/api/portal/content-submissions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, review_note: note }),
    })
    setBusyId(null)
    load()
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-ink font-display">Contenido de estudiantes y profesores</h2>
        <p className="text-xs text-gray-500">Revisa el contenido subido, verifica la autorización y apruébalo para usarlo en redes, web y promociones.</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {FILTERS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === key ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {Icon && <Icon className="h-3.5 w-3.5" />} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
      ) : subs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-black/[0.06]">
          <ImageIcon className="h-9 w-9 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay contenido {filter !== 'todos' ? `(${filter})` : ''} por ahora.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subs.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl border border-black/[0.06] shadow-soft overflow-hidden flex flex-col">
              <div className="relative aspect-[4/3] bg-gray-900 flex items-center justify-center">
                {s.url && s.kind === 'imagen'
                  /* eslint-disable-next-line @next/next/no-img-element */
                  ? <img src={s.url} alt={s.title ?? ''} className="w-full h-full object-contain" />
                  : s.url && s.kind === 'video'
                    ? <video src={s.url} controls className="w-full h-full object-contain" />
                    : <span className="text-gray-500">{s.kind === 'video' ? <Film /> : <ImageIcon />}</span>}
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-white">
                  {s.kind === 'video' ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />} {s.kind}
                </span>
              </div>

              <div className="p-4 flex flex-col gap-2.5 flex-1">
                {s.title && <p className="text-sm font-bold text-ink leading-tight">{s.title}</p>}
                {s.caption && <p className="text-xs text-gray-500 leading-snug line-clamp-2">{s.caption}</p>}

                <div className="flex flex-col gap-0.5 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    {s.author_type === 'profesor' ? <BookOpen className="h-3.5 w-3.5 text-accent" /> : s.author_type === 'estudiante' ? <GraduationCap className="h-3.5 w-3.5 text-accent" /> : <UserRound className="h-3.5 w-3.5 text-gray-400" />}
                    <span className="font-semibold text-ink">{s.author_name}</span>
                    {s.author_type && <span className="text-gray-400">· {s.author_type}</span>}
                  </div>
                  {s.author_email && (
                    <a href={`mailto:${s.author_email}`} className="flex items-center gap-1.5 text-accent hover:underline pl-[19px]">
                      <Mail className="h-3 w-3" /> {s.author_email}
                    </a>
                  )}
                  <span className="text-gray-400 pl-[19px]">{fmtDate(s.created_at)} · {fmtSize(s.size_bytes)}</span>
                </div>

                {/* Consentimiento */}
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 text-[11px] text-emerald-800 flex items-start gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Autorizó uso en redes/web/promos {s.consent_version && <span className="text-emerald-600">({s.consent_version})</span>}.
                    {s.is_minor && <span className="block text-emerald-700">Menor · aval del tutor{s.guardian_name ? `: ${s.guardian_name}` : ''}.</span>}
                  </span>
                </div>

                {s.status === 'rechazado' && s.review_note && <p className="text-[11px] text-red-600">Motivo: {s.review_note}</p>}

                <div className="mt-auto flex items-center gap-2 pt-1">
                  {s.status !== 'aprobado' && (
                    <button onClick={() => review(s.id, 'aprobado')} disabled={busyId === s.id}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                      {busyId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />} Aprobar
                    </button>
                  )}
                  {s.status !== 'rechazado' && (
                    <button onClick={() => review(s.id, 'rechazado')} disabled={busyId === s.id}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50">
                      <XCircle className="h-3.5 w-3.5" /> {s.status === 'aprobado' ? 'Revertir' : 'Rechazar'}
                    </button>
                  )}
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" title="Descargar / ver original"
                      className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      <Download className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${s.status === 'aprobado' ? 'text-emerald-600' : s.status === 'rechazado' ? 'text-red-500' : 'text-amber-600'}`}>
                  {s.status === 'aprobado' ? <><CheckCircle2 className="h-3 w-3" /> Aprobado</> : s.status === 'rechazado' ? <><XCircle className="h-3 w-3" /> No aprobado</> : <><Clock className="h-3 w-3" /> Pendiente</>}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
