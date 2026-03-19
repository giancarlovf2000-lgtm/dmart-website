import ProgramCard from '@/components/ui/ProgramCard'
import type { Program, Category } from '@/lib/types'

interface ProgramsGridProps {
  programs: (Program & { category?: Category })[]
  title?: string
  subtitle?: string
  emptyMessage?: string
}

export default function ProgramsGrid({
  programs,
  title,
  subtitle,
  emptyMessage = 'No hay programas disponibles en esta categoría.',
}: ProgramsGridProps) {
  return (
    <div>
      {(title || subtitle) && (
        <div className="mb-10">
          {title && (
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-3">{title}</h2>
          )}
          {subtitle && (
            <p className="text-gray-600 text-lg max-w-2xl">{subtitle}</p>
          )}
        </div>
      )}

      {programs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  )
}
