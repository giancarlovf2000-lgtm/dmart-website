'use client'

import { useMemo, useRef, useState } from 'react'
import * as htmlToImage from 'html-to-image'
import {
  ChevronLeft, ChevronRight, Copy, Download, Image as ImageIcon, Layers, Plus, Save, Trash2, Upload, X,
  // Iconos decorativos que se renderizan DENTRO de la tarjeta (exportan bien a PNG).
  Sparkles, Heart, HeartPulse, Briefcase, Wrench, Scissors, Hand, Crown, Award, Zap, Car, Snowflake, Thermometer,
  FileText, Coffee, MessageCircle, Flower2, Wine, GraduationCap, Monitor, Clock, Hourglass, Sun, Moon,
  CalendarDays, Check, ArrowUpRight, type LucideIcon,
} from 'lucide-react'
import { STATIC_PROGRAMS, PRIVADOS_SABATINOS, STATIC_CATEGORIES, STATIC_CAMPUSES } from '@/lib/utils'
import { buildCarousel, accentIconFor } from '@/lib/posts/templates'

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
// Set premium (nuevo) + plantillas legacy (se conservan solo para render de posts guardados).
export type PostTemplate =
  | 'titular' | 'enfoque' | 'pregunta' | 'destacado' | 'lista'
  | 'clasico' | 'centrado' | 'banda' | 'editorial' | 'minimal' | 'marco' | 'lateral'

// Plantillas que se ofrecen en el selector del editor (las nuevas premium).
const TEMPLATE_OPTIONS: [PostTemplate, string][] = [
  ['titular', 'Titular'], ['enfoque', 'Enfoque'], ['pregunta', 'Pregunta'], ['destacado', 'Destacado'], ['lista', 'Lista'],
]

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
  logoScale?: number
  // Diseño premium: color de acento (por área), icono temático (lucide) y micro-etiquetas superiores.
  accent?: string
  icon?: string
  topLabels?: string[]
}

const DEFAULT_TOP_LABELS = ['Educa', 'Crece', 'Transfórmate']

// Reduce el tamaño de letra del cuerpo según cuánto texto haya, para que quepa
// en la tarjeta de altura fija sin cortarse.
function fitBodySize(text: string | undefined, base: number): number {
  const len = (text ?? '').length
  if (len <= 130) return base
  if (len <= 200) return Math.round(base * 0.88)
  if (len <= 280) return Math.round(base * 0.78)
  if (len <= 360) return Math.round(base * 0.70)
  if (len <= 440) return Math.round(base * 0.62)
  return Math.round(base * 0.55)
}

const CAMPUS_OPTIONS = [
  { value: '', label: 'Sin teléfono' },
  ...STATIC_CAMPUSES.map((c) => ({ value: c.phone, label: `${c.name} · ${c.phone}` })),
  { value: STATIC_CAMPUSES.map((c) => c.phone).join('  ·  '), label: 'Ambos recintos' },
]

function defaultsFor(type: PostType): Partial<PostConfig> {
  if (type === 'programa') {
    const p = STATIC_PROGRAMS[0]
    const { accent, icon } = accentIconFor(p.name)
    return {
      kicker: 'Matrículas Abiertas',
      title: p.name,
      body: p.description,
      chips: [`${p.duration_months} meses`, `${p.credits} créditos`, p.schedule_options.join(' · ')],
      cta: 'Matricúlate ya',
      accent, icon,
    }
  }
  if (type === 'sabatino') {
    const s = PRIVADOS_SABATINOS[0]
    const { accent, icon } = accentIconFor(s.title)
    return { kicker: 'Curso Sabatino Corto', title: s.title, body: s.description, chips: [s.tag], cta: 'Cupos limitados', accent, icon }
  }
  if (type === 'requisitos') {
    return { kicker: 'Requisitos de Admisión', title: 'Requisitos', body: '', chips: [], reqs: ADMISSION_REQS, cta: 'Solicita información', accent: RED, icon: 'GraduationCap' }
  }
  return { kicker: 'D\'Mart Institute', title: 'Tu carrera **empieza** aquí', body: 'Matrículas abiertas en nuestros recintos de Barranquitas y Vega Alta.', chips: [], cta: 'Inscríbete hoy', accent: RED, icon: 'GraduationCap' }
}

export function initialConfig(): PostConfig {
  return {
    type: 'programa', template: 'enfoque', bg: 'degradado', photo: null,
    kicker: '', title: '', body: '', chips: [], reqs: [], cta: '',
    campusPhone: STATIC_CAMPUSES[0].phone, handle: '@dmartinstitute', website: 'dmartpr.net', logo: 'blanco', logoScale: 1,
    topLabels: DEFAULT_TOP_LABELS,
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
  // Modo controlado (para el editor de carousel): edita `value` externo en vez del estado interno.
  value?: PostConfig
  onChange?: (config: PostConfig) => void
  // Oculta vista previa, nodo de export y botones (el contenedor los aporta).
  embedded?: boolean
}

export default function PostStudio({ onSave, onClear, saving = false, initial, value, onChange, embedded = false }: PostStudioProps = {}) {
  const controlled = value !== undefined && onChange !== undefined
  const [internal, setInternal] = useState<PostConfig>(() => initial ?? initialConfig())
  const config = controlled ? (value as PostConfig) : internal
  const setConfig = (updater: PostConfig | ((c: PostConfig) => PostConfig)) => {
    const next = typeof updater === 'function' ? (updater as (c: PostConfig) => PostConfig)(config) : updater
    if (controlled) onChange!(next)
    else setInternal(next)
  }
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
    const { accent, icon } = accentIconFor(p.name)
    set({
      title: p.name,
      body: p.description,
      chips: [`${p.duration_months} meses`, `${p.credits} créditos`, p.schedule_options.join(' · ')],
      accent, icon,
    })
  }

  function selectSabatino(id: string) {
    const s = PRIVADOS_SABATINOS.find((x) => String(x.id) === id)
    if (!s) return
    const { accent, icon } = accentIconFor(s.title)
    set({ title: s.title, body: s.description, chips: [s.tag], accent, icon })
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
    return cardToPng(exportRef.current)
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
    <div className={embedded ? '' : 'grid lg:grid-cols-[1fr_400px] gap-6'}>
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
          <p className="text-[11px] text-gray-400 mt-1">Envuelve una palabra en **asteriscos** para resaltarla en el color de acento.</p>
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
            {TEMPLATE_OPTIONS.map(([k, l]) => (
              <button key={k} onClick={() => set({ template: k })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${(config.template ?? 'enfoque') === k ? 'bg-accent text-white border-accent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Etiquetas superiores */}
        <div>
          <label className={labelCls}>Etiquetas superiores (3, separadas por coma)</label>
          <input className={inputCls}
            value={(config.topLabels ?? DEFAULT_TOP_LABELS).join(', ')}
            onChange={(e) => set({ topLabels: e.target.value.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3) })} />
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
          {config.logo !== 'none' && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <label className={labelCls + ' mb-0'}>Tamaño del logo</label>
                <span className="text-[11px] font-semibold text-gray-500">{Math.round((config.logoScale ?? 1) * 100)}%</span>
              </div>
              <input type="range" min={0.5} max={1.8} step={0.1} value={config.logoScale ?? 1}
                onChange={(e) => set({ logoScale: Number(e.target.value) })}
                className="w-full accent-accent" />
            </div>
          )}
        </div>

        {!embedded && (
          <button onClick={download} disabled={downloading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
            <Download className="h-4 w-4" />
            {downloading ? 'Generando…' : 'Descargar imagen (1080×1350)'}
          </button>
        )}

        {!embedded && (onSave || onClear) && (
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
      {!embedded && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-500">Vista previa</p>
          <div style={{ width: 360, height: 450, overflow: 'hidden', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}>
            <div style={{ transform: 'scale(0.33333)', transformOrigin: 'top left' }}>
              <PostCard config={config} />
            </div>
          </div>
          <p className="text-xs text-gray-400">Formato 4:5 (1080×1350 px), listo para Instagram.</p>
        </div>
      )}

      {/* Nodo a tamaño real (fuera de pantalla) para exportar */}
      {!embedded && (
        <div style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }} aria-hidden>
          <div ref={exportRef}><PostCard config={config} /></div>
        </div>
      )}
    </div>
  )
}

// ── La tarjeta (diseño 1080×1350) ────────────────────────────────────────────
const DISPLAY_FONT = 'var(--font-display), system-ui, sans-serif'

interface Colors {
  dark: boolean; fg: string; sub: string
  pillBg: string; pillFg: string; borderCol: string; chipBorder: string; chipBg: string
  accent: string
}

// ── Sistema de diseño premium (iconos, watermark, énfasis, badges) ────────────
const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles, Heart, HeartPulse, Briefcase, Wrench, Scissors, Hand, Crown, Award, Zap, Car, Snowflake,
  Thermometer, FileText, Coffee, MessageCircle, Flower2, Wine, GraduationCap, Monitor,
}
function iconCmp(name?: string): LucideIcon {
  return (name && ICON_MAP[name]) || GraduationCap
}

// ¿El color es tan oscuro que se pierde sobre fondo oscuro? (p. ej. #111111 de Comercial)
function isDarkColor(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return false
  const n = parseInt(m[1], 16)
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
  return 0.299 * r + 0.587 * g + 0.114 * b < 70
}

// Icono para un chip según su contenido (11 meses → Clock, 39 créditos → Award, …).
function chipIcon(text: string): LucideIcon {
  const t = text.toLowerCase()
  if (t.includes('mes')) return Clock
  if (t.includes('crédito') || t.includes('credito')) return Award
  if (t.includes('hora')) return Hourglass
  if (t.includes('diurn')) return Sun
  if (t.includes('nocturn')) return Moon
  if (t.includes('sabatin') || t.includes('comienza') || t.includes('inicia') || t.includes('cupos')) return CalendarDays
  return Check
}

// Divide un chip "11 meses" → { value: '11', label: 'meses' } para las stat cards.
function parseStat(chip: string): { Icon: LucideIcon; value: string; label: string } {
  const Icon = chipIcon(chip)
  const m = chip.match(/^\s*([\d.,]+)\s*(.+)$/)
  if (m) return { Icon, value: m[1], label: m[2] }
  return { Icon, value: chip, label: '' }
}

// Resalta segmentos marcados con **doble asterisco** en color de acento.
function EmphText({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**')
          ? <span key={i} style={{ color: accent }}>{p.slice(2, -2)}</span>
          : <span key={i}>{p}</span>,
      )}
    </>
  )
}

function Headline({ config, c, size, align = 'left' }: { config: PostConfig; c: Colors; size: number; align?: 'left' | 'center' }) {
  return (
    <h1 style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: size, lineHeight: 1.0, margin: 0, color: c.fg, textAlign: align, letterSpacing: -1 }}>
      <EmphText text={config.title} accent={c.accent} />
    </h1>
  )
}

// Texto de marca gigante y tenue detrás del contenido.
function BrandWatermark({ text, c, top = 120 }: { text: string; c: Colors; top?: number }) {
  if (!text) return null
  return (
    <div aria-hidden style={{ position: 'absolute', top, left: -30, right: -30, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 300, lineHeight: 0.9, letterSpacing: -6, whiteSpace: 'nowrap', textTransform: 'uppercase', color: c.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>{text}</div>
    </div>
  )
}

// Fila de 3 micro-etiquetas (SMART · SECURE · SIMPLE → EDUCA · CRECE · TRANSFÓRMATE).
function TopLabels({ config, c }: { config: PostConfig; c: Colors }) {
  const ls = (config.topLabels && config.topLabels.length ? config.topLabels : DEFAULT_TOP_LABELS).slice(0, 3)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      {ls.map((l, i) => (
        <span key={i} style={{ fontSize: 24, fontWeight: 700, letterSpacing: 4, textTransform: 'uppercase', color: c.dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.42)' }}>{l}</span>
      ))}
    </div>
  )
}

// Panel translúcido con icono + label + valor grande.
function StatCard({ Icon, value, label, c }: { Icon: LucideIcon; value: string; label: string; c: Colors }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 22, background: c.dark ? 'rgba(255,255,255,0.06)' : '#ffffff', border: `2px solid ${c.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`, borderRadius: 26, padding: '26px 30px' }}>
      <div style={{ width: 82, height: 82, borderRadius: 20, background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={44} color="#ffffff" strokeWidth={2.4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: value.length > 10 ? 34 : 50, fontWeight: 700, color: c.fg, lineHeight: 1 }}>{value}</span>
        {label && <span style={{ fontSize: 25, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: c.sub }}>{label}</span>}
      </div>
    </div>
  )
}

// CTA con botón circular de flecha.
function IconCtaPill({ config, c, align = 'left' }: { config: PostConfig; c: Colors; align?: 'left' | 'center' }) {
  if (!config.cta) return null
  return (
    <div style={{ textAlign: align }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 22, background: c.accent, color: '#ffffff', fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 38, textTransform: 'uppercase', letterSpacing: 0.5, padding: '20px 20px 20px 42px', borderRadius: 999 }}>
        {config.cta}
        <span style={{ width: 62, height: 62, borderRadius: 999, background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUpRight size={36} color="#ffffff" strokeWidth={2.6} />
        </span>
      </span>
    </div>
  )
}

// Badge circular con glow y el icono temático del programa.
function ProgramIconBadge({ config, c, size = 300 }: { config: PostConfig; c: Colors; size?: number }) {
  const Icon = iconCmp(config.icon)
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 999, background: `radial-gradient(circle at 50% 50%, ${c.accent}55 0%, ${c.accent}00 70%)` }} />
      <div style={{ position: 'absolute', inset: size * 0.16, borderRadius: 999, background: c.dark ? 'rgba(255,255,255,0.07)' : '#ffffff', border: `3px solid ${c.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={size * 0.4} color={c.accent} strokeWidth={1.9} />
      </div>
    </div>
  )
}

function LogoImg({ config, size }: { config: PostConfig; size: number }) {
  if (config.logo === 'none') return <span />
  const scaled = (config.logo === 'icono' ? size * 1.4 : size) * (config.logoScale ?? 1)
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={LOGO_SRC[config.logo]} alt="D'Mart Institute" style={{ height: scaled, width: 'auto', display: 'block' }} />
}

function Handle({ config, c }: { config: PostConfig; c: Colors }) {
  if (!config.handle) return <span />
  return <span style={{ fontSize: 30, color: c.dark ? 'rgba(255,255,255,0.9)' : '#5A5A5A', fontWeight: 600 }}>{config.handle}</span>
}

function KickerPill({ text, c, align = 'left' }: { text: string; c: Colors; align?: 'left' | 'center' }) {
  if (!text) return null
  // En fondo oscuro: píldora blanca con texto de acento. En claro: píldora de acento con texto blanco.
  const bg = c.dark ? '#ffffff' : c.accent
  const fg = c.dark ? c.accent : '#ffffff'
  return (
    <div style={{ textAlign: align }}>
      <span style={{ display: 'inline-block', background: bg, color: fg, fontWeight: 800, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', padding: '12px 26px', borderRadius: 999 }}>{text}</span>
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
  return <p style={{ fontSize: fitBodySize(config.body, 40), lineHeight: 1.4, color: c.sub, maxWidth, ...(align === 'center' ? { marginLeft: 'auto', marginRight: 'auto' } : {}) }}>{config.body}</p>
}

function Chips({ config, c, align = 'left' }: { config: PostConfig; c: Colors; align?: 'left' | 'center' }) {
  if (config.chips.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
      {config.chips.map((chip, i) => {
        const Ic = chipIcon(chip)
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontSize: 30, fontWeight: 700, padding: '13px 26px', borderRadius: 999, color: c.fg, border: `2px solid ${c.chipBorder}`, background: c.chipBg }}>
            <Ic size={30} color={c.accent} strokeWidth={2.5} />{chip}
          </span>
        )
      })}
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
          {config.logo !== 'none' && <img src={LOGO_SRC.blanco} alt="D'Mart Institute" style={{ height: 72 * (config.logoScale ?? 1), width: 'auto', display: 'block' }} />}
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
      {config.body && <p style={{ fontSize: fitBodySize(config.body, 36), lineHeight: 1.35, color: c.sub, maxWidth: 820, marginBottom: 28 }}>{config.body}</p>}
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
      {config.body && <p style={{ fontSize: fitBodySize(config.body, 36), lineHeight: 1.4, color: c.sub, maxWidth: 720, marginTop: 32 }}>{config.body}</p>}
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
          {config.body && <p style={{ fontSize: fitBodySize(config.body, 36), lineHeight: 1.4, color: c.sub, maxWidth: 760, margin: '32px auto 0' }}>{config.body}</p>}
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

// ── Plantillas premium (set nuevo) ───────────────────────────────────────────
function TplTitular({ config, c }: { config: PostConfig; c: Colors }) {
  const wm = config.title.split(' ')[0] || 'DMART'
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 80px' }}>
      <BrandWatermark text={wm} c={c} top={440} />
      <div style={{ position: 'absolute', right: -90, bottom: 150 }}>
        <ProgramIconBadge config={config} c={c} size={520} />
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 90 }}>
        <LogoImg config={config} size={60} /><Handle config={config} c={c} />
      </div>
      <div style={{ position: 'relative', marginTop: 40 }}><TopLabels config={config} c={c} /></div>
      <div style={{ position: 'relative', marginTop: 80, maxWidth: 780 }}>
        <KickerPill text={config.kicker} c={c} />
        <div style={{ marginTop: 30 }}><Headline config={config} c={c} size={config.title.length > 22 ? 92 : 118} /></div>
        {config.body && <p style={{ marginTop: 28, fontSize: fitBodySize(config.body, 38), lineHeight: 1.4, color: c.sub, maxWidth: 620 }}><EmphText text={config.body} accent={c.accent} /></p>}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative', maxWidth: 660 }}>
        {config.chips.length > 0 && <div style={{ marginBottom: 30 }}><Chips config={config} c={c} /></div>}
        {config.cta && <IconCtaPill config={config} c={c} />}
      </div>
      <div style={{ position: 'relative', marginTop: 34 }}><Footer config={config} c={c} /></div>
    </div>
  )
}

function TplEnfoque({ config, c }: { config: PostConfig; c: Colors }) {
  const numeric = config.chips.filter((ch) => /^\s*[\d.,]/.test(ch))
  const nonNumeric = config.chips.filter((ch) => !/^\s*[\d.,]/.test(ch))
  const stats = numeric.slice(0, 3).map(parseStat)
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 80px' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1080, height: 12, background: c.accent }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 90 }}>
        <LogoImg config={config} size={62} /><Handle config={config} c={c} />
      </div>
      <div style={{ marginTop: 46 }}><KickerPill text={config.kicker} c={c} /></div>
      <div style={{ marginTop: 26 }}><Headline config={config} c={c} size={config.title.length > 24 ? 68 : 86} /></div>
      {config.body && <p style={{ marginTop: 28, fontSize: fitBodySize(config.body, 40), lineHeight: 1.42, color: c.sub, maxWidth: 900 }}><EmphText text={config.body} accent={c.accent} /></p>}
      {stats.length > 0 && (
        <div style={{ marginTop: 38, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {stats.map((s, i) => <StatCard key={i} Icon={s.Icon} value={s.value} label={s.label} c={c} />)}
        </div>
      )}
      {nonNumeric.length > 0 && <div style={{ marginTop: 24 }}><Chips config={{ ...config, chips: nonNumeric }} c={c} /></div>}
      <div style={{ flex: 1 }} />
      {config.cta && <div style={{ marginBottom: 30 }}><IconCtaPill config={config} c={c} /></div>}
      <Footer config={config} c={c} />
    </div>
  )
}

function TplPregunta({ config, c }: { config: PostConfig; c: Colors }) {
  const wm = config.title.split(' ')[0] || 'DMART'
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '96px 90px' }}>
      <BrandWatermark text={wm} c={c} top={540} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <LogoImg config={config} size={60} />
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <ProgramIconBadge config={config} c={c} size={240} />
        <div style={{ marginTop: 40 }}><KickerPill text={config.kicker} c={c} align="center" /></div>
        <div style={{ marginTop: 30 }}><Headline config={config} c={c} size={config.title.length > 18 ? 92 : 118} align="center" /></div>
        {config.body && <p style={{ marginTop: 28, fontSize: fitBodySize(config.body, 38), lineHeight: 1.4, color: c.sub, maxWidth: 820 }}><EmphText text={config.body} accent={c.accent} /></p>}
      </div>
      <div style={{ flex: 1 }} />
      {config.cta && <IconCtaPill config={config} c={c} align="center" />}
      <div style={{ position: 'relative', width: '100%', marginTop: 36 }}><Footer config={config} c={c} /></div>
    </div>
  )
}

function TplDestacado({ config, c }: { config: PostConfig; c: Colors }) {
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'stretch' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 0 80px 80px', maxWidth: 660 }}>
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 90 }}><LogoImg config={config} size={60} /></div>
        <div style={{ flex: 1 }} />
        <KickerPill text={config.kicker} c={c} />
        <div style={{ marginTop: 28 }}><Headline config={config} c={c} size={config.title.length > 20 ? 82 : 100} /></div>
        {config.body && <p style={{ marginTop: 26, fontSize: fitBodySize(config.body, 38), lineHeight: 1.42, color: c.sub, maxWidth: 560 }}><EmphText text={config.body} accent={c.accent} /></p>}
        {config.cta && <div style={{ marginTop: 42 }}><IconCtaPill config={config} c={c} /></div>}
        <div style={{ flex: 1 }} />
        <Footer config={config} c={c} />
      </div>
      <div style={{ width: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 58% 50%, ${c.accent}33 0%, ${c.accent}00 65%)` }} />
        <ProgramIconBadge config={config} c={c} size={400} />
      </div>
    </div>
  )
}

function TplLista({ config, c }: { config: PostConfig; c: Colors }) {
  const items = config.reqs.length ? config.reqs : []
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '80px 80px' }}>
      <BrandWatermark text={config.title.split(' ')[0] || 'DMART'} c={c} top={470} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 90 }}>
        <LogoImg config={config} size={62} /><Handle config={config} c={c} />
      </div>
      <div style={{ position: 'relative', marginTop: 46 }}><KickerPill text={config.kicker} c={c} /></div>
      <div style={{ position: 'relative', marginTop: 26 }}><Headline config={config} c={c} size={96} /></div>
      <div style={{ position: 'relative', marginTop: 52, display: 'flex', flexDirection: 'column', gap: 28 }}>
        {items.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
            <div style={{ flexShrink: 0, width: 70, height: 70, borderRadius: 20, background: `${c.accent}22`, border: `2px solid ${c.accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={40} color={c.accent} strokeWidth={3} />
            </div>
            <span style={{ fontSize: 36, lineHeight: 1.25, color: c.fg, fontWeight: 500 }}>{r}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {config.cta && <div style={{ position: 'relative', marginBottom: 30 }}><IconCtaPill config={config} c={c} /></div>}
      <div style={{ position: 'relative' }}><Footer config={config} c={c} /></div>
    </div>
  )
}

export function PostCard({ config }: { config: PostConfig }) {
  const dark = config.bg !== 'claro'
  const rawAccent = config.accent || RED
  // Sobre fondo oscuro, un acento muy oscuro (Comercial #111) se pierde → usar rojo de marca.
  const accent = dark && isDarkColor(rawAccent) ? RED : rawAccent
  const c: Colors = {
    dark,
    fg: dark ? '#ffffff' : INK,
    sub: dark ? 'rgba(255,255,255,0.82)' : '#5A5A5A',
    pillBg: dark ? '#ffffff' : RED,
    pillFg: dark ? RED : '#ffffff',
    borderCol: dark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)',
    chipBorder: dark ? 'rgba(255,255,255,0.30)' : 'rgba(0,0,0,0.14)',
    chipBg: dark ? 'rgba(255,255,255,0.08)' : '#fff',
    accent,
  }

  const bgStyle: React.CSSProperties = useMemo(() => {
    switch (config.bg) {
      case 'rojo': return { background: RED }
      case 'negro': return { background: INK }
      case 'claro': return { background: '#F4F3F1' }
      case 'foto': return { background: INK }
      // Degradado neutral oscuro: el glow de acento (abajo) es el que aporta el color.
      default: return { background: 'linear-gradient(158deg, #1b191d 0%, #121013 55%, #0a0a0b 100%)' }
    }
  }, [config.bg])

  const template = config.template ?? 'enfoque'

  return (
    <div style={{
      width: 1080, height: 1350, position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-body), system-ui, sans-serif', color: c.fg, ...bgStyle,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Glow de acento (define el color del fondo degradado por área) */}
      {config.bg === 'degradado' && (
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: `radial-gradient(1100px 850px at 82% 10%, ${accent}30 0%, transparent 60%)` }} />
      )}

      {config.bg === 'foto' && config.photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={config.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.25) 40%, rgba(0,0,0,.82) 100%)' }} />
        </>
      )}

      {template === 'titular' ? <TplTitular config={config} c={c} />
        : template === 'enfoque' ? <TplEnfoque config={config} c={c} />
        : template === 'pregunta' ? <TplPregunta config={config} c={c} />
        : template === 'destacado' ? <TplDestacado config={config} c={c} />
        : template === 'lista' ? <TplLista config={config} c={c} />
        : template === 'centrado' ? <TplCentrado config={config} c={c} />
        : template === 'banda' ? <TplBanda config={config} c={c} />
        : template === 'editorial' ? <TplEditorial config={config} c={c} />
        : template === 'minimal' ? <TplMinimal config={config} c={c} />
        : template === 'marco' ? <TplMarco config={config} c={c} />
        : template === 'lateral' ? <TplLateral config={config} c={c} />
        : <TplClasico config={config} c={c} />}
    </div>
  )
}

// Rasteriza un nodo (una tarjeta 1080×1350) a PNG. Reutilizable para carousels.
export async function cardToPng(node: HTMLElement): Promise<string> {
  return htmlToImage.toPng(node, { pixelRatio: 1, cacheBust: true, width: 1080, height: 1350 })
}

// ── Editor de carousel (hilo de varias tarjetas relacionadas) ─────────────────
interface CarouselStudioProps {
  // Config base (programa elegido o post en blanco) del que se deriva la secuencia.
  seed: PostConfig
  // Guarda el carousel: recibe todos los slides y sus PNG (dataURL).
  onSave?: (slides: PostConfig[], pngDataUrls: string[]) => void
  onClear?: () => void
  saving?: boolean
}

export function CarouselStudio({ seed, onSave, onClear, saving = false }: CarouselStudioProps) {
  const [slides, setSlides] = useState<PostConfig[]>(() => buildCarousel(seed))
  const [active, setActive] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])

  const current = slides[active] ?? slides[0]

  function patchActive(next: PostConfig) {
    setSlides((s) => s.map((x, i) => (i === active ? next : x)))
  }

  // Nueva tarjeta: hereda la marca (fondo/logo/pie) del slide actual, contenido en blanco.
  function addSlide() {
    setSlides((s) => {
      const b = s[active] ?? s[0]
      const blank: PostConfig = {
        ...b, type: 'evento', kicker: '', title: '', body: '', chips: [], reqs: [], cta: '', photo: null,
      }
      const next = [...s.slice(0, active + 1), blank, ...s.slice(active + 1)]
      return next
    })
    setActive((i) => i + 1)
  }

  function duplicateSlide() {
    setSlides((s) => [...s.slice(0, active + 1), { ...s[active] }, ...s.slice(active + 1)])
    setActive((i) => i + 1)
  }

  function deleteSlide() {
    if (slides.length <= 1) return
    setSlides((s) => s.filter((_, i) => i !== active))
    setActive((i) => Math.max(0, i - 1))
  }

  function move(dir: -1 | 1) {
    const j = active + dir
    if (j < 0 || j >= slides.length) return
    setSlides((s) => {
      const next = [...s]
      ;[next[active], next[j]] = [next[j], next[active]]
      return next
    })
    setActive(j)
  }

  async function exportAll(): Promise<string[]> {
    const urls: string[] = []
    for (let i = 0; i < slides.length; i++) {
      const node = slideRefs.current[i]
      if (!node) continue
      urls.push(await cardToPng(node))
    }
    return urls
  }

  async function downloadAll() {
    setDownloading(true)
    try {
      const urls = await exportAll()
      for (let i = 0; i < urls.length; i++) {
        const a = document.createElement('a')
        a.href = urls[i]
        a.download = `dmart-carousel-${i + 1}.png`
        a.click()
        // Pequeña pausa para que el navegador procese cada descarga.
        await new Promise((r) => setTimeout(r, 250))
      }
    } catch (err) {
      console.error('[CarouselStudio] export error', err)
      alert('No se pudieron generar las imágenes. Intenta de nuevo.')
    }
    setDownloading(false)
  }

  async function handleSave() {
    if (!onSave) return
    setPreparing(true)
    try {
      const urls = await exportAll()
      if (urls.length !== slides.length) { alert('No se pudieron preparar todas las tarjetas. Intenta de nuevo.'); setPreparing(false); return }
      onSave(slides, urls)
    } catch (err) {
      console.error('[CarouselStudio] save export error', err)
      alert('No se pudo preparar el carousel para guardar. Intenta de nuevo.')
    }
    setPreparing(false)
  }

  return (
    <div className="space-y-5">
      {/* Barra de tarjetas (miniaturas + acciones) */}
      <div className="bg-white rounded-2xl border border-black/[0.06] shadow-soft p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-bold text-ink font-display">Carousel · {slides.length} tarjeta{slides.length === 1 ? '' : 's'}</h2>
          <span className="text-[11px] text-gray-400">Editando la #{active + 1}</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {slides.map((s, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === active ? 'border-accent' : 'border-gray-200 hover:border-gray-300'}`}
              style={{ width: 96, height: 120 }} title={`Tarjeta ${i + 1}`}>
              <div style={{ width: 1080, height: 1350, transform: 'scale(0.0888)', transformOrigin: 'top left' }}>
                <PostCard config={s} />
              </div>
              <span className="absolute top-1 left-1 text-[10px] font-bold text-white bg-black/60 rounded px-1.5 py-0.5 leading-none">{i + 1}</span>
            </button>
          ))}
          <button onClick={addSlide}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-accent hover:text-accent transition-colors"
            style={{ width: 96, height: 120 }} title="Añadir tarjeta">
            <Plus className="h-5 w-5" />
            <span className="text-[10px] font-semibold">Añadir</span>
          </button>
        </div>
        {/* Acciones sobre la tarjeta activa */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button onClick={() => move(-1)} disabled={active === 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            <ChevronLeft className="h-3.5 w-3.5" /> Mover
          </button>
          <button onClick={() => move(1)} disabled={active === slides.length - 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40">
            Mover <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button onClick={duplicateSlide}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50">
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </button>
          <button onClick={deleteSlide} disabled={slides.length <= 1}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-40">
            <Trash2 className="h-3.5 w-3.5" /> Borrar
          </button>
        </div>
      </div>

      {/* Editor del slide activo + vista previa con navegación */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        <PostStudio key={active} embedded value={current} onChange={patchActive} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-500">Vista previa</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setActive((i) => Math.max(0, i - 1))} disabled={active === 0}
                className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
              <span className="text-xs font-semibold text-gray-600">{active + 1} / {slides.length}</span>
              <button onClick={() => setActive((i) => Math.min(slides.length - 1, i + 1))} disabled={active === slides.length - 1}
                className="p-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div style={{ width: 360, height: 450, overflow: 'hidden', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}>
            <div style={{ transform: 'scale(0.33333)', transformOrigin: 'top left' }}>
              <PostCard config={current} />
            </div>
          </div>
          <p className="text-xs text-gray-400">Formato 4:5 (1080×1350 px). Se exporta una imagen por tarjeta.</p>

          <button onClick={downloadAll} disabled={downloading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full bg-accent text-white text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50">
            <Download className="h-4 w-4" />
            {downloading ? 'Generando…' : `Descargar ${slides.length} imágenes`}
          </button>

          {(onSave || onClear) && (
            <div className="grid grid-cols-2 gap-2">
              {onSave && (
                <button onClick={handleSave} disabled={preparing || saving}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50">
                  <Save className="h-4 w-4" />
                  {preparing || saving ? 'Guardando…' : 'Guardar carousel'}
                </button>
              )}
              {onClear && (
                <button onClick={onClear} disabled={preparing || saving}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50">
                  <Trash2 className="h-4 w-4" /> Descartar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nodos a tamaño real (fuera de pantalla) para exportar cada tarjeta */}
      <div style={{ position: 'fixed', left: -100000, top: 0, pointerEvents: 'none' }} aria-hidden>
        {slides.map((s, i) => (
          <div key={i} ref={(el) => { slideRefs.current[i] = el }}><PostCard config={s} /></div>
        ))}
      </div>
    </div>
  )
}
