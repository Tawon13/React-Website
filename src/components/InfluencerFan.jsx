import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform
} from 'motion/react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import { useCanSeeStats, SIGNUP_FOR_STATS_PATH } from '../hooks/useCanSeeStats'

const MAX_CARDS = 7
const compactFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
const formatCount = (value) => (Number.isFinite(value) && value > 0 ? compactFormat.format(value) : '—')

// Nom et prénom réels jamais affichés publiquement : on montre le pseudo TikTok.
const displayName = (item) => `@${item.tiktokUsername}`

const useIsMobile = () => {
  const query = '(max-width: 639px)'
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setIsMobile(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)
const lerp = (from, to, t) => from + (to - from) * t

// Une carte de l'éventail, pilotée par deux progressions liées au scroll (donc réversibles) :
// - open  : les cartes empilées pivotent autour d'un point sous la carte et glissent vers la droite ;
// - split : les cartes de gauche s'envolent à gauche, celles de droite à droite (les cartes
//   extérieures partent en premier). En remontant, les deux progressions redescendent et
//   les cartes reviennent.
const FanCard = ({ item, index, count, open, split, isMobile, maxShift, hidden, scattered, onSelect }) => {
  const spread = count > 1 ? index / (count - 1) : 0.5
  const side = spread < 0.5 ? -1 : 1
  const rank = Math.abs(spread - 0.5) * 2 // 0 = carte centrale, 1 = carte extérieure
  const delay = (1 - rank) * 0.35
  const openRotate = -14 + spread * (isMobile ? 36 : 44)
  const openX = spread * maxShift
  const closedRotate = -3 + index * 1.2

  // Départ en ease-in : la carte décolle doucement puis accélère hors de l'écran.
  const leave = (s) => clamp01((s - delay) / (1 - delay)) ** 2

  const x = useTransform([open, split], ([o, s]) => {
    const viewport = typeof window !== 'undefined' ? window.innerWidth : 1200
    const fly = side * viewport * (0.85 + rank * 0.3)
    return lerp(index * 3, openX, o) + leave(s) * fly
  })
  const rotate = useTransform([open, split], ([o, s]) =>
    lerp(closedRotate, openRotate, o) + leave(s) * side * (25 + 20 * rank))
  const y = useTransform(split, (s) => -leave(s) * (60 + 80 * (1 - rank)))

  const style = { x, y, rotate, zIndex: index, transformOrigin: '50% 160%' }
  const cardClass = 'absolute left-0 bottom-0 w-32 h-44 sm:w-48 sm:h-64 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gray-200'

  // La carte sélectionnée « s'envole » vers la fiche : on laisse un emplacement vide.
  if (hidden) return <motion.div style={style} className={`${cardClass} opacity-0`} aria-hidden='true' />

  return (
    <motion.button
      type='button'
      data-fan-id={item._id}
      layoutId={`fan-card-${item._id}`}
      onClick={() => onSelect(item)}
      style={style}
      // Survol en scale et non en y : y est déjà piloté par le scroll.
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      tabIndex={scattered ? -1 : 0}
      aria-hidden={scattered || undefined}
      aria-label={`Voir les statistiques de ${displayName(item)}`}
      className={`${cardClass} cursor-pointer text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary`}
    >
      <img src={item.image} alt='' className='w-full h-full object-cover' draggable='false' />
      {/* Nom en haut de la carte : c'est la partie qui reste visible quand l'éventail est ouvert. */}
      <span className='absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-3 pt-3 pb-10'>
        <span className='block text-white font-semibold text-sm sm:text-base truncate'>{displayName(item)}</span>
        <span className='block text-white/80 text-xs truncate'>{item.speciality}</span>
      </span>
    </motion.button>
  )
}

const InfluencerDetail = ({ item, onClose }) => {
  const navigate = useNavigate()
  const closeRef = useRef(null)
  const canSeeStats = useCanSeeStats()

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // Blocage du scroll sur <html> et non sur <body> : overflow hidden sur body en ferait
    // un conteneur de défilement, ce qui décroche la section sticky derrière la fiche.
    const root = document.documentElement
    const previousOverflow = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      root.style.overflow = previousOverflow
    }
  }, [onClose])

  const stats = [
    { label: 'Abonnés', value: formatCount(item.followers?.tiktok) },
    { label: 'Vues moyennes', value: formatCount(item.avgViews) },
    { label: 'Engagement', value: item.engagementRate != null ? `${item.engagementRate.toLocaleString('fr-FR')} %` : '—' }
  ]

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
      <motion.div
        className='absolute inset-0 bg-gray-900/70 backdrop-blur-sm'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        layoutId={`fan-card-${item._id}`}
        role='dialog'
        aria-modal='true'
        aria-labelledby='fan-detail-title'
        style={{ rotate: 0 }}
        className='relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl grid sm:grid-cols-2'
      >
        <motion.img layout src={item.image} alt={displayName(item)} className='w-full h-64 sm:h-full sm:min-h-[26rem] object-cover' />
        <motion.div
          className='p-6 sm:p-8 flex flex-col'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.1 } }}
        >
          <button
            ref={closeRef}
            type='button'
            onClick={onClose}
            aria-label='Fermer'
            className='cursor-pointer absolute top-3 right-3 w-11 h-11 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
            </svg>
          </button>

          <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-1'>{item.speciality}</p>
          <h3 id='fan-detail-title' className='text-2xl font-bold text-gray-900 break-words'>{displayName(item)}</h3>
          {item.city && <p className='text-gray-500 mt-1'>{item.city}</p>}

          {canSeeStats ? (
          <dl className='grid grid-cols-3 gap-3 my-6'>
            {stats.map((stat) => (
              <div key={stat.label} className='flex flex-col-reverse rounded-xl bg-gray-50 border border-gray-100 px-3 py-3 text-center'>
                <dt className='text-xs text-gray-500 mt-0.5'>{stat.label}</dt>
                <dd className='text-xl font-bold text-gray-900'>{stat.value}</dd>
              </div>
            ))}
          </dl>
          ) : (
            <button
              type='button'
              onClick={() => { navigate(SIGNUP_FOR_STATS_PATH); window.scrollTo(0, 0) }}
              className='cursor-pointer my-6 flex items-center gap-3 rounded-xl bg-gray-900 text-white text-left px-4 py-3.5 hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            >
              <span className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-primary'>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' /></svg>
              </span>
              <span>
                <span className='block font-semibold'>Statistiques réservées aux membres</span>
                <span className='block text-sm text-gray-300'>Créez un compte gratuit pour voir abonnés, vues et engagement.</span>
              </span>
            </button>
          )}

          <p className='text-gray-600 leading-relaxed line-clamp-4 mb-6'>{item.about}</p>

          <div className='mt-auto flex items-center justify-between gap-4'>
            <p className='text-gray-900'>
              <span className='text-sm text-gray-500 block'>Tarif</span>
              <span className='text-xl font-bold'>{item.fees}€</span>
            </p>
            <button
              type='button'
              onClick={() => { navigate(`/influencer/${item._id}`); window.scrollTo(0, 0) }}
              className='cursor-pointer bg-gray-900 text-white px-6 py-3 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
            >
              Voir le profil
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

// Éventail de créateurs dans une section « sticky » : au scroll il s'ouvre, puis les cartes
// s'écartent à gauche et à droite pour révéler un appel à l'action ; en remontant tout revient.
// Un clic sur une carte l'agrandit en fiche avec ses statistiques.
const InfluencerFan = ({ children, onDiscover }) => {
  const { doctors, doctorsLoading } = useContext(AppContext)
  const [selected, setSelected] = useState(null)
  const sectionRef = useRef(null)
  const isMobile = useIsMobile()
  const reduceMotion = useReducedMotion()
  // La carte d'origine est remplacée pendant que la fiche est ouverte : on lui rend le
  // focus une fois qu'elle est revenue dans l'éventail.
  const lastSelectedId = useRef(null)
  const closeDetail = useCallback(() => setSelected(null), [])
  useEffect(() => {
    if (selected) {
      lastSelectedId.current = selected._id
    } else if (lastSelectedId.current) {
      document.querySelector(`[data-fan-id="${lastSelectedId.current}"]`)?.focus({ preventScroll: true })
      lastSelectedId.current = null
    }
  }, [selected])

  // Largeur dispo pour centrer l'éventail ouvert sans qu'il déborde du bloc.
  const fanAreaRef = useRef(null)
  const [fanWidth, setFanWidth] = useState(0)
  useEffect(() => {
    const el = fanAreaRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setFanWidth(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [doctorsLoading])
  const cardWidth = isMobile ? 128 : 192
  const maxShift = Math.max(0, Math.min(fanWidth - cardWidth - (isMobile ? 40 : 160), 520))
  const fanLeft = Math.max(0, (fanWidth - (maxShift + cardWidth)) / 2)

  const cards = useMemo(() => doctors
    .filter((item) => item.tiktokUsername && item.image && item.image !== assets.profile_pic)
    .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
    .slice(0, MAX_CARDS), [doctors])

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] })
  const spring = { stiffness: 120, damping: 24, mass: 0.6 }
  const scrollOpen = useSpring(useTransform(scrollYProgress, [0.02, 0.32], [0, 1]), spring)
  const scrollSplit = useSpring(useTransform(scrollYProgress, [0.42, 0.88], [0, 1]), spring)
  // Mouvement réduit (palier 1 : grands déplacements supprimés) : éventail ouvert et
  // immobile, pas de dispersion, l'appel à l'action reste simplement affiché dessous.
  const alwaysOpen = useMotionValue(1)
  const neverSplit = useMotionValue(0)
  const open = reduceMotion ? alwaysOpen : scrollOpen
  const split = reduceMotion ? neverSplit : scrollSplit

  // Cartes hors écran : retirées de la navigation clavier ; bouton central actif à la place.
  const [scattered, setScattered] = useState(false)
  useMotionValueEvent(split, 'change', (v) => {
    const next = v > 0.55
    if (next !== scattered) setScattered(next)
  })
  const ctaOpacity = useTransform(split, [0.5, 0.85], [0, 1])
  const ctaScale = useTransform(split, [0.5, 1], [0.92, 1])

  if (!doctorsLoading && cards.length === 0) return null

  const discoverBtn = (
    <button
      type='button'
      onClick={onDiscover}
      tabIndex={reduceMotion || scattered ? 0 : -1}
      className='cursor-pointer bg-primary text-gray-900 px-8 py-4 rounded-full font-semibold text-lg hover:bg-[#EDC085] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
    >
      Découvrir les talents
    </button>
  )

  return (
    <section
      ref={sectionRef}
      aria-label='Nos créateurs'
      className={`relative ${reduceMotion ? '' : 'h-[300vh]'}`}
    >
      <div className={`${reduceMotion ? '' : 'sticky top-0 h-screen pt-20'} flex items-center`}>
        {/* Pas d'overflow-hidden : les cartes s'envolent jusqu'aux bords de l'écran
            (le débordement horizontal est coupé par overflow-x: clip sur html/body). */}
        <div className='w-full rounded-3xl bg-gray-900 text-white px-6 sm:px-10 py-10'>
          <div className='max-w-2xl mx-auto text-center'>{children}</div>

          <div className='relative h-72 sm:h-[22rem] mt-8'>
            {doctorsLoading ? (
              <div className='absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-44 sm:w-48 sm:h-64 rounded-2xl bg-white/10 animate-pulse' />
            ) : (
              <div ref={fanAreaRef} className='absolute inset-0'>
                <div className='absolute inset-y-0 right-0' style={{ left: fanLeft }}>
                  {cards.map((item, index) => (
                    <FanCard
                      key={item._id}
                      item={item}
                      index={index}
                      count={cards.length}
                      open={open}
                      split={split}
                      isMobile={isMobile}
                      maxShift={maxShift}
                      hidden={selected?._id === item._id}
                      scattered={scattered}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Révélé au centre quand les cartes s'écartent */}
            {!reduceMotion && (
              <motion.div
                style={{ opacity: ctaOpacity, scale: ctaScale, pointerEvents: scattered ? 'auto' : 'none' }}
                aria-hidden={!scattered || undefined}
                className='absolute inset-0 flex flex-col items-center justify-center text-center gap-5 px-4'
              >
                <p className='text-2xl sm:text-3xl font-bold max-w-md'>{"Et bien d'autres créateurs vous attendent."}</p>
                {discoverBtn}
              </motion.div>
            )}
          </div>

          {reduceMotion && <div className='mt-10 flex justify-center'>{discoverBtn}</div>}
        </div>
      </div>

      <AnimatePresence>
        {selected && <InfluencerDetail key={selected._id} item={selected} onClose={closeDetail} />}
      </AnimatePresence>
    </section>
  )
}

export default InfluencerFan
