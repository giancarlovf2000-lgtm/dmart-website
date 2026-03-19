import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Clock, Facebook, Instagram, Youtube, ArrowRight } from 'lucide-react'
import { ACCREDITATIONS, CAMPUS_HOURS } from '@/lib/utils'

const footerPrograms = [
  { label: 'Cosmetología', href: '/programas/cosmetologia' },
  { label: 'Barbería y Estilismo', href: '/programas/barberia-y-estilismo' },
  { label: 'Técnica de Uñas', href: '/programas/tecnica-de-unas' },
  { label: 'Estética y Maquillaje', href: '/programas/estetica-y-maquillaje' },
  { label: 'Supermaster', href: '/programas/supermaster' },
  { label: 'Enfermería Práctica', href: '/programas/enfermeria-practica' },
  { label: 'Administración de Oficina', href: '/programas/administracion-de-sistemas-de-oficina' },
  { label: 'Técnico de Electricidad', href: '/programas/tecnico-de-electricidad' },
  { label: 'Mecánica Automotriz', href: '/programas/tecnico-de-mecanica-automotriz' },
  { label: 'Refrigeración y A/C', href: '/programas/tecnico-de-refrigeracion' },
]

const footerLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Programas', href: '/programas' },
  { label: 'Privados Sabatinos', href: '/privados-sabatinos' },
  { label: 'Recintos', href: '/recintos' },
  { label: 'Admisiones', href: '/admisiones' },
  { label: 'Servicios Estudiantiles', href: '/servicios-estudiantiles' },
  { label: 'Sobre Nosotros', href: '/sobre-nosotros' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Preguntas Frecuentes', href: '/preguntas-frecuentes' },
  { label: 'Contáctanos', href: '/contactanos' },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-navy text-white">
      {/* Main footer content */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="xl:col-span-1">
            {/* Logo */}
            <Link href="/" className="inline-flex mb-5 group">
              <Image
                src="/logo.png"
                alt="D'Mart Institute"
                width={180}
                height={60}
                className="h-16 w-auto object-contain group-hover:opacity-90 transition-opacity"
              />
            </Link>

            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Institución postsecundaria acreditada en Puerto Rico. Formamos profesionales en Belleza,
              Salud, Comercial y Técnico con programas de calidad.
            </p>

            {/* Accreditations */}
            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Acreditaciones</p>
              {ACCREDITATIONS.map((acc) => (
                <div key={acc.abbr} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[7px] font-black text-gold">{acc.abbr.charAt(0)}</span>
                  </div>
                  <span className="text-xs text-gray-400">{acc.name}</span>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a
                href="https://facebook.com/dmartinstitute"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-gold/20 border border-white/10 flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 text-gray-400 hover:text-gold" />
              </a>
              <a
                href="https://instagram.com/dmartinstitute"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-gold/20 border border-white/10 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 text-gray-400 hover:text-gold" />
              </a>
              <a
                href="https://youtube.com/@dmartinstitute"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-gold/20 border border-white/10 flex items-center justify-center transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4 text-gray-400 hover:text-gold" />
              </a>
            </div>
          </div>

          {/* Programs column */}
          <div>
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-5">Programas</h4>
            <ul className="space-y-2.5">
              {footerPrograms.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gold transition-colors group"
                  >
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/privados-sabatinos"
                  className="flex items-center gap-1.5 text-sm text-gold/80 hover:text-gold transition-colors group font-semibold"
                >
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                  Privados Sabatinos
                </Link>
              </li>
            </ul>
          </div>

          {/* Links column */}
          <div>
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-5">Institución</h4>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-5">Contáctanos</h4>

            <div className="space-y-5">
              {/* Barranquitas */}
              <div>
                <p className="text-xs font-bold text-gold/80 uppercase tracking-wider mb-2">Barranquitas</p>
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 text-gold/60 flex-shrink-0 mt-0.5" />
                    <span>Urb. San Cristóbal #12 Calle B, Zona Industrial, PR 00794</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-400">
                    <Phone className="h-4 w-4 text-gold/60 flex-shrink-0 mt-0.5" />
                    <a href="tel:7878576929" className="hover:text-gold transition-colors">
                      (787) 857-6929
                    </a>
                  </div>
                </div>
              </div>

              {/* Vega Alta */}
              <div>
                <p className="text-xs font-bold text-gold/80 uppercase tracking-wider mb-2">Vega Alta</p>
                <div className="space-y-1.5">
                  <div className="flex gap-2 text-sm text-gray-400">
                    <MapPin className="h-4 w-4 text-gold/60 flex-shrink-0 mt-0.5" />
                    <span>Centro Gran Caribe, Ave. Luis Meléndez Class, PR 00692</span>
                  </div>
                  <div className="flex gap-2 text-sm text-gray-400">
                    <Phone className="h-4 w-4 text-gold/60 flex-shrink-0 mt-0.5" />
                    <a href="tel:7878838180" className="hover:text-gold transition-colors">
                      (787) 883-8180
                    </a>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-gold/60" />
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horario</p>
                </div>
                <div className="space-y-1">
                  {CAMPUS_HOURS.map((h) => (
                    <div key={h.label} className="flex justify-between text-xs text-gray-500">
                      <span>{h.label}</span>
                      <span className="text-gray-400">{h.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="container-custom py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>
              © {currentYear} D'Mart Institute. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span>Barranquitas & Vega Alta, Puerto Rico</span>
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <Link href="/sitemap.xml" className="hover:text-gray-300 transition-colors">
                Mapa del Sitio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
