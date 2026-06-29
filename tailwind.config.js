/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#14401f',
          50: '#eef6ef',
          100: '#d6e9d8',
          600: '#1d5a2a',
          700: '#14401f',
          800: '#0f3119',
          900: '#0a2311',
        },
        lime: {
          DEFAULT: '#e7f24b',
          accent: '#dff05a',
          soft: '#f3f7b0',
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 40px -12px rgba(20, 64, 31, 0.25)',
        glow: '0 0 0 1px rgba(20,64,31,0.06), 0 20px 50px -20px rgba(20,64,31,0.35)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) forwards',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
