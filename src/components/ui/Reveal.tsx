'use client'

import { useEffect, useRef, useState } from 'react'

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** Retraso en ms (para efecto escalonado en grids). */
  delay?: number
  /** Distancia inicial en px (por defecto 24). */
  y?: number
}

type Phase = 'idle' | 'hidden' | 'shown'

/**
 * Anima la entrada (fade + slide-up) cuando el elemento entra en viewport.
 * Seguro sin JS/SSR: renderiza VISIBLE por defecto ('idle') y solo se oculta
 * para animar si hay JS y el elemento aún no está en pantalla. Respeta
 * prefers-reduced-motion. Sin dependencias externas.
 */
export default function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('idle')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || !('IntersectionObserver' in window)) { setPhase('shown'); return }

    // Si ya está (casi) visible al montar, mostrar sin animar para evitar parpadeo.
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight * 0.92) { setPhase('shown'); return }

    setPhase('hidden')
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setPhase('shown'); io.disconnect() } },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const style: React.CSSProperties =
    phase === 'hidden'
      ? { opacity: 0, transform: `translateY(${y}px)` }
      : phase === 'shown'
        ? {
            opacity: 1,
            transform: 'none',
            transition: `opacity 0.6s ease ${delay}ms, transform 0.7s cubic-bezier(0.2,0.7,0.2,1) ${delay}ms`,
          }
        : {} // idle: visible, sin estilos (seguro sin JS)

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
