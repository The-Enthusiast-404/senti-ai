/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],

  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#1a1b1e',
          50: '#2d2e33',
          100: '#27282d',
          200: '#232428',
          300: '#1f2023',
          400: '#1a1b1e',
          500: '#16171a',
          600: '#121315',
          700: '#0e0f10',
          800: '#0a0b0c',
          900: '#060707'
        },
        'accent-blue': {
          DEFAULT: '#4285f4',
          50: '#eef4fe',
          100: '#c9e0fd',
          200: '#a4ccfc',
          300: '#7fb8fb',
          400: '#5aa4fa',
          500: '#4285f4'
        }
      }
    }
  },
  plugins: []
}
