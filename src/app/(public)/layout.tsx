import { Suspense } from 'react'
import { Space_Grotesk } from 'next/font/google'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageViewTracker from '@/components/analytics/PageViewTracker'

// Tipografía display (titulares) — coherente con el generador de posts.
const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' })

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} flex flex-col min-h-screen`}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
