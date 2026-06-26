import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google'
import PwaRegister from '@/components/portal/PwaRegister'

export const metadata: Metadata = {
  applicationName: "Portal D'Mart",
  appleWebApp: { capable: true, title: "Portal D'Mart", statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: '#D40000' }

const display = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${body.variable} font-body min-h-screen bg-surface text-ink`}>
      <PwaRegister />
      {children}
    </div>
  )
}
