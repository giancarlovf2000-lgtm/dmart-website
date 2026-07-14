import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight, CheckCircle, Sparkles, Heart, Briefcase, Wrench, Calendar,
  GraduationCap, Wallet, HeartHandshake, type LucideIcon,
} from 'lucide-react'
import Hero from '@/components/sections/Hero'
import AccreditationBar from '@/components/sections/AccreditationBar'
import StatsBar from '@/components/sections/StatsBar'
import CTABanner from '@/components/sections/CTABanner'
import LeadForm from '@/components/forms/LeadForm'
import Badge from '@/components/ui/Badge'
import Reveal from '@/components/ui/Reveal'
import MediaSlot from '@/components/ui/MediaSlot'
import { STATIC_CATEGORIES, STATIC_PROGRAMS } from '@/lib/utils'

export const metadata: Metadata = {
  title: "D'Mart Institute — Tu Carrera Comienza Aquí",
  description:
    "Programas vocacionales acreditados en Puerto Rico. Cosmetología, Enfermería Práctica, Técnico de Electricidad con PLC y Energía Renovable y más. Recintos en Barranquitas y Vega Alta.",
}

const categoryIcons: Record<string, LucideIcon> = {
  belleza: Sparkles,
  salud: Heart,
  comercial: Briefcase,
  tecnico: Wrench,
}

export default async function HomePage() {
  const categories = STATIC_CATEGORIES
  const programs = STATIC_PROGRAMS

  const categoryProgramCount = categories.map((cat) => ({
    ...cat,
    count: programs.filter((p) => p.category_id === cat.id).length,
  }))

  const featuredPrograms = programs.slice(0, 6).map((p) => ({
    ...p,
    category: categories.find((c) => c.id === p.category_id) ?? null,
  }))

  const admissionSteps = [
    'Completa el formulario de información',
    'Habla con un representante de admisiones',
    'Entrega documentos requeridos',
    'Solicita tu ayuda económica (FAFSA)',
    '¡Inicia tus clases!',
  ]

  const shortCourses = [
    'Maquillaje', 'Técnica de Uñas', 'Terapia de Masaje y Tratamiento Corporal',
    'Facturación a Planes Médicos', 'Repostería', 'Corte y Estilo de Caballeros',
  ]

  const whyDmart: { title: string; desc: string; icon: LucideIcon }[] = [
    { title: 'Educación Acreditada', desc: 'Programas reconocidos por el Departamento de Educación de PR, ACCSC y la Junta de Instituciones Postsecundarias.', icon: GraduationCap },
    { title: 'Ayuda Económica', desc: 'Participamos en programas de asistencia económica federal. Nuestro equipo te guía en el proceso del FAFSA.', icon: Wallet },
    { title: 'Apoyo Completo', desc: 'Centro de recursos, orientación académica, oficina de retención y servicio de colocación de empleo.', icon: HeartHandshake },
  ]

  return (
    <>
      <Hero />
      <AccreditationBar />

      {/* Categorías */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <Reveal className="mb-12 text-center">
            <Badge variant="gold" size="md" className="mb-4">Nuestros Programas</Badge>
            <h2 className="mb-4 text-3xl font-bold text-navy md:text-5xl">Encuentra Tu Carrera Ideal</h2>
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
              Cuatro áreas de estudio diseñadas para conectarte al mundo laboral con éxito.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categoryProgramCount.map((cat, i) => {
              const Icon = categoryIcons[cat.slug] ?? Sparkles
              return (
                <Reveal key={cat.id} delay={i * 80}>
                  <Link
                    href={`/categorias/${cat.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-card-hover"
                  >
                    <MediaSlot
                      src={undefined /* sube /public/media/categoria-{slug}.jpg y ponlo aquí */}
                      icon={Icon}
                      className="aspect-[16/11] w-full"
                      alt={cat.name}
                    />
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-1 text-xl font-bold text-navy">{cat.name}</h3>
                      <p className="mb-4 line-clamp-2 text-sm text-gray-500">{cat.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">
                          {cat.count} {cat.count === 1 ? 'programa' : 'programas'}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-gold transition-all group-hover:gap-2">
                          Ver <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href="/programas" className="inline-flex items-center gap-2 font-bold text-navy transition-colors hover:text-gold">
              Ver todos los programas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <StatsBar />

      {/* Programas destacados */}
      {featuredPrograms.length > 0 && (
        <section className="section-padding bg-gray-50">
          <div className="container-custom">
            <Reveal className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <h2 className="text-3xl font-bold text-navy md:text-5xl">Programas de Alta Demanda</h2>
              <Link href="/programas" className="inline-flex flex-shrink-0 items-center gap-2 font-bold text-gold transition-colors hover:text-gold-dark">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPrograms.map((program, i) => {
                const Icon = categoryIcons[program.category?.slug ?? 'belleza'] ?? Sparkles
                return (
                  <Reveal key={program.id} delay={(i % 3) * 80}>
                    <Link
                      href={`/programas/${program.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-card-hover"
                    >
                      <MediaSlot
                        src={undefined /* sube /public/media/programa-{slug}.jpg y ponlo aquí */}
                        icon={Icon}
                        className="aspect-[16/10] w-full"
                        alt={program.name}
                      />
                      <div className="flex flex-1 flex-col p-6">
                        {program.category && <Badge variant="gold" className="mb-3 self-start">{program.category.name}</Badge>}
                        <h3 className="mb-2 line-clamp-2 text-lg font-bold text-navy">{program.name}</h3>
                        {program.description && <p className="mb-4 line-clamp-2 text-sm text-gray-500">{program.description}</p>}
                        {program.duration_weeks && (
                          <p className="mt-auto text-xs font-medium text-gray-400">
                            {program.duration_weeks} semanas · {program.credits} créditos · {program.hours} horas
                          </p>
                        )}
                        <div className="mt-4 flex items-center gap-1 text-sm font-bold text-gold transition-all group-hover:gap-2">
                          Ver programa <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Cursos privados cortos */}
      <section className="relative overflow-hidden bg-black py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
        <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-gold/15 blur-[110px]" />
        <div className="container-custom relative">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <Reveal className="flex-1">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5">
                <Calendar className="h-4 w-4 text-gold" />
                <span className="text-sm font-semibold text-gold">Disponibles Lunes a Sábados</span>
              </div>
              <h2 className="mb-4 text-3xl font-bold text-white md:text-5xl">Programas Privados Cortos</h2>
              <p className="mb-6 max-w-lg text-lg leading-relaxed text-gray-300">
                Cursos especializados en belleza, salud, gastronomía y más. Programas cortos diseñados para tu desarrollo profesional.
              </p>
              <Link href="/privados-sabatinos" className="inline-flex items-center gap-2 rounded-xl bg-gold px-6 py-3 font-bold text-white shadow-gold transition-colors hover:bg-gold-dark">
                Ver Programas Privados Cortos <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
            <div className="grid w-full max-w-md flex-1 grid-cols-2 gap-3">
              {shortCourses.map((course, i) => (
                <Reveal key={course} delay={i * 60}>
                  <div className="flex h-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:border-gold/30 hover:bg-white/[0.07]">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold/15">
                      <Sparkles className="h-4 w-4 text-gold" />
                    </span>
                    <p className="text-sm font-semibold text-white">{course}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ¿Por qué D'Mart? */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <Reveal className="mb-12 text-center">
            <Badge variant="gold" size="md" className="mb-4">¿Por qué D&apos;Mart?</Badge>
            <h2 className="mb-4 text-3xl font-bold text-navy md:text-5xl">Tu Éxito Es Nuestra Misión</h2>
          </Reveal>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {whyDmart.map((item, i) => {
              const Icon = item.icon
              return (
                <Reveal key={item.title} delay={i * 90}>
                  <div className="h-full rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 ring-1 ring-gold/20">
                      <Icon className="h-7 w-7 text-gold" />
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-navy">{item.title}</h3>
                    <p className="leading-relaxed text-gray-600">{item.desc}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Admisión + LeadForm */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <Reveal>
              <Badge variant="gold" size="md" className="mb-4">Proceso Simple</Badge>
              <h2 className="mb-4 text-3xl font-bold text-navy md:text-5xl">Comienza en 5 Pasos</h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                El proceso de admisión en D&apos;Mart Institute es sencillo y nuestro equipo te acompaña en cada paso del camino.
              </p>
              <div className="space-y-4">
                {admissionSteps.map((step, i) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gold font-display text-sm font-bold text-white">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <CheckCircle className="h-4 w-4 flex-shrink-0 text-gold" />
                      <p className="font-medium text-gray-700">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/admisiones" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-bold text-white transition-colors hover:bg-navy-700">
                Ver Proceso Completo <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>

            <Reveal delay={120}>
              <LeadForm
                title="Solicita Información"
                subtitle="Un representante de la institución te contactará dentro de 24 horas."
                source="home-page"
              />
            </Reveal>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
