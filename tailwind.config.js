/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#0a0a0a',
        brasil: {
          green: '#00c853',
          'green-light': '#00e676',
          'green-dark': '#00993f',
          yellow: '#ffd600',
          blue: '#002776',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
