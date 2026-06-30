'use client'

import { useEffect, useState } from 'react'
import { Calendar as CalendarIcon, Plus, X, Download, Trash2, ChevronLeft, Loader2, AlertCircle } from 'lucide-react'

export interface Calendar {
  id: string
  name: string
  month: string // YYYY-MM-01
  created_at: string
  post_count: number
}

export interface SavedPost {
  id: string
  calendar_id: string | null
  post_date: string // YYYY-MM-DD
  title: string | null
  config: Record<string, unknown> | null
  image_url: string | null
  created_at: string
}

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function monthLabel(monthIso: string) {
  const [y, m] = monthIso.split('-').map(Number)
  return `${MONTHS[m - 1]} ${y}`
}

async function downloadImage(url: string, name: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = name
    a.click()
    URL.revokeObjectURL(objectUrl)
  } catch {
    window.open(url, '_blank')
  }
}

export default function PostCalendar() {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Calendar | null>(null)
  const [posts, setPosts] = useState<SavedPost[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [openPost, setOpenPost] = useState<SavedPost | null>(null)

  async function loadCalendars() {
    setLoading(true)
    const res = await fetch('/api/portal/posts/calendars')
    const data = await res.json()
    setCalendars(data.calendars ?? [])
    setLoading(false)
  }

  async function loadPosts(calendarId: string) {
    setPostsLoading(true)
    const res = await fetch(`/api/portal/posts?calendar_id=${calendarId}`)
    const data = await res.json()
    setPosts(data.posts ?? [])
    setPostsLoading(false)
  }

  useEffect(() => { loadCalendars() }, [])
  useEffect(() => { if (selected) loadPosts(selected.id) }, [selected])

  async function deleteCalendar(c: Calendar) {
    if (!confirm(`¿Eliminar el calendario "${c.name}" y todos sus posts?`)) return
    await fetch(`/api/portal/posts/calendars/${c.id}`, { method: 'DELETE' })
    setSelected(null)
    loadCalendars()
  }

  async function deletePost(p: SavedPost) {
    if (!confirm('¿Eliminar este post del calendario?')) return
    await fetch(`/api/portal/posts/${p.id}`, { method: 'DELETE' })
    setOpenPost(null)
    if (selected) loadPosts(selected.id)
  }

  // ── Lista de calendarios ──────────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-ink font-display">Calendarios de posts</h2>
            <p className="text-xs text-gray-500">Programa tus publicaciones por día del mes.</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
            <Plus className="h-4 w-4" /> Crear nuevo calendario
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : calendars.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-black/[0.06]">
            <CalendarIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aún no tienes calendarios. Crea el primero para empezar a programar posts.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendars.map((c) => (
              <button key={c.id} onClick={() => setSelected(c)}
                className="text-left bg-white rounded-2xl border border-black/[0.06] shadow-soft p-5 hover:border-accent/40 hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-ink truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{monthLabel(c.month)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">{c.post_count} post{c.post_count === 1 ? '' : 's'} guardado{c.post_count === 1 ? '' : 's'}</p>
              </button>
            ))}
          </div>
        )}

        {showCreate && (
          <CreateCalendarModal
            onClose={() => setShowCreate(false)}
            onCreated={(c) => { setShowCreate(false); loadCalendars(); setSelected(c) }}
          />
        )}
      </div>
    )
  }

  // ── Vista de un calendario (grilla del mes) ───────────────────────────────
  const [y, m] = selected.month.split('-').map(Number)
  const firstWeekday = (new Date(y, m - 1, 1).getDay() + 6) % 7 // Lunes = 0
  const daysInMonth = new Date(y, m, 0).getDate()
  const byDay: Record<string, SavedPost[]> = {}
  for (const p of posts) (byDay[p.post_date] ??= []).push(p)

  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function dayIso(d: number) {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-ink">
          <ChevronLeft className="h-4 w-4" /> Calendarios
        </button>
        <div className="text-center">
          <h2 className="text-base font-bold text-ink font-display">{selected.name}</h2>
          <p className="text-xs text-gray-500 capitalize">{monthLabel(selected.month)} · {posts.length} post{posts.length === 1 ? '' : 's'}</p>
        </div>
        <button onClick={() => deleteCalendar(selected)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500">
          <Trash2 className="h-3.5 w-3.5" /> Eliminar
        </button>
      </div>

      {postsLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-10 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando posts…
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="text-center text-[11px] font-semibold text-gray-400 py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} className="aspect-square" />
              const iso = dayIso(d)
              const dayPosts = byDay[iso] ?? []
              return (
                <button key={iso} onClick={() => dayPosts.length && setOpenDay(iso)}
                  className={`aspect-square rounded-lg border p-1 flex flex-col text-left transition-colors ${dayPosts.length ? 'border-accent/30 bg-accent/[0.04] hover:bg-accent/10 cursor-pointer' : 'border-gray-100'}`}>
                  <span className="text-[11px] font-semibold text-gray-500">{d}</span>
                  <div className="flex-1 flex flex-wrap gap-0.5 mt-0.5 overflow-hidden">
                    {dayPosts.slice(0, 4).map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      p.image_url ? <img key={p.id} src={p.image_url} alt="" className="h-4 w-4 rounded object-cover" />
                        : <span key={p.id} className="h-4 w-4 rounded bg-accent/30" />
                    ))}
                    {dayPosts.length > 4 && <span className="text-[9px] text-gray-400">+{dayPosts.length - 4}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal: posts de un día */}
      {openDay && (
        <Modal onClose={() => setOpenDay(null)} title={`Posts del ${openDay.split('-')[2]} de ${MONTHS[m - 1]}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(byDay[openDay] ?? []).map((p) => (
              <button key={p.id} onClick={() => { setOpenPost(p); setOpenDay(null) }}
                className="rounded-xl overflow-hidden border border-gray-200 hover:border-accent transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.image_url ? <img src={p.image_url} alt={p.title ?? ''} className="w-full aspect-[4/5] object-cover" />
                  : <div className="w-full aspect-[4/5] bg-gray-100 flex items-center justify-center text-xs text-gray-400">Sin imagen</div>}
                {p.title && <p className="text-[11px] text-gray-600 px-2 py-1 truncate">{p.title}</p>}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Modal: un post (descargar / eliminar) */}
      {openPost && (
        <Modal onClose={() => setOpenPost(null)} title={openPost.title ?? 'Post'}>
          <div className="space-y-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {openPost.image_url && (
              <img src={openPost.image_url} alt={openPost.title ?? ''} className="w-full max-w-xs mx-auto rounded-xl shadow-md" />
            )}
            <div className="flex gap-3">
              {openPost.image_url && (
                <button onClick={() => downloadImage(openPost.image_url!, `dmart-post-${openPost.post_date}.png`)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors">
                  <Download className="h-4 w-4" /> Descargar
                </button>
              )}
              <button onClick={() => deletePost(openPost)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Modal genérico ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-ink truncate">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  )
}

// ── Modal: crear calendario ───────────────────────────────────────────────────
function CreateCalendarModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Calendar) => void }) {
  const [name, setName] = useState('')
  const [month, setMonth] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Escribe un nombre.'); return }
    if (!/^\d{4}-\d{2}$/.test(month)) { setError('Selecciona un mes.'); return }
    setLoading(true)
    const res = await fetch('/api/portal/posts/calendars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), month }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? 'Error al crear.'); return }
    onCreated(data.calendar)
  }

  return (
    <Modal title="Crear nuevo calendario" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Campaña de Verano"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Mes</label>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-ring" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
          {loading ? 'Creando…' : 'Crear calendario'}
        </button>
      </form>
    </Modal>
  )
}
