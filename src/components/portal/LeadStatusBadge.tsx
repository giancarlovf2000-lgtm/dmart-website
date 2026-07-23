import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/lib/types'

// Los estados de lead son la ÚNICA capa con color del portal (todo lo demás es
// monocromo). Paleta en tinte suave/pastel iOS con lógica de embudo:
// frío → cálido → verde=ganado / gris=perdido / rojo=urgente.
// Fuente única: el dashboard reusa `chipBg`/`icon` para las tarjetas de conteo.
interface StatusStyle { label: string; className: string; chipBg: string; icon: string }

const STATUS_CONFIG: Record<LeadStatus, StatusStyle> = {
  'Nuevo Lead':                                { label: 'Nuevo Lead',            className: 'bg-blue-50 text-blue-700',       chipBg: 'bg-blue-50',    icon: 'text-blue-600' },
  'Crítico':                                   { label: 'Crítico',               className: 'bg-accent-soft text-accent',     chipBg: 'bg-accent-soft', icon: 'text-accent' },
  'Contacto Inicial (Pendiente de Respuesta)': { label: 'Contacto Inicial',     className: 'bg-sky-50 text-sky-700',         chipBg: 'bg-sky-50',     icon: 'text-sky-600' },
  'Contacto Establecido':                      { label: 'Contacto Establecido', className: 'bg-cyan-50 text-cyan-700',        chipBg: 'bg-cyan-50',    icon: 'text-cyan-600' },
  'Cita Programada':                           { label: 'Cita Programada',      className: 'bg-indigo-50 text-indigo-700',    chipBg: 'bg-indigo-50',  icon: 'text-indigo-600' },
  'No Asistió a la Cita':                      { label: 'No Asistió',           className: 'bg-orange-50 text-orange-700',    chipBg: 'bg-orange-50',  icon: 'text-orange-600' },
  'Reagendado':                                { label: 'Reagendado',           className: 'bg-violet-50 text-violet-700',    chipBg: 'bg-violet-50',  icon: 'text-violet-600' },
  'En Espera de Documentos':                   { label: 'Esp. Documentos',      className: 'bg-amber-50 text-amber-700',      chipBg: 'bg-amber-50',   icon: 'text-amber-600' },
  'Orientado (En Proceso de Matricularse)':    { label: 'Orientado',            className: 'bg-teal-50 text-teal-700',        chipBg: 'bg-teal-50',    icon: 'text-teal-600' },
  'Seguimiento a Futuro':                      { label: 'Seg. Futuro',          className: 'bg-slate-100 text-slate-600',     chipBg: 'bg-slate-100',  icon: 'text-slate-500' },
  'Matriculado':                               { label: 'Matriculado',          className: 'bg-green-50 text-green-700',      chipBg: 'bg-green-50',   icon: 'text-green-600' },
  'Desinteresado / Rechazado':                 { label: 'Desinteresado',        className: 'bg-surface text-ink-muted/70',    chipBg: 'bg-surface',    icon: 'text-ink-muted' },
  'Graduado':                                  { label: 'Graduado',             className: 'bg-emerald-50 text-emerald-700',  chipBg: 'bg-emerald-50', icon: 'text-emerald-600' },
  'Graduado con Reválida':                     { label: 'Revalidado',           className: 'bg-emerald-100 text-emerald-800', chipBg: 'bg-emerald-100', icon: 'text-emerald-700' },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
  className?: string
}

export default function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-surface text-ink-muted' }
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
