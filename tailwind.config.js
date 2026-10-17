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
          50: '#fff7f8',
          100: '#fdecef',
          200: '#fad8df',
          300: '#f4b5c3',
          400: '#ea8ca3',
          500: '#d96c89',
          600: '#c25173',
          700: '#a2405f',
          800: '#82364f',
          900: '#6a2f44',
        },
        warm: {
          50: '#fffbfb',
          100: '#f9f3f4',
          200: '#efe5e7',
          300: '#e0d1d4',
          400: '#b3a1a5',
          500: '#82727a',
          600: '#63555b',
          700: '#4c4146',
          800: '#33292e',
          900: '#231c20',
        },
        gold: {
          300: '#ecd9a8',
          400: '#dcc17e',
          500: '#c9a45c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 8px 20px -6px         rgba(217, 108, 137, 0.5)',
                'float': '0 12px 40px -8px rgba(194, 81, 115, 0.35)',
        'soft-xl': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
