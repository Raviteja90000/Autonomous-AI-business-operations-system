/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        auren: {
          bg: '#EFECE6',
          bgSubtle: '#E8E3DA',
          card: '#FAF8F5',
          cardHover: '#FFFFFF',
          border: '#DDD5CA',
          borderHover: '#C8BEB0',
          dark: '#181716',
          darkCard: '#1E1D1B',
          darkBorder: '#35312C',
          textPrimary: '#1C1917',
          textSecondary: '#78716C',
          textMuted: '#A8A29E',
        },
        copper: {
          50: '#FBF6F1',
          100: '#F5E9DF',
          200: '#ECD2C0',
          300: '#DFB59D',
          400: '#D29777',
          500: '#C5855A',
          600: '#B27045',
          700: '#8E5633',
          850: '#5F3920',
          900: '#422716',
        },
        brand: {
          bg: '#EFECE6',
          card: '#FAF8F5',
          cardHover: '#FFFFFF',
          border: '#DDD5CA',
          borderHover: '#C8BEB0',
          cyan: '#C5855A', // Maps to copper accent
          indigo: '#475569',
          emerald: '#16A34A',
          amber: '#D97706',
          rose: '#DC2626',
          purple: '#8B5534',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'auren-sm': '0 2px 8px rgba(28, 25, 23, 0.03)',
        'auren-md': '0 4px 20px rgba(28, 25, 23, 0.05)',
        'auren-lg': '0 12px 36px rgba(28, 25, 23, 0.08)',
        'auren-dark': '0 10px 30px rgba(0, 0, 0, 0.35)',
        'copper-glow': '0 0 20px -2px rgba(197, 133, 90, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      }
    },
  },
  plugins: [],
}
