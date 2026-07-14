import Link from 'next/link'
import { ArrowRight, Phone } from 'lucide-react'
import Button from '@/components/ui/Button'

interface CTABannerProps {
  title?: string
  subtitle?: string
  primaryLabel?: string
  primaryHref?: string
  secondaryLabel?: string
  secondaryHref?: string
  variant?: 'navy' | 'gold'
}

export default function CTABanner({
  title = '¿Listo para comenzar tu nueva carrera?',
  subtitle = 'Habla con un representante de admisiones hoy mismo. Sin costo, sin compromiso.',
  primaryLabel = 'Solicitar Información',
  primaryHref = '/contactanos',
  secondaryLabel = 'Llamar Ahora',
  secondaryHref = 'tel:7878576929',
  variant = 'navy',
}: CTABannerProps) {
  const isNavy = variant === 'navy'
  const isExternalOrTel = (href: string) =>
    href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http')

  const Primary = (
    <Button variant={isNavy ? 'gold' : 'primary'} size="lg" className="whitespace-nowrap shadow-gold">
      {primaryLabel}
      <ArrowRight className="h-4 w-4" />
    </Button>
  )
  const Secondary = (
    <Button variant="outline" size="lg" className="whitespace-nowrap border-white/30 text-white hover:bg-white hover:text-black">
      <Phone className="h-4 w-4" />
      {secondaryLabel}
    </Button>
  )

  return (
    <section className={`relative overflow-hidden py-16 md:py-20 ${isNavy ? 'bg-black' : 'bg-gold'}`}>
      {/* Decoración */}
      {isNavy ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-grid-dark opacity-30" />
          <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-gold/25 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
      )}

      <div className="container-custom relative">
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <div className="text-center lg:text-left">
            <h2 className="mb-3 font-display text-3xl font-bold text-white md:text-5xl">{title}</h2>
            <p className={`text-lg ${isNavy ? 'text-gray-300' : 'text-white/85'}`}>{subtitle}</p>
          </div>

          <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row">
            {isExternalOrTel(primaryHref) ? <a href={primaryHref}>{Primary}</a> : <Link href={primaryHref}>{Primary}</Link>}
            {isExternalOrTel(secondaryHref) ? <a href={secondaryHref}>{Secondary}</a> : <Link href={secondaryHref}>{Secondary}</Link>}
          </div>
        </div>
      </div>
    </section>
  )
}
