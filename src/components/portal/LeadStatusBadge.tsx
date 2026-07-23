import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/lib/types'

// Casi monocromo: rojo SOLO para urgente; "sólido" (ink) para logrado/matriculado;
// neutro gris para en-proceso; muted para perdido.
const NEUTRAL = 'bg-surface text-ink-muted'
const URGENT = 'bg-accent-soft text-accent'
const SOLID = 'bg-ink/[0.06] text-ink'
const MUTED = 'bg-surface text-ink-muted/60'

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  'Nuevo Lead':                                { label: 'Nuevo Lead',           className: SOLID },
  'Crítico':                                   { label: 'Crítico',              className: URGENT },
  'Contacto Inicial (Pendiente de Respuesta)': { label: 'Contacto Inicial',    className: NEUTRAL },
  'Contacto Establecido':                      { label: 'Contacto Establecido', className: NEUTRAL },
  'Cita Programada':                           { label: 'Cita Programada',      className: NEUTRAL },
  'No Asistió a la Cita':                      { label: 'No Asistió',           className: URGENT },
  'Reagendado':                                { label: 'Reagendado',           className: NEUTRAL },
  'En Espera de Documentos':                   { label: 'Esp. Documentos',      className: NEUTRAL },
  'Orientado (En Proceso de Matricularse)':    { label: 'Orientado',            className: NEUTRAL },
  'Seguimiento a Futuro':                      { label: 'Seg. Futuro',          className: NEUTRAL },
  'Matriculado':                               { label: 'Matriculado',          className: SOLID },
  'Desinteresado / Rechazado':                 { label: 'Desinteresado',        className: MUTED },
  'Graduado':                                  { label: 'Graduado',             className: SOLID },
  'Graduado con Reválida':                     { label: 'Revalidado',           className: SOLID },
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
