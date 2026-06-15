/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: '#0a0a0f',
        cream: '#f5e6d3',
        accent: '#e74c3c',
        accentDark: '#c0392b',
        purple: '#8e44ad',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        inter: ['Inter', 'sans-serif'],
        great: ['Great Vibes', 'cursive'],
      },
    },
  },
  plugins: [],
}