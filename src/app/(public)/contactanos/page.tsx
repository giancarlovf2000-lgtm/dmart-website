import type { Metadata } from 'next'
import { Phone, MapPin, Clock, Mail } from 'lucide-react'
import LeadForm from '@/components/forms/LeadForm'
import Badge from '@/components/ui/Badge'
import { CAMPUS_HOURS, STATIC_CAMPUSES } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Contáctanos',
  description:
    "Contáctate con D'Mart Institute. Recintos en Barranquitas (787) 857-6929 y Vega Alta (787) 883-8180. Solicita información sobre admisiones y programas.",
}

export default async function ContactanosPage() {
  const campuses = STATIC_CAMPUSES

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Estamos Aquí Para Ti</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Contáctanos
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              ¿Tienes preguntas sobre admisiones, programas o ayuda económica?
              Estamos listos para ayudarte.
            </p>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Campus cards */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-navy mb-6">Nuestros Recintos</h2>
              </div>

              {campuses.map((campus) => (
                <div
                  key={campus.id}
                  className="bg-white rounded-2xl shadow-card border border-gray-100 border-t-4 border-t-gold overflow-hidden"
                >
                  <div className="p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-navy rounded-xl flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-gold" />
                      </div>
                      <h3 className="text-xl font-bold text-navy">Recinto {campus.name}</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Address */}
                      <div className="flex gap-3">
                        <MapPin className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Dirección</p>
                          <p className="text-sm text-gray-700">{campus.address}</p>
                          <p className="text-sm text-gray-700">{campus.city}, PR {campus.zip}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex gap-3">
                        <Phone className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Teléfono</p>
                          <a
                            href={`tel:${campus.phone.replace(/\D/g, '')}`}
                            className="text-sm font-bold text-gold hover:text-gold-dark transition-colors"
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
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Correo</p>
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
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Horario</p>
                          <div className="space-y-0.5">
                            {CAMPUS_HOURS.map((h) => (
                              <p key={h.label} className="text-xs text-gray-600">
                                <span className="font-medium">{h.label}:</span> {h.hours}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Google Maps link */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campus.address}, ${campus.city}, PR ${campus.zip}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-dark transition-colors"
                      >
                        <MapPin className="h-4 w-4" />
                        Abrir en Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lead form */}
            <div className="lg:sticky lg:top-24">
              <LeadForm
                title="Solicita Información"
                subtitle="Completa el formulario y un consejero te llamará en menos de 24 horas."
                source="contactanos-page"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Map embeds placeholder */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <h2 className="text-2xl font-black text-navy mb-8 text-center">Cómo Llegar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {campuses.map((campus) => (
              <div key={campus.id} className="bg-white rounded-2xl overflow-hidden shadow-card border border-gray-100">
                <div className="bg-gradient-navy px-6 py-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gold" />
                  <h3 className="text-white font-bold">Recinto {campus.name}</h3>
                </div>
                {/* Map placeholder — replace with actual embed when ready */}
                <div className="h-64 bg-gray-100 flex flex-col items-center justify-center gap-3">
                  <MapPin className="h-10 w-10 text-gray-300" />
                  <p className="text-gray-400 text-sm text-center px-4">{campus.address}<br />{campus.city}, PR {campus.zip}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${campus.address}, ${campus.city}, PR ${campus.zip}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gold hover:text-gold-dark transition-colors"
                  >
                    Ver en Google Maps →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
