import type { Metadata } from 'next'
import { ShieldCheck, Target, Eye, Building2, MapPin, Phone } from 'lucide-react'
import AccreditationBar from '@/components/sections/AccreditationBar'
import CTABanner from '@/components/sections/CTABanner'
import Badge from '@/components/ui/Badge'
import { ACCREDITATIONS, STATIC_CAMPUSES } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description:
    "Conoce a D'Mart Institute, institución vocacional acreditada en Puerto Rico. Misión, visión, valores y acreditaciones. Recintos en Barranquitas y Vega Alta.",
}

export default async function SobreNosotrosPage() {
  const campuses = STATIC_CAMPUSES

  const values = [
    { title: 'Excelencia Académica', desc: 'Mantenemos los más altos estándares en todos nuestros programas educativos.' },
    { title: 'Compromiso Estudiantil', desc: 'El éxito de cada estudiante es nuestra prioridad número uno.' },
    { title: 'Integridad', desc: 'Actuamos con honestidad y transparencia en todas nuestras operaciones.' },
    { title: 'Innovación', desc: 'Actualizamos continuamente nuestros programas con las últimas tendencias de la industria.' },
    { title: 'Comunidad', desc: 'Somos parte activa de las comunidades de Barranquitas y Vega Alta.' },
    { title: 'Inclusión', desc: 'Brindamos oportunidades educativas accesibles para todos los puertorriqueños.' },
  ]

  return (
    <>
      {/* Page header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Nuestra Historia</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Sobre D'Mart Institute
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              Institución postsecundaria acreditada con presencia en el corazón de Puerto Rico,
              comprometida con la educación vocacional de calidad.
            </p>
          </div>
        </div>
      </section>

      {/* Accreditation bar */}
      <AccreditationBar />

      {/* Mission & Vision */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Mission */}
            <div className="bg-gradient-to-br from-navy to-navy-700 text-white rounded-3xl p-8 md:p-10">
              <div className="w-12 h-12 bg-gold/20 rounded-2xl flex items-center justify-center mb-6">
                <Target className="h-6 w-6 text-gold" />
              </div>
              <h2 className="text-2xl font-black mb-4">Nuestra Misión</h2>
              <p className="text-gray-300 leading-relaxed text-lg">
                Proveer educación vocacional y técnica de alta calidad que prepare a nuestros
                estudiantes con las competencias, habilidades y valores necesarios para triunfar
                en el mercado laboral y contribuir positivamente a la sociedad puertorriqueña.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-gradient-to-br from-gold-50 to-white border-2 border-gold/20 rounded-3xl p-8 md:p-10">
              <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-gold-dark" />
              </div>
              <h2 className="text-2xl font-black text-navy mb-4">Nuestra Visión</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                Ser la institución de educación vocacional líder en Puerto Rico, reconocida por la
                excelencia académica, el impacto en el desarrollo económico de nuestras comunidades
                y el éxito profesional de nuestros egresados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="navy" size="md" className="mb-4">Lo Que Nos Define</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Nuestros Valores
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Estos principios guían todo lo que hacemos en D'Mart Institute.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={v.title} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-gold text-navy font-black text-sm flex items-center justify-center mb-4">
                  {i + 1}
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{v.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accreditations detailed */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="gold" size="md" className="mb-4">Reconocimientos Oficiales</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Acreditaciones y Licencias
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              D'Mart Institute opera bajo las licencias y acreditaciones de los organismos
              reguladores oficiales de Puerto Rico y Estados Unidos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ACCREDITATIONS.map((acc) => (
              <div
                key={acc.abbr}
                className="bg-white rounded-2xl p-8 shadow-card border border-gray-100 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-navy/5 border-2 border-navy/10 flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck className="h-8 w-8 text-navy" />
                </div>
                <div className="inline-block bg-gold/10 text-gold-dark font-black text-sm px-3 py-1 rounded-full mb-3">
                  {acc.abbr}
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{acc.name}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{acc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Campuses overview */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <Badge variant="navy" size="md" className="mb-4">Nuestras Instalaciones</Badge>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              Dos Recintos. Una Misión.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {campuses.map((campus) => (
              <div
                key={campus.id}
                className="bg-white rounded-2xl p-8 shadow-card border-t-4 border-t-gold"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-gradient-navy rounded-xl flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gold" />
                  </div>
                  <h3 className="text-xl font-bold text-navy">Recinto {campus.name}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>{campus.address}, {campus.city}, {campus.state} {campus.zip}</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <Phone className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                    <a href={`tel:${campus.phone.replace(/\D/g, '')}`} className="text-gold font-semibold hover:text-gold-dark">
                      {campus.phone}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="¿Quieres conocer nuestras instalaciones?"
        subtitle="Visítanos en cualquiera de nuestros recintos. Estaremos felices de recibirte."
        primaryLabel="Ver Recintos"
        primaryHref="/recintos"
        secondaryLabel="Contáctanos"
        secondaryHref="/contactanos"
      />
    </>
  )
}
