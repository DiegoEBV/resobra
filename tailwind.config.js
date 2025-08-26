/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores inspirada en Google Drive
        primary: {
          50: '#e8f0fe',
          100: '#d2e3fc',
          200: '#aecbfa',
          300: '#8ab4f8',
          400: '#669df6',
          500: '#4285f4', // Azul secundario Google
          600: '#1a73e8', // Azul principal Google
          700: '#1967d2',
          800: '#185abc',
          900: '#174ea6',
        },
        secondary: {
          50: '#f8f9fa', // Fondo principal
          100: '#f1f3f4',
          200: '#e8eaed',
          300: '#dadce0',
          400: '#bdc1c6',
          500: '#9aa0a6',
          600: '#80868b',
          700: '#5f6368',
          800: '#3c4043',
          900: '#202124',
        },
        success: {
          50: '#e6f4ea',
          100: '#ceead6',
          200: '#a8dab5',
          300: '#81c995',
          400: '#5bb974',
          500: '#34a853', // Verde Google
          600: '#2d9334',
          700: '#137333',
          800: '#0d652d',
          900: '#0b5394',
        },
        warning: {
          50: '#fef7e0',
          100: '#feefc3',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#fbbc04', // Amarillo Google
          600: '#f59e0b',
          700: '#d97706',
          800: '#b45309',
          900: '#92400e',
        },
        danger: {
          50: '#fce8e6',
          100: '#fad2cf',
          200: '#f6aea9',
          300: '#f28b82',
          400: '#ee675c',
          500: '#ea4335', // Rojo Google
          600: '#d33b2c',
          700: '#b52d20',
          800: '#a50e0e',
          900: '#8d0801',
        },
        gdrive: {
          blue: '#1a73e8',
          'blue-light': '#4285f4',
          background: '#f8f9fa',
          sidebar: '#ffffff',
          green: '#34a853',
          yellow: '#fbbc04',
          red: '#ea4335',
          'text-primary': '#202124',
          'text-secondary': '#5f6368',
          border: '#dadce0',
          primary: '#1a73e8',
          secondary: '#4285f4',
        },
        // Colores corporativos de ingeniería civil
        civil: {
          blue: '#1a73e8',
          'lightblue': '#4285f4',
          'darkblue': '#1967d2',
          orange: '#f97316',
          'darkorange': '#ea580c',
          'lightorange': '#fb923c',
          // Variantes adicionales
          'blue-50': '#eff6ff',
          'blue-100': '#dbeafe',
          'blue-200': '#bfdbfe',
          'blue-300': '#93c5fd',
          'blue-400': '#60a5fa',
          'blue-500': '#3b82f6',
          'blue-600': '#2563eb',
          'blue-700': '#1d4ed8',
          'blue-800': '#1e40af',
          'blue-900': '#1e3a8a',
          'orange-50': '#fff7ed',
          'orange-100': '#ffedd5',
          'orange-200': '#fed7aa',
          'orange-300': '#fdba74',
          'orange-400': '#fb923c',
          'orange-500': '#f97316',
          'orange-600': '#ea580c',
          'orange-700': '#c2410c',
          'orange-800': '#9a3412',
          'orange-900': '#7c2d12',
        }
      },
      fontFamily: {
        'sans': ['Google Sans', 'Roboto', 'system-ui', 'sans-serif'],
        'google': ['Google Sans', 'sans-serif'],
        'roboto': ['Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
      },
      boxShadow: {
        'gdrive': '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)',
        'gdrive-md': '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
        'gdrive-lg': '0 2px 6px 2px rgba(60, 64, 67, 0.15), 0 8px 24px 4px rgba(60, 64, 67, 0.15)',
        'gdrive-hover': '0 1px 3px 0 rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15)',
      },
      borderRadius: {
        'gdrive': '8px',
        'gdrive-lg': '12px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [],
}