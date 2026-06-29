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
        primary: {
          light: '#3b82f6',
          DEFAULT: '#2563EB',
          dark: '#1E40AF',
        },
        secondary: {
          light: '#2563eb',
          DEFAULT: '#1E40AF',
          dark: '#172554',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        darkbg: {
          DEFAULT: '#0B0F19',
          card: '#161F30',
          border: '#1F2E45'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
