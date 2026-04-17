import type { Metadata } from 'next'
import { MapPin, Phone, Clock, Building2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import CTABanner from '@/components/sections/CTABanner'
import { CAMPUS_HOURS, STATIC_CAMPUSES } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Nuestros Recintos',
  description:
    "D'Mart Institute tiene recintos en Barranquitas y Vega Alta, Puerto Rico. Encuentra el recinto más cercano a ti y comienza tu educación vocacional.",
}

export default async function RecintosPage() {
  const campuses = STATIC_CAMPUSES

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Puerto Rico</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Nuestros Recintos
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              Dos campus estratégicamente ubicados en Puerto Rico para que accedas a tu educación
              vocacional de manera conveniente.
            </p>
          </div>
        </div>
      </section>

      {/* Campus cards */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className="bg-white rounded-3xl shadow-card border border-gray-100 overflow-hidden group hover:shadow-card-hover transition-shadow"
              >
                {/* Campus header */}
                <div className="bg-gradient-navy px-8 py-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gold/20 rounded-xl flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">Recinto {campus.name}</h2>
                      <p className="text-gray-400 text-sm">{campus.city}, Puerto Rico</p>
                    </div>
                  </div>
                </div>

                {/* Map placeholder */}
                <div className="h-48 bg-gray-100 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100/50" />
                  <MapPin className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-400 text-sm text-center px-4">{campus.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campus.address}, ${campus.city}, PR ${campus.zip}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gold hover:text-gold-dark transition-colors relative z-10"
                  >
                    Ver en Google Maps →
                  </a>
                </div>

                {/* Info */}
                <div className="p-8">
                  <div className="grid grid-cols-1 gap-5">
                    {/* Address */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Dirección</p>
                        <p className="text-gray-700 font-medium">{campus.address}</p>
                        <p className="text-gray-600">{campus.city}, {campus.state} {campus.zip}</p>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Teléfono</p>
                        <a
                          href={`tel:${campus.phone.replace(/\D/g, '')}`}
                          className="text-gold font-bold text-lg hover:text-gold-dark transition-colors"
                        >
                          {campus.phone}
                        </a>
                      </div>
                    </div>

                    {/* Hours */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Horario de Oficina</p>
                        <div className="space-y-1.5">
                          {CAMPUS_HOURS.map((h) => (
                            <div key={h.label} className="flex gap-4 text-sm">
                              <span className="text-gray-500 min-w-[120px]">{h.label}</span>
                              <span className="font-semibold text-navy">{h.hours}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/contactanos"
                      className="flex-1 bg-navy text-white font-bold py-3 px-5 rounded-xl text-center hover:bg-navy-700 transition-colors text-sm"
                    >
                      Solicitar Información
                    </Link>
                    <a
                      href={`tel:${campus.phone.replace(/\D/g, '')}`}
                      className="flex items-center justify-center gap-2 flex-1 border-2 border-gold text-gold font-bold py-3 px-5 rounded-xl hover:bg-gold hover:text-navy transition-all text-sm"
                    >
                      <Phone className="h-4 w-4" />
                      Llamar Ahora
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs by campus */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-navy mb-4">Programas por Recinto</h2>
            <p className="text-gray-600">La mayoría de los programas están disponibles en ambos recintos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold" />
                Barranquitas
              </h3>
              <ul className="space-y-2">
                {[
                  'Cosmetología', 'Barbería y Estilismo', 'Técnica de Uñas', 'Estética y Maquillaje',
                  'Supermaster', 'Enfermería Práctica', 'Administración de Sistemas de Oficina',
                  'Técnico de Electricidad con PLC', 'Técnico de Mecánica Automotriz',
                  'Técnico de Refrigeración y A/C',
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
              <h3 className="text-xl font-bold text-navy mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gold" />
                Vega Alta
              </h3>
              <ul className="space-y-2">
                {[
                  'Cosmetología', 'Barbería y Estilismo', 'Técnica de Uñas', 'Estética y Maquillaje',
                  'Supermaster', 'Enfermería Práctica', 'Administración de Sistemas de Oficina',
                  'Técnico de Electricidad con PLC', 'Técnico de Refrigeración y A/C',
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-4 italic">
                * Mecánica Automotriz disponible solo en Barranquitas.
              </p>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/programas"
              className="inline-flex items-center gap-2 text-navy font-bold hover:text-gold transition-colors"
            >
              Ver todos los programas con detalles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
