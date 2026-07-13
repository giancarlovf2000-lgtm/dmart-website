import { STATIC_PROGRAMS, PRIVADOS_SABATINOS, STATIC_CAMPUSES } from '@/lib/utils'
import type { PostConfig, PostTemplate } from '@/components/portal/PostStudio'

// Un pedido de apoyo en redes hecho por un supervisor.
export interface SocialItem {
  program: string
  kind: 'regular' | 'privado' | 'otro'
  shift: 'diurno' | 'nocturno' | 'sabatino'
  start_date: string | null
}

export interface PostVariation {
  id: string
  label: string
  config: PostConfig
}

type BgStyle = PostConfig['bg']
type CopyKey = 'matriculas' | 'carrera' | 'cupos' | 'grupo' | 'fecha' | 'info'

function fmtStart(d: string | null): string {
  if (!d) return 'Cupos abiertos'
  const date = new Date(d + 'T00:00:00')
  return `Comienza ${date.toLocaleDateString('es-PR', { day: 'numeric', month: 'short' })}`
}

function sectionLabel(shift: SocialItem['shift']): string {
  if (shift === 'diurno') return 'Sección Diurna'
  if (shift === 'nocturno') return 'Sección Nocturna'
  return 'Curso Sabatino'
}

function shortDesc(text: string | undefined, max = 150): string {
  if (!text) return ''
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

// Genera muchas opciones de post: plantilla × color × enfoque de copy.
export function generateVariations(item: SocialItem, campusName: string): PostVariation[] {
  const isSabatino = item.kind === 'privado' || item.shift === 'sabatino'
  const reg = STATIC_PROGRAMS.find((p) => p.name === item.program)
  const sab = PRIVADOS_SABATINOS.find((s) => s.title === item.program)

  const desc = shortDesc(reg?.description ?? sab?.description)
  const months = reg ? `${reg.duration_months} meses` : null
  const credits = reg ? `${reg.credits} créditos` : null
  const tag = sab?.tag ?? null

  const section = sectionLabel(item.shift)
  const startChip = fmtStart(item.start_date)

  const campus = STATIC_CAMPUSES.find((c) => c.name === campusName)
  const campusPhone = campus?.phone ?? STATIC_CAMPUSES[0].phone

  const sectionChips = isSabatino ? (tag ? [tag] : []) : [section]
  const infoChips = (isSabatino ? [] : [months, credits]).filter(Boolean) as string[]

  const base: Omit<PostConfig, 'template' | 'bg' | 'logo' | 'kicker' | 'body' | 'chips' | 'cta' | 'type'> = {
    photo: null,
    title: item.program,
    reqs: [],
    campusPhone,
    handle: '@dmartinstitute',
    website: 'dmartpr.net',
    logoScale: 1,
  }

  // Presets de copy (kicker/cuerpo/chips/CTA/tipo).
  function copy(key: CopyKey): Pick<PostConfig, 'type' | 'kicker' | 'body' | 'chips' | 'cta'> {
    switch (key) {
      case 'matriculas':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Matrículas Abiertas', body: desc, chips: [...sectionChips, startChip, ...infoChips.slice(0, 1)], cta: 'Matricúlate ya' }
      case 'carrera':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: section, body: isSabatino ? 'Aprende una destreza nueva.' : 'Tu nueva carrera empieza aquí.', chips: [startChip, ...infoChips.slice(0, 1)].filter(Boolean), cta: 'Inscríbete hoy' }
      case 'cupos':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Cupos Limitados', body: desc, chips: [...sectionChips, startChip], cta: 'Reserva tu cupo' }
      case 'grupo':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Nuevo Grupo', body: desc, chips: [...sectionChips, startChip], cta: 'Solicita información' }
      case 'info':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Orientación', body: desc, chips: [...sectionChips, startChip], cta: 'Más información' }
      case 'fecha':
        return { type: 'evento', kicker: '¡Nuevo Comienzo!', body: `${section} · ${startChip}`, chips: [startChip], cta: 'Aparta tu cupo' }
    }
  }

  const logoFor = (bg: BgStyle) => (bg === 'claro' ? 'color' : 'blanco') as PostConfig['logo']

  // Recetas curadas: cada plantilla aparece con distintos colores/copys.
  const recipes: { template: PostTemplate; bg: BgStyle; copy: CopyKey; label: string }[] = [
    { template: 'clasico',   bg: 'degradado', copy: 'matriculas', label: 'Clásico · Degradado' },
    { template: 'clasico',   bg: 'rojo',      copy: 'carrera',    label: 'Clásico · Rojo' },
    { template: 'clasico',   bg: 'negro',     copy: 'fecha',      label: 'Clásico · Fecha' },
    { template: 'centrado',  bg: 'negro',     copy: 'cupos',      label: 'Centrado · Negro' },
    { template: 'centrado',  bg: 'claro',     copy: 'grupo',      label: 'Centrado · Claro' },
    { template: 'centrado',  bg: 'rojo',      copy: 'fecha',      label: 'Centrado · Fecha' },
    { template: 'banda',     bg: 'degradado', copy: 'matriculas', label: 'Banda · Degradado' },
    { template: 'banda',     bg: 'negro',     copy: 'cupos',      label: 'Banda · Negro' },
    { template: 'editorial', bg: 'negro',     copy: 'fecha',      label: 'Editorial · Fecha' },
    { template: 'editorial', bg: 'rojo',      copy: 'carrera',    label: 'Editorial · Rojo' },
    { template: 'minimal',   bg: 'claro',     copy: 'grupo',      label: 'Minimal · Claro' },
    { template: 'minimal',   bg: 'degradado', copy: 'info',       label: 'Minimal · Oscuro' },
    { template: 'marco',     bg: 'degradado', copy: 'matriculas', label: 'Marco · Degradado' },
    { template: 'marco',     bg: 'rojo',      copy: 'cupos',      label: 'Marco · Rojo' },
    { template: 'lateral',   bg: 'negro',     copy: 'carrera',    label: 'Lateral · Negro' },
    { template: 'lateral',   bg: 'claro',     copy: 'info',       label: 'Lateral · Claro' },
  ]

  return recipes.map((r, i) => ({
    id: `v${i + 1}`,
    label: r.label,
    config: { ...base, template: r.template, bg: r.bg, logo: logoFor(r.bg), ...copy(r.copy) } as PostConfig,
  }))
}

// Requisitos de admisión (duplicado ligero para evitar dependencia circular con PostStudio).
const CAROUSEL_REQS = [
  '16 años o más (programas de salud: 18 años o más)',
  'Diploma o Transcripción de Crédito con 4to año aprobado',
  'Certificado de Vacunas (PVAC-3), si es menor de 21 años',
  'Cuota de Admisión',
]

// Deriva un hilo de tarjetas (carousel) a partir de una config base: portada →
// descripción → detalles → requisitos → cierre. Todas comparten fondo/logo/marca.
export function buildCarousel(base: PostConfig): PostConfig[] {
  const title = base.title || "D'Mart Institute"
  const hasBody = !!base.body?.trim()
  const chips = base.chips ?? []
  const slides: PostConfig[] = []

  // 1. Portada / gancho
  slides.push({
    ...base, template: 'centrado', type: 'evento',
    kicker: base.kicker || 'Nuevo Grupo', title, body: '', reqs: [],
    chips: chips.slice(0, 1), cta: 'Desliza →',
  })

  // 2. Descripción (si la hay)
  if (hasBody) {
    slides.push({
      ...base, template: 'clasico', type: 'programa',
      kicker: '¿De qué se trata?', title, body: base.body, reqs: [],
      chips: [], cta: '',
    })
  }

  // 3. Detalles (chips)
  if (chips.length) {
    slides.push({
      ...base, template: 'lateral', type: 'programa',
      kicker: 'Detalles', title, body: '', reqs: [],
      chips, cta: '',
    })
  }

  // 4. Requisitos de admisión
  slides.push({
    ...base, template: 'clasico', type: 'requisitos',
    kicker: 'Requisitos de Admisión', title: 'Requisitos', body: '', reqs: CAROUSEL_REQS,
    chips: [], cta: '',
  })

  // 5. Cierre / CTA
  slides.push({
    ...base, template: 'centrado', type: 'evento',
    kicker: '¡Te esperamos!', title, body: 'Escríbenos o llámanos para más información.', reqs: [],
    chips: [], cta: base.cta && base.cta !== 'Desliza →' ? base.cta : 'Matricúlate ya',
  })

  return slides
}
