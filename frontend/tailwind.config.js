/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body:    ['Inter', 'sans-serif'],
      },
      colors: {
        'ritmica': {
          pink:     '#663B8F',   // violeta del logo
          'pink-dark': '#4E2B6E',
          'pink-light':'#B28FC1',
          rose:     '#F5F0FA',   // lila muy suave
          dark:     '#1A1A2E',   // texto oscuro
          gray:     '#6B7280',
        },
      },
    },
  },
  plugins: [],
}
