import { Reveal } from './PageKit'
import saily from '../assets/brands/saily.svg'
import nordvpn from '../assets/brands/nordvpn.svg'
import boohooman from '../assets/brands/boohooman.svg'

// Marques ayant déjà collaboré via Collabzz (logos officiels, couleurs d'origine). `className` règle la hauteur
// de chaque logo pour qu'ils aient un poids visuel comparable malgré des formats différents.
const BRANDS = [
  { name: 'Saily', logo: saily, className: 'h-9 sm:h-10' },
  { name: 'NordVPN', logo: nordvpn, className: 'h-8 sm:h-9' },
  { name: 'boohooMAN', logo: boohooman, className: 'h-4 sm:h-5' }
]

// Avec seulement trois marques, on répète la liste pour que la piste couvre les grands écrans.
const TRACK = Array.from({ length: 4 }, () => BRANDS).flat()

const LogoRow = ({ hidden = false }) => (
  <ul className='flex shrink-0 items-center' aria-hidden={hidden || undefined}>
    {TRACK.map((brand, i) => (
      <li key={`${brand.name}-${i}`} className='shrink-0 px-8 sm:px-14'>
        <img
          src={brand.logo}
          alt={hidden || i >= BRANDS.length ? '' : brand.name}
          className={`${brand.className} w-auto`}
          loading='lazy'
          draggable='false'
        />
      </li>
    ))}
  </ul>
)

const TrustedBrands = () => (
  <section aria-labelledby='brands-title'>
    <Reveal className='text-center mb-10'>
      <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Partenaires</p>
      <h2 id='brands-title' className='text-3xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight'>
        Ils nous ont fait{' '}
        <span className='relative inline-block text-primary-dark'>
          confiance
          {/* Soulignement tracé à la main, doré */}
          <svg className='absolute left-0 -bottom-2 w-full h-3 md:h-4 text-primary' viewBox='0 0 200 12' preserveAspectRatio='none' fill='none' aria-hidden='true'>
            <path d='M3 8.5C40 3.5 90 2 197 6.5' stroke='currentColor' strokeWidth='4' strokeLinecap='round' />
            <path d='M28 10.5C80 7 130 6.5 180 9' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' opacity='0.6' />
          </svg>
        </span>
      </h2>
    </Reveal>

    {/* Bandeau qui défile de droite à gauche, en pause au survol. Mouvement réduit : immobile. */}
    <div
      className='group relative overflow-hidden py-4'
      style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
    >
      <div className='flex w-max animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none'>
        <LogoRow />
        <LogoRow hidden />
      </div>
    </div>
  </section>
)

export default TrustedBrands
