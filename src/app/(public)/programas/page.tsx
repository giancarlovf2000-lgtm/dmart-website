'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Clock, Award, BookOpen } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import CTABanner from '@/components/sections/CTABanner'
import { cn, STATIC_PROGRAMS, STATIC_CATEGORIES } from '@/lib/utils'

const categoryColors: Record<string, { tab: string; badge: 'gold' | 'green' | 'navy' | 'violet'; card: string }> = {
  all: { tab: 'bg-navy text-white', badge: 'navy', card: '' },
  belleza: { tab: 'bg-gold text-navy', badge: 'gold', card: 'border-l-gold hover:bg-gold-50' },
  salud: { tab: 'bg-emerald-600 text-white', badge: 'green', card: 'border-l-emerald-500 hover:bg-emerald-50' },
  comercial: { tab: 'bg-navy text-white', badge: 'navy', card: 'border-l-navy hover:bg-blue-50' },
  tecnico: { tab: 'bg-violet-600 text-white', badge: 'violet', card: 'border-l-violet-500 hover:bg-violet-50' },
}

const staticPrograms = STATIC_PROGRAMS.map((p) => ({
  ...p,
  category: STATIC_CATEGORIES.find((c) => c.id === p.category_id) ?? null,
}))

export default function ProgramasPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const programs = staticPrograms
  const categories = STATIC_CATEGORIES
  const loading = false

  const filtered = programs.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category?.slug === activeCategory
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <>
      {/* Header */}
      <section className="bg-gradient-navy py-20 md:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <Badge variant="gold" size="md" className="mb-4">Formación Profesional</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-5">
              Nuestros Programas
            </h1>
            <p className="text-gray-300 text-xl leading-relaxed">
              Programas acreditados en Belleza, Salud, Comercial y Técnico. Encuentra el programa
              que transformará tu carrera.
            </p>
          </div>
        </div>
      </section>

      {/* Filter + Search */}
      <section className="sticky top-16 md:top-20 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                  activeCategory === 'all'
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Todos
              </button>
              {categories.map((cat) => {
                const style = categoryColors[cat.slug] ?? categoryColors.belleza
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={cn(
                      'px-4 py-1.5 rounded-full text-sm font-semibold transition-all',
                      activeCategory === cat.slug
                        ? style.tab + ' shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {cat.name}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="relative sm:ml-auto w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Buscar programa…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Programs grid */}
      <section className="section-padding">
        <div className="container-custom">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg mb-4">
                No se encontraron programas{searchQuery ? ` para "${searchQuery}"` : ''}.
              </p>
              <button
                onClick={() => { setActiveCategory('all'); setSearchQuery('') }}
                className="text-gold font-semibold hover:underline"
              >
                Ver todos los programas
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 mb-8">
                Mostrando <strong>{filtered.length}</strong> {filtered.length === 1 ? 'programa' : 'programas'}
                {activeCategory !== 'all' && ` en ${categories.find(c => c.slug === activeCategory)?.name}`}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((program) => {
                  const catSlug = program.category?.slug ?? 'belleza'
                  const style = categoryColors[catSlug] ?? categoryColors.belleza
                  return (
                    <Link
                      key={program.id}
                      href={`/programas/${program.slug}`}
                      className={cn(
                        'group card-base border-l-4 flex flex-col overflow-hidden transition-all duration-300',
                        'hover:-translate-y-1 hover:shadow-card-hover',
                        style.card
                      )}
                    >
                      <div className="p-6 flex flex-col flex-1">
                        {program.category && (
                          <Badge variant={style.badge} className="mb-3 self-start">
                            {program.category.name}
                          </Badge>
                        )}
                        <h3 className="text-lg font-bold text-navy mb-2 line-clamp-2 group-hover:text-navy-700">
                          {program.name}
                        </h3>
                        {program.description && (
                          <p className="text-sm text-gray-500 line-clamp-3 flex-1 mb-4 leading-relaxed">
                            {program.description}
                          </p>
                        )}
                        {(program.duration_weeks || program.credits || program.hours) && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            {program.duration_weeks && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Clock className="h-3.5 w-3.5 text-gold" />
                                <span>{program.duration_weeks} semanas</span>
                              </div>
                            )}
                            {program.credits && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Award className="h-3.5 w-3.5 text-gold" />
                                <span>{program.credits} créditos</span>
                              </div>
                            )}
                            {program.hours && (
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <BookOpen className="h-3.5 w-3.5 text-gold" />
                                <span>{program.hours} horas</span>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm font-bold text-gold group-hover:gap-2 transition-all">
                          Ver detalles <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Saturday courses link */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom text-center">
          <p className="text-gray-600 mb-4">
            ¿Buscas cursos cortos? Explora nuestros <strong>Privados Sabatinos</strong> — tecnología y marketing los sábados.
          </p>
          <Link
            href="/privados-sabatinos"
            className="inline-flex items-center gap-2 text-gold font-bold hover:text-gold-dark transition-colors"
          >
            Ver Privados Sabatinos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <CTABanner />
    </>
  )
}
