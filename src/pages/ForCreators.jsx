import { useNavigate } from 'react-router-dom'
import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from 'motion/react'
import SEO from '../components/SEO'
import { PAGE_SEO } from '../constants/seo'
import CreatorStrip from '../components/CreatorStrip'
import { Reveal, Icon, ICONS, StepsTimeline, FeeBreakdown, darkBtn, outlineBtn } from '../components/PageKit'

const STATS = [
  { value: '100+', label: 'Créateurs actifs' },
  { value: '50+', label: 'Marques partenaires' },
  { value: '80+', label: 'Collaborations réussies' }
]

const STEPS = [
  { title: 'Créez votre profil', desc: 'Inscrivez-vous gratuitement, connectez votre compte TikTok et créez un profil professionnel qui met en valeur votre contenu.' },
  { title: 'Recevez des demandes', desc: 'Une fois votre profil validé, les marques qui correspondent à votre niche vous découvrent et vous proposent des collaborations.' },
  { title: "Gagnez de l'argent", desc: 'Créez du contenu, validez-le avec la marque, et recevez votre paiement de manière sécurisée.' }
]

const BENEFITS = [
  { icon: 'wallet', title: '100% Gratuit', desc: "Pas de frais d'inscription, pas d'abonnement. Vous recevez 100 % du prix que vous fixez : les frais de service sont payés par la marque." },
  { icon: 'lock', title: 'Paiements sécurisés', desc: 'Votre argent est protégé. Les paiements sont libérés uniquement après validation de votre travail.' },
  { icon: 'tag', title: 'Vous fixez vos prix', desc: 'Vous restez libre de vos tarifs et de choisir les collaborations que vous acceptez.' },
  { icon: 'support', title: 'Support dédié', desc: 'Notre équipe est là pour vous aider à chaque étape de vos collaborations.' }
]

// Visuel du hero : les notifications qu'un créateur reçoit sur Collabzz, empilées avec
// une entrée échelonnée (une seule fois) et un léger parallaxe au scroll.
const NOTIFICATIONS = [
  { icon: 'check', tone: 'bg-green-100 text-green-700', title: 'Profil validé', desc: 'Votre profil est visible par les marques' },
  { icon: 'inbox', tone: 'bg-primary/20 text-primary-dark', title: 'Nouvelle demande', desc: 'Marque Beauté · 1 vidéo TikTok', amount: '500 €' },
  { icon: 'wallet', tone: 'bg-gray-900 text-primary', title: 'Paiement reçu', desc: 'Contenu validé par la marque', amount: '+500 €' }
]

const HeroNotifications = () => {
  const reduceMotion = useReducedMotion()
  const { scrollY } = useScroll()
  // Écarts faibles entre les couches : assez pour la profondeur, sans que les cartes se chevauchent.
  const offsets = [useTransform(scrollY, [0, 800], [0, -10]), useTransform(scrollY, [0, 800], [0, -22]), useTransform(scrollY, [0, 800], [0, -34])]

  return (
    <figure className='relative'>
      <div className='absolute inset-8 bg-primary/30 rounded-full blur-3xl' aria-hidden='true'></div>
      <ul className='relative space-y-4 max-w-sm mx-auto lg:ml-auto'>
        {NOTIFICATIONS.map((notif, i) => (
          <motion.li
            key={notif.title}
            style={{ y: reduceMotion ? 0 : offsets[i] }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`flex items-center gap-4 rounded-2xl bg-white border border-gray-100 shadow-xl p-4 ${i === 1 ? 'lg:-ml-10' : ''}`}
          >
            <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${notif.tone}`}>
              <Icon path={ICONS[notif.icon]} />
            </span>
            <span className='flex-1 min-w-0'>
              <span className='block font-semibold text-gray-900 truncate'>{notif.title}</span>
              <span className='block text-sm text-gray-500 truncate'>{notif.desc}</span>
            </span>
            {notif.amount && <span className='font-bold text-gray-900 tabular-nums'>{notif.amount}</span>}
          </motion.li>
        ))}
      </ul>
      <figcaption className='relative text-center lg:text-right text-xs text-gray-500 mt-4'>Exemple illustratif de notifications</figcaption>
    </figure>
  )
}

const ForCreators = () => {
  const navigate = useNavigate()
  const signUp = () => navigate('/login?isSignUp=true')

  return (
    <MotionConfig reducedMotion='user'>
      <div className='min-h-screen bg-white'>
        <SEO {...PAGE_SEO.forCreators} />

        {/* Hero */}
        <section className='grid lg:grid-cols-2 gap-12 items-center pt-12 md:pt-20 pb-16'>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className='inline-block px-4 py-1.5 rounded-full bg-primary/15 text-primary-dark text-sm font-semibold mb-8'>
              Pour les créateurs
            </span>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6'>
              {"Gagnez de l'argent en tant que "}
              <span className='relative whitespace-nowrap'>
                <span className='absolute inset-x-0 bottom-1 h-4 md:h-5 bg-primary/50' aria-hidden='true'></span>
                <span className='relative'>créateur</span>
              </span>
            </h1>
            <p className='text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed mb-10'>
              Rejoignez les influenceurs qui collaborent avec des marques via Collabzz, et gardez 100 % de vos tarifs.
            </p>
            <div className='flex flex-col sm:flex-row gap-3'>
              <button onClick={signUp} className={darkBtn}>Commencer gratuitement</button>
              <button onClick={() => { navigate('/about'); window.scrollTo(0, 0) }} className={outlineBtn}>En savoir plus</button>
            </div>
            <p className='mt-4 text-sm text-gray-500'>Gratuit pour toujours · Aucune carte requise</p>
          </motion.div>
          <HeroNotifications />
        </section>

        {/* Chiffres */}
        <dl className='grid grid-cols-3 border-y border-gray-200 divide-x divide-gray-200'>
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.06} className='flex flex-col-reverse py-8 px-3 text-center'>
              <dt className='text-sm text-gray-500 mt-1'>{stat.label}</dt>
              <dd className='text-3xl md:text-5xl font-bold text-gray-900 tracking-tight'>{stat.value}</dd>
            </Reveal>
          ))}
        </dl>

        <div className='py-20 md:py-28 space-y-24 md:space-y-32'>
          {/* Comment ça marche */}
          <section aria-labelledby='how-title'>
            <Reveal className='max-w-2xl mb-14'>
              <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>En 3 étapes</p>
              <h2 id='how-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Comment ça marche ?</h2>
            </Reveal>
            <StepsTimeline steps={STEPS} accent='bg-gray-900 text-white' />
          </section>

          {/* Ce que vous gagnez vraiment */}
          <section aria-labelledby='earn-title' className='grid lg:grid-cols-2 gap-10 lg:gap-16 items-center'>
            <Reveal>
              <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Transparence</p>
              <h2 id='earn-title' className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>Votre prix, sans commission</h2>
              <p className='text-lg text-gray-600 leading-relaxed'>
                {"Vous fixez votre tarif et vous le recevez en entier. Les frais de service de Collabzz s'ajoutent au prix payé par la marque, jamais à votre détriment."}
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <FeeBreakdown audience='creator' />
            </Reveal>
          </section>

          {/* Avantages */}
          <section aria-labelledby='benefits-title'>
            <Reveal className='max-w-2xl mb-12'>
              <h2 id='benefits-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Pourquoi rejoindre Collabzz ?</h2>
            </Reveal>
            <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              {BENEFITS.map((benefit, i) => (
                <Reveal key={benefit.title} delay={i * 0.06} className='h-full'>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className='h-full rounded-3xl bg-gray-50 border border-gray-200 p-7'
                  >
                    <div className='w-11 h-11 rounded-xl bg-gray-900 text-primary flex items-center justify-center mb-5'>
                      <Icon path={ICONS[benefit.icon]} />
                    </div>
                    <h3 className='text-xl font-semibold text-gray-900 mb-2'>{benefit.title}</h3>
                    <p className='text-gray-600 leading-relaxed'>{benefit.desc}</p>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Vrais créateurs (remplace les faux avis) */}
          <CreatorStrip>
            <Reveal className='max-w-2xl'>
              <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>Ils créent déjà sur Collabzz</h2>
              <p className='text-gray-600 leading-relaxed'>Des créateurs de la plateforme, visibles par les marques. Le prochain profil pourrait être le vôtre.</p>
            </Reveal>
          </CreatorStrip>

          {/* CTA */}
          <Reveal className='relative overflow-hidden rounded-3xl bg-primary px-6 py-16 md:py-20 text-center'>
            <div className='absolute -bottom-24 -left-16 w-80 h-80 bg-white/30 rounded-full blur-3xl' aria-hidden='true'></div>
            <div className='relative'>
              <h2 className='text-3xl md:text-5xl font-bold text-gray-900 mb-5'>Prêt à commencer votre aventure ?</h2>
              <p className='text-lg text-gray-800 mb-8 max-w-2xl mx-auto'>
                Créez votre profil gratuitement et commencez à recevoir des demandes de marques.
              </p>
              <button onClick={signUp} className={`${darkBtn} focus-visible:ring-gray-900 focus-visible:ring-offset-primary`}>Créer mon compte gratuitement</button>
              <p className='mt-4 text-sm text-gray-800'>Inscription en 2 minutes · Sans engagement</p>
            </div>
          </Reveal>
        </div>
      </div>
    </MotionConfig>
  )
}

export default ForCreators
