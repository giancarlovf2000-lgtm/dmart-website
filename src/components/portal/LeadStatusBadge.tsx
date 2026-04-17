import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/lib/types'

const STATUS_CONFIG: Record<LeadStatus, { label: string; className: string }> = {
  'Nuevo Lead':                              { label: 'Nuevo Lead',           className: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Crítico':                                 { label: 'Crítico',              className: 'bg-red-50 text-red-700 border-red-200' },
  'Contacto Inicial (Pendiente de Respuesta)': { label: 'Contacto Inicial',   className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  'Contacto Establecido':                    { label: 'Contacto Establecido', className: 'bg-teal-50 text-teal-700 border-teal-200' },
  'Cita Programada':                         { label: 'Cita Programada',      className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'No Asistió a la Cita':                    { label: 'No Asistió',           className: 'bg-orange-50 text-orange-700 border-orange-200' },
  'Reagendado':                              { label: 'Reagendado',           className: 'bg-purple-50 text-purple-700 border-purple-200' },
  'En Espera de Documentos':                 { label: 'Esp. Documentos',      className: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Orientado (En Proceso de Matricularse)':  { label: 'Orientado',            className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'Seguimiento a Futuro':                    { label: 'Seg. Futuro',          className: 'bg-slate-50 text-slate-600 border-slate-200' },
  'Matriculado':                             { label: 'Matriculado',          className: 'bg-green-50 text-green-700 border-green-200' },
  'Desinteresado / Rechazado':               { label: 'Desinteresado',        className: 'bg-gray-100 text-gray-500 border-gray-200' },
}

interface LeadStatusBadgeProps {
  status: LeadStatus
  className?: string
}

export default function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-600 border-gray-200' }
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap',
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}

export { STATUS_CONFIG }
