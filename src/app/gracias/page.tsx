import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Phone, ArrowRight, Clock, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Gracias — Información Recibida',
  description: 'Tu solicitud de información ha sido recibida. Un consejero de D\'Mart Institute te contactará pronto.',
  robots: { index: false, follow: false },
}

export default function GraciasPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center py-16 md:py-24">
        <div className="container-custom max-w-2xl">
          <div className="bg-white rounded-3xl shadow-card border border-gray-100 p-8 md:p-12 text-center">
            {/* Success icon */}
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>

            {/* Heading */}
            <h1 className="text-3xl md:text-4xl font-black text-navy mb-3">
              ¡Recibimos Tu Información!
            </h1>
            <div className="w-16 h-1 bg-gold rounded-full mx-auto mb-5" />

            {/* Message */}
            <p className="text-gray-600 text-lg leading-relaxed mb-4">
              Gracias por tu interés en D'Mart Institute. Tu solicitud ha sido enviada exitosamente.
            </p>
            <p className="text-gray-500 leading-relaxed mb-10">
              Uno de nuestros consejeros de admisiones se comunicará contigo
              <strong className="text-navy"> dentro de las próximas 24 horas</strong> para
              brindarte toda la información que necesitas sobre nuestros programas.
            </p>

            {/* What's next */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-navy mb-4 text-center">¿Qué pasa ahora?</h3>
              <div className="space-y-3">
                {[
                  'Un consejero revisará tu solicitud',
                  'Te llamarán al número que proporcionaste',
                  'Recibirás información sobre el programa de tu interés',
                  'Programaremos una visita al recinto si deseas',
                ].map((step, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold-dark text-xs font-black">{i + 1}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <a
                href="tel:7878576929"
                className="flex items-center gap-3 p-4 rounded-xl bg-navy/5 border border-navy/10 hover:bg-navy/10 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Barranquitas</p>
                  <p className="font-bold text-navy text-sm">(787) 857-6929</p>
                </div>
              </a>
              <a
                href="tel:7878838180"
                className="flex items-center gap-3 p-4 rounded-xl bg-navy/5 border border-navy/10 hover:bg-navy/10 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">Vega Alta</p>
                  <p className="font-bold text-navy text-sm">(787) 883-8180</p>
                </div>
              </a>
            </div>

            {/* Office hours reminder */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-8">
              <Clock className="h-4 w-4" />
              <span>Lun–Jue 8am–10pm · Vie 8am–5pm · Sáb 8am–12pm</span>
            </div>

            {/* Navigation */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 bg-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-navy-700 transition-colors text-sm"
              >
                Regresar al Inicio
              </Link>
              <Link
                href="/programas"
                className="flex items-center justify-center gap-2 border-2 border-gold text-gold font-bold px-6 py-3 rounded-xl hover:bg-gold hover:text-navy transition-all text-sm"
              >
                Explorar Programas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Campus reminder */}
          <div className="mt-6 text-center text-sm text-gray-400">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>Barranquitas & Vega Alta, Puerto Rico</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
