/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          1: '#080912',
          2: '#0d0f1e',
          3: '#131629',
          4: '#1a1d30',
          5: '#232640',
        },
      },
    },
  },
  plugins: [],
}
