'use client'

import { useEffect, useState } from 'react'
import {
  Calendar as CalendarIcon, Megaphone, BarChart3, ChevronLeft, ChevronRight,
  X, AlertCircle, Download, History, Sparkles, PencilLine, Building2, Loader2,
} from 'lucide-react'
import { createClient as createBrowserSupabase } from '@/lib/supabase/client'
import { STATIC_CAMPUSES } from '@/lib/utils'
import PostStudio, { PostCard, type PostConfig } from '@/components/portal/PostStudio'
import PostCalendar, { type Calendar, type SavedPost } from '@/components/portal/posts/PostCalendar'
import PostsStats from '@/components/portal/posts/PostsStats'
import { generateVariations, type SocialItem } from '@/lib/posts/templates'

type View = 'home' | 'calendar' | 'create' | 'stats'

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(meta)?.[1] ?? 'image/png'
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

export default function PostsHub() {
  const [view, setView] = useState<View>('home')

  if (view === 'home') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-bold text-ink font-display">Posts</h2>
          <p className="text-xs text-gray-500">Crea contenido, prográmalo en calendarios y analiza tus resultados.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <HubCard icon={CalendarIcon} title="Calendario de posts" desc="Programa y organiza tus publicaciones por día." onClick={() => setView('calendar')} />
          <HubCard icon={Megaphone} title="Crear contenido" desc="Diseña y guarda posts para Instagram." onClick={() => setView('create')} />
          <HubCard icon={BarChart3} title="Estadísticas" desc="Leads, programas, seguimiento y recomendaciones." onClick={() => setView('stats')} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <button onClick={() => setView('home')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Posts
      </button>
      {view === 'calendar' && <PostCalendar />}
      {view === 'create' && <CreateContent />}
      {view === 'stats' && <PostsStats />}
    </div>
  )
}

function HubCard({ icon: Icon, title, desc, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-left bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6 hover:border-accent/40 hover:shadow-md transition-all group">
      <div className="h-11 w-11 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:bg-accent/20 transition-colors">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-accent transition-colors" />
      </div>
      <p className="text-xs text-gray-500 mt-1">{desc}</p>
    </button>
  )
}

// ── Crear contenido (elegir origen → editor + guardar + historial) ────────────
type CreateMode = 'home' | 'social' | 'editor'

function CreateContent() {
  const [mode, setMode] = useState<CreateMode>('home')
  const [editorConfig, setEditorConfig] = useState<PostConfig | null>(null)
  const [editorKey, setEditorKey] = useState(0)
  const [defaultDay, setDefaultDay] = useState<string | undefined>(undefined)
  const [pending, setPending] = useState<{ config: PostConfig; dataUrl: string } | null>(null)
  const [history, setHistory] = useState<SavedPost[]>([])

  async function loadHistory() {
    const res = await fetch('/api/portal/posts?limit=12')
    const data = await res.json()
    setHistory(data.posts ?? [])
  }
  useEffect(() => { loadHistory() }, [])

  function openEditor(config: PostConfig | null, day?: string) {
    setEditorConfig(config)
    setDefaultDay(day)
    setEditorKey((k) => k + 1)
    setMode('editor')
  }

  // Pantalla inicial: elegir origen del contenido.
  if (mode === 'home') {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-ink font-display">Crear contenido</h3>
          <p className="text-xs text-gray-500">¿Cómo quieres empezar?</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <HubCard icon={Sparkles} title="Desde pedidos de supervisores"
            desc="Genera posts para los programas que los supervisores pidieron por recinto."
            onClick={() => setMode('social')} />
          <HubCard icon={PencilLine} title="Crear desde cero"
            desc="Diseña un post en blanco con el editor."
            onClick={() => openEditor(null)} />
        </div>
      </div>
    )
  }

  if (mode === 'social') {
    return (
      <div className="space-y-4">
        <button onClick={() => setMode('home')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> Crear contenido
        </button>
        <SocialPicker onPick={(config, day) => openEditor(config, day)} />
      </div>
    )
  }

  // Editor (en blanco o precargado con una variación).
  return (
    <div className="space-y-6">
      <button onClick={() => setMode('home')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Crear contenido
      </button>

      <PostStudio
        key={editorKey}
        initial={editorConfig ?? undefined}
        onSave={(config, dataUrl) => setPending({ config, dataUrl })}
        onClear={() => {}}
      />

      {/* Historial */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold text-ink">Historial de posts guardados</h3>
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Aún no has guardado ningún post. Diseña uno y pulsa &quot;Guardar contenido&quot;.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {history.map((p) => (
              <div key={p.id} className="rounded-xl overflow-hidden border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt={p.title ?? ''} className="w-full aspect-[4/5] object-cover" />
                  : <div className="w-full aspect-[4/5] bg-gray-100" />}
                <p className="text-[10px] text-gray-500 px-1.5 py-1 truncate">{p.post_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {pending && (
        <SavePostModal
          pending={pending}
          defaultDay={defaultDay}
          onClose={() => setPending(null)}
          onSaved={() => { setPending(null); loadHistory() }}
        />
      )}
    </div>
  )
}

// ── Flujo: crear desde los pedidos de los supervisores ────────────────────────
type SocialProgram = SocialItem & { supervisors: string[] }
type SocialCampus = { campus: string; programs: SocialProgram[] }

const SHIFT_TAG: Record<SocialItem['shift'], string> = { diurno: 'Diurno', nocturno: 'Nocturno', sabatino: 'Sabatino' }

function fmtDay(d: string | null): string {
  if (!d) return 'Pendiente'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-PR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function SocialPicker({ onPick }: { onPick: (config: PostConfig, day?: string) => void }) {
  const [campus, setCampus] = useState(STATIC_CAMPUSES[0].name)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [data, setData] = useState<SocialCampus[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SocialProgram | null>(null)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    fetch(`/api/portal/posts/social-requests?month=${month}`)
      .then((r) => r.json())
      .then((d) => setData(d.campuses ?? []))
      .finally(() => setLoading(false))
  }, [month])

  const items = data.find((c) => c.campus === campus)?.programs ?? []
  const variations = selected ? generateVariations(selected, campus) : []

  return (
    <div className="space-y-4">
      {/* Recinto + mes */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
          {STATIC_CAMPUSES.map((c) => (
            <button key={c.name} onClick={() => { setCampus(c.name); setSelected(null) }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${campus === c.name ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'}`}>
              <Building2 className="h-3.5 w-3.5" /> {c.name}
            </button>
          ))}
        </div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando pedidos…
        </div>
      ) : !selected ? (
        // Lista de programas pendientes de este recinto.
        items.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-black/[0.06]">
            <Megaphone className="h-9 w-9 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Ningún supervisor de {campus} pidió apoyo para este mes.</p>
            <p className="text-xs text-gray-400 mt-1">Cambia de recinto o de mes.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((it, i) => (
              <button key={`${it.program}-${it.shift}-${i}`} onClick={() => setSelected(it)}
                className="text-left bg-white rounded-xl border border-black/[0.06] shadow-soft p-4 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-sm font-bold text-ink">{it.program}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${it.shift === 'nocturno' ? 'bg-indigo-100 text-indigo-700' : it.shift === 'sabatino' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                    {SHIFT_TAG[it.shift]}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Comienzo: <span className="font-medium text-ink">{fmtDay(it.start_date)}</span></p>
                {it.supervisors.length > 0 && <p className="text-[11px] text-gray-400 mt-1 truncate">Pedido por {it.supervisors.join(', ')}</p>}
              </button>
            ))}
          </div>
        )
      ) : (
        // Variaciones generadas para el programa elegido.
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-ink">
              <ChevronLeft className="h-4 w-4" /> Pedidos
            </button>
            <p className="text-sm text-gray-600">
              Opciones para <span className="font-semibold text-ink">{selected.program}</span> · {SHIFT_TAG[selected.shift]} · {fmtDay(selected.start_date)}
            </p>
          </div>
          <p className="text-xs text-gray-500">Elige una opción para editarla y guardarla.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 justify-items-center">
            {variations.map((v) => (
              <button key={v.id} onClick={() => onPick(v.config, selected.start_date ?? undefined)}
                className="group text-left">
                <div style={{ width: 160, height: 200, overflow: 'hidden', borderRadius: 12 }}
                  className="border border-gray-200 group-hover:border-accent transition-colors shadow-sm">
                  <div style={{ width: 1080, height: 1350, transform: 'scale(0.148148)', transformOrigin: 'top left' }}>
                    <PostCard config={v.config} />
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-gray-600 mt-1.5 text-center group-hover:text-accent">{v.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal: guardar post en un calendario + día ────────────────────────────────
function SavePostModal({ pending, defaultDay, onClose, onSaved }: {
  pending: { config: PostConfig; dataUrl: string }
  defaultDay?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [calendarId, setCalendarId] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMonth, setNewMonth] = useState('')
  const [day, setDay] = useState(defaultDay ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/portal/posts/calendars')
      .then((r) => r.json())
      .then((d) => {
        const cals: Calendar[] = d.calendars ?? []
        setCalendars(cals)
        if (cals.length) setCalendarId(cals[0].id)
        else setCreatingNew(true)
      })
  }, [])

  const selectedCal = calendars.find((c) => c.id === calendarId)
  // Limitar el día al mes del calendario seleccionado.
  const monthIso = creatingNew ? newMonth : selectedCal?.month.slice(0, 7)
  const dayMin = monthIso ? `${monthIso}-01` : undefined
  const dayMax = monthIso ? `${monthIso}-${String(new Date(Number(monthIso.slice(0, 4)), Number(monthIso.slice(5, 7)), 0).getDate()).padStart(2, '0')}` : undefined

  async function uploadImage(calId: string): Promise<string | null> {
    try {
      const supabase = createBrowserSupabase()
      const blob = dataUrlToBlob(pending.dataUrl)
      const path = `${calId}/${Date.now()}.png`
      const { error: upErr } = await supabase.storage.from('saved-post-images').upload(path, blob, { upsert: true, contentType: 'image/png' })
      if (upErr) { console.error('[SavePost] upload', upErr); return null }
      const { data } = supabase.storage.from('saved-post-images').getPublicUrl(path)
      return data.publicUrl
    } catch (e) {
      console.error('[SavePost] upload exception', e)
      return null
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    let calId = calendarId

    // Crear calendario nuevo si aplica.
    if (creatingNew) {
      if (newName.trim().length < 2) { setError('Escribe el nombre del calendario.'); return }
      if (!/^\d{4}-\d{2}$/.test(newMonth)) { setError('Selecciona el mes del calendario.'); return }
    }
    if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) { setError('Selecciona el día.'); return }

    setLoading(true)
    try {
      if (creatingNew) {
        const res = await fetch('/api/portal/posts/calendars', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName.trim(), month: newMonth }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? 'Error al crear el calendario.'); setLoading(false); return }
        calId = data.calendar.id
      }
      if (!calId) { setError('Selecciona un calendario.'); setLoading(false); return }

      const imageUrl = await uploadImage(calId)
      if (!imageUrl) { setError('No se pudo subir la imagen. Intenta de nuevo.'); setLoading(false); return }

      const res = await fetch('/api/portal/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendar_id: calId,
          post_date: day,
          title: pending.config.title,
          config: pending.config,
          image_url: imageUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Error al guardar el post.'); setLoading(false); return }
      onSaved()
    } catch {
      setError('Ocurrió un error al guardar.')
      setLoading(false)
    }
  }

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-ring'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-ink">Guardar contenido</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <form onSubmit={submit} className="px-5 py-5 space-y-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pending.dataUrl} alt="" className="w-28 mx-auto rounded-lg shadow-md" />

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Calendario</label>
            {calendars.length > 0 && !creatingNew ? (
              <div className="flex gap-2">
                <select value={calendarId} onChange={(e) => setCalendarId(e.target.value)} className={inputCls}>
                  {calendars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setCreatingNew(true)} className="px-3 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 whitespace-nowrap">+ Nuevo</button>
              </div>
            ) : (
              <div className="space-y-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del calendario" className={inputCls} />
                <input type="month" value={newMonth} onChange={(e) => setNewMonth(e.target.value)} className={inputCls} />
                {calendars.length > 0 && (
                  <button type="button" onClick={() => setCreatingNew(false)} className="text-xs text-gray-500 hover:text-ink">← Usar un calendario existente</button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1 block">Día</label>
            <input type="date" value={day} min={dayMin} max={dayMax} onChange={(e) => setDay(e.target.value)} className={inputCls} />
            {monthIso && <p className="text-[11px] text-gray-400 mt-1">Elige un día del mes del calendario.</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
            <Download className="h-4 w-4 rotate-180" />
            {loading ? 'Guardando…' : 'Guardar en el calendario'}
          </button>
        </form>
      </div>
    </div>
  )
}
