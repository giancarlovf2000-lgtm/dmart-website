import type { Metadata } from 'next'
import { MessageCircle, Phone } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import Accordion from '@/components/ui/Accordion'
import CTABanner from '@/components/sections/CTABanner'
import { FAQ_DATA } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Preguntas Frecuentes',
  description:
    "Respuestas a las preguntas más comunes sobre admisiones, programas, ayuda económica, horarios y más en D'Mart Institute.",
}

const faqCategories = [
  {
    label: 'Admisiones y Requisitos',
    ids: [1, 8],
  },
  {
    label: 'Programas y Horarios',
    ids: [3, 4, 6, 9],
  },
  {
    label: 'Ayuda Económica',
    ids: [2],
  },
  {
    label: 'Institución',
    ids: [5, 7, 10],
  },
]

export default function PreguntasFrecuentesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Centro de Ayuda</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Preguntas Frecuentes
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              Encuentra respuestas a las preguntas más comunes sobre admisiones, programas,
              ayuda económica y servicios de D'Mart Institute.
            </p>
          </div>
        </div>
      </section>

      {/* All FAQ */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto">
            {faqCategories.map((cat) => {
              const catItems = FAQ_DATA.filter((item) => cat.ids.includes(item.id))
              if (catItems.length === 0) return null
              return (
                <div key={cat.label} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-gold rounded-full" />
                    <h2 className="text-xl font-black text-navy">{cat.label}</h2>
                  </div>
                  <Accordion items={catItems} allowMultiple />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Still have questions */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <MessageCircle className="h-8 w-8 text-gold" />
            </div>
            <h2 className="text-3xl font-black text-navy mb-4">
              ¿No Encontraste Tu Respuesta?
            </h2>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Nuestro equipo de consejeros está listo para responder todas tus preguntas
              de manera personalizada. Llámanos o visítanos en cualquiera de nuestros recintos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contactanos"
                className="flex items-center justify-center gap-2 bg-navy text-white font-bold px-8 py-3 rounded-xl hover:bg-navy-700 transition-colors"
              >
                Enviar Mensaje
              </Link>
              <a
                href="tel:7878576929"
                className="flex items-center justify-center gap-2 border-2 border-gold text-gold font-bold px-8 py-3 rounded-xl hover:bg-gold hover:text-navy transition-all"
              >
                <Phone className="h-4 w-4" />
                Llamar Ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
