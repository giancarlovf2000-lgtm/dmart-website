'use client'

import { useMemo, useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import { Download, Image as ImageIcon, Save, Trash2, Upload, X } from 'lucide-react'
import { STATIC_PROGRAMS, PRIVADOS_SABATINOS, STATIC_CATEGORIES, STATIC_CAMPUSES } from '@/lib/utils'

// ── Constantes de marca ──────────────────────────────────────────────────────
const RED = '#D40000'
const INK = '#141414'

const ADMISSION_REQS = [
  '16 años o más (programas de salud: 18 años o más)',
  'Diploma o Transcripción de Crédito con 4to año aprobado',
  'Certificado de Vacunas (PVAC-3), si es menor de 21 años',
  'Cuota de Admisión',
]

type PostType = 'programa' | 'sabatino' | 'requisitos' | 'evento'
type BgStyle = 'rojo' | 'negro' | 'claro' | 'degradado' | 'foto'
type LogoKind = 'blanco' | 'color' | 'icono' | 'none'
export type PostTemplate = 'clasico' | 'centrado' | 'banda' | 'editorial' | 'minimal' | 'marco' | 'lateral'

const LOGO_SRC: Record<Exclude<LogoKind, 'none'>, string> = {
  blanco: '/logo-dmart-blanco.png',
  color: '/logo-dmart-color.png',
  icono: '/logo-dmart-icono.png',
}

export interface PostConfig {
  type: PostType
  template: PostTemplate
  bg: BgStyle
  photo: string | null
  kicker: string
  title: string
  body: string
  chips: string[]
  reqs: string[]
  cta: string
  campusPhone: string
  handle: string
  website: string
  logo: LogoKind
}

const CAMPUS_OPTIONS = [
  { value: '', label: 'Sin teléfono' },
  ...STATIC_CAMPUSES.map((c) => ({ value: c.phone, label: `${c.name} · ${c.phone}` })),
  { value: STATIC_CAMPUSES.map((c) => c.phone).join('  ·  '), label: 'Ambos recintos' },
]

function defaultsFor(type: PostType): Partial<PostConfig> {
  if (type === 'programa') {
    const p = STATIC_PROGRAMS[0]
    return {
      kicker: 'Programa',
      title: p.name,
      body: p.description.slice(0, 160).replace(/\s+\S*$/, '') + '…',
      chips: [`${p.duration_months} meses`, `${p.credits} créditos`, p.schedule_options.join(' · ')],
      cta: 'Matricúlate ya',
    }
  }
  if (type === 'sabatino') {
    const s = PRIVADOS_SABATINOS[0]
    return { kicker: 'Curso Sabatino Corto', title: s.title, body: s.description, chips: [s.tag], cta: 'Cupos limitados' }
  }
  if (type === 'requisitos') {
    return { kicker: 'Admisiones', title: 'Requisitos de Admisión', body: '', chips: [], reqs: ADMISSION_REQS, cta: 'Solicita información' }
  }
  return { kicker: 'D\'Mart Institute', title: 'Tu carrera empieza aquí', body: 'Matrículas abiertas en nuestros recintos de Barranquitas y Vega Alta.', chips: [], cta: 'Inscríbete hoy' }
}

function initialConfig(): PostConfig {
  return {
    type: 'programa', template: 'clasico', bg: 'degradado', photo: null,
    kicker: '', title: '', body: '', chips: [], reqs: [], cta: '',
    campusPhone: STATIC_CAMPUSES[0].phone, handle: '@dmartinstitute', website: 'dmartpr.net', logo: 'blanco',
    ...defaultsFor('programa'),
  } as PostConfig
}

interface PostStudioProps {
  // Cuando se proveen, se muestran los botones "Guardar contenido" y "Borrar contenido".
  onSave?: (config: PostConfig, pngDataUrl: string) => void
  onClear?: () => void
  saving?: boolean
  // Config inicial (para precargar una variación generada). El remonte se fuerza con `key`.
  initial?: PostConfig
}

export default function PostStudio({ onSave, onClear, saving = false, initial }: PostStudioProps = {}) {
  const [config, setConfig] = useState<PostConfig>(() => initial ?? initialConfig())
  const [downloading, setDownloading] = useState(false)
  const [preparing, setPreparing] = useState(false)
  // Si el usuario no ha elegido logo manualmente, se autoajusta según el fondo.
  const [logoAuto, setLogoAuto] = useState(true)
  const exportRef = useRef<HTMLDivElement>(null)

  const set = (patch: Partial<PostConfig>) => setConfig((c) => ({ ...c, ...patch }))

  // Cambiar fondo: ajusta el logo automáticamente (claro → color; resto → blanco) si no se eligió manual.
  function changeBg(bg: BgStyle) {
    setConfig((c) => ({ ...c, bg, ...(logoAuto ? { logo: (bg === 'claro' ? 'color' : 'blanco') as LogoKind } : {}) }))
  }
  function chooseLogo(logo: LogoKind) {
    setLogoAuto(false)
    set({ logo })
  }

  function changeType(type: PostType) {
    set({ type, ...defaultsFor(type) })
  }

  function selectProgram(slug: string) {
    const p = STATIC_PROGRAMS.find((x) => x.slug === slug)
    if (!p) return
    set({
      title: p.name,
      body: p.description.slice(0, 170).replace(/\s+\S*$/, '') + '…',
      chips: [`${p.duration_months} meses`, `${p.credits} créditos`, p.schedule_options.join(' · ')],
    })
  }

  function selectSabatino(id: string) {
    const s = PRIVADOS_SABATINOS.find((x) => String(x.id) === id)
    if (!s) return
    set({ title: s.title, body: s.description, chips: [s.tag] })
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setConfig((c) => ({ ...c, photo: reader.result as string, bg: 'foto', ...(logoAuto ? { logo: 'blanco' as LogoKind } : {}) }))
    reader.readAsDataURL(file)
  }

  async function getPng(): Promise<string | null> {
    if (!exportRef.current) return null
    return htmlToImage.toPng(exportRef.current, { pixelRatio: 1, cacheBust: true, width: 1080, height: 1350 })
  }

  async function download() {
    setDownloading(true)
    try {
      const dataUrl = await getPng()
      if (!dataUrl) return
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `dmart-post-${config.type}.png`
      a.click()
    } catch (err) {
      console.error('[PostStudio] export error', err)
      alert('No se pudo generar la imagen. Intenta de nuevo.')
    }
    setDownloading(false)
  }

  async function handleSave() {
    if (!onSave) return
    setPreparing(true)
    try {
      const dataUrl = await getPng()
      if (!dataUrl) return
      onSave(config, dataUrl)
    } catch (err) {
      console.error('[PostStudio] save export error', err)
      alert('No se pudo preparar la imagen para guardar. Intenta de nuevo.')
    }
    setPreparing(false)
  }

  function handleClear() {
    if (!confirm('¿Borrar el contenido actual del editor? Esto no afecta los posts ya guardados.')) return
    setConfig(initialConfig())
    setLogoAuto(true)
    onClear?.()
  }

  const inputCls = 'w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-accent-ring'
  const labelCls = 'text-xs font-semibold text-gray-600 mb-1 block'

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* ── Controles ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-ink font-display">Generador de Posts (Instagram 4:5)</h2>
        </div>

        {/* Tipo */}
        <div>
          <label className={labelCls}>Tipo de post</label>
          <div className="flex flex-wrap gap-2">
            {([
              ['programa', 'Programa'], ['sabatino', 'Curso sabatino'], ['requisitos', 'Requisitos'], ['evento', 'Evento / Promo'],
            ] as [PostType, string][]).map(([k, l]) => (
              <button key={k} onClick={() => changeType(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${config.type === k ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Selector según tipo */}
        {config.type === 'programa' && (
          <div>
            <label className={labelCls}>Elegir programa (autocompleta)</label>
            <select className={inputCls} onChange={(e) => selectProgram(e.target.value)} defaultValue={STATIC_PROGRAMS[0].slug}>
              {STATIC_PROGRAMS.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
          </div>
        )}
        {config.type === 'sabatino' && (
          <div>
            <label className={labelCls}>Elegir curso sabatino (autocompleta)</label>
            <select className={inputCls} onChange={(e) => selectSabatino(e.target.value)} defaultValue={String(PRIVADOS_SABATINOS[0].id)}>
              {PRIVADOS_SABATINOS.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
        )}

        {/* Campos editables */}
        <div>
          <label className={labelCls}>Etiqueta superior</label>
          <input className={inputCls} value={config.kicker} onChange={(e) => set({ kicker: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Título</label>
          <input className={inputCls} value={config.title} onChange={(e) => set({ title: e.target.value })} />
        </div>
        {config.type !== 'requisitos' && (
          <div>
            <label className={labelCls}>Texto</label>
            <textarea className={inputCls} rows={3} value={config.body} onChange={(e) => set({ body: e.target.value })} />
          </div>
        )}
        {config.type === 'requisitos' && (
          <div>
            <label className={labelCls}>Requisitos (uno por línea)</label>
            <textarea className={inputCls} rows={4} value={config.reqs.join('\n')} onChange={(e) => set({ reqs: e.target.value.split('\n').filter(Boolean) })} />
          </div>
        )}
        {(config.type === 'programa' || config.type === 'sabatino' || config.type === 'evento') && (
          <div>
            <label className={labelCls}>Chips (separados por coma)</label>
            <input className={inputCls} value={config.chips.join(', ')} onChange={(e) => set({ chips: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </div>
        )}
        <div>
          <label className={labelCls}>Botón / CTA</label>
          <input className={inputCls} value={config.cta} onChange={(e) => set({ cta: e.target.value })} />
        </div>

        {/* Diseño (plantilla) */}
        <div>
          <label className={labelCls}>Diseño</label>
          <div className="flex flex-wrap gap-2">
            {([
              ['clasico', 'Clásico'], ['centrado', 'Centrado'], ['banda', 'Banda'], ['editorial', 'Editorial'],
              ['minimal', 'Minimal'], ['marco', 'Marco'], ['lateral', 'Lateral'],
            ] as [PostTemplate, string][]).map(([k, l]) => (
              <button key={k} onClick={() => set({ template: k })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${(config.template ?? 'clasico') === k ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Fondo */}
        <div>
          <label className={labelCls}>Fondo</label>
          <div className="flex flex-wrap gap-2">
            {([['degradado', 'Degradado'], ['rojo', 'Rojo'], ['negro', 'Negro'], ['claro', 'Claro']] as [BgStyle, string][]).map(([k, l]) => (
              <button key={k} onClick={() => changeBg(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${config.bg === k ? 'bg-ink text-white border-ink' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
            <label className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors flex items-center gap-1 ${config.bg === 'foto' ? 'bg-ink text-white border-ink' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              <Upload className="h-3 w-3" /> Subir foto
              <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
            </label>
            {config.photo && (
              <button onClick={() => set({ photo: null, bg: 'degradado' })} className="px-2 py-1.5 rounded-full text-xs text-gray-400 hover:bg-gray-100" title="Quitar foto">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Pie */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Teléfono en el pie</label>
            <select className={inputCls} value={config.campusPhone} onChange={(e) => set({ campusPhone: e.target.value })}>
              {CAMPUS_OPTIONS.map((o) => <option key={o.label} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Usuario / Instagram</label>
            <input className={inputCls} value={config.handle} onChange={(e) => set({ handle: e.target.value })} />
          </div>
        </div>
        {/* Logo */}
        <div>
          <label className={labelCls}>Logo</label>
          <div className="flex flex-wrap gap-2">
            {([['blanco', 'Blanco'], ['color', 'Color'], ['icono', 'Ícono'], ['none', 'Ninguno']] as [LogoKind, string][]).map(([k, l]) => (
              <button key={k} onClick={() => chooseLogo(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${config.logo === k ? 'bg-ink text-white border-ink' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Blanco para fondos oscuros · Color para fondo claro · Ícono = solo el swoosh.</p>
        </div>

        <button onClick={download} disabled={downloading}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
          <Download className="h-4 w-4" />
          {downloading ? 'Generando…' : 'Descargar imagen (1080×1350)'}
        </button>

        {(onSave || onClear) && (
          <div className="grid grid-cols-2 gap-2">
            {onSave && (
              <button onClick={handleSave} disabled={preparing || saving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50">
                <Save className="h-4 w-4" />
                {preparing || saving ? 'Guardando…' : 'Guardar contenido'}
              </button>
            )}
            {onClear && (
              <button onClick={handleClear} disabled={preparing || saving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Trash2 className="h-4 w-4" />
                Borrar contenido
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Vista previa ──────────────────────────────────────────── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500">Vista previa</p>
        <div style={{ width: 360, height: 450, overflow: 'hidden', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}>
          <div style={{ transform: 'scale(0.33333)', transformOrigin: 'top left' }}>
            <PostCard config={config} />
          </div>
        </div>
        <p className="text-xs text-gray-400">Formato 4:5 (1080×1350 px), listo para Instagram.</p>
      </div>

      {/* Nodo a tamaño real (fuera de pantalla) para exportar */}
      <div style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }} aria-hidden>
        <div ref={exportRef}><PostCard config={config} /></div>
      </div>
    </div>
  )
}

// ── La tarjeta (diseño 1080×1350) ────────────────────────────────────────────
const DISPLAY_FONT = 'var(--font-display), system-ui, sans-serif'

interface Colors {
  dark: boolean; fg: string; sub: string
  pillBg: string; pillFg: string; borderCol: string; chipBorder: string; chipBg: string
}

function LogoImg({ config, size }: { config: PostConfig; size: number }) {
  if (config.logo === 'none') return <span />
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_SRC[config.logo]} alt="D'Mart Institute" style={{ height: config.logo === 'icono' ? size * 1.4 : size, width: 'auto', display: 'block' }} />
}

function Handle({ config, c }: { config: PostConfig; c: Colors }) {
  if (!config.handle) return <span />
  return <span style={{ fontSize: 30, color: c.dark ? 'rgba(255,255,255,0.9)' : '#5A5A5A', fontWeight: 600 }}>{config.handle}</span>
}

function KickerPill({ text, c, align = 'left' }: { text: string; c: Colors; align?: 'left' | 'center' }) {
  if (!text) return null
  return (
    <div style={{ textAlign: align }}>
      <span style={{ display: 'inline-block', background: c.pillBg, color: c.pillFg, fontWeight: 800, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', padding: '12px 26px', borderRadius: 999 }}>{text}</span>
    </div>
  )
}

function BodyOrReqs({ config, c, align = 'left', maxWidth = 820 }: { config: PostConfig; c: Colors; align?: 'left' | 'center'; maxWidth?: number }) {
  if (config.type === 'requisitos') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
        {config.reqs.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 22 }}>
            <div style={{ flexShrink: 0, width: 52, height: 52, borderRadius: 999, background: c.pillBg, color: c.pillFg, fontSize: 32, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
            <span style={{ fontSize: 38, lineHeight: 1.3, color: c.fg, fontWeight: 500 }}>{r}</span>
          </div>
        ))}
      </div>
    )
  }
  if (!config.body) return null
  return <p style={{ fontSize: 40, lineHeight: 1.4, color: c.sub, maxWidth, ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}) }}>{config.body}</p>
}

function Chips({ config, c, align = 'left' }: { config: PostConfig; c: Colors; align?: 'left' | 'center' }) {
  if (config.chips.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
      {config.chips.map((chip, i) => (
        <span key={i} style={{ fontSize: 30, fontWeight: 700, padding: '14px 28px', borderRadius: 999, color: c.fg, border: `2px solid ${c.chipBorder}`, background: c.chipBg }}>{chip}</span>
      ))}
    </div>
  )
}

function CtaPill({ config, c, align = 'left', plain = false }: { config: PostConfig; c: Colors; align?: 'left' | 'center'; plain?: boolean }) {
  if (!config.cta) return null
  if (plain) {
    return (
      <div style={{ textAlign: align }}>
        <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 42, color: c.fg, borderBottom: `4px solid ${c.pillBg}`, paddingBottom: 8 }}>{config.cta} →</span>
      </div>
    )
  }
  return (
    <div style={{ textAlign: align }}>
      <span style={{ display: 'inline-block', background: c.pillBg, color: c.pillFg, fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 44, padding: '26px 56px', borderRadius: 999 }}>{config.cta} →</span>
    </div>
  )
}

function Footer({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <div style={{ marginTop: 56, paddingTop: 30, borderTop: `2px solid ${c.borderCol}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 32, fontWeight: 700, color: c.fg }}>{config.website}</span>
      {config.campusPhone ? <span style={{ fontSize: 32, fontWeight: 700, color: c.dark ? '#fff' : RED }}>{config.campusPhone}</span> : <span />}
    </div>
  )
}

function Title({ config, c, size, align = 'left' }: { config: PostConfig; c: Colors; size: number; align?: 'left' | 'center' }) {
  return (
    <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.03, margin: 0, color: c.fg, textAlign: align }}>{config.title}</h1>
  )
}

// ── Plantillas de layout (todas reciben config + colores) ─────────────────────
function TplClasico({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 360, height: 14, background: c.pillBg }} />
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '88px 84px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 96 }}>
          <LogoImg config={config} size={72} /><Handle config={config} c={c} />
        </div>
        <div style={{ marginTop: 64 }}><KickerPill text={config.kicker} c={c} /></div>
        <div style={{ marginTop: 34 }}><Title config={config} c={c} size={92} /></div>
        <div style={{ marginTop: config.type === 'requisitos' ? 44 : 32 }}><BodyOrReqs config={config} c={c} /></div>
        <div style={{ marginTop: 40 }}><Chips config={config} c={c} /></div>
        <div style={{ flex: 1 }} />
        <CtaPill config={config} c={c} />
        <Footer config={config} c={c} />
      </div>
    </>
  )
}

function TplCentrado({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '96px 84px' }}>
      <LogoImg config={config} size={80} />
      <div style={{ marginTop: 56 }}><KickerPill text={config.kicker} c={c} align="center" /></div>
      <div style={{ marginTop: 40 }}><Title config={config} c={c} size={100} align="center" /></div>
      <div style={{ marginTop: 34, width: '100%' }}><BodyOrReqs config={config} c={c} align="center" maxWidth={820} /></div>
      <div style={{ marginTop: 40, width: '100%' }}><Chips config={config} c={c} align="center" /></div>
      <div style={{ flex: 1 }} />
      <CtaPill config={config} c={c} align="center" />
      <div style={{ width: '100%' }}><Footer config={config} c={c} /></div>
    </div>
  )
}

function TplBanda({ config, c }: { config: PostConfig; c: Colors }) {
  // Banda superior sólida (acento) con logo + kicker + título; abajo el resto sobre el fondo base.
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: RED, color: '#fff', padding: '84px 84px 72px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 96 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {config.logo !== 'none' && <img src={LOGO_SRC.blanco} alt="D'Mart Institute" style={{ height: 72, width: 'auto', display: 'block' }} />}
          {config.handle && <span style={{ fontSize: 30, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{config.handle}</span>}
        </div>
        {config.kicker && (
          <div style={{ marginTop: 40 }}>
            <span style={{ display: 'inline-block', background: '#fff', color: RED, fontWeight: 800, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', padding: '12px 26px', borderRadius: 999 }}>{config.kicker}</span>
          </div>
        )}
        <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 96, lineHeight: 1.02, margin: '34px 0 0', color: '#fff' }}>{config.title}</h1>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '64px 84px 84px' }}>
        <BodyOrReqs config={config} c={c} />
        <div style={{ marginTop: 40 }}><Chips config={config} c={c} /></div>
        <div style={{ flex: 1 }} />
        <CtaPill config={config} c={c} />
        <Footer config={config} c={c} />
      </div>
    </div>
  )
}

function TplEditorial({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 80 }}>
        <LogoImg config={config} size={60} /><Handle config={config} c={c} />
      </div>
      <div style={{ marginTop: 44 }}><KickerPill text={config.kicker} c={c} /></div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 150, lineHeight: 0.98, margin: 0, color: c.fg, letterSpacing: -2 }}>{config.title}</h1>
      </div>
      {config.body && <p style={{ fontSize: 36, lineHeight: 1.35, color: c.sub, maxWidth: 820, marginBottom: 28 }}>{config.body}</p>}
      <div style={{ marginBottom: 28 }}><Chips config={config} c={c} /></div>
      <CtaPill config={config} c={c} />
      <Footer config={config} c={c} />
    </div>
  )
}

function TplMinimal({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '110px 100px' }}>
      <LogoImg config={config} size={64} />
      <div style={{ flex: 1 }} />
      {config.kicker && <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: 4, textTransform: 'uppercase', color: c.pillBg }}>{config.kicker}</span>}
      <div style={{ width: 90, height: 4, background: c.pillBg, margin: '32px 0' }} />
      <Title config={config} c={c} size={86} align="center" />
      {config.body && <p style={{ fontSize: 36, lineHeight: 1.4, color: c.sub, maxWidth: 720, marginTop: 32 }}>{config.body}</p>}
      <div style={{ marginTop: 36, width: '100%' }}><Chips config={config} c={c} align="center" /></div>
      <div style={{ flex: 1 }} />
      <CtaPill config={config} c={c} align="center" plain />
      <div style={{ width: '100%', marginTop: 40 }}><Footer config={config} c={c} /></div>
    </div>
  )
}

function TplMarco({ config, c }: { config: PostConfig; c: Colors }) {
  const line = c.dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.35)'
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
      <div style={{ position: 'absolute', inset: 48, border: `3px solid ${line}`, borderRadius: 8 }} />
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '120px 110px' }}>
        <LogoImg config={config} size={70} />
        <div style={{ marginTop: 44 }}><KickerPill text={config.kicker} c={c} align="center" /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Title config={config} c={c} size={94} align="center" />
          {config.body && <p style={{ fontSize: 36, lineHeight: 1.4, color: c.sub, maxWidth: 760, margin: '32px auto 0' }}>{config.body}</p>}
          <div style={{ marginTop: 36 }}><Chips config={config} c={c} align="center" /></div>
        </div>
        <CtaPill config={config} c={c} align="center" />
      </div>
    </div>
  )
}

function TplLateral({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex' }}>
      <div style={{ width: 24, background: c.pillBg, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '88px 84px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 96 }}>
          <LogoImg config={config} size={72} /><Handle config={config} c={c} />
        </div>
        <div style={{ marginTop: 56 }}><KickerPill text={config.kicker} c={c} /></div>
        <div style={{ marginTop: 30 }}><Title config={config} c={c} size={104} /></div>
        <div style={{ marginTop: 32 }}><BodyOrReqs config={config} c={c} /></div>
        <div style={{ marginTop: 40 }}><Chips config={config} c={c} /></div>
        <div style={{ flex: 1 }} />
        <CtaPill config={config} c={c} />
        <Footer config={config} c={c} />
      </div>
    </div>
  )
}

export function PostCard({ config }: { config: PostConfig }) {
  const dark = config.bg !== 'claro'
  const c: Colors = {
    dark,
    fg: dark ? '#ffffff' : INK,
    sub: dark ? 'rgba(255,255,255,0.82)' : '#5A5A5A',
    pillBg: dark ? '#ffffff' : RED,
    pillFg: dark ? RED : '#ffffff',
    borderCol: dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)',
    chipBorder: dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.18)',
    chipBg: dark ? 'rgba(255,255,255,0.10)' : '#fff',
  }

  const bgStyle: React.CSSProperties = useMemo(() => {
    switch (config.bg) {
      case 'rojo': return { background: RED }
      case 'negro': return { background: INK }
      case 'claro': return { background: '#F4F3F1' }
      case 'foto': return { background: INK }
      default: return { background: 'linear-gradient(150deg, #1a1a1a 0%, #3a0a0a 55%, #7a0f0f 100%)' }
    }
  }, [config.bg])

  const template = config.template ?? 'clasico'

  return (
    <div style={{
      width: 1080, height: 1350, position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-body), system-ui, sans-serif', color: c.fg, ...bgStyle,
      display: 'flex', flexDirection: 'column',
    }}>
      {config.bg === 'foto' && config.photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.25) 40%, rgba(0,0,0,.82) 100%)' }} />
        </>
      )}

      {template === 'centrado' ? <TplCentrado config={config} c={c} />
        : template === 'banda' ? <TplBanda config={config} c={c} />
        : template === 'editorial' ? <TplEditorial config={config} c={c} />
        : template === 'minimal' ? <TplMinimal config={config} c={c} />
        : template === 'marco' ? <TplMarco config={config} c={c} />
        : template === 'lateral' ? <TplLateral config={config} c={c} />
        : <TplClasico config={config} c={c} />}
    </div>
  )
}
