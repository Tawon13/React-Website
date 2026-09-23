import { useContext, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { Reveal, Icon, ICONS } from './PageKit'
import { useCanSeeStats } from '../hooks/useCanSeeStats'
import SmartImage from './SmartImage'

const compactFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

const TopDoctors = () => {
  const navigate = useNavigate()
  const { doctors, doctorsLoading } = useContext(AppContext)
  const canSeeStats = useCanSeeStats()

  // Les 4 profils les plus suivis du site.
  const topInfluencers = useMemo(
    () => [...doctors]
      .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
      .slice(0, 4),
    [doctors]
  )

  return (
    <section aria-labelledby='top-title'>
      <Reveal className='flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10'>
        <div>
          <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Tendances</p>
          <h2 id='top-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Nos influenceurs du moment</h2>
        </div>
        <button
          onClick={() => { navigate('/talents'); window.scrollTo(0, 0) }}
          className='cursor-pointer group inline-flex items-center gap-2 self-start sm:self-auto font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'
        >
          Voir tous les talents
          <svg className='w-4 h-4 transition-transform duration-200 group-hover:translate-x-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 8l4 4m0 0l-4 4m4-4H3' />
          </svg>
        </button>
      </Reveal>

      <ul className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5'>
        {doctorsLoading
          ? Array.from({ length: 4 }).map((_, i) => <li key={i} className='aspect-[3/4] rounded-3xl bg-gray-100 animate-pulse' />)
          : topInfluencers.map((item, index) => (
            <Reveal as='li' key={item._id} delay={index * 0.08}>
              <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 400, damping: 30 }}>
                <Link
                  to={`/influencer/${item._id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className='group relative block aspect-[3/4] rounded-3xl overflow-hidden bg-gray-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary'
                >
                  <SmartImage width={320}
                    loading='eager'
                    src={item.image}
                    alt={item.tiktokUsername ? `@${item.tiktokUsername}` : 'Influenceur'}
                    className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                  />
                  <span className='absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-gray-900'>
                    <Icon path={ICONS.check} className='w-3.5 h-3.5 text-green-600' /> Vérifié
                  </span>
                  <span className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16 text-white'>
                    {item.tiktokUsername && <span className='block text-base sm:text-lg font-semibold truncate'>@{item.tiktokUsername}</span>}
                    <span className='flex items-center justify-between gap-2 text-xs sm:text-sm text-white/80'>
                      <span className='truncate'>{item.speciality}</span>
                      {canSeeStats && item.followers?.tiktok > 0 && <span className='whitespace-nowrap'>{compactFormat.format(item.followers.tiktok)} abonnés</span>}
                    </span>
                  </span>
                </Link>
              </motion.div>
            </Reveal>
          ))}
      </ul>

      <div className='mt-10 flex justify-center'>
        <Link
          to='/talents'
          onClick={() => window.scrollTo(0, 0)}
          className='group inline-flex items-center gap-2 rounded-full border-2 border-primary px-8 py-3.5 font-semibold text-gray-900 hover:bg-primary transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
        >
          Voir tous nos talents
          <svg className='w-4 h-4 transition-transform duration-200 group-hover:translate-x-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 8l4 4m0 0l-4 4m4-4H3' />
          </svg>
        </Link>
      </div>
    </section>
  )
}

export default TopDoctors
