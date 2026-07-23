import type { Metadata, Viewport } from 'next'
import PwaRegister from '@/components/portal/PwaRegister'

export const metadata: Metadata = {
  applicationName: "Portal D'Mart",
  appleWebApp: { capable: true, title: "Portal D'Mart", statusBarStyle: 'default' },
  icons: { apple: '/icons/apple-touch-icon.png' },
}

export const viewport: Viewport = { themeColor: '#F5333F' }

// Tipografía nativa iOS/soft-UI (SF Pro en Apple, Segoe/Inter en el resto).
const IOS_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Inter, Roboto, system-ui, sans-serif'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-body min-h-screen bg-surface text-ink antialiased"
      style={{ ['--font-display' as string]: IOS_STACK, ['--font-body' as string]: IOS_STACK }}
    >
      <PwaRegister />
      {children}
    </div>
  )
}
