import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#111111',
          800: '#1a1a1a',
          700: '#222222',
          600: '#333333',
          500: '#444444',
          400: '#555555',
        },
        gold: {
          DEFAULT: '#D40000',
          light: '#f03030',
          dark: '#a80000',
          50: '#fff0f0',
          100: '#ffd6d6',
        },
        // Portal design system — neumórfico / soft UI (iOS). Rojo = urgencia.
        ink: {
          DEFAULT: '#1C1C1E',
          muted: '#6E727A',
        },
        surface: {
          DEFAULT: '#EEF0F3',
          soft: '#E4E7EC',
        },
        accent: {
          DEFAULT: '#F5333F',
          hover: '#DA1F2B',
          soft: '#FFE9EA',
          ring: 'rgba(245,51,63,0.22)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-navy': 'linear-gradient(135deg, #111111 0%, #222222 50%, #333333 100%)',
        'gradient-gold': 'linear-gradient(135deg, #D40000 0%, #f03030 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'gold': '0 4px 24px rgba(212, 0, 0, 0.25)',
        'navy': '0 4px 24px rgba(17, 17, 17, 0.4)',
        'card': '0 2px 16px rgba(10, 22, 40, 0.08)',
        'card-hover': '0 8px 32px rgba(10, 22, 40, 0.16)',
        // Neumorfismo dual: sombra oscura abajo-derecha + brillo claro arriba-izquierda.
        'soft': '6px 8px 20px rgba(174,179,191,0.28), -6px -6px 16px rgba(255,255,255,0.7)',
        'soft-lg': '10px 14px 32px rgba(168,174,188,0.38), -8px -8px 22px rgba(255,255,255,0.8)',
        'neu-sm': '3px 4px 10px rgba(174,179,191,0.30), -3px -3px 8px rgba(255,255,255,0.75)',
        'neu-inset': 'inset 2px 2px 5px rgba(174,179,191,0.35), inset -2px -2px 5px rgba(255,255,255,0.85)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'neu': '1.5rem',
        'neu-lg': '1.75rem',
      },
    },
  },
  plugins: [],
}

export default config
