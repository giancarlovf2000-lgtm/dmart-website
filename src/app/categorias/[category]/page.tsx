import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ProgramCard from '@/components/ui/ProgramCard'
import CTABanner from '@/components/sections/CTABanner'
import { getCategoryBySlug, getProgramsByCategory } from '@/lib/utils'

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params
  const category = getCategoryBySlug(slug)

  if (!category) return { title: 'Categoría no encontrada' }

  return {
    title: `Programas de ${category.name}`,
    description:
      category.description ??
      `Programas vocacionales en ${category.name} en D'Mart Institute. Recintos en Barranquitas y Vega Alta, Puerto Rico.`,
  }
}

const categoryHeroStyles: Record<string, { bg: string; accent: string }> = {
  belleza: { bg: 'bg-gradient-navy', accent: 'text-gold' },
  salud: { bg: 'bg-gradient-to-br from-emerald-900 to-emerald-700', accent: 'text-emerald-300' },
  comercial: { bg: 'bg-gradient-navy', accent: 'text-gold' },
  tecnico: { bg: 'bg-gradient-to-br from-violet-900 to-violet-700', accent: 'text-violet-300' },
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const rawPrograms = getProgramsByCategory(slug)
  const programs = rawPrograms.map((p) => ({ ...p, category }))
  const style = categoryHeroStyles[slug] ?? categoryHeroStyles.belleza

  return (
    <>
      {/* Header */}
      <section className={`${style.bg} py-20 md:py-28`}>
        <div className="container-custom">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/programas" className="hover:text-gold transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              Programas
            </Link>
            <span>/</span>
            <span className="text-gray-300">{category.name}</span>
          </div>

          <div className="max-w-3xl">
            <div className={`text-sm font-bold uppercase tracking-wider mb-3 ${style.accent}`}>
              Área de Estudio
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Programas de {category.name}
            </h1>
            {category.description && (
              <p className="text-gray-300 text-xl leading-relaxed">{category.description}</p>
            )}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-navy">
                {programs.length} {programs.length === 1 ? 'Programa' : 'Programas'} Disponibles
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Todos los programas están disponibles en{' '}
                {slug === 'tecnico' ? 'uno o ambos recintos' : 'ambos recintos de D\'Mart Institute'}
              </p>
            </div>
            <Link
              href="/programas"
              className="text-sm font-semibold text-gold hover:text-gold-dark transition-colors hidden md:flex items-center gap-1"
            >
              Ver todas las áreas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {programs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400">No hay programas disponibles en esta categoría actualmente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Other categories */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-navy mb-1">¿Explorando otras áreas?</h3>
              <p className="text-gray-500 text-sm">D'Mart Institute ofrece 4 áreas de especialización.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Belleza', slug: 'belleza' },
                { label: 'Salud', slug: 'salud' },
                { label: 'Comercial', slug: 'comercial' },
                { label: 'Técnico', slug: 'tecnico' },
              ]
                .filter((c) => c.slug !== slug)
                .map((c) => (
                  <Link
                    key={c.slug}
                    href={`/categorias/${c.slug}`}
                    className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:border-gold hover:text-gold transition-all"
                  >
                    {c.label}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>

      <CTABanner
        title={`¿Interesado en ${category.name}?`}
        subtitle="Habla con un consejero y comienza tu camino profesional."
      />
    </>
  )
}
