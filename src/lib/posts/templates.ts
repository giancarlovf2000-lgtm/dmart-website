import { STATIC_PROGRAMS, PRIVADOS_SABATINOS, STATIC_CAMPUSES } from '@/lib/utils'
import type { PostConfig } from '@/components/portal/PostStudio'

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

// Genera varias opciones de post (mismas datos, distinto estilo/enfoque de copy).
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

  const base: PostConfig = {
    type: isSabatino ? 'sabatino' : 'programa',
    bg: 'degradado',
    photo: null,
    kicker: '',
    title: item.program,
    body: desc,
    chips: [],
    reqs: [],
    cta: 'Matricúlate ya',
    campusPhone,
    handle: '@dmartinstitute',
    website: 'dmartpr.net',
    logo: 'blanco',
  }

  // Chips comunes (sección + comienzo) y extras según tipo.
  const sectionChips = isSabatino ? (tag ? [tag] : []) : [section]
  const infoChips = isSabatino ? [] : [months, credits].filter(Boolean) as string[]

  const variations: PostVariation[] = [
    {
      id: 'v1',
      label: 'Matrículas Abiertas',
      config: {
        ...base, bg: 'degradado', logo: 'blanco',
        kicker: 'Matrículas Abiertas',
        chips: [...sectionChips, startChip, ...infoChips.slice(0, 1)],
        cta: 'Matricúlate ya',
      },
    },
    {
      id: 'v2',
      label: 'Nueva Carrera',
      config: {
        ...base, bg: 'rojo', logo: 'blanco',
        kicker: section,
        body: 'Tu nueva carrera empieza aquí.',
        chips: [startChip, ...infoChips.slice(0, 1)].filter(Boolean),
        cta: 'Inscríbete hoy',
      },
    },
    {
      id: 'v3',
      label: 'Cupos Limitados',
      config: {
        ...base, bg: 'negro', logo: 'blanco',
        kicker: 'Cupos Limitados',
        body: desc,
        chips: [...sectionChips, startChip],
        cta: 'Reserva tu cupo',
      },
    },
    {
      id: 'v4',
      label: 'Estilo Claro',
      config: {
        ...base, bg: 'claro', logo: 'color',
        kicker: 'Nuevo Grupo',
        body: desc,
        chips: [...sectionChips, startChip],
        cta: 'Solicita información',
      },
    },
    {
      id: 'v5',
      label: 'Enfoque en la Fecha',
      config: {
        ...base, type: 'evento', bg: 'degradado', logo: 'blanco',
        kicker: '¡Nuevo Comienzo!',
        title: item.program,
        body: `${section} · ${startChip}`,
        chips: [startChip],
        cta: 'Aparta tu cupo',
      },
    },
  ]

  return variations
}
