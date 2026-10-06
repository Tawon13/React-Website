import { useContext, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { Reveal, Icon, ICONS } from './PageKit'
import SmartImage from './SmartImage'
import { AppContext } from '../context/AppContext'
import { useCanSeeStats } from '../hooks/useCanSeeStats'
import { assets } from '../assets/assets'

// Le fonctionnement de Collabzz raconté sur une maquette de l'interface : chaque étape du
// défilement change l'écran affiché. Les créateurs montrés sont de vrais profils approuvés.
const STEPS = [
  { key: 'search', icon: 'wallet', label: 'Recherche', title: 'Sans frais initiaux', desc: 'Recherchez des influenceurs gratuitement. Aucun abonnement, contrat ou frais cachés.' },
  { key: 'select', icon: 'check', label: 'Sélection', title: 'Influenceurs vérifiés', desc: 'Chaque influenceur est vérifié par nos soins. Recevez toujours du contenu de haute qualité et professionnel.' },
  { key: 'offer', icon: 'chat', label: 'Proposition', title: 'Chat instantané', desc: 'Discutez avec les influenceurs et restez en contact tout au long de la collaboration.' },
  { key: 'pay', icon: 'lock', label: 'Paiement', title: 'Achats sécurisés', desc: "Votre argent est conservé en sécurité jusqu'à ce que vous approuviez le travail de l'influenceur." }
]

// Noms TikTok des créateurs mis en avant dans la maquette, dans l'ordre d'affichage.
const FEATURED_CREATORS = ['singesse', 'Mohamed B.', 'lilieeee']

const compactFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })
// Le prénom des créateurs est privé (sous-collection private/profile) : on affiche leur nom
// TikTok, public et déjà montré ailleurs sur le site.
const displayName = (creator) => (creator?.tiktokUsername || '').trim()
const greetingName = (creator) => displayName(creator).split(/\s+/)[0]

const Avatar = ({ creator, size = 'w-10 h-10', width = 96 }) => (
  <div className={`${size} rounded-full overflow-hidden bg-gray-200 shrink-0`}>
    {creator && <SmartImage src={creator.image} width={width} alt='' className='w-full h-full object-cover' />}
  </div>
)

// Chiffres réservés aux visiteurs connectés (même règle que le reste du site) : floutés sinon.
const Stat = ({ value, canSee }) => (
  canSee
    ? <span>{value}</span>
    : <span className='blur-[5px] select-none'>00,0K</span>
)

const Chip = ({ children, active }) => (
  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${active ? 'bg-primary text-gray-900 border-primary' : 'border-gray-200 text-gray-600'}`}>
    {children}
  </span>
)

const pop = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.15 + i * 0.12, duration: 0.35, ease: 'easeOut' }
})

const SearchScreen = ({ creators, canSeeStats }) => (
  <div className='space-y-4'>
    <div className='flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900'>
      <svg className='w-4 h-4 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z' />
      </svg>
      <motion.span initial={{ width: 0 }} animate={{ width: 'auto' }} transition={{ duration: 0.6, ease: 'linear' }} className='overflow-hidden whitespace-nowrap'>
        {creators[0]?.speciality}
      </motion.span>
      <span className='w-px h-4 bg-gray-900 animate-pulse' />
    </div>
    <div className='flex flex-wrap gap-2'>
      <Chip active>{creators[0]?.speciality || 'Lifestyle'}</Chip>
      <Chip>France</Chip>
      <Chip>TikTok</Chip>
    </div>
    <div className='grid grid-cols-3 gap-2.5'>
      {creators.map((creator, i) => (
        <motion.div key={creator._id} {...pop(i)} className='rounded-xl border border-gray-100 bg-gray-50 p-2.5 flex flex-col items-center text-center min-w-0'>
          <Avatar creator={creator} size='w-12 h-12' />
          <p className='mt-1.5 text-xs font-semibold text-gray-900 truncate max-w-full'>{displayName(creator)}</p>
          <p className='text-[11px] text-gray-500 truncate max-w-full'>
            <Stat canSee={canSeeStats} value={compactFormat.format(creator.followers?.tiktok || 0)} /> abonnés
          </p>
        </motion.div>
      ))}
    </div>
  </div>
)

const SelectScreen = ({ creators, canSeeStats }) => {
  const creator = creators[0]
  const stats = [
    [compactFormat.format(creator?.followers?.tiktok || 0), 'abonnés'],
    [creator?.avgViews ? compactFormat.format(creator.avgViews) : '–', 'vues moy.'],
    [creator?.engagementRate != null ? `${creator.engagementRate.toFixed(1).replace('.', ',')} %` : '–', 'engagement']
  ]
  return (
    <div className='space-y-3.5'>
      <motion.div {...pop(0)} className='flex items-center gap-3'>
        <Avatar creator={creator} size='w-14 h-14' width={128} />
        <div className='min-w-0'>
          <p className='font-semibold text-gray-900 flex items-center gap-1.5'>
            {displayName(creator)}
            <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium px-2 py-0.5'>
              <Icon path={ICONS.check} className='w-3.5 h-3.5' /> Vérifié
            </span>
          </p>
          <p className='text-xs text-gray-500 truncate'>{creator?.speciality}</p>
        </div>
      </motion.div>
      <div className='grid grid-cols-3 gap-2.5'>
        {stats.map(([value, label], i) => (
          <motion.div key={label} {...pop(i + 1)} className='rounded-xl bg-gray-50 border border-gray-100 py-2.5 text-center'>
            <p className='text-sm font-bold text-gray-900'><Stat canSee={canSeeStats} value={value} /></p>
            <p className='text-[11px] text-gray-500'>{label}</p>
          </motion.div>
        ))}
      </div>
      {!canSeeStats && <p className='text-[11px] text-center text-gray-400 -mt-1'>Statistiques réservées aux membres</p>}
      <motion.div {...pop(4)} className='flex items-center justify-between rounded-xl border border-gray-200 px-4 py-2.5'>
        <div>
          <p className='text-xs text-gray-500'>Vidéo TikTok</p>
          <p className='text-sm font-semibold text-gray-900'>{creator?.fees} €</p>
        </div>
        <span className='rounded-full bg-gray-900 text-white text-xs font-semibold px-4 py-2'>Contacter</span>
      </motion.div>
    </div>
  )
}

const OfferScreen = ({ creators }) => (
  <div className='space-y-2.5 sm:space-y-3 text-[13px] sm:text-sm'>
    <motion.div {...pop(0)} className='ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gray-900 text-white px-3.5 py-2.5'>
      Bonjour {greetingName(creators[0])} ! Une vidéo pour notre nouvelle gamme, ça te tente ?
    </motion.div>
    <motion.div {...pop(1)} className='flex items-end gap-2'>
      <Avatar creator={creators[0]} size='w-7 h-7' />
      <div className='max-w-[80%] rounded-2xl rounded-bl-md bg-gray-100 text-gray-900 px-3.5 py-2.5'>
        Avec plaisir ! Je vous envoie ma proposition 😊
      </div>
    </motion.div>
    <motion.div {...pop(2)} className='rounded-xl border border-primary/50 bg-primary/10 p-3 sm:p-3.5'>
      <p className='text-xs font-semibold uppercase tracking-wide text-primary-dark'>Proposition</p>
      <div className='mt-1 flex items-center justify-between'>
        <p className='font-semibold text-gray-900'>1 vidéo TikTok · sous 7 jours</p>
        <p className='font-bold text-gray-900'>{creators[0]?.fees} €</p>
      </div>
      <span className='mt-2.5 inline-block rounded-full bg-gray-900 text-white text-xs font-semibold px-4 py-2'>Accepter la proposition</span>
    </motion.div>
  </div>
)

const PAYMENT_STEPS = ['Paiement sécurisé', 'Vidéo livrée', 'Vidéo validée', 'Paiement versé']


const PayScreen = ({ creators }) => (
  <div className='space-y-3 sm:space-y-4'>
    <motion.div {...pop(0)} className='rounded-xl bg-gray-900 text-white p-3 sm:p-4 flex items-center gap-3'>
      <div className='w-10 h-10 rounded-lg bg-primary text-gray-900 flex items-center justify-center'>
        <Icon path={ICONS.lock} className='w-5 h-5' />
      </div>
      <div>
        <p className='text-xs text-gray-400'>Montant protégé</p>
        <p className='font-bold'>{creators[0]?.fees} € conservés en sécurité</p>
      </div>
    </motion.div>
    <ol className='space-y-2'>
      {PAYMENT_STEPS.map((label, i) => {
        const done = i < 3
        return (
          <motion.li key={label} {...pop(i + 1)} className='flex items-center gap-3 text-sm'>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${done ? 'bg-emerald-500 text-white' : 'border-2 border-gray-300 text-gray-400'}`}>
              {done ? '✓' : i + 1}
            </span>
            <span className={done ? 'text-gray-900 font-medium' : 'text-gray-500'}>{label}</span>
          </motion.li>
        )
      })}
    </ol>
    <motion.span {...pop(5)} className='block text-center rounded-full bg-primary text-gray-900 text-sm font-semibold py-2'>
      Libérer le paiement
    </motion.span>
  </div>
)

const SCREENS = { search: SearchScreen, select: SelectScreen, offer: OfferScreen, pay: PayScreen }

const AppMockup = ({ step, creators, canSeeStats }) => {
  const Screen = SCREENS[step.key]
  return (
    <div className='rounded-2xl bg-white text-gray-900 shadow-2xl shadow-black/40 overflow-hidden' aria-hidden='true'>
      <div className='flex items-center gap-1.5 px-4 py-3 border-b border-gray-100'>
        <span className='w-2.5 h-2.5 rounded-full bg-gray-200' />
        <span className='w-2.5 h-2.5 rounded-full bg-gray-200' />
        <span className='w-2.5 h-2.5 rounded-full bg-gray-200' />
        <span className='ml-3 text-xs text-gray-400'>collabzz.com</span>
        <span className='ml-auto text-xs font-semibold text-primary-dark'>{step.label}</span>
      </div>
      {/* Fondu enchaîné (écrans superposés) plutôt que mode « wait » : rien ne peut rester bloqué
          entre deux écrans si l'on fait défiler vite. */}
      <div className='relative h-[19rem] overflow-hidden'>
        <AnimatePresence initial={false}>
          <motion.div
            key={step.key}
            className='absolute inset-0 p-4 sm:p-5'
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {creators.length > 0 ? <Screen creators={creators} canSeeStats={canSeeStats} /> : <div className='h-full rounded-xl bg-gray-100 animate-pulse' />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

const Features = () => {
  const trackRef = useRef(null)
  const [active, setActive] = useState(0)
  const { doctors } = useContext(AppContext)
  const canSeeStats = useCanSeeStats()

  // Trois vrais créateurs inscrits (photo et nom TikTok) : ceux choisis en priorité, complétés
  // par les plus suivis si l'un d'eux n'est plus disponible.
  const creators = useMemo(() => {
    const eligible = doctors.filter((creator) => creator.image && creator.image !== assets.profile_pic && displayName(creator))
    const picked = FEATURED_CREATORS.map((name) => eligible.find((creator) => creator.tiktokUsername === name)).filter(Boolean)
    const others = eligible
      .filter((creator) => !picked.includes(creator))
      .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
    return [...picked, ...others].slice(0, 3)
  }, [doctors])
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start 88px', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    setActive(Math.min(STEPS.length - 1, Math.floor(value * STEPS.length)))
  })

  return (
    <div ref={trackRef} className='relative'>
      {/* Tout le bloc reste collé sous la barre de navigation pendant que les étapes défilent. */}
      <section aria-labelledby='features-title' className='sticky top-[5.5rem] rounded-3xl bg-gray-900 text-white px-4 sm:px-10 lg:px-14 py-6 md:py-12'>
        <Reveal className='max-w-2xl mb-4 md:mb-8'>
          <p className='text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary mb-2 sm:mb-3'>Pourquoi Collabzz</p>
          <h2 id='features-title' className='text-xl sm:text-3xl md:text-4xl font-bold'>{"Le marketing d'influence rendu simple."}</h2>
        </Reveal>

        <div className='grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-3 sm:gap-5 lg:gap-12 items-center'>
          <ol className='order-2 lg:order-1 space-y-1.5'>
            {STEPS.map((step, i) => {
              const isActive = i === active
              return (
                <li
                  key={step.key}
                  className={`rounded-2xl border p-3 sm:p-3.5 lg:p-4 transition-colors duration-300 ${isActive ? 'bg-white/10 border-white/20' : 'border-transparent'} ${isActive ? '' : 'hidden lg:block'}`}
                >
                  <div className='flex items-center gap-3'>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-primary text-gray-900' : 'bg-white/5 text-gray-400'}`}>
                      <Icon path={ICONS[step.icon]} className='w-5 h-5' />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-500'}`}>
                        {i + 1}. {step.label}
                      </p>
                      <h3 className={`text-lg font-semibold ${isActive ? 'text-white' : 'text-gray-400'}`}>{step.title}</h3>
                    </div>
                  </div>
                  <p className={`mt-2 sm:mt-3 text-sm sm:text-[15px] leading-relaxed text-gray-300 ${isActive ? '' : 'lg:hidden'}`}>{step.desc}</p>
                </li>
              )
            })}
          </ol>
          <div className='order-1 lg:order-2'>
            <AppMockup step={STEPS[active]} creators={creators} canSeeStats={canSeeStats} />
            <div className='mt-3 flex justify-center gap-1.5 lg:hidden' aria-hidden='true'>
              {STEPS.map((step, i) => (
                <span key={step.key} className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-primary' : 'w-1.5 bg-white/20'}`} />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Espace de défilement : environ un tiers d'écran par étape pendant que le bloc reste collé. */}
      <div style={{ height: `${STEPS.length * 35}vh` }} aria-hidden='true' />
    </div>
  )
}

export default Features
