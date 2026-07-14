import { Building2, GraduationCap, BookOpen, Calendar } from 'lucide-react'

const stats = [
  { icon: Building2, value: '2', label: 'Recintos en Puerto Rico' },
  { icon: BookOpen, value: '10+', label: 'Programas Autorizados' },
  { icon: GraduationCap, value: 'En Pocas Semanas Te Gradúas', label: '' },
  { icon: Calendar, value: 'Autorizada y Acreditada', label: '' },
]

export default function StatsBar() {
  return (
    <section className="relative overflow-hidden bg-black py-16">
      <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[40rem] -translate-x-1/2 glow-red opacity-20" />
      <div className="container-custom relative">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            const isNumber = stat.value.length <= 4
            return (
              <div
                key={i}
                className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.05]"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/20 transition-colors group-hover:bg-gold/20">
                  <Icon className="h-6 w-6 text-gold" />
                </div>
                {isNumber ? (
                  <div className="font-display text-5xl font-bold text-white md:text-6xl">{stat.value}</div>
                ) : (
                  <div className="font-display text-lg font-bold leading-snug text-white md:text-xl">{stat.value}</div>
                )}
                {stat.label && <div className="mt-2 text-sm font-medium text-gray-400">{stat.label}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
