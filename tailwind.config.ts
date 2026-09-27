import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: {
          900: '#0B0F14',
          800: '#10151C',
          700: '#161C25',
          600: '#1E2631',
          500: '#2A3542'
        },
        accent: {
          DEFAULT: '#FF3B30',
          soft: '#FF6B5E'
        },
        success: '#2ED573',
        warning: '#FFB020'
      },
      borderRadius: { xl2: '1.25rem' }
    }
  },
  plugins: []
} satisfies Config
