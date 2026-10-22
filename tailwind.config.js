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
      fontFamily:{
        // Police du site (chargée dans src/index.css).
        sans:['Sora','sans-serif']
      },
      keyframes:{
        // Défilement continu de droite à gauche : la piste contient deux copies identiques,
        // on la décale de la moitié de sa largeur puis on boucle.
        marquee:{ from:{ transform:'translateX(0)' }, to:{ transform:'translateX(-50%)' } }
      },
      animation:{
        marquee:'marquee 30s linear infinite'
      },
      gridTemplateColumns:{
        'auto':'repeat(auto-fill, minmax(200px, 1fr))'
      }
    },
  },
  plugins: [],
}