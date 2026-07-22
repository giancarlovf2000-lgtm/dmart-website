import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageSquare, Ban, Repeat, DollarSign, HandHelping, Mail, Phone, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Términos del Programa SMS · D\'Mart Institute',
  description:
    'Términos y Condiciones del programa de mensajes de texto (SMS) de D\'Mart Institute, Inc.: tipos de mensaje, frecuencia, tarifas, cómo darte de baja (STOP) y obtener ayuda (HELP).',
  alternates: { canonical: 'https://www.dmartpr.net/terminos-sms' },
}

const EFFECTIVE = '22 de julio de 2026'

export default function TerminosSmsPage() {
  return (
    <>
      <section className="bg-gradient-navy py-16 md:py-20">
        <div className="container-custom">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 mb-5">
            <MessageSquare className="h-4 w-4 text-gold" />
            <span className="text-sm font-semibold text-gold">Programa de mensajes SMS</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white">Términos del Programa SMS</h1>
          <p className="text-gray-300 mt-3">Vigente desde el {EFFECTIVE} · D&apos;Mart Institute, Inc.</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <div className="content-prose text-gray-700 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">1. Descripción del programa</h2>
              <p>D&apos;Mart Institute, Inc. (&quot;D&apos;Mart&quot;) envía mensajes de texto (SMS) a estudiantes, prospectos y encargados sobre <strong>confirmaciones de matrícula, recordatorios de citas y clases, notificaciones académicas y respuestas de atención al estudiante</strong>.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">2. Consentimiento (Opt-In)</h2>
              <p>Aceptas recibir mensajes SMS al proporcionar voluntariamente tu número de teléfono móvil durante tu matrícula o solicitud de información. <strong>Tu consentimiento no es condición para comprar ningún bien o servicio.</strong></p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3 flex items-center gap-2"><Repeat className="h-5 w-5 text-gold" /> 3. Frecuencia de los mensajes</h2>
              <p>La frecuencia de los mensajes puede variar según tu relación con la institución. Se trata de <strong>mensajes recurrentes</strong> relacionados con tu matrícula, citas y notificaciones.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3 flex items-center gap-2"><DollarSign className="h-5 w-5 text-gold" /> 4. Tarifas</h2>
              <p><strong>Pueden aplicar tarifas de mensajes y datos</strong> de tu operador. D&apos;Mart no cobra por los mensajes.</p>
              <p className="text-sm text-gray-500 mt-2"><em>Message and data rates may apply.</em></p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-2xl font-bold text-navy mb-3 flex items-center gap-2"><HandHelping className="h-5 w-5 text-gold" /> 5. Cómo darte de baja y obtener ayuda</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Responde <strong>STOP</strong> (o CANCELAR / BAJA) a cualquier mensaje para cancelar el servicio. Recibirás un mensaje de confirmación y no te enviaremos más mensajes.</li>
                <li>Responde <strong>HELP</strong> (o AYUDA), o llama al <strong>(787) 710-7001</strong>, para obtener ayuda.</li>
              </ul>
              <p className="text-sm text-gray-500 mt-3"><em>Reply STOP to cancel. Reply HELP for help. Message and data rates may apply.</em></p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">6. Operadores</h2>
              <p>Los operadores móviles no son responsables por mensajes retrasados o no entregados.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3 flex items-center gap-2"><Ban className="h-5 w-5 text-gold" /> 7. Privacidad</h2>
              <p>El manejo de tu información se rige por nuestra <Link href="/privacidad" className="font-semibold text-gold hover:underline">Política de Privacidad</Link>. <strong>No compartimos ni vendemos los números de teléfono ni la información de consentimiento (opt-in) a terceros ni afiliados con fines de marketing.</strong></p>
              <p className="text-sm text-gray-500 mt-2"><em>Mobile information / phone numbers and SMS opt-in consent will not be shared with or sold to third parties or affiliates for marketing purposes.</em></p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">8. Contacto</h2>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2 not-prose">
                <p className="font-bold text-navy">D&apos;Mart Institute, Inc.</p>
                <p className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4 text-gold" /> A-16 Degetau Ave, Boneville Terrace, Caguas, PR 00725</p>
                <p className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gold" /> <a href="tel:7877107001" className="hover:text-gold">(787) 710-7001</a></p>
                <p className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-gold" /> <a href="mailto:gvargas@dmartpr.net" className="hover:text-gold">gvargas@dmartpr.net</a></p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
