import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google'

const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })
const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'Mi cuenta · D\'Mart Institute',
  description: 'Portal de estudiantes y profesores: sube tu contenido para que la institución lo use en sus redes.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} min-h-screen bg-surface text-ink`}>
      {children}
    </div>
  )
}
