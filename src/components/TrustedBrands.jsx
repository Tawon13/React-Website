import { Reveal } from './PageKit'

// Marques ayant déjà collaboré via Collabzz. Wordmarks typographiques en attendant les
// logos officiels : pour en utiliser un, ajouter le fichier dans src/assets et le passer
// dans `logo` (il remplace alors le wordmark).
const BRANDS = [
  {
    name: 'Saily',
    logo: null,
    wordmark: <span className='font-extrabold tracking-tight lowercase'>saily</span>
  },
  {
    name: 'NordVPN',
    logo: null,
    wordmark: <span className='font-bold tracking-tight'>Nord<span className='font-extrabold'>VPN</span></span>
  },
  {
    name: 'boohooMAN',
    logo: null,
    wordmark: <span className='tracking-tight'><span className='font-semibold lowercase'>boohoo</span><span className='font-black uppercase'>MAN</span></span>
  }
]

const TrustedBrands = () => (
  <section aria-labelledby='brands-title'>
    <Reveal className='text-center mb-10'>
      <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Partenaires</p>
      <h2 id='brands-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Ils nous ont fait confiance</h2>
    </Reveal>

    <Reveal delay={0.1}>
      <ul className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        {BRANDS.map((brand) => (
          <li
            key={brand.name}
            className='flex items-center justify-center h-28 rounded-2xl border border-gray-200 bg-white text-gray-400 hover:text-gray-900 hover:border-primary transition-colors duration-200'
          >
            {brand.logo
              ? <img src={brand.logo} alt={brand.name} className='max-h-10 w-auto opacity-70 hover:opacity-100 transition-opacity duration-200' />
              : <span className='text-3xl' aria-label={brand.name} role='img'>{brand.wordmark}</span>}
          </li>
        ))}
      </ul>
    </Reveal>
  </section>
)

export default TrustedBrands
