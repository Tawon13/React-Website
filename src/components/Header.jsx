import { useContext, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { Icon, ICONS } from './PageKit'
import SmartImage from './SmartImage'

const QUICK_FILTERS = [
  { label: 'Nouvelles stars TikTok', to: '/talents?sort=recent', icon: 'sparkles' },
  { label: 'Les plus suivis', to: '/talents', icon: 'users' },
  { label: 'Meilleur engagement', to: '/talents?sort=engagement', icon: 'chart' },
  { label: 'Moins de 250 €', to: '/talents?maxPrice=250', icon: 'tag' }
]

const ease = [0.22, 1, 0.36, 1]

// Colonne de photos de créateurs, décalée verticalement au rythme du scroll (parallaxe
// réversible, sans lecture automatique). Mouvement réduit : immobile.
const PhotoColumn = ({ items, y, offset = '' }) => (
  <motion.div style={{ y }} className={`flex flex-col gap-3 sm:gap-4 ${offset}`}>
    {items.map((item, i) => (
      <motion.div
        key={item._id}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 + i * 0.12, ease }}
      >
        <Link
          to={`/influencer/${item._id}`}
          onClick={() => window.scrollTo(0, 0)}
          tabIndex={-1}
          className='group relative block aspect-[3/4] rounded-2xl overflow-hidden bg-white/10'
        >
          <SmartImage width={220} loading='eager' src={item.image} alt='' className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105' />
          <span className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-white text-xs sm:text-sm font-semibold truncate'>
            @{item.tiktokUsername}
          </span>
        </Link>
      </motion.div>
    ))}
  </motion.div>
)

const Header = () => {
  const navigate = useNavigate()
  const { doctors, doctorsLoading } = useContext(AppContext)
  const reduceMotion = useReducedMotion()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState('')

  const creators = useMemo(() => doctors
    .filter((item) => item.tiktokUsername && item.image && item.image !== assets.profile_pic)
    .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0)), [doctors])
  const columns = [creators.slice(0, 3), creators.slice(3, 6), creators.slice(6, 9)]

  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 700], [0, -90])
  const y2 = useTransform(scrollY, [0, 700], [0, -170])
  const y3 = useTransform(scrollY, [0, 700], [0, -50])

  const goTo = (path) => {
    navigate(path)
    window.scrollTo(0, 0)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const path = category ? `/talents/${encodeURIComponent(category)}` : '/talents'
    const q = keyword.trim()
    goTo(q ? `${path}?search=${encodeURIComponent(q)}` : path)
  }

  return (
    <section className='relative overflow-hidden rounded-3xl bg-gray-900 text-white'>
      <div className='absolute -top-40 -left-32 w-[32rem] h-[32rem] bg-primary/20 rounded-full blur-3xl' aria-hidden='true'></div>

      <div className='relative grid lg:grid-cols-12 gap-10 items-center px-6 sm:px-10 lg:pl-14 lg:pr-0 pt-12 sm:pt-16 lg:pt-0'>
        <div className='lg:col-span-7 min-w-0 lg:py-24'>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm font-medium mb-7'
          >
            <span className='w-2 h-2 rounded-full bg-green-400' aria-hidden='true'></span>
            {doctorsLoading ? 'Créateurs TikTok vérifiés' : `${doctors.length} créateurs TikTok vérifiés`}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease }}
            className='text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.08] mb-6'
          >
            Collaborer avec des <span className='text-primary'>Influenceurs</span> en un clic
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease }}
            className='text-lg text-gray-300 max-w-lg leading-relaxed mb-8'
          >
            Contactez nos influenceurs facilement, et réservez votre collaboration en quelques clics.
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            role='search'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease }}
            className='flex flex-wrap items-center gap-2 bg-white rounded-2xl xl:rounded-full p-2 shadow-2xl shadow-black/30 max-w-xl'
          >
            <label htmlFor='home-search' className='sr-only'>Rechercher un créateur</label>
            <div className='flex items-center gap-2 basis-full xl:basis-0 flex-1 min-w-0 pl-3'>
              <Icon path={ICONS.search} className='w-5 h-5 text-gray-400 flex-shrink-0' />
              <input
                id='home-search'
                type='search'
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder='Pseudo, niche…'
                className='w-full py-2.5 text-base text-gray-900 placeholder:text-gray-400 bg-transparent outline-none'
              />
            </div>
            <label htmlFor='home-category' className='sr-only'>Catégorie</label>
            <select
              id='home-category'
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='cursor-pointer flex-1 min-w-0 xl:flex-none xl:w-40 truncate px-3 py-2.5 text-sm text-gray-700 bg-gray-100 rounded-xl xl:rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary'
            >
              <option value=''>Toutes catégories</option>
              {INFLUENCER_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button
              type='submit'
              className='cursor-pointer flex-shrink-0 bg-primary text-gray-900 font-semibold px-6 py-2.5 rounded-xl xl:rounded-full hover:bg-[#EDC085] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900'
            >
              Rechercher
            </button>
          </motion.form>

          <motion.ul
            initial='hidden'
            animate='visible'
            variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.4 } } }}
            className='flex gap-2 mt-5 overflow-x-auto scrollbar-hide pb-1'
          >
            {QUICK_FILTERS.map((filter) => (
              <motion.li key={filter.label} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                <button
                  type='button'
                  onClick={() => goTo(filter.to)}
                  className='cursor-pointer flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full border border-white/20 text-sm text-gray-100 hover:bg-white/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                >
                  <Icon path={ICONS[filter.icon]} className='w-4 h-4 text-primary' />
                  {filter.label}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Mosaïque de vrais créateurs (décorative : les profils restent accessibles plus bas) */}
        <div
          className='lg:col-span-5 min-w-0 relative h-72 sm:h-96 lg:h-[40rem] -mx-6 sm:-mx-10 lg:mx-0'
          aria-hidden='true'
          style={{ maskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)' }}
        >
          {!doctorsLoading && (
            <div className='grid grid-cols-3 gap-3 sm:gap-4 px-4 lg:pr-6'>
              <PhotoColumn items={columns[0]} y={reduceMotion ? 0 : y1} offset='pt-16' />
              <PhotoColumn items={columns[1]} y={reduceMotion ? 0 : y2} />
              <PhotoColumn items={columns[2]} y={reduceMotion ? 0 : y3} offset='pt-28' />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Header
