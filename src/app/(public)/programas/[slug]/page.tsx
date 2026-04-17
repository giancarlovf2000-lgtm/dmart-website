import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Award, BookOpen, MapPin, Calendar, ArrowLeft, CheckCircle } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import LeadForm from '@/components/forms/LeadForm'
import CTABanner from '@/components/sections/CTABanner'
import { getProgramBySlug } from '@/lib/utils'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const program = getProgramBySlug(slug)

  if (!program) {
    return { title: 'Programa no encontrado' }
  }

  return {
    title: program.name,
    description:
      program.description ??
      `Programa de ${program.name} en D'Mart Institute. ${program.duration_weeks ? `${program.duration_weeks} semanas` : ''} ${program.credits ? `· ${program.credits} créditos` : ''}. Recintos en Barranquitas y Vega Alta, Puerto Rico.`,
  }
}

const categoryBadgeVariant: Record<string, 'gold' | 'green' | 'navy' | 'violet'> = {
  belleza: 'gold',
  salud: 'green',
  comercial: 'navy',
  tecnico: 'violet',
}

const careerOutcomes: Record<string, string[]> = {
  cosmetologia: [
    'Estilista en salones de belleza',
    'Propietario de salón propio',
    'Educador de cosmetología',
    'Colorista especializado',
    'Artista de plataforma',
  ],
  'barberia-y-estilismo': [
    'Barbero en barbería establecida',
    'Propietario de barbería',
    'Estilista masculino',
    'Educador de barbería',
  ],
  'tecnica-de-unas': [
    'Técnica de uñas en salón',
    'Propietaria de nail salon',
    'Manicurista móvil',
    'Artista de nail art',
  ],
  'estetica-y-maquillaje': [
    'Esteticista en spa o salón',
    'Maquillador artístico',
    'Especialista en tratamientos faciales',
    'Consultor de imagen',
  ],
  supermaster: [
    'Educador/instructor de belleza',
    'Director técnico de salón',
    'Especialista avanzado de belleza',
  ],
  'enfermeria-practica': [
    'Enfermero Práctico (LPN) en hospitales',
    'Enfermero en clínicas y centros médicos',
    'Cuidado en hogares de pacientes',
    'Enfermero en hogares de ancianos',
    'Asistente médico en consultorios',
  ],
  'administracion-de-sistemas-de-oficina': [
    'Asistente administrativo',
    'Secretaria ejecutiva',
    'Recepcionista corporativa',
    'Coordinador de oficina',
    'Asistente de recursos humanos',
  ],
  'tecnico-de-electricidad': [
    'Técnico electricista residencial',
    'Técnico en sistemas industriales',
    'Instalador de paneles solares',
    'Técnico de PLC',
    'Supervisor de instalaciones eléctricas',
  ],
  'tecnico-de-mecanica-automotriz': [
    'Mecánico en talleres certificados',
    'Técnico de diagnóstico automotriz',
    'Especialista en vehículos modernos',
    'Propietario de taller mecánico',
  ],
  'tecnico-de-refrigeracion': [
    'Técnico de A/C residencial',
    'Técnico en sistemas comerciales',
    'Especialista en refrigeración industrial',
    'Técnico en sistemas de energía renovable',
  ],
}

export default async function ProgramPage({ params }: PageProps) {
  const { slug } = await params
  const program = getProgramBySlug(slug)

  if (!program) {
    notFound()
  }

  const catSlug = program.category?.slug ?? 'belleza'
  const badgeVariant = categoryBadgeVariant[catSlug] ?? 'gold'
  const outcomes = careerOutcomes[slug] ?? []

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/programas" className="hover:text-gold transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Programas
            </Link>
            <span>/</span>
            {program.category && (
              <>
                <Link href={`/categorias/${catSlug}`} className="hover:text-gold transition-colors">
                  {program.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-gray-300">{program.name}</span>
          </div>

          <div className="max-w-3xl">
            {program.category && (
              <Badge variant={badgeVariant} size="md" className="mb-4">
                {program.category.name}
              </Badge>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-white mb-5 leading-tight">
              {program.name}
            </h1>
            {program.description && (
              <p className="text-gray-300 text-xl leading-relaxed">{program.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      {(program.duration_weeks || program.credits || program.hours) && (
        <section className="bg-white border-b border-gray-100">
          <div className="container-custom py-6">
            <div className="flex flex-wrap gap-8">
              {program.duration_weeks && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Duración</p>
                    <p className="text-lg font-black text-navy">{program.duration_weeks} semanas</p>
                  </div>
                </div>
              )}
              {program.credits && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Créditos</p>
                    <p className="text-lg font-black text-navy">{program.credits} créditos</p>
                  </div>
                </div>
              )}
              {program.hours && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Horas</p>
                    <p className="text-lg font-black text-navy">{program.hours} horas</p>
                  </div>
                </div>
              )}
              {program.campuses && program.campuses.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Recintos</p>
                    <p className="text-lg font-black text-navy">
                      {program.campuses.map((c) => c.name).join(' · ')}
                    </p>
                  </div>
                </div>
              )}
              {program.schedule_options && program.schedule_options.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Horarios</p>
                    <p className="text-lg font-black text-navy">
                      {program.schedule_options.join(' · ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Main content */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left — Details */}
            <div className="lg:col-span-2 space-y-10">
              {/* About the program */}
              <div>
                <h2 className="text-2xl font-black text-navy mb-4">Acerca del Programa</h2>
                <div className="bg-gray-50 rounded-2xl p-6">
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {program.description ?? `El programa de ${program.name} en D'Mart Institute te prepara con las habilidades técnicas y prácticas necesarias para destacar en la industria. Nuestros instructores son profesionales activos con experiencia en el campo.`}
                  </p>
                </div>
              </div>

              {/* Career outcomes */}
              {outcomes.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-navy mb-4">Oportunidades de Carrera</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {outcomes.map((outcome) => (
                      <div
                        key={outcome}
                        className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
                      >
                        <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-medium text-gray-700">{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campus availability */}
              {program.campuses && program.campuses.length > 0 && (
                <div>
                  <h2 className="text-2xl font-black text-navy mb-4">Disponible En</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {program.campuses.map((campus) => (
                      <div
                        key={campus.id}
                        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-navy rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-gold" />
                          </div>
                          <h3 className="font-bold text-navy">Recinto {campus.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{campus.address}</p>
                        <p className="text-sm text-gray-500 mb-2">{campus.city}, PR {campus.zip}</p>
                        <a
                          href={`tel:${campus.phone.replace(/\D/g, '')}`}
                          className="text-sm font-semibold text-gold hover:text-gold-dark transition-colors"
                        >
                          {campus.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admission info */}
              <div>
                <h2 className="text-2xl font-black text-navy mb-4">Información de Admisión</h2>
                <div className="bg-gold-50 border border-gold/20 rounded-2xl p-6">
                  <ul className="space-y-2">
                    {[
                      'Diploma de escuela superior o equivalente (GED)',
                      'Formulario de solicitud completado',
                      'Entrevista con consejero de admisiones',
                      'Documentos de identificación válidos',
                      'Solicitud de Asistencia Económica (FAFSA) si aplica',
                    ].map((req) => (
                      <li key={req} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                        {req}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/admisiones"
                    className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-gold hover:text-gold-dark transition-colors"
                  >
                    Ver proceso completo de admisión →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right — Lead form */}
            <div className="lg:sticky lg:top-24 self-start">
              <LeadForm
                defaultProgram={program.name}
                title="¿Te interesa este programa?"
                subtitle="Solicita información y un consejero te llamará pronto."
                source={`program-${slug}`}
              />
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title={`Comienza tu carrera en ${program.name}`}
        subtitle="Habla con un consejero de admisiones y da el primer paso."
        primaryLabel="Solicitar Información"
        primaryHref="/contactanos"
      />
    </>
  )
}
