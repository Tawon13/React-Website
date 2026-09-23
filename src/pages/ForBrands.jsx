import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from 'motion/react'
import SEO from '../components/SEO'
import { PAGE_SEO } from '../constants/seo'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import CreatorStrip from '../components/CreatorStrip'
import { useCanSeeStats } from '../hooks/useCanSeeStats'
import { Reveal, Icon, ICONS, StepsTimeline, FeeBreakdown, darkBtn, outlineBtn, goldBtn } from '../components/PageKit'

const compactFormat = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 })

const STATS = [
  { value: '100+', label: 'Influenceurs disponibles' },
  { value: '50+', label: 'Marques satisfaites' },
  { value: '80+', label: 'Campagnes lancées' },
  { value: '98%', label: 'Taux de satisfaction' }
]

const STEPS = [
  { title: 'Recherchez', desc: 'Explorez nos influenceurs TikTok vérifiés. Filtrez par niche, audience et prix.' },
  { title: 'Collaborez', desc: 'Envoyez votre demande, discutez de votre brief et validez les conditions directement sur la plateforme.' },
  { title: 'Validez', desc: 'Recevez le contenu créé et validez-le : le créateur est payé seulement à ce moment-là.' }
]

const FEATURES = [
  { icon: 'check', title: 'Influenceurs vérifiés', desc: "Tous nos créateurs sont vérifiés pour garantir l'authenticité de leur audience et la qualité de leur contenu.", wide: true },
  { icon: 'lock', title: 'Paiement sécurisé', desc: "Payez en toute confiance. Votre argent est protégé jusqu'à la livraison et validation du contenu." },
  { icon: 'chart', title: 'Statistiques réelles', desc: 'Abonnés, vues moyennes et taux d’engagement proviennent directement du compte TikTok connecté.' },
  { icon: 'chat', title: 'Gestion simplifiée', desc: 'Demandes, messagerie et paiements réunis en un seul endroit.' },
  { icon: 'support', title: 'Support dédié', desc: "Une équipe à votre écoute pour vous accompagner dans vos campagnes d'influence marketing." }
]

const PRICING_POINTS = [
  "Accès illimité au catalogue d'influenceurs",
  'Messagerie sécurisée avec les créateurs',
  'Paiement uniquement lors d’une collaboration'
]

// Visuel du hero : trois vrais créateurs en éventail, avec un léger parallaxe au scroll
// (profondeurs différentes) et des badges de confiance. Mouvement réduit : immobile.
const HeroCards = () => {
  const { doctors } = useContext(AppContext)
  const reduceMotion = useReducedMotion()
  const canSeeStats = useCanSeeStats()
  const { scrollY } = useScroll()
  const depth = [useTransform(scrollY, [0, 600], [0, -40]), useTransform(scrollY, [0, 600], [0, -90]), useTransform(scrollY, [0, 600], [0, -60])]
  const badgeY = useTransform(scrollY, [0, 600], [0, -120])

  const cards = useMemo(() => doctors
    .filter((item) => item.tiktokUsername && item.image && item.image !== assets.profile_pic)
    .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
    .slice(0, 3), [doctors])

  const layout = [
    { rotate: -9, x: '-100%', z: 1 },
    { rotate: 0, x: '-50%', z: 3 },
    { rotate: 9, x: '0%', z: 2 }
  ]

  return (
    <div className='relative h-[22rem] sm:h-[26rem]' aria-hidden='true'>
      {cards.map((item, i) => (
        <motion.div
          key={item._id}
          className='absolute left-1/2 top-6 w-40 h-56 sm:w-52 sm:h-72 rounded-2xl overflow-hidden border-4 border-white shadow-2xl bg-gray-200'
          style={{ zIndex: layout[i].z, y: reduceMotion ? 0 : depth[i] }}
          initial={{ opacity: 0, rotate: 0, x: '-50%' }}
          animate={{ opacity: 1, rotate: layout[i].rotate, x: layout[i].x }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img src={item.image} alt='' className='w-full h-full object-cover' />
          <span className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10 text-white'>
            <span className='block font-semibold text-sm truncate'>@{item.tiktokUsername}</span>
            {canSeeStats && item.followers?.tiktok > 0 && <span className='block text-xs text-white/80'>{compactFormat.format(item.followers.tiktok)} abonnés</span>}
          </span>
        </motion.div>
      ))}

      <motion.div
        style={{ y: reduceMotion ? 0 : badgeY }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.7 }}
        className='absolute z-10 left-0 sm:left-4 top-10 flex items-center gap-2 rounded-full bg-white shadow-lg px-4 py-2 text-sm font-semibold text-gray-900'
      >
        <Icon path={ICONS.check} className='w-5 h-5 text-green-600' /> Profil vérifié
      </motion.div>
      <motion.div
        style={{ y: reduceMotion ? 0 : depth[0] }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.85 }}
        className='absolute z-10 right-0 sm:right-4 bottom-4 flex items-center gap-2 rounded-full bg-gray-900 shadow-lg px-4 py-2 text-sm font-semibold text-white'
      >
        <Icon path={ICONS.lock} className='w-5 h-5 text-primary' /> Paiement protégé
      </motion.div>
    </div>
  )
}

const ForBrands = () => {
  const navigate = useNavigate()
  const signUp = () => navigate('/login?type=brand&isSignUp=true')

  return (
    <MotionConfig reducedMotion='user'>
      <div className='min-h-screen bg-white'>
        <SEO {...PAGE_SEO.forBrands} />

        {/* Hero */}
        <section className='grid lg:grid-cols-2 gap-10 items-center pt-12 md:pt-20 pb-16'>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className='inline-block px-4 py-1.5 rounded-full bg-primary/15 text-primary-dark text-sm font-semibold mb-8'>
              Pour les marques
            </span>
            <h1 className='text-4xl sm:text-5xl xl:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6'>
              Trouvez les meilleurs{' '}
              <span className='relative whitespace-nowrap'>
                <span className='absolute inset-x-0 bottom-1 h-4 md:h-5 bg-primary/50' aria-hidden='true'></span>
                <span className='relative'>influenceurs</span>
              </span>{' '}
              pour votre marque
            </h1>
            <p className='text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed mb-10'>
              Accédez à des créateurs vérifiés et lancez vos campagnes en quelques clics.
            </p>
            <div className='flex flex-col sm:flex-row gap-3'>
              <button onClick={signUp} className={darkBtn}>Commencer gratuitement</button>
              <button onClick={() => { navigate('/talents'); window.scrollTo(0, 0) }} className={outlineBtn}>Voir les talents</button>
            </div>
            <p className='mt-4 text-sm text-gray-500'>Gratuit pour explorer · Payez uniquement pour les collaborations</p>
          </motion.div>
          <HeroCards />
        </section>

        {/* Chiffres */}
        <dl className='grid grid-cols-2 md:grid-cols-4 border-y border-gray-200 divide-x divide-gray-200'>
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.06} className={`flex flex-col-reverse py-8 px-4 text-center ${i >= 2 ? 'border-t md:border-t-0 border-gray-200' : ''}`}>
              <dt className='text-sm text-gray-500 mt-1'>{stat.label}</dt>
              <dd className='text-4xl md:text-5xl font-bold text-gray-900 tracking-tight'>{stat.value}</dd>
            </Reveal>
          ))}
        </dl>

        <div className='py-20 md:py-28 space-y-24 md:space-y-32'>
          {/* Comment ça fonctionne */}
          <section aria-labelledby='how-title'>
            <Reveal className='max-w-2xl mb-14'>
              <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>En 3 étapes</p>
              <h2 id='how-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Comment ça fonctionne ?</h2>
            </Reveal>
            <StepsTimeline steps={STEPS} />
          </section>

          {/* Pourquoi Collabzz : grille bento */}
          <section aria-labelledby='why-title'>
            <Reveal className='max-w-2xl mb-12'>
              <h2 id='why-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Pourquoi choisir Collabzz ?</h2>
            </Reveal>
            <div className='grid md:grid-cols-3 gap-4'>
              {FEATURES.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.05} className={feature.wide ? 'md:col-span-2' : ''}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`h-full rounded-3xl p-7 ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${i === 0 ? 'bg-primary text-gray-900' : 'bg-primary/15 text-primary-dark'}`}>
                      <Icon path={ICONS[feature.icon]} />
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{feature.title}</h3>
                    <p className={`leading-relaxed ${i === 0 ? 'text-gray-300' : 'text-gray-600'}`}>{feature.desc}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Vrais créateurs (remplace les faux avis) */}
          <CreatorStrip>
            <Reveal className='max-w-2xl'>
              <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>Des créateurs déjà disponibles</h2>
              <p className='text-gray-600 leading-relaxed'>De vrais profils de la plateforme. Créez un compte gratuit pour accéder à leurs statistiques TikTok.</p>
            </Reveal>
          </CreatorStrip>

          {/* Tarification transparente */}
          <section aria-labelledby='pricing-title' className='grid lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
            <Reveal>
              <h2 id='pricing-title' className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>Tarification transparente</h2>
              <p className='text-lg text-gray-600 mb-8'>
                <span className='text-4xl font-bold text-gray-900 align-middle mr-2'>0€</span>
                pour créer votre compte et explorer la plateforme.
              </p>
              <ul className='space-y-3'>
                {PRICING_POINTS.map((point) => (
                  <li key={point} className='flex items-center gap-3 text-gray-800'>
                    <Icon path={ICONS.check} className='w-5 h-5 text-green-600 flex-shrink-0' />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1}>
              <FeeBreakdown audience='brand' />
            </Reveal>
          </section>

          {/* CTA */}
          <Reveal className='relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-16 md:py-20 text-center text-white'>
            <div className='absolute -top-24 -right-24 w-80 h-80 bg-primary/25 rounded-full blur-3xl' aria-hidden='true'></div>
            <div className='relative'>
              <h2 className='text-3xl md:text-5xl font-bold mb-5'>{"Lancez votre première campagne aujourd'hui"}</h2>
              <p className='text-lg text-gray-300 mb-8 max-w-2xl mx-auto'>
                {"Rejoignez les marques qui font confiance à Collabzz pour leurs campagnes d'influence."}
              </p>
              <button onClick={signUp} className={goldBtn}>Créer mon compte gratuitement</button>
              <p className='mt-4 text-sm text-gray-400'>Aucune carte bancaire requise · Configuration en 5 minutes</p>
            </div>
          </Reveal>
        </div>
      </div>
    </MotionConfig>
  )
}

export default ForBrands
