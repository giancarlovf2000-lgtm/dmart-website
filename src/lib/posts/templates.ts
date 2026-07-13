import { STATIC_PROGRAMS, PRIVADOS_SABATINOS, STATIC_CAMPUSES, STATIC_CATEGORIES } from '@/lib/utils'
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
type CopyKey = 'matriculas' | 'carrera' | 'cupos' | 'grupo' | 'fecha' | 'info' | 'requisitos'

const RED = '#D40000'
const DEFAULT_TOP_LABELS = ['Educa', 'Crece', 'Transfórmate']

// Requisitos de admisión (duplicado ligero para evitar dependencia circular con PostStudio).
const CAROUSEL_REQS = [
  '16 años o más (programas de salud: 18 años o más)',
  'Diploma o Transcripción de Crédito con 4to año aprobado',
  'Certificado de Vacunas (PVAC-3), si es menor de 21 años',
  'Cuota de Admisión',
]

// Icono lucide temático por slug de programa (sobreescribe el de categoría).
const SLUG_ICON: Record<string, string> = {
  'cosmetologia': 'Sparkles',
  'barberia-y-estilismo': 'Scissors',
  'tecnica-de-unas': 'Hand',
  'estetica-y-maquillaje': 'Sparkles',
  'supermaster': 'Crown',
  'enfermeria-practica': 'HeartPulse',
  'administracion-de-sistemas-de-oficina': 'Monitor',
  'tecnico-de-electricidad': 'Zap',
  'tecnico-de-mecanica-automotriz': 'Wrench',
  'tecnico-de-refrigeracion': 'Snowflake',
}

// tag de sabatino → id de categoría (para heredar color).
const TAG_CATEGORY: Record<string, string> = {
  'Belleza': 'belleza', 'Salud': 'salud', 'Comercial': 'comercial', 'Técnico': 'tecnico',
  'Gastronomía': 'belleza', 'Arte': 'belleza', 'Comunicación': 'comercial',
}

// Color de acento (por área) + icono temático de un programa/sabatino por su nombre.
export function accentIconFor(programName: string): { accent: string; icon: string } {
  const reg = STATIC_PROGRAMS.find((p) => p.name === programName)
  if (reg) {
    const cat = STATIC_CATEGORIES.find((c) => c.id === reg.category_id)
    return { accent: cat?.color ?? RED, icon: SLUG_ICON[reg.slug] ?? cat?.icon ?? 'GraduationCap' }
  }
  const sab = PRIVADOS_SABATINOS.find((s) => s.title === programName)
  if (sab) {
    const cat = STATIC_CATEGORIES.find((c) => c.id === (TAG_CATEGORY[sab.tag] ?? 'belleza'))
    return { accent: cat?.color ?? RED, icon: sab.icon ?? cat?.icon ?? 'GraduationCap' }
  }
  return { accent: RED, icon: 'GraduationCap' }
}

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

// Genera muchas opciones de post: plantilla × color × enfoque de copy.
export function generateVariations(item: SocialItem, campusName: string): PostVariation[] {
  const isSabatino = item.kind === 'privado' || item.shift === 'sabatino'
  const reg = STATIC_PROGRAMS.find((p) => p.name === item.program)
  const sab = PRIVADOS_SABATINOS.find((s) => s.title === item.program)

  const desc = reg?.description ?? sab?.description ?? ''
  const months = reg ? `${reg.duration_months} meses` : null
  const credits = reg ? `${reg.credits} créditos` : null
  const hours = reg ? `${reg.hours} horas` : null
  const tag = sab?.tag ?? null

  const section = sectionLabel(item.shift)
  const startChip = fmtStart(item.start_date)
  const { accent, icon } = accentIconFor(item.program)

  const campus = STATIC_CAMPUSES.find((c) => c.name === campusName)
  const campusPhone = campus?.phone ?? STATIC_CAMPUSES[0].phone

  const sectionChips = isSabatino ? (tag ? [tag] : []) : [section]
  const infoChips = (isSabatino ? [] : [months, credits, hours]).filter(Boolean) as string[]

  const base: Omit<PostConfig, 'template' | 'bg' | 'logo' | 'kicker' | 'body' | 'chips' | 'cta' | 'type' | 'reqs'> = {
    photo: null,
    title: item.program,
    campusPhone,
    handle: '@dmartinstitute',
    website: 'dmartpr.net',
    logoScale: 1,
    accent, icon,
    topLabels: DEFAULT_TOP_LABELS,
  }

  // Presets de copy (kicker/cuerpo/chips/CTA/tipo). Menos repetitivos: CTAs y kickers variados.
  function copy(key: CopyKey): Pick<PostConfig, 'type' | 'kicker' | 'body' | 'chips' | 'cta'> {
    switch (key) {
      case 'matriculas':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Matrículas Abiertas', body: desc, chips: [...infoChips.slice(0, 2), ...sectionChips], cta: 'Matricúlate ya' }
      case 'carrera':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: section, body: isSabatino ? 'Aprende una **destreza** que transforma tu vida.' : 'Tu nueva **carrera** empieza aquí.', chips: [startChip, ...infoChips.slice(0, 1)].filter(Boolean), cta: 'Inscríbete hoy' }
      case 'cupos':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Cupos Limitados', body: desc, chips: [...sectionChips, startChip], cta: 'Reserva tu cupo' }
      case 'grupo':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: '¿Listo para transformar tu futuro?', body: desc, chips: [...sectionChips, startChip], cta: 'Solicita información' }
      case 'info':
        return { type: isSabatino ? 'sabatino' : 'programa', kicker: 'Orientación', body: desc, chips: [...infoChips.slice(0, 2), ...sectionChips], cta: 'Más información' }
      case 'fecha':
        return { type: 'evento', kicker: '¡Nuevo Comienzo!', body: `Empieza tu formación en **${item.program}**.`, chips: [section, startChip], cta: 'Aparta tu cupo' }
      case 'requisitos':
        return { type: 'requisitos', kicker: 'Requisitos de Admisión', body: '', chips: [], cta: 'Solicita información' }
    }
  }

  const logoFor = (bg: BgStyle) => (bg === 'claro' ? 'color' : 'blanco') as PostConfig['logo']

  // Recetas curadas con el set premium: plantilla × color × copy.
  const recipes: { template: PostTemplate; bg: BgStyle; copy: CopyKey; label: string }[] = [
    { template: 'titular',   bg: 'degradado', copy: 'matriculas', label: 'Titular · Impacto' },
    { template: 'titular',   bg: 'negro',     copy: 'carrera',    label: 'Titular · Negro' },
    { template: 'enfoque',   bg: 'degradado', copy: 'info',       label: 'Enfoque · Info' },
    { template: 'enfoque',   bg: 'negro',     copy: 'cupos',      label: 'Enfoque · Cupos' },
    { template: 'enfoque',   bg: 'claro',     copy: 'matriculas', label: 'Enfoque · Claro' },
    { template: 'pregunta',  bg: 'degradado', copy: 'grupo',      label: 'Pregunta · Gancho' },
    { template: 'pregunta',  bg: 'rojo',      copy: 'fecha',      label: 'Pregunta · Rojo' },
    { template: 'destacado', bg: 'degradado', copy: 'carrera',    label: 'Destacado · CTA' },
    { template: 'destacado', bg: 'negro',     copy: 'matriculas', label: 'Destacado · Negro' },
    { template: 'lista',     bg: 'degradado', copy: 'requisitos', label: 'Lista · Requisitos' },
    { template: 'titular',   bg: 'claro',     copy: 'grupo',      label: 'Titular · Claro' },
    { template: 'enfoque',   bg: 'degradado', copy: 'fecha',      label: 'Enfoque · Fecha' },
  ]

  return recipes.map((r, i) => {
    const cp = copy(r.copy)
    return {
      id: `v${i + 1}`,
      label: r.label,
      config: {
        ...base, template: r.template, bg: r.bg, logo: logoFor(r.bg), ...cp,
        reqs: cp.type === 'requisitos' ? CAROUSEL_REQS : [],
      } as PostConfig,
    }
  })
}

// Deriva un hilo de tarjetas (carousel) a partir de una config base: portada →
// descripción → detalles → requisitos → cierre. Todas comparten fondo/acento/icono/marca.
export function buildCarousel(base: PostConfig): PostConfig[] {
  const title = base.title || "D'Mart Institute"
  const hasBody = !!base.body?.trim()
  const chips = base.chips ?? []
  const slides: PostConfig[] = []

  // 1. Portada / gancho
  slides.push({
    ...base, template: 'titular', type: 'evento',
    kicker: base.kicker || 'Matrículas Abiertas', title, body: '', reqs: [],
    chips: chips.slice(0, 2), cta: 'Desliza →',
  })

  // 2. Descripción (si la hay)
  if (hasBody) {
    slides.push({
      ...base, template: 'enfoque', type: 'programa',
      kicker: '¿De qué se trata?', title, body: base.body, reqs: [],
      chips: [], cta: '',
    })
  }

  // 3. Detalles (chips → stat cards)
  if (chips.length) {
    slides.push({
      ...base, template: 'enfoque', type: 'programa',
      kicker: 'Detalles del programa', title, body: '', reqs: [],
      chips, cta: '',
    })
  }

  // 4. Requisitos de admisión
  slides.push({
    ...base, template: 'lista', type: 'requisitos',
    kicker: 'Requisitos de Admisión', title: 'Requisitos', body: '', reqs: CAROUSEL_REQS,
    chips: [], cta: '',
  })

  // 5. Cierre / CTA
  slides.push({
    ...base, template: 'destacado', type: 'evento',
    kicker: '¡Te esperamos!', title, body: 'Escríbenos por DM o llámanos y da el primer paso.', reqs: [],
    chips: [], cta: base.cta && base.cta !== 'Desliza →' ? base.cta : 'Matricúlate ya',
  })

  return slides
}
