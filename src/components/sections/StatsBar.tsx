import { Building2, GraduationCap, BookOpen, Calendar } from 'lucide-react'

const stats = [
  {
    icon: Building2,
    value: '2',
    label: 'Recintos en Puerto Rico',
  },
  {
    icon: BookOpen,
    value: '10+',
    label: 'Programas Acreditados',
  },
  {
    icon: GraduationCap,
    value: '56',
    label: 'Semanas de Duración',
  },
  {
    icon: Calendar,
    value: '3',
    label: 'Acreditaciones Activas',
  },
]

export default function StatsBar() {
  return (
    <section className="bg-navy py-14">
      <div className="container-custom">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="text-center group">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                  <Icon className="h-6 w-6 text-gold" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
