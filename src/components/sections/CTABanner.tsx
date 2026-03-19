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
  subtitle = 'Habla con un consejero de admisiones hoy mismo. Sin costo, sin compromiso.',
  primaryLabel = 'Solicitar Información',
  primaryHref = '/contactanos',
  secondaryLabel = 'Llamar Ahora',
  secondaryHref = 'tel:7878576929',
  variant = 'navy',
}: CTABannerProps) {
  const isNavy = variant === 'navy'

  const isExternalOrTel = (href: string) =>
    href.startsWith('tel:') || href.startsWith('mailto:') || href.startsWith('http')

  return (
    <section
      className={
        isNavy
          ? 'bg-navy py-16 md:py-20'
          : 'bg-gold py-16 md:py-20'
      }
    >
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Text */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl md:text-4xl font-black mb-3 text-white">
              {title}
            </h2>
            <p className={`text-lg ${isNavy ? 'text-gray-300' : 'text-white/80'}`}>
              {subtitle}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            {isExternalOrTel(primaryHref) ? (
              <a href={primaryHref}>
                <Button
                  variant={isNavy ? 'gold' : 'primary'}
                  size="lg"
                  className="whitespace-nowrap"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            ) : (
              <Link href={primaryHref}>
                <Button
                  variant={isNavy ? 'gold' : 'primary'}
                  size="lg"
                  className="whitespace-nowrap"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {isExternalOrTel(secondaryHref) ? (
              <a href={secondaryHref}>
                <Button
                  variant="outline"
                  size="lg"
                  className="whitespace-nowrap border-white/40 text-white hover:bg-white hover:text-black"
                >
                  <Phone className="h-4 w-4" />
                  {secondaryLabel}
                </Button>
              </a>
            ) : (
              <Link href={secondaryHref}>
                <Button
                  variant="outline"
                  size="lg"
                  className="whitespace-nowrap border-white/40 text-white hover:bg-white hover:text-black"
                >
                  <Phone className="h-4 w-4" />
                  {secondaryLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
