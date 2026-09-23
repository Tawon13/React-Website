import { useContext, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import { useCanSeeStats } from '../hooks/useCanSeeStats'
import SmartImage from './SmartImage'

const compactFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

// Bandeau de vrais créateurs de la plateforme (remplace les faux avis). La rangée glisse
// horizontalement au rythme du scroll, sans lecture automatique (donc pas de contrôle
// pause requis, WCAG 2.2.2), et reste défilable au doigt. Mouvement réduit : immobile.
const CreatorStrip = ({ children, max = 10 }) => {
  const { doctors, doctorsLoading } = useContext(AppContext)
  const sectionRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const canSeeStats = useCanSeeStats()

  const creators = useMemo(() => doctors
    .filter((item) => item.tiktokUsername && item.image && item.image !== assets.profile_pic)
    .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
    .slice(0, max), [doctors, max])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const x = useTransform(scrollYProgress, [0, 1], ['4%', '-30%'])

  if (!doctorsLoading && creators.length === 0) return null

  return (
    <section ref={sectionRef} className='relative'>
      <div className='mb-10'>{children}</div>
      <div className='overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0'>
        <motion.ul style={reduceMotion ? undefined : { x }} className='flex gap-4 w-max pb-2'>
          {doctorsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className='w-40 sm:w-48 h-56 sm:h-64 rounded-2xl bg-gray-100 animate-pulse' />
            ))
            : creators.map((item) => (
              <li key={item._id}>
                <Link
                  to={`/influencer/${item._id}`}
                  onClick={() => window.scrollTo(0, 0)}
                  className='group relative block w-40 sm:w-48 h-56 sm:h-64 rounded-2xl overflow-hidden bg-gray-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary'
                >
                  <SmartImage width={160}
                    src={item.image}
                    alt=''
                    loading='lazy'
                    className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                  />
                  <span className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-12'>
                    <span className='block text-white font-semibold truncate'>@{item.tiktokUsername}</span>
                    <span className='block text-white/80 text-xs truncate'>
                      {canSeeStats && item.followers?.tiktok > 0 ? `${compactFormat.format(item.followers.tiktok)} abonnés · ` : ''}{item.speciality}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default CreatorStrip
