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
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
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
      },
    },
  },
  plugins: [],
}

export default config
