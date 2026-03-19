import Link from 'next/link'
import { Clock, BookOpen, Award, ArrowRight } from 'lucide-react'
import Badge from './Badge'
import { cn } from '@/lib/utils'
interface ProgramCardProps {
  program: {
    id: string
    name: string
    slug: string
    description?: string | null
    duration_weeks?: number | null
    credits?: number | null
    hours?: number | null
    category?: { name: string; slug: string } | null
  }
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

const categoryVariants: Record<string, { badge: 'gold' | 'navy' | 'green' | 'violet'; accent: string; bg: string }> = {
  belleza: { badge: 'gold', accent: 'border-l-gold', bg: 'hover:bg-gold-50' },
  salud: { badge: 'green', accent: 'border-l-emerald-500', bg: 'hover:bg-emerald-50' },
  comercial: { badge: 'navy', accent: 'border-l-navy', bg: 'hover:bg-blue-50' },
  tecnico: { badge: 'violet', accent: 'border-l-violet-500', bg: 'hover:bg-violet-50' },
}

export default function ProgramCard({ program, variant = 'default', className }: ProgramCardProps) {
  const categorySlug = program.category?.slug ?? 'belleza'
  const style = categoryVariants[categorySlug] ?? categoryVariants.belleza

  if (variant === 'compact') {
    return (
      <Link
        href={`/programas/${program.slug}`}
        className={cn(
          'group flex items-center gap-4 p-4 rounded-xl',
          'border border-gray-100 bg-white',
          'hover:border-gold hover:shadow-gold/10 hover:shadow-md',
          'transition-all duration-200',
          className
        )}
      >
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy text-sm line-clamp-1">{program.name}</p>
          {program.category && (
            <p className="text-xs text-gray-500 mt-0.5">{program.category.name}</p>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-gold flex-shrink-0 group-hover:translate-x-1 transition-transform" />
      </Link>
    )
  }

  return (
    <Link
      href={`/programas/${program.slug}`}
      className={cn(
        'group card-base card-hover',
        'border-l-4',
        style.accent,
        'flex flex-col',
        'overflow-hidden',
        className
      )}
    >
      <div className={cn('p-6 flex flex-col flex-1', style.bg, 'transition-colors duration-200')}>
        {/* Category badge */}
        {program.category && (
          <div className="mb-3">
            <Badge variant={style.badge}>{program.category.name}</Badge>
          </div>
        )}

        {/* Program name */}
        <h3 className="text-lg font-bold text-navy mb-2 group-hover:text-navy-700 line-clamp-2">
          {program.name}
        </h3>

        {/* Description */}
        {program.description && (
          <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 flex-1 mb-4">
            {program.description}
          </p>
        )}

        {/* Stats */}
        {(program.duration_weeks || program.credits || program.hours) && (
          <div className="flex flex-wrap gap-3 mb-4">
            {program.duration_weeks && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Clock className="h-3.5 w-3.5 text-gold" />
                <span>{program.duration_weeks} semanas</span>
              </div>
            )}
            {program.credits && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Award className="h-3.5 w-3.5 text-gold" />
                <span>{program.credits} créditos</span>
              </div>
            )}
            {program.hours && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <BookOpen className="h-3.5 w-3.5 text-gold" />
                <span>{program.hours} horas</span>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-2 text-sm font-semibold text-gold group-hover:gap-3 transition-all duration-200">
          <span>Ver programa</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
