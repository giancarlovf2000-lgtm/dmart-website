import { Suspense } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import PageViewTracker from '@/components/analytics/PageViewTracker'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}
