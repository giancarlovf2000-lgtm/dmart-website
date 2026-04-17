import type { Metadata } from 'next'
import { Calendar, Clock, TrendingUp, Star, Palette, Globe, Video, Share2, Bot, Shield, ArrowRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import LeadForm from '@/components/forms/LeadForm'
import CTABanner from '@/components/sections/CTABanner'
import { PRIVADOS_SABATINOS } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Privados Sabatinos',
  description:
    "Cursos sabatinos de tecnología y marketing en D'Mart Institute: Mercadeo Digital, Inteligencia Artificial, Diseño Gráfico, WordPress, Producción de Videos y más.",
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Star,
  Palette,
  Globe,
  Video,
  Share2,
  Bot,
  Shield,
}

const tagColors: Record<string, string> = {
  Marketing: 'bg-gold/10 text-gold-dark border border-gold/20',
  Branding: 'bg-blue-50 text-blue-700 border border-blue-200',
  Diseño: 'bg-violet-50 text-violet-700 border border-violet-200',
  Tecnología: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Contenido: 'bg-orange-50 text-orange-700 border border-orange-200',
  'Redes Sociales': 'bg-pink-50 text-pink-700 border border-pink-200',
  Seguridad: 'bg-red-50 text-red-700 border border-red-200',
}

export default function PrivadosSabatinosPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 right-20 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-10 w-64 h-64 bg-navy-600/50 rounded-full blur-2xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-5">
              <Calendar className="h-4 w-4 text-gold" />
              <span className="text-gold text-sm font-semibold">Disponible los Sábados</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
              Privados Sabatinos
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed mb-6">
              Cursos especializados en las habilidades digitales más demandadas del mercado actual.
              Aprende tecnología, marketing y diseño los sábados, a tu propio ritmo.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Mercadeo Digital', 'IA', 'Diseño Gráfico', 'WordPress', 'Ciberseguridad'].map((tag) => (
                <span key={tag} className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/10">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Saturday courses */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Calendar, title: 'Solo los Sábados', desc: 'Cursos diseñados para profesionales y emprendedores con horario flexible.' },
              { icon: Clock, title: 'Corta Duración', desc: 'Aprende habilidades prácticas y aplicables sin comprometer tu semana laboral.' },
              { icon: TrendingUp, title: 'Alta Demanda', desc: 'Tecnologías y habilidades que el mercado laboral actual más solicita.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="flex gap-4 p-5 rounded-2xl bg-gray-50">
                  <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Courses grid */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="gold" size="md" className="mb-4">8 Cursos Disponibles</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Cursos Sabatinos
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Todos los cursos están disponibles en ambos recintos. Para información sobre
              fechas de inicio y disponibilidad, contáctanos directamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRIVADOS_SABATINOS.map((course) => {
              const Icon = iconMap[course.icon] ?? TrendingUp
              const tagStyle = tagColors[course.tag] ?? 'bg-gray-100 text-gray-600'
              return (
                <div
                  key={course.id}
                  className="group bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Card header */}
                  <div className="bg-gradient-to-br from-navy to-navy-600 p-5">
                    <div className="w-11 h-11 bg-gold/20 rounded-xl flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-gold" />
                    </div>
                    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${tagStyle}`}>
                      {course.tag}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="font-bold text-navy text-base mb-2 leading-snug">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500 text-sm">
              Para información sobre horarios de inicio, duración específica y disponibilidad,{' '}
              <a href="tel:7878576929" className="text-gold font-semibold hover:underline">
                contáctanos
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="navy" size="md" className="mb-4">¿Para Quién?</Badge>
              <h2 className="text-3xl md:text-4xl font-black text-navy mb-5">
                Los Privados Sabatinos Son Para Ti Si...
              </h2>
              <ul className="space-y-4">
                {[
                  'Eres un profesional que quiere actualizar sus habilidades digitales',
                  'Tienes o quieres iniciar un negocio y necesitas presencia en línea',
                  'Quieres cambiar de carrera y explorar la industria digital',
                  'Eres estudiante y quieres aprender habilidades complementarias',
                  'Quieres generar ingresos adicionales con habilidades digitales',
                  'No tienes disponibilidad entre semana y prefieres los sábados',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="w-2 h-2 bg-gold rounded-full" />
                    </span>
                    <span className="text-gray-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 p-4 bg-gold-50 border border-gold/20 rounded-xl">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong className="text-navy">Nota:</strong> Los Privados Sabatinos son cursos
                  independientes de los programas regulares de D'Mart Institute. No hay información
                  pública de precios — contáctanos para detalles.
                </p>
              </div>
            </div>

            {/* Lead form */}
            <div>
              <LeadForm
                defaultCampus=""
                title="¿Te Interesan los Sabatinos?"
                subtitle="Selecciona el curso que te interesa y te llamamos con toda la información."
                source="privados-sabatinos-page"
              />
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title="Inscríbete en un Privado Sabatino"
        subtitle="Habla con un consejero y comienza a aprender habilidades del futuro."
        primaryLabel="Solicitar Información"
        primaryHref="/contactanos"
      />
    </>
  )
}
