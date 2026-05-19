import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = "D'Mart Institute — Tu Carrera. Tu Futuro. Empieza Aquí."
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a1628',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Top gold bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 14, background: '#c9a227', display: 'flex' }} />

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

          {/* Brand name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span style={{
              fontSize: 120,
              fontWeight: 900,
              color: 'white',
              letterSpacing: -5,
              lineHeight: 1,
            }}>
              D&apos;MART
            </span>
            <span style={{
              fontSize: 32,
              fontWeight: 700,
              color: '#c9a227',
              letterSpacing: 20,
            }}>
              INSTITUTE
            </span>
          </div>

          {/* Divider */}
          <div style={{ width: 100, height: 4, background: '#c9a227', display: 'flex', borderRadius: 2 }} />

          {/* Tagline */}
          <span style={{
            fontSize: 40,
            color: 'rgba(255,255,255,0.88)',
            textAlign: 'center',
            fontWeight: 500,
            lineHeight: 1.2,
          }}>
            Tu Carrera. Tu Futuro. Empieza Aquí.
          </span>

          {/* Location */}
          <span style={{
            fontSize: 22,
            color: 'rgba(255,255,255,0.38)',
            textAlign: 'center',
            letterSpacing: 3,
          }}>
            BARRANQUITAS · VEGA ALTA · PUERTO RICO
          </span>
        </div>

        {/* Bottom gold bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, background: '#c9a227', display: 'flex' }} />
      </div>
    ),
    { ...size }
  )
}
