'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Upload, LogOut, ImageIcon, Film, CheckCircle2, Clock, XCircle, X, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CONSENT_TEXT, GUARDIAN_TEXT, MAX_UPLOAD_BYTES } from '@/lib/content/consent'

const BUCKET = 'student-content'

interface Submission {
  id: string; kind: 'imagen' | 'video'; title: string | null; caption: string | null
  status: 'pendiente' | 'aprobado' | 'rechazado'; review_note: string | null; created_at: string; url: string | null
}

const STATUS = {
  pendiente: { label: 'En revisión', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
  aprobado: { label: 'Aprobado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
  rechazado: { label: 'No aprobado', cls: 'bg-red-50 text-red-700 border-red-200', Icon: XCircle },
}

export default function StudentDashboard({ name, userId }: { name: string; userId: string }) {
  const [subs, setSubs] = useState<Submission[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [consent, setConsent] = useState(false)
  const [isMinor, setIsMinor] = useState(false)
  const [guardianAck, setGuardianAck] = useState(false)
  const [guardianName, setGuardianName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadList = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await fetch('/api/mi-cuenta/submissions')
      const data = await res.json()
      setSubs(data.submissions ?? [])
    } catch { /* ignore */ }
    setLoadingList(false)
  }, [])
  useEffect(() => { loadList() }, [loadList])

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setError('')
    if (f.size > MAX_UPLOAD_BYTES) { setError('El archivo supera el límite de 200 MB.'); return }
    if (!/^(image|video)\//.test(f.type)) { setError('Solo se permiten imágenes o videos.'); return }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  function reset() {
    setFile(null); setPreview(null); setTitle(''); setCaption('')
    setConsent(false); setIsMinor(false); setGuardianAck(false); setGuardianName('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const canSubmit = !!file && consent && (!isMinor || (guardianAck && guardianName.trim().length > 1)) && !uploading

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !canSubmit) return
    setUploading(true); setError('')
    try {
      const supabase = createClient()
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false })
      if (upErr) { setError('No se pudo subir el archivo. Intenta de nuevo.'); setUploading(false); return }

      const res = await fetch('/api/mi-cuenta/submissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storage_path: path, kind: file.type.startsWith('video') ? 'video' : 'imagen',
          mime: file.type, size_bytes: file.size, title, caption,
          consent_granted: consent, is_minor: isMinor, guardian_ack: guardianAck, guardian_name: guardianName,
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'No se pudo guardar.'); setUploading(false); return }
      reset()
      await loadList()
    } catch {
      setError('Ocurrió un error. Intenta de nuevo.')
    }
    setUploading(false)
  }

  async function logout() {
    await fetch('/api/portal/auth/logout', { method: 'POST' })
    window.location.href = '/mi-cuenta/entrar'
  }

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring'

  return (
    <div>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Image src="/logo.png" alt="D'Mart Institute" width={130} height={44} className="h-9 w-auto" />
          <button onClick={logout} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-ink">
            <LogOut className="h-4 w-4" /> Salir
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Bienvenida */}
        <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#111 0%,#1c1c1c 55%,#3a0a0a 100%)' }}>
          <h1 className="text-2xl font-bold font-display">¡Hola, {name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-300 mt-1 text-sm max-w-xl">
            Sube fotos y videos de tus clases, prácticas o proyectos. Nuestro equipo los revisa y, si los apruebas para su uso,
            podríamos publicarlos en las redes sociales y el sitio de D&apos;Mart. Solo tú y la institución ven tu contenido.
          </p>
        </div>

        {/* Subir contenido */}
        <form onSubmit={submit} className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold text-ink font-display">Subir contenido</h2>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          {!file ? (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-colors">
              <Upload className="h-7 w-7" />
              <span className="text-sm font-semibold">Elegir imagen o video</span>
              <span className="text-xs text-gray-400">Hasta 200 MB · JPG, PNG, MP4, MOV…</span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black/[0.03]">
              {file.type.startsWith('video')
                ? <video src={preview ?? undefined} controls className="w-full max-h-72 object-contain bg-black" />
                /* eslint-disable-next-line @next/next/no-img-element */
                : <img src={preview ?? ''} alt="" className="w-full max-h-72 object-contain" />}
              <button type="button" onClick={reset} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pickFile} />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Título <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Ej: Práctica de coloración" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Descripción <span className="text-gray-400 font-normal">(opcional)</span></label>
              <input value={caption} onChange={(e) => setCaption(e.target.value)} className={inputCls} placeholder="Cuéntanos qué es" />
            </div>
          </div>

          {/* Consentimiento */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase tracking-wide">
              <ShieldCheck className="h-4 w-4 text-accent" /> Autorización de uso
            </div>
            <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-accent flex-shrink-0" />
              <span>{CONSENT_TEXT}</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} className="h-4 w-4 accent-accent flex-shrink-0" />
              <span>Soy menor de 18 años</span>
            </label>
            {isMinor && (
              <div className="pl-7 space-y-3 border-l-2 border-accent/30">
                <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={guardianAck} onChange={(e) => setGuardianAck(e.target.checked)} className="mt-1 h-4 w-4 accent-accent flex-shrink-0" />
                  <span>{GUARDIAN_TEXT}</span>
                </label>
                <input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={inputCls} placeholder="Nombre del padre/madre/tutor" />
              </div>
            )}
          </div>

          <button type="submit" disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo…</> : <><Upload className="h-4 w-4" /> Subir y autorizar</>}
          </button>
          {!consent && file && <p className="text-xs text-center text-gray-400">Marca la autorización para poder subir.</p>}
        </form>

        {/* Mis envíos */}
        <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6">
          <h2 className="text-sm font-bold text-ink font-display mb-4">Mis envíos</h2>
          {loadingList ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
          ) : subs.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Aún no has subido contenido. ¡Sube tu primera foto o video!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {subs.map((s) => {
                const st = STATUS[s.status]
                return (
                  <div key={s.id} className="rounded-xl overflow-hidden border border-gray-200">
                    <div className="relative aspect-square bg-gray-100 flex items-center justify-center">
                      {s.url && s.kind === 'imagen'
                        /* eslint-disable-next-line @next/next/no-img-element */
                        ? <img src={s.url} alt={s.title ?? ''} className="w-full h-full object-cover" />
                        : s.url && s.kind === 'video'
                          ? <video src={s.url} className="w-full h-full object-cover" />
                          : <span className="text-gray-300">{s.kind === 'video' ? <Film /> : <ImageIcon />}</span>}
                      <span className={`absolute top-1.5 left-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>
                        <st.Icon className="h-3 w-3" /> {st.label}
                      </span>
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="text-xs font-medium text-ink truncate">{s.title || (s.kind === 'video' ? 'Video' : 'Imagen')}</p>
                      {s.status === 'rechazado' && s.review_note && <p className="text-[11px] text-red-600 mt-0.5">{s.review_note}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
