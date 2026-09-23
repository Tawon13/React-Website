import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react'
import SEO from '../components/SEO'
import { PAGE_SEO } from '../constants/seo'
import InfluencerFan from '../components/InfluencerFan'
import { Reveal, Icon, ICONS } from '../components/PageKit'

// Engagements vérifiables (repris de la FAQ et du fonctionnement réel de la plateforme),
// plus parlants qu'une liste de valeurs abstraites pour inspirer confiance.
const COMMITMENTS = [
  { icon: 'check', title: 'Profils validés à la main', desc: 'Chaque créateur est vérifié par notre équipe avant sa mise en ligne.' },
  { icon: 'chart', title: 'Statistiques réelles', desc: 'Abonnés, vues et engagement viennent directement du compte TikTok connecté.' },
  { icon: 'lock', title: 'Paiement protégé', desc: 'Le créateur est payé une fois le contenu livré et validé par la marque.' },
  { icon: 'wallet', title: '100 % pour le créateur', desc: "Le créateur touche l'intégralité du prix qu'il fixe. Aucun abonnement." }
]

const STATS = [
  { value: '100+', label: 'Influenceurs' },
  { value: '50+', label: 'Marques' },
  { value: '80+', label: 'Collaborations' },
  { value: '98%', label: 'Satisfaction' }
]

const PROBLEMS = [
  'Des agences hors de prix pour une petite marque',
  'Des heures perdues à démarcher en messages privés',
  'Des chiffres déclarés, impossibles à vérifier'
]

const SOLUTIONS = [
  'Des tarifs affichés et comparables, sans intermédiaire',
  'Une demande de collaboration et une messagerie intégrées',
  'Des statistiques TikTok synchronisées automatiquement'
]

const STEPS = {
  brands: [
    { title: 'Découvrez', desc: 'Parcourez les talents et comparez leurs statistiques vérifiées.' },
    { title: 'Choisissez', desc: 'Sélectionnez la prestation qui correspond à votre besoin.' },
    { title: 'Collaborez', desc: 'Échangez votre brief directement via la messagerie sécurisée.' },
    { title: 'Validez', desc: 'Recevez le contenu et validez-le avant que le créateur soit payé.' }
  ],
  creators: [
    { title: 'Inscrivez-vous', desc: 'Créez votre profil gratuitement et connectez votre compte TikTok.' },
    { title: 'Fixez vos prix', desc: 'Vous restez libre de vos tarifs, et vous en touchez 100 %.' },
    { title: 'Recevez des offres', desc: 'Les marques découvrent votre profil et vous proposent des collaborations.' },
    { title: 'Créez & gagnez', desc: 'Livrez un contenu authentique et soyez payé une fois validé.' }
  ]
}

const VALUES = [
  { icon: 'eye', title: 'Transparence', desc: 'Des prix clairs, des statistiques vérifiées et une communication honnête entre toutes les parties.' },
  { icon: 'users', title: 'Collaboration', desc: "Les meilleures campagnes naissent d'une vraie relation entre marques et créateurs." },
  { icon: 'bolt', title: 'Simplicité', desc: 'De la recherche au paiement, tout se fait au même endroit, en quelques clics.' }
]

const About = () => {
  const navigate = useNavigate()
  const [audience, setAudience] = useState('brands')
  const reduceMotion = useReducedMotion()

  const goTo = (path) => {
    navigate(path)
    window.scrollTo(0, 0)
  }

  const darkBtn = 'cursor-pointer bg-gray-900 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
  const outlineBtn = 'cursor-pointer border border-gray-300 text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

  const audiences = [
    { id: 'brands', label: 'Pour les marques', steps: STEPS.brands },
    { id: 'creators', label: 'Pour les créateurs', steps: STEPS.creators }
  ]
  const activeAudience = audiences.find((a) => a.id === audience)

  return (
    <MotionConfig reducedMotion='user'>
      <div className='min-h-screen bg-white'>
        <SEO {...PAGE_SEO.about} />

        {/* Hero éditorial : texte à gauche, chiffres à droite */}
        <section className='grid lg:grid-cols-12 gap-12 items-end pt-12 md:pt-20 pb-16 md:pb-24'>
          <motion.div
            className='lg:col-span-7'
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <span className='inline-block px-4 py-1.5 rounded-full bg-primary/15 text-primary-dark text-sm font-semibold mb-8'>
              {"La plateforme française du marketing d'influence"}
            </span>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-8'>
              Des collaborations{' '}
              <span className='relative whitespace-nowrap'>
                <span className='absolute inset-x-0 bottom-1 h-4 md:h-5 bg-primary/50 -z-0' aria-hidden='true'></span>
                <span className='relative'>simples, vérifiées</span>
              </span>{' '}
              et bien payées
            </h1>
            <p className='text-lg md:text-xl text-gray-600 max-w-xl leading-relaxed mb-10'>
              Collabzz connecte les marques avec des créateurs de contenu vérifiés, sans agence, sans abonnement et en toute transparence.
            </p>
            <div className='flex flex-col sm:flex-row gap-3'>
              <button onClick={() => goTo('/for-brands')} className={darkBtn}>Je suis une marque</button>
              <button onClick={() => goTo('/for-creators')} className={outlineBtn}>Je suis créateur</button>
            </div>
          </motion.div>

          <dl className='lg:col-span-5 grid grid-cols-2 gap-3'>
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.06, ease: 'easeOut' }}
                className={`flex flex-col-reverse rounded-2xl p-6 ${i === 0 ? 'bg-gray-900 text-white' : i === 3 ? 'bg-primary text-gray-900' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
              >
                <dt className={`text-sm mt-1 ${i === 0 ? 'text-gray-400' : i === 3 ? 'text-gray-800' : 'text-gray-500'}`}>{stat.label}</dt>
                <dd className='text-4xl md:text-5xl font-bold tracking-tight'>{stat.value}</dd>
              </motion.div>
            ))}
          </dl>
        </section>

        {/* Éventail de créateurs (s'ouvre au scroll, clic = fiche) */}
        <InfluencerFan onDiscover={() => goTo('/talents')}>
          <p className='text-sm font-semibold uppercase tracking-wider text-primary mb-3'>Nos créateurs</p>
          <h2 className='text-3xl md:text-4xl font-bold leading-tight mb-4'>Des talents vérifiés, prêts à collaborer</h2>
          <p className='text-gray-300 leading-relaxed'>
            {reduceMotion
              ? 'Cliquez sur une photo pour voir les statistiques du créateur.'
              : "Faites défiler : l'éventail s'ouvre, puis les créateurs s'écartent. Remontez pour les faire revenir, et cliquez sur une photo pour voir ses statistiques."}
          </p>
        </InfluencerFan>

        <div className='py-20 md:py-28 space-y-24 md:space-y-32'>
          {/* Engagements : titre collant à gauche, liste numérotée à droite */}
          <section aria-labelledby='commitments-title' className='grid lg:grid-cols-12 gap-10'>
            <div className='lg:col-span-4'>
              <div className='lg:sticky lg:top-28'>
                <h2 id='commitments-title' className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>Nos engagements</h2>
                <p className='text-gray-600 leading-relaxed'>Ce qui fait de Collabzz un endroit sûr pour les marques comme pour les créateurs.</p>
              </div>
            </div>
            <ol className='lg:col-span-8'>
              {COMMITMENTS.map((item, i) => (
                <Reveal key={item.title} delay={i * 0.05}>
                  <li className='grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 py-7 border-t border-gray-200 last:border-b'>
                    <span className='row-span-2 text-sm font-semibold text-gray-400 tabular-nums pt-1.5'>{String(i + 1).padStart(2, '0')}</span>
                    <h3 className='flex items-center gap-3 text-xl font-semibold text-gray-900'>
                      <span className='w-9 h-9 rounded-lg bg-primary/15 text-primary-dark flex items-center justify-center flex-shrink-0'>
                        <Icon path={ICONS[item.icon]} className='w-5 h-5' />
                      </span>
                      {item.title}
                    </h3>
                    <p className='text-gray-600 leading-relaxed md:pl-12'>{item.desc}</p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </section>

          {/* Mission : grand titre + comparatif avant / après */}
          <section aria-labelledby='mission-title'>
            <Reveal className='max-w-4xl'>
              <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Notre mission</p>
              <h2 id='mission-title' className='text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-8'>
                {"Rendre l'influence accessible à toutes les marques"}
              </h2>
            </Reveal>
            <Reveal className='grid md:grid-cols-2 gap-6 md:gap-12 mb-14 text-lg text-gray-700 leading-relaxed'>
              <p>{"Chez Collabzz, nous croyons au pouvoir de l'authenticité et de la créativité. Notre mission est de simplifier les collaborations entre marques et influenceurs."}</p>
              <p>Les marques découvrent des talents authentiques, et les créateurs monétisent leur passion tout en restant fidèles à leur communauté.</p>
            </Reveal>
            <Reveal className='rounded-3xl border border-gray-200 overflow-hidden'>
              <div className='hidden sm:grid grid-cols-2 bg-gray-50 border-b border-gray-200 text-sm font-semibold'>
                <p className='px-5 sm:px-8 py-4 text-gray-500'>Avant</p>
                <p className='px-5 sm:px-8 py-4 text-gray-900 border-l border-gray-200'>Avec Collabzz</p>
              </div>
              {PROBLEMS.map((problem, i) => (
                <div key={problem} className='grid sm:grid-cols-2 border-b border-gray-200 last:border-b-0'>
                  <p className='flex gap-3 px-5 sm:px-8 pt-5 pb-2 sm:pb-5 text-gray-500 min-w-0'>
                    <span className='sr-only sm:hidden'>Avant :</span>
                    <Icon path={ICONS.x} className='w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5' />
                    <span>{problem}</span>
                  </p>
                  <p className='flex gap-3 px-5 sm:px-8 pt-2 pb-5 sm:pt-5 text-gray-900 font-medium sm:border-l border-gray-200 min-w-0'>
                    <span className='sr-only sm:hidden'>Avec Collabzz :</span>
                    <Icon path={ICONS.check} className='w-5 h-5 text-primary-dark flex-shrink-0 mt-0.5' />
                    <span>{SOLUTIONS[i]}</span>
                  </p>
                </div>
              ))}
            </Reveal>
          </section>

          {/* Comment ça marche : onglets marques / créateurs + frise */}
          <section aria-labelledby='how-title'>
            <Reveal className='flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12'>
              <h2 id='how-title' className='text-3xl md:text-4xl font-bold text-gray-900'>Comment ça marche ?</h2>
              <div role='tablist' aria-label='Public' className='inline-flex self-start rounded-full bg-gray-100 p-1'>
                {audiences.map((a) => (
                  <button
                    key={a.id}
                    role='tab'
                    id={`tab-${a.id}`}
                    aria-selected={audience === a.id}
                    aria-controls='how-panel'
                    onClick={() => setAudience(a.id)}
                    className={`cursor-pointer relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${audience === a.id ? 'text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {audience === a.id && (
                      <motion.span layoutId='how-tab-pill' className='absolute inset-0 rounded-full bg-gray-900' transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                    )}
                    <span className='relative'>{a.label}</span>
                  </button>
                ))}
              </div>
            </Reveal>
            <div id='how-panel' role='tabpanel' aria-labelledby={`tab-${audience}`}>
              <AnimatePresence mode='wait'>
                <motion.ol
                  key={audience}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className='grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6'
                >
                  {activeAudience.steps.map((step, i) => (
                    <li key={step.title} className='relative'>
                      <div className='flex items-center gap-4 mb-5'>
                        <span className={`w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${audience === 'brands' ? 'bg-primary text-gray-900' : 'bg-gray-900 text-white'}`}>
                          {i + 1}
                        </span>
                        {i < activeAudience.steps.length - 1 && <span className='hidden lg:block h-px flex-1 bg-gray-200' aria-hidden='true'></span>}
                      </div>
                      <h3 className='text-lg font-semibold text-gray-900 mb-1'>{step.title}</h3>
                      <p className='text-gray-600 leading-relaxed'>{step.desc}</p>
                    </li>
                  ))}
                </motion.ol>
              </AnimatePresence>
            </div>
          </section>

          {/* Valeurs : trois colonnes séparées par des filets */}
          <section aria-labelledby='values-title'>
            <Reveal>
              <h2 id='values-title' className='text-3xl md:text-4xl font-bold text-gray-900 mb-12'>Nos valeurs</h2>
            </Reveal>
            <div className='grid md:grid-cols-3 border-t border-gray-900'>
              {VALUES.map((value, i) => (
                <Reveal key={value.title} delay={i * 0.06} className={`pt-8 pb-4 md:pr-8 ${i > 0 ? 'md:pl-8 md:border-l md:border-gray-200' : ''}`}>
                  <Icon path={ICONS[value.icon]} className='w-7 h-7 text-primary-dark mb-5' />
                  <h3 className='text-xl font-bold text-gray-900 mb-2'>{value.title}</h3>
                  <p className='text-gray-600 leading-relaxed'>{value.desc}</p>
                </Reveal>
              ))}
            </div>
          </section>

          {/* CTA final */}
          <Reveal className='rounded-3xl bg-primary px-6 py-14 md:py-20 md:px-16 grid md:grid-cols-12 gap-8 items-center'>
            <div className='md:col-span-8'>
              <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>Prêt à lancer votre première collaboration ?</h2>
              <p className='text-lg text-gray-800'>
                {"L'inscription est gratuite, pour les marques comme pour les créateurs."}
              </p>
            </div>
            <div className='md:col-span-4 flex flex-col gap-3'>
              <button onClick={() => goTo('/talents')} className={`${darkBtn} focus-visible:ring-gray-900 focus-visible:ring-offset-primary`}>Découvrir les talents</button>
              <button onClick={() => goTo('/for-creators')} className='cursor-pointer border border-gray-900 text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:bg-gray-900/10 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900'>Devenir créateur</button>
            </div>
          </Reveal>
        </div>
      </div>
    </MotionConfig>
  )
}

export default About
