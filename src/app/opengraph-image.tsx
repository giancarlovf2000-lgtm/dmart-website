import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import path from 'path'

export const alt = "D'Mart Institute — Tu Carrera. Tu Futuro. Empieza Aquí."
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  const logoBuffer = readFileSync(path.join(process.cwd(), 'public/logo.png'))
  const logoSrc = `data:image/png;base64,${logoBuffer.toString('base64')}`

  return new ImageResponse(
    (
      <div
        style={{
          background: '#ffffff',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Real logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={700} height={394} alt="D'Mart Institute" />

        {/* Tagline */}
        <span
          style={{
            fontSize: 28,
            color: '#374151',
            marginTop: 16,
            letterSpacing: 0.5,
          }}
        >
          Tu Carrera. Tu Futuro. Empieza Aquí.
        </span>

        {/* Bottom gold bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 12,
            background: '#c9a227',
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
