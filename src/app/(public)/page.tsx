import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Sparkles, Heart, Briefcase, Wrench, Calendar } from 'lucide-react'
import Hero from '@/components/sections/Hero'
import AccreditationBar from '@/components/sections/AccreditationBar'
import StatsBar from '@/components/sections/StatsBar'
import CTABanner from '@/components/sections/CTABanner'
import LeadForm from '@/components/forms/LeadForm'
import Badge from '@/components/ui/Badge'
import { STATIC_CATEGORIES, STATIC_PROGRAMS } from '@/lib/utils'

export const metadata: Metadata = {
  title: "D'Mart Institute — Tu Carrera Comienza Aquí",
  description:
    "Programas vocacionales acreditados en Puerto Rico. Cosmetología, Enfermería Práctica, Técnico de Electricidad y más. Recintos en Barranquitas y Vega Alta.",
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  belleza: Sparkles,
  salud: Heart,
  comercial: Briefcase,
  tecnico: Wrench,
}

const categoryStyles: Record<string, { card: string; icon: string; badge: 'gold' | 'green' | 'navy' | 'violet' }> = {
  belleza: { card: 'border-gold/30 hover:border-gold/60 bg-gradient-to-br from-gold-50 to-white', icon: 'text-gold bg-gold/10', badge: 'gold' },
  salud: { card: 'border-emerald-200 hover:border-emerald-400 bg-gradient-to-br from-emerald-50 to-white', icon: 'text-emerald-600 bg-emerald-100', badge: 'green' },
  comercial: { card: 'border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50 to-white', icon: 'text-navy bg-navy/10', badge: 'navy' },
  tecnico: { card: 'border-violet-200 hover:border-violet-400 bg-gradient-to-br from-violet-50 to-white', icon: 'text-violet-700 bg-violet-100', badge: 'violet' },
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
    'Habla con un consejero de admisiones',
    'Entrega documentos requeridos',
    'Solicita tu ayuda económica (FAFSA)',
    '¡Inicia tus clases!',
  ]

  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Accreditation bar */}
      <AccreditationBar />

      {/* Categories section */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="gold" size="md" className="mb-4">Nuestros Programas</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Encuentra Tu Carrera Ideal
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
              Cuatro áreas de estudio diseñadas para conectarte con las industrias de mayor demanda en Puerto Rico.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categoryProgramCount.map((cat) => {
              const Icon = categoryIcons[cat.slug] ?? Sparkles
              const style = categoryStyles[cat.slug] ?? categoryStyles.belleza
              return (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  className={`group rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${style.card}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${style.icon}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-black text-navy mb-1">{cat.name}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{cat.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">
                      {cat.count} {cat.count === 1 ? 'programa' : 'programas'}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-gold group-hover:gap-2 transition-all">
                      Ver <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/programas"
              className="inline-flex items-center gap-2 text-navy font-bold hover:text-gold transition-colors"
            >
              Ver todos los programas
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <StatsBar />

      {/* Featured Programs */}
      {featuredPrograms.length > 0 && (
        <section className="section-padding">
          <div className="container-custom">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <Badge variant="navy" size="md" className="mb-3">Programas Destacados</Badge>
                <h2 className="text-3xl md:text-4xl font-black text-navy">
                  Programas de Alta Demanda
                </h2>
              </div>
              <Link
                href="/programas"
                className="inline-flex items-center gap-2 text-gold font-bold hover:text-gold-dark transition-colors flex-shrink-0"
              >
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPrograms.map((program) => {
                const catSlug = program.category?.slug ?? 'belleza'
                const style = categoryStyles[catSlug] ?? categoryStyles.belleza
                return (
                  <Link
                    key={program.id}
                    href={`/programas/${program.slug}`}
                    className={`group rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover ${style.card}`}
                  >
                    {program.category && (
                      <Badge variant={style.badge} className="mb-3">{program.category.name}</Badge>
                    )}
                    <h3 className="text-lg font-bold text-navy mb-2 line-clamp-2">{program.name}</h3>
                    {program.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{program.description}</p>
                    )}
                    {program.duration_weeks && (
                      <p className="text-xs text-gray-400 font-medium">
                        {program.duration_weeks} semanas · {program.credits} créditos · {program.hours} horas
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-4 text-sm font-bold text-gold group-hover:gap-2 transition-all">
                      Ver programa <ArrowRight className="h-4 w-4" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Saturday courses teaser */}
      <section className="section-padding bg-navy">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-5">
                <Calendar className="h-4 w-4 text-gold" />
                <span className="text-gold text-sm font-semibold">Disponible los Sábados</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                Privados Sabatinos — Cursos de Tecnología y Marketing
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Cursos especializados en habilidades digitales del mundo moderno: Mercadeo Digital,
                Inteligencia Artificial, Diseño Gráfico, Redes Sociales y más. Aprende los sábados.
              </p>
              <Link
                href="/privados-sabatinos"
                className="inline-flex items-center gap-2 bg-gold text-navy font-bold px-6 py-3 rounded-xl hover:bg-gold-dark transition-colors"
              >
                Ver Cursos Sabatinos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 w-full max-w-sm">
              {['Mercadeo Digital', 'Inteligencia Artificial', 'Diseño Gráfico', 'Ciberseguridad', 'Producción de Videos', 'WordPress'].map((course) => (
                <div key={course} className="bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white text-sm font-semibold">{course}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why D'Mart */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="gold" size="md" className="mb-4">¿Por qué D'Mart?</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Tu Éxito Es Nuestra Misión
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Educación Acreditada',
                desc: 'Programas reconocidos por el Departamento de Educación de PR, ACCSC y la Junta de Instituciones Postsecundarias.',
                icon: '🎓',
              },
              {
                title: 'Ayuda Económica',
                desc: 'Participamos en programas de asistencia económica federal. Nuestro equipo te guía en el proceso del FAFSA.',
                icon: '💰',
              },
              {
                title: 'Apoyo Completo',
                desc: 'Centro de recursos, orientación académica, oficina de retención y servicio de colocación de empleo.',
                icon: '🤝',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-8 shadow-card border border-gray-100 text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-navy mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission steps */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="gold" size="md" className="mb-4">Proceso Simple</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
                Comienza en 5 Pasos
              </h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                El proceso de admisión en D'Mart Institute es sencillo y nuestro equipo te acompaña en cada paso del camino.
              </p>
              <div className="space-y-4">
                {admissionSteps.map((step, i) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-gold text-navy font-black text-sm flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                      <p className="text-gray-700 font-medium">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/admisiones"
                className="inline-flex items-center gap-2 mt-8 bg-navy text-white font-bold px-6 py-3 rounded-xl hover:bg-navy-700 transition-colors"
              >
                Ver Proceso Completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Lead form */}
            <div>
              <LeadForm
                title="Solicita Información Gratis"
                subtitle="Un consejero te contactará dentro de 24 horas."
                source="home-page"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner />
    </>
  )
}
