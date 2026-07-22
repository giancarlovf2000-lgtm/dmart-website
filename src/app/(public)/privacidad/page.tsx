import type { Metadata } from 'next'
import Link from 'next/link'
import { ShieldCheck, Ban, MessageSquareOff, HelpCircle, Mail, Phone, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidad · D\'Mart Institute',
  description:
    'Política de Privacidad de D\'Mart Institute, Inc., incluyendo el programa de mensajes SMS: qué datos recopilamos, cómo usamos tu número de teléfono, y nuestro compromiso de no compartir ni vender tu información.',
  alternates: { canonical: 'https://www.dmartpr.net/privacidad' },
}

const EFFECTIVE = '22 de julio de 2026'

export default function PrivacidadPage() {
  return (
    <>
      <section className="bg-gradient-navy py-16 md:py-20">
        <div className="container-custom">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5 mb-5">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span className="text-sm font-semibold text-gold">Privacidad y consentimiento</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white">Política de Privacidad</h1>
          <p className="text-gray-300 mt-3">Vigente desde el {EFFECTIVE} · D&apos;Mart Institute, Inc.</p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom max-w-3xl">
          <div className="content-prose text-gray-700 space-y-8">

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">1. Introducción</h2>
              <p>En D&apos;Mart Institute, Inc. (&quot;D&apos;Mart&quot;, &quot;nosotros&quot;) valoramos tu privacidad. Esta Política de Privacidad explica cómo recopilamos, usamos y protegemos la información personal de estudiantes, prospectos y encargados, incluida la que se maneja a través de nuestras comunicaciones y de nuestro programa de mensajes de texto (SMS).</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">2. Información que recopilamos</h2>
              <p>Podemos recopilar tu <strong>nombre</strong>, <strong>número de teléfono móvil</strong> y <strong>correo electrónico</strong>, así como datos relacionados con tu matrícula o tu solicitud de información. Solo recopilamos la información necesaria para atenderte.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">3. Cómo usamos tu información</h2>
              <p>Usamos tu información para comunicarnos contigo y brindarte servicio, incluyendo: <strong>confirmaciones de matrícula</strong>, notificaciones académicas, <strong>recordatorios de citas y clases</strong>, y respuestas de atención al estudiante. Tu número de teléfono móvil se usa para enviarte estos mensajes por SMS cuando has dado tu consentimiento.</p>
            </div>

            {/* Programa SMS + cláusula de no compartir */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
              <h2 className="text-2xl font-bold text-navy mb-3 flex items-center gap-2"><MessageSquareOff className="h-5 w-5 text-gold" /> 4. Programa de mensajes SMS</h2>
              <p>Al proporcionar voluntariamente tu número de teléfono móvil, aceptas recibir mensajes de texto de D&apos;Mart relacionados con tu matrícula, citas, clases y notificaciones. <strong>Pueden aplicar tarifas de mensajes y datos de tu operador.</strong> La frecuencia de los mensajes puede variar según tu relación con la institución (mensajes recurrentes).</p>

              <div className="mt-4 rounded-xl border-2 border-gold/40 bg-white p-4">
                <p className="flex items-start gap-2 font-semibold text-navy">
                  <Ban className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  No compartimos ni vendemos los números de teléfono ni la información de consentimiento (opt-in) a terceros ni afiliados con fines de marketing.
                </p>
                <p className="text-sm text-gray-500 mt-2 pl-7">
                  <em>Mobile information / phone numbers and SMS opt-in consent will not be shared with or sold to third parties or affiliates for marketing purposes.</em>
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3 flex items-center gap-2"><HelpCircle className="h-5 w-5 text-gold" /> 5. Cómo darte de baja y obtener ayuda</h2>
              <ul className="list-disc list-inside space-y-2">
                <li>Para dejar de recibir mensajes, responde <strong>STOP</strong> (o CANCELAR / BAJA) a cualquier mensaje. Recibirás una confirmación y no te enviaremos más mensajes.</li>
                <li>Para obtener ayuda, responde <strong>HELP</strong> (o AYUDA), o llámanos al <strong>(787) 710-7001</strong>.</li>
              </ul>
              <p className="text-sm text-gray-500 mt-3"><em>Reply STOP to unsubscribe at any time. Reply HELP for help. Message and data rates may apply.</em></p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">6. Retención y seguridad</h2>
              <p>Conservamos tu información solo durante el tiempo necesario para los fines descritos y aplicamos medidas razonables para protegerla contra el acceso no autorizado.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-navy mb-3">7. Contacto</h2>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2 not-prose">
                <p className="font-bold text-navy">D&apos;Mart Institute, Inc.</p>
                <p className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4 text-gold" /> A-16 Degetau Ave, Boneville Terrace, Caguas, PR 00725</p>
                <p className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gold" /> <a href="tel:7877107001" className="hover:text-gold">(787) 710-7001</a></p>
                <p className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-gold" /> <a href="mailto:gvargas@dmartpr.net" className="hover:text-gold">gvargas@dmartpr.net</a></p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Consulta también los <Link href="/terminos-sms" className="font-semibold text-gold hover:underline">Términos del Programa SMS</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
