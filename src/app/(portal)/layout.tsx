import { Space_Grotesk, Plus_Jakarta_Sans } from 'next/font/google'

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
      {children}
    </div>
  )
}
