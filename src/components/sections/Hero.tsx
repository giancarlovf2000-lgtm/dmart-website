import Link from 'next/link'
import { ArrowRight, Phone, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import MediaSlot from '@/components/ui/MediaSlot'

interface HeroProps {
  title?: string
  subtitle?: string
  showCampuses?: boolean
}

// Slot de video de fondo: sube /public/media/hero.mp4 y pon la ruta aquí para activarlo.
const HERO_VIDEO: string | null = null
// Slot de imagen del visual derecho: sube /public/media/hero.jpg y pon la ruta aquí.
const HERO_IMAGE: string | undefined = undefined

export default function Hero({
  title = 'Tu Conexión Al Futuro',
  subtitle = 'Programas vocacionales acreditados en Belleza, Salud, Comercial y Técnico. Con recintos en Barranquitas y Vega Alta, Puerto Rico.',
  showCampuses = true,
}: HeroProps) {
  const words = title.trim().split(' ')
  const lastWord = words.length > 1 ? words.pop() : null

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-black">
      {/* Fondo por capas */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-800 via-black to-black" />
        <div className="absolute -right-40 -top-40 h-[38rem] w-[38rem] rounded-full bg-gold/20 blur-[120px]" />
        <div className="absolute -bottom-52 -left-40 h-[34rem] w-[34rem] rounded-full bg-gold/10 blur-[130px]" />
        <div className="absolute inset-0 bg-grid-dark opacity-40" />
        {HERO_VIDEO && (
          <>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video className="absolute inset-0 h-full w-full object-cover opacity-40" autoPlay muted loop playsInline>
              <source src={HERO_VIDEO} />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/50" />
          </>
        )}
      </div>

      <div className="container-custom relative z-10 py-24 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Columna de texto */}
          <div className="animate-slide-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-4 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-gold" />
              <span className="text-sm font-semibold tracking-wide text-gold">
                Institución Postsecundaria Acreditada · ACCSC
              </span>
            </div>

            <h1 className="mb-6 text-balance font-display text-5xl font-bold leading-[1.03] text-white md:text-6xl lg:text-7xl">
              {lastWord ? (
                <>
                  {words.join(' ')} <span className="text-gold">{lastWord}</span>
                </>
              ) : (
                title
              )}
            </h1>

            <p className="mb-9 max-w-xl text-lg leading-relaxed text-gray-300 md:text-xl">
              {subtitle}
            </p>

            <div className="mb-11 flex flex-col gap-4 sm:flex-row">
              <Link href="/admisiones">
                <Button variant="gold" size="xl" className="text-lg font-bold shadow-gold">
                  Comienza Tu Matrícula
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/programas">
                <Button variant="outline" size="xl" className="border-white/30 text-lg text-white hover:bg-white hover:text-black">
                  Ver Todos los Programas
                </Button>
              </Link>
            </div>

            {showCampuses && (
              <div className="flex flex-col gap-4 sm:flex-row">
                {[
                  { name: 'Barranquitas', tel: '7878576929', display: '(787) 857-6929' },
                  { name: 'Vega Alta', tel: '7878838180', display: '(787) 883-8180' },
                ].map((c) => (
                  <a
                    key={c.tel}
                    href={`tel:${c.tel}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 transition-all duration-200 hover:border-gold/40 hover:bg-white/[0.08]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/20">
                      <Phone className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">{c.name}</p>
                      <p className="text-sm font-semibold text-white">{c.display}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Columna visual (composición de marca + slot de foto) */}
          <div className="relative hidden lg:block">
            <div className="absolute -inset-8 glow-red opacity-30" />
            <div className="relative">
              <MediaSlot
                src={HERO_IMAGE}
                icon={GraduationCap}
                className="aspect-[4/5] w-full rounded-[2rem] border border-white/10 shadow-2xl"
                alt="Estudiantes de D'Mart Institute"
                priority
                sizes="(max-width: 1024px) 0px, 45vw"
              />
              {/* Tarjeta flotante: acreditación */}
              <div className="absolute -left-6 top-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 shadow-xl backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
                  <ShieldCheck className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Acreditada ACCSC</p>
                  <p className="text-[11px] text-gray-400">Autorizada en Puerto Rico</p>
                </div>
              </div>
              {/* Tarjeta flotante: programas */}
              <div className="absolute -right-6 bottom-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/70 px-4 py-3 shadow-xl backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
                  <Sparkles className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">10+ Programas</p>
                  <p className="text-[11px] text-gray-400">Belleza · Salud · Técnico</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fade inferior hacia la siguiente sección */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  )
}
