import Link from 'next/link'
import { Sparkles, Heart, Briefcase, Wrench, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Heart,
  Briefcase,
  Wrench,
}

const categoryStyles: Record<string, { gradient: string; iconBg: string; iconColor: string; border: string }> = {
  belleza: {
    gradient: 'from-gold-50 to-white',
    iconBg: 'bg-gold/10',
    iconColor: 'text-gold-dark',
    border: 'hover:border-gold/50',
  },
  salud: {
    gradient: 'from-emerald-50 to-white',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-700',
    border: 'hover:border-emerald-300',
  },
  comercial: {
    gradient: 'from-blue-50 to-white',
    iconBg: 'bg-navy/10',
    iconColor: 'text-navy',
    border: 'hover:border-navy/30',
  },
  tecnico: {
    gradient: 'from-violet-50 to-white',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-700',
    border: 'hover:border-violet-300',
  },
}

interface CategoryCardProps {
  category: Category
  programCount?: number
  className?: string
}

export default function CategoryCard({ category, programCount, className }: CategoryCardProps) {
  const Icon = iconMap[category.icon ?? 'Sparkles'] ?? Sparkles
  const style = categoryStyles[category.slug] ?? categoryStyles.belleza

  return (
    <Link
      href={`/categorias/${category.slug}`}
      className={cn(
        'group relative flex flex-col gap-4 p-6',
        'rounded-2xl border border-gray-100',
        'bg-gradient-to-br',
        style.gradient,
        style.border,
        'transition-all duration-300',
        'hover:shadow-card-hover hover:-translate-y-1',
        className
      )}
    >
      {/* Icon */}
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center', style.iconBg)}>
        <Icon className={cn('h-7 w-7', style.iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className="text-xl font-bold text-navy mb-1">{category.name}</h3>
        {category.description && (
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {programCount !== undefined && (
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {programCount} {programCount === 1 ? 'programa' : 'programas'}
          </span>
        )}
        <div className="flex items-center gap-1 text-sm font-semibold text-gold group-hover:gap-2 transition-all">
          <span>Explorar</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
