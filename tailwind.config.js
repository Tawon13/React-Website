/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors:{
        'primary':"#E6B067"
        // Or foncé pour le texte doré sur fond clair : #E6B067 sur blanc n'atteint pas 4.5:1.
        ,'primary-dark':"#9A6A1F"
        ,'secondary':"#6B7280"
      },
      gridTemplateColumns:{
        'auto':'repeat(auto-fill, minmax(200px, 1fr))'
      }
    },
  },
  plugins: [],
}