import type { Metadata } from 'next'
import { BookOpen, Users, Briefcase, FileText, DollarSign, CreditCard } from 'lucide-react'
import Link from 'next/link'
import Badge from '@/components/ui/Badge'
import CTABanner from '@/components/sections/CTABanner'
import { STUDENT_SERVICES } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Servicios Estudiantiles',
  description:
    "D'Mart Institute ofrece servicios completos de apoyo estudiantil: Centro de Recursos, Retención, Colocaciones, Registraduría, Asistencia Económica y más.",
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Users,
  Briefcase,
  FileText,
  DollarSign,
  CreditCard,
}

const serviceDetails: Record<number, { details: string[]; contact?: string }> = {
  1: {
    details: [
      'Computadoras con acceso a internet',
      'Biblioteca con materiales de referencia',
      'Impresoras y escáneres disponibles',
      'Tutorías académicas',
      'Materiales de estudio complementarios',
    ],
  },
  2: {
    details: [
      'Orientación académica personalizada',
      'Seguimiento del progreso estudiantil',
      'Apoyo en situaciones personales',
      'Mediación de conflictos',
      'Recursos de salud mental',
    ],
  },
  3: {
    details: [
      'Banco de empleos actualizado',
      'Talleres de preparación para entrevistas',
      'Revisión de resume/CV',
      'Conexión con empleadores de la industria',
      'Seguimiento post-graduación',
    ],
  },
  4: {
    details: [
      'Transcripciones oficiales',
      'Certificaciones de estudios',
      'Cambios de programa o recinto',
      'Gestión de documentos académicos',
      'Verificación de matrícula',
    ],
  },
  5: {
    details: [
      'Orientación sobre el FAFSA',
      'Gestión de Pell Grant y préstamos',
      'Información sobre becas disponibles',
      'Planes de pago alternativos',
      'Revisión de elegibilidad',
    ],
  },
  6: {
    details: [
      'Gestión de pagos de matrícula',
      'Planes de pago',
      'Facturación y estados de cuenta',
      'Información sobre costos del programa',
      'Recibo de cheques de ayuda económica',
    ],
  },
}

export default function ServiciosEstudiantilesPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Tu Éxito es Nuestra Prioridad</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Servicios Estudiantiles
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              En D'Mart Institute contamos con un equipo dedicado a apoyarte en cada aspecto
              de tu experiencia académica, desde la matrícula hasta la colocación de empleo.
            </p>
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Servicios Disponibles para Estudiantes
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Todos nuestros servicios están disponibles en ambos recintos para todos los estudiantes matriculados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {STUDENT_SERVICES.map((service) => {
              const Icon = iconMap[service.icon] ?? BookOpen
              const details = serviceDetails[service.id]
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="bg-gradient-to-br from-navy to-navy-700 p-6">
                    <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight">{service.name}</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">{service.description}</p>
                    {details && (
                      <ul className="space-y-2">
                        {details.details.map((d) => (
                          <li key={d} className="flex items-start gap-2 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 bg-gold rounded-full flex-shrink-0 mt-1.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Financial aid focus */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="gold" size="md" className="mb-4">Ayuda Económica</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-navy mb-5">
                No Dejes que el Dinero Sea un Obstáculo
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                Nuestro equipo de Asistencia Económica trabaja contigo para identificar todas las
                opciones de financiamiento disponibles para tu educación. Desde el Pell Grant hasta
                préstamos estudiantiles federales.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Pell Grant (beca federal sin devolución)',
                  'Préstamos Estudiantiles Federales',
                  'Programas de asistencia estatal',
                  'Planes de pago flexibles',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                      <span className="w-2 h-2 bg-gold rounded-full" />
                    </span>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/admisiones"
                className="inline-flex items-center gap-2 bg-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-navy-700 transition-colors"
              >
                Ver Proceso de Admisión
              </Link>
            </div>

            <div className="bg-gradient-navy rounded-3xl p-8 text-white">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-2xl font-black mb-4">¿Cómo solicitar el FAFSA?</h3>
              <div className="space-y-4">
                {[
                  'Visita studentaid.gov',
                  'Crea tu cuenta FSA ID',
                  'Completa la solicitud FAFSA con tu información financiera',
                  'Indica D\'Mart Institute como tu institución',
                  'Nuestro equipo revisará tu elegibilidad',
                  'Recibe tu paquete de ayuda económica',
                ].map((step, i) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold text-xs font-black">{i + 1}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="¿Necesitas más información sobre servicios?"
        subtitle="Contáctanos y te orientamos sobre todos los servicios disponibles para ti."
        primaryLabel="Contáctanos"
        primaryHref="/contactanos"
      />
    </>
  )
}
