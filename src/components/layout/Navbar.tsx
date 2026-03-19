'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown, Phone } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const programDropdown = [
  { label: 'Belleza', href: '/categorias/belleza', description: 'Cosmetología, Barbería, Uñas y más' },
  { label: 'Salud', href: '/categorias/salud', description: 'Enfermería Práctica' },
  { label: 'Comercial', href: '/categorias/comercial', description: 'Administración de Oficina' },
  { label: 'Técnico', href: '/categorias/tecnico', description: 'Electricidad, Mecánica, Refrigeración' },
  { label: 'Privados Sabatinos', href: '/privados-sabatinos', description: 'Cursos cortos los sábados' },
]

const navLinks = [
  { label: 'Inicio', href: '/' },
  { label: 'Programas', href: '/programas', dropdown: programDropdown },
  { label: 'Recintos', href: '/recintos' },
  { label: 'Admisiones', href: '/admisiones' },
  { label: 'Servicios', href: '/servicios-estudiantiles' },
  { label: 'Nosotros', href: '/sobre-nosotros' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [programsOpen, setProgramsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Scroll listener for shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
    setProgramsOpen(false)
  }, [pathname])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProgramsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-white transition-shadow duration-300',
        scrolled ? 'shadow-navy/10 shadow-md' : 'shadow-sm border-b border-gray-100'
      )}
    >
      <div className="container-custom">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group" aria-label="D'Mart Institute — Inicio">
            <Image
              src="/logo.png"
              alt="D'Mart Institute"
              width={160}
              height={52}
              className="h-16 w-auto object-contain group-hover:scale-105 transition-transform"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navegación principal">
            {navLinks.map((link) => {
              if (link.dropdown) {
                return (
                  <div key={link.label} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProgramsOpen((v) => !v)}
                      className={cn(
                        'flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                        isActive(link.href)
                          ? 'text-gold bg-gold-50'
                          : 'text-gray-700 hover:text-navy hover:bg-gray-50'
                      )}
                      aria-expanded={programsOpen}
                      aria-haspopup="true"
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          programsOpen && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Dropdown panel */}
                    {programsOpen && (
                      <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-2 mb-1">
                          <Link
                            href="/programas"
                            className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gold transition-colors"
                          >
                            Ver todos los programas →
                          </Link>
                        </div>
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col px-4 py-3 hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-semibold text-navy">{item.label}</span>
                            <span className="text-xs text-gray-500 mt-0.5">{item.description}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive(link.href)
                      ? 'text-gold bg-gold-50'
                      : 'text-gray-700 hover:text-navy hover:bg-gray-50'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:7878576929"
              className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gold transition-colors"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>(787) 857-6929</span>
            </a>
            <Link href="/admisiones">
              <Button variant="gold" size="sm">
                Matrícula Ahora
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-navy" />
            ) : (
              <Menu className="h-6 w-6 text-navy" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-xl animate-slide-up">
          <nav className="container-custom py-4 space-y-1" aria-label="Navegación móvil">
            {navLinks.map((link) => {
              if (link.dropdown) {
                return (
                  <div key={link.label}>
                    <button
                      onClick={() => setProgramsOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {link.label}
                      <ChevronDown
                        className={cn('h-4 w-4 transition-transform', programsOpen && 'rotate-180')}
                      />
                    </button>
                    {programsOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gold/20 pl-4">
                        <Link
                          href="/programas"
                          className="block py-2 text-xs font-bold text-gold uppercase tracking-wider"
                        >
                          Ver todos los programas
                        </Link>
                        {link.dropdown.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="block py-2.5 text-sm font-semibold text-gray-700 hover:text-navy"
                          >
                            {item.label}
                            <span className="block text-xs font-normal text-gray-400">{item.description}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    'block px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                    isActive(link.href) ? 'bg-gold-50 text-gold' : 'text-gray-700 hover:bg-gray-50 hover:text-navy'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}

            {/* Mobile CTA */}
            <div className="pt-4 pb-2 space-y-3 border-t border-gray-100 mt-4">
              <Link href="/admisiones" className="block">
                <Button variant="gold" size="md" fullWidth>
                  Matrícula Ahora
                </Button>
              </Link>
              <div className="flex gap-4 justify-center text-sm">
                <a href="tel:7878576929" className="text-gray-500 hover:text-gold font-medium">
                  Barranquitas: (787) 857-6929
                </a>
              </div>
              <div className="flex gap-4 justify-center text-sm">
                <a href="tel:7878838180" className="text-gray-500 hover:text-gold font-medium">
                  Vega Alta: (787) 883-8180
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
