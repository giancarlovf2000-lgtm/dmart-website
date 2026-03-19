import { MapPin, Phone, Clock, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CAMPUS_HOURS } from '@/lib/utils'
import type { Campus } from '@/lib/types'

interface CampusCardProps {
  campus: Campus
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export default function CampusCard({ campus, variant = 'default', className }: CampusCardProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-3', className)}>
        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MapPin className="h-4 w-4 text-gold" />
        </div>
        <div>
          <p className="font-semibold text-navy text-sm">{campus.name}</p>
          <p className="text-xs text-gray-500">{campus.address}</p>
          <p className="text-xs text-gray-500">{campus.city}, {campus.state} {campus.zip}</p>
          <a
            href={`tel:${campus.phone.replace(/\D/g, '')}`}
            className="text-xs text-gold font-semibold hover:text-gold-dark mt-0.5 block"
          >
            {campus.phone}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'card-base p-6 md:p-8',
        'border-t-4 border-t-gold',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-navy flex items-center justify-center flex-shrink-0">
          <MapPin className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy">Recinto {campus.name}</h3>
          <p className="text-sm text-gray-500">{campus.city}, Puerto Rico</p>
        </div>
      </div>

      {/* Info rows */}
      <div className="space-y-4">
        {/* Address */}
        <div className="flex gap-3">
          <MapPin className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-0.5">Dirección</p>
            <p className="text-sm text-gray-600">{campus.address}</p>
            <p className="text-sm text-gray-600">
              {campus.city}, {campus.state} {campus.zip}
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex gap-3">
          <Phone className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-0.5">Teléfono</p>
            <a
              href={`tel:${campus.phone.replace(/\D/g, '')}`}
              className="text-sm text-gold font-semibold hover:text-gold-dark transition-colors"
            >
              {campus.phone}
            </a>
          </div>
        </div>

        {/* Email */}
        {campus.email && (
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-0.5">Correo</p>
              <a
                href={`mailto:${campus.email}`}
                className="text-sm text-gold font-semibold hover:text-gold-dark transition-colors break-all"
              >
                {campus.email}
              </a>
            </div>
          </div>
        )}

        {/* Hours */}
        <div className="flex gap-3">
          <Clock className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Horario de Oficina</p>
            <div className="space-y-1">
              {CAMPUS_HOURS.map((h) => (
                <div key={h.label} className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500 min-w-[110px]">{h.label}</span>
                  <span className="font-medium text-navy">{h.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campus.address}, ${campus.city}, PR ${campus.zip}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-dark transition-colors"
        >
          <MapPin className="h-4 w-4" />
          Ver en Google Maps
        </a>
      </div>
    </div>
  )
}
