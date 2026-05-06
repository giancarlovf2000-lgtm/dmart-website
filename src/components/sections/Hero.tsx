import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import Button from '@/components/ui/Button'

interface HeroProps {
  title?: string
  subtitle?: string
  showCampuses?: boolean
}

export default function Hero({
  title = "Tu Carrera. Tu Futuro. Empieza Aquí.",
  subtitle = "Programas vocacionales acreditados en Belleza, Salud, Comercial y Técnico. Con recintos en Barranquitas y Vega Alta, Puerto Rico.",
  showCampuses = true,
}: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-navy">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Red geometric accent top right */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />
        {/* Dark accent bottom left */}
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-navy-600/80 blur-2xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A84C' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container-custom relative z-10 py-24 md:py-32">
        <div className="max-w-4xl">
          {/* Eyebrow label */}
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-gold text-sm font-semibold tracking-wide">
              Institución Postsecundaria Acreditada · ACCSC
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] mb-6 text-balance">
            {title.split('. ').map((part, i, arr) => (
              <span key={i}>
                {i === 0 ? (
                  <span className="text-gradient-gold">{part}.</span>
                ) : (
                  <span> {part}{i < arr.length - 1 ? '.' : ''}</span>
                )}
              </span>
            ))}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed mb-10">
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Link href="/admisiones">
              <Button variant="gold" size="xl" className="text-lg font-black">
                Comienza Tu Matrícula
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/programas">
              <Button
                variant="outline"
                size="xl"
                className="text-lg border-white/40 text-white hover:bg-white hover:text-black"
              >
                Ver Todos los Programas
              </Button>
            </Link>
          </div>

          {/* Quick campus contact */}
          {showCampuses && (
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="tel:7878576929"
                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-3 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Barranquitas</p>
                  <p className="text-white font-semibold text-sm">(787) 857-6929</p>
                </div>
              </a>
              <a
                href="tel:7878838180"
                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-5 py-3 transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Phone className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Vega Alta</p>
                  <p className="text-white font-semibold text-sm">(787) 883-8180</p>
                </div>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
    </section>
  )
}
