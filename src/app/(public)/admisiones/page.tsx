import type { Metadata } from 'next'
import { CheckCircle, FileText, DollarSign, Users, ArrowRight, Phone } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import LeadForm from '@/components/forms/LeadForm'

export const metadata: Metadata = {
  title: 'Admisiones',
  description:
    "Inicia tu proceso de admisión en D'Mart Institute. Conoce los requisitos, pasos para matricularte y opciones de ayuda económica disponibles. Recintos en Barranquitas y Vega Alta.",
}

const steps = [
  {
    number: 1,
    title: 'Solicita Información',
    desc: 'Completa nuestro formulario en línea o llama a cualquiera de nuestros recintos. Un consejero de admisiones te contactará dentro de 24 horas.',
    icon: Phone,
  },
  {
    number: 2,
    title: 'Visita el Recinto',
    desc: 'Programa una visita a nuestras instalaciones. Conoce los laboratorios, conoce al equipo y resuelve todas tus dudas en persona.',
    icon: Users,
  },
  {
    number: 3,
    title: 'Completa la Solicitud',
    desc: 'Entrega tu solicitud de admisión junto con los documentos requeridos. Nuestro equipo te guía en cada paso.',
    icon: FileText,
  },
  {
    number: 4,
    title: 'Solicita Ayuda Económica',
    desc: 'Si calificas, solicita el FAFSA y otras formas de asistencia económica. Nuestro equipo de Asistencia Económica te ayudará.',
    icon: DollarSign,
  },
  {
    number: 5,
    title: '¡Comienza tus Clases!',
    desc: 'Una vez completado el proceso, recibirás tu carta de aceptación y podrás matricularte para comenzar tu nueva carrera.',
    icon: CheckCircle,
  },
]

const requirements = [
  'Diploma de escuela superior o equivalente (GED)',
  'Acta de nacimiento certificada',
  'Tarjeta de Seguro Social',
  'Foto de identificación con foto válida',
  'Formulario de solicitud de admisión completado y firmado',
  'Entrevista personal con el consejero de admisiones',
  'FAFSA completado (si solicita asistencia económica)',
]

const financialAidOptions = [
  {
    name: 'Pell Grant Federal',
    desc: 'Beca federal para estudiantes que demuestran necesidad económica. No hay que devolver el dinero.',
    type: 'Beca',
  },
  {
    name: 'Préstamos Estudiantiles Federales',
    desc: 'Préstamos con tasas de interés favorables a través del programa de ayuda federal.',
    type: 'Préstamo',
  },
  {
    name: 'Programas de Asistencia Estatal',
    desc: 'Programas adicionales de asistencia disponibles para residentes de Puerto Rico.',
    type: 'Asistencia',
  },
]

export default function AdmisionesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">El Primer Paso</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Proceso de Admisiones
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              El camino hacia tu nueva carrera comienza aquí. Nuestro proceso de admisión es
              sencillo y nuestro equipo te acompaña en cada paso.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="gold" size="md" className="mb-4">Proceso</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              5 Pasos Para Comenzar
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Desde tu primera consulta hasta el inicio de clases, estamos contigo en cada etapa.
            </p>
          </div>

          <div className="relative">
            {/* Vertical line (desktop) */}
            <div className="hidden lg:block absolute left-1/2 -translate-x-px top-8 bottom-8 w-0.5 bg-gradient-to-b from-gold/50 via-gold/20 to-transparent" />

            <div className="space-y-8">
              {steps.map((step, i) => {
                const Icon = step.icon
                const isLeft = i % 2 === 0
                return (
                  <div
                    key={step.number}
                    className={`relative flex flex-col lg:flex-row items-center gap-8 ${
                      isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    }`}
                  >
                    {/* Content */}
                    <div className={`flex-1 ${isLeft ? 'lg:text-right' : 'lg:text-left'}`}>
                      <div
                        className={`bg-white rounded-2xl p-6 shadow-card border border-gray-100 max-w-md ${
                          isLeft ? 'lg:ml-auto' : 'lg:mr-auto'
                        }`}
                      >
                        <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'lg:justify-end' : ''}`}>
                          <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center">
                            <Icon className="h-5 w-5 text-gold" />
                          </div>
                          <Badge variant="gold" size="sm">Paso {step.number}</Badge>
                        </div>
                        <h3 className="text-xl font-bold text-navy mb-2">{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>

                    {/* Center icon */}
                    <div className="hidden lg:flex w-14 h-14 bg-gradient-navy rounded-full items-center justify-center flex-shrink-0 border-4 border-white shadow-lg z-10">
                      <span className="text-gold font-black text-lg">{step.number}</span>
                    </div>

                    {/* Empty space for opposite side */}
                    <div className="hidden lg:block flex-1" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements + Form */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Requirements */}
            <div>
              <Badge variant="navy" size="md" className="mb-4">Documentos Necesarios</Badge>
              <h2 className="text-3xl font-black text-navy mb-6">
                Requisitos de Admisión
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Para completar tu proceso de admisión en D'Mart Institute, necesitarás tener
                disponibles los siguientes documentos:
              </p>
              <ul className="space-y-3">
                {requirements.map((req) => (
                  <li key={req} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 font-medium text-sm">{req}</p>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-4 italic">
                * Los requisitos específicos pueden variar según el programa. Consulta con tu consejero de admisiones para más detalles.
              </p>

              {/* Financial Aid */}
              <div className="mt-10">
                <Badge variant="gold" size="md" className="mb-4">Ayuda Económica</Badge>
                <h3 className="text-2xl font-black text-navy mb-4">
                  Opciones de Financiamiento
                </h3>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                  D'Mart Institute participa en programas de asistencia económica federal. Nuestro
                  equipo de Asistencia Económica te guiará en el proceso de solicitud del FAFSA sin costo.
                </p>
                <div className="space-y-4">
                  {financialAidOptions.map((option) => (
                    <div key={option.name} className="bg-white rounded-xl p-4 border border-gray-100 flex gap-4">
                      <div className="w-2 h-full bg-gold rounded-full flex-shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-navy text-sm">{option.name}</h4>
                          <Badge variant="gold" size="sm">{option.type}</Badge>
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">{option.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/servicios-estudiantiles"
                  className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-gold hover:text-gold-dark transition-colors"
                >
                  Ver todos los servicios estudiantiles
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Lead form */}
            <div className="lg:sticky lg:top-24 self-start">
              <LeadForm
                title="Comienza Tu Proceso Hoy"
                subtitle="Solicita información y un consejero te llamará dentro de 24 horas."
                source="admisiones-page"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-black text-navy mb-4">¿Tienes preguntas?</h2>
          <p className="text-gray-600 text-lg mb-8">
            Llama directamente a cualquiera de nuestros recintos. Estamos aquí para ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:7878576929"
              className="flex items-center justify-center gap-3 bg-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-navy-700 transition-colors"
            >
              <Phone className="h-5 w-5 text-gold" />
              Barranquitas: (787) 857-6929
            </a>
            <a
              href="tel:7878838180"
              className="flex items-center justify-center gap-3 bg-navy text-white px-8 py-4 rounded-xl font-bold hover:bg-navy-700 transition-colors"
            >
              <Phone className="h-5 w-5 text-gold" />
              Vega Alta: (787) 883-8180
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
