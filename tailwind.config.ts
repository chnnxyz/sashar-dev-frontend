import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0d0d0f',
        'bg-surface': '#161619',
        'bg-card': '#1f1f24',
        'purple': {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#6d28d9',
          glow: '#7c3aed',
        },
        'border-subtle': '#2d2d35',
        'text-body': '#e5e7eb',
        'text-muted': '#9ca3af',
      },
      fontFamily: {
        sans: ['Archivo', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'inset-field': 'inset 0 1px 3px rgba(0,0,0,0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config
