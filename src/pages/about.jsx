import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import SEO from '../components/SEO'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 }
}

const Reveal = ({ children, className = '', delay = 0 }) => (
  <motion.div
    className={className}
    initial='hidden'
    whileInView='visible'
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    variants={fadeUp}
  >
    {children}
  </motion.div>
)

const About = () => {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      <SEO
        title='À propos'
        description="Découvrez Collabzz, la plateforme qui connecte marques et influenceurs pour des collaborations rémunérées simples et sécurisées."
        path='/about'
      />
      {/* Hero Section */}
      <div className='relative overflow-hidden bg-gradient-to-br from-primary via-primary to-blue-600 text-white py-24 px-4'>
        <div className='absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl'></div>
        <div className='absolute -bottom-32 -right-16 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl'></div>
        <motion.div
          className='relative max-w-6xl mx-auto text-center'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className='inline-block px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20'>
            La plateforme du marketing d'influence
          </span>
          <h1 className='text-4xl md:text-6xl font-bold mb-6 tracking-tight'>
            À Propos de Collabzz
          </h1>
          <p className='text-xl md:text-2xl opacity-90 max-w-3xl mx-auto leading-relaxed'>
            La plateforme qui connecte les marques avec les meilleurs talents du marketing d'influence
          </p>
        </motion.div>
      </div>

      {/* Mission Section */}
      <div className='max-w-6xl mx-auto py-16 md:py-24 px-4'>
        <div className='grid md:grid-cols-2 gap-12 items-center mb-24'>
          <Reveal>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-6'>
              Notre Mission
            </h2>
            <p className='text-lg text-gray-700 mb-4 leading-relaxed'>
              Chez <span className='font-semibold text-primary'>Collabzz</span>, nous croyons au pouvoir de l'authenticité et de la créativité. Notre mission est de simplifier et d'optimiser les collaborations entre marques et influenceurs.
            </p>
            <p className='text-lg text-gray-700 leading-relaxed'>
              Nous offrons une plateforme intuitive où les marques peuvent découvrir des talents authentiques, et où les créateurs de contenu peuvent monétiser leur passion tout en restant fidèles à leur communauté.
            </p>
          </Reveal>
          <Reveal delay={0.15} className='bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-3xl p-8 md:p-12 border border-primary/10'>
            <div className='space-y-6'>
              <div className='flex items-start gap-4 group'>
                <div className='w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 group-hover:scale-110 transition-transform'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z'/>
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>Rapidité</h3>
                  <p className='text-gray-600'>Trouvez et collaborez avec des influenceurs en quelques clics</p>
                </div>
              </div>
              <div className='flex items-start gap-4 group'>
                <div className='w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 group-hover:scale-110 transition-transform'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/>
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>Qualité</h3>
                  <p className='text-gray-600'>Des créateurs vérifiés avec des communautés engagées</p>
                </div>
              </div>
              <div className='flex items-start gap-4 group'>
                <div className='w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/20 group-hover:scale-110 transition-transform'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/>
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-1'>Sécurité</h3>
                  <p className='text-gray-600'>Transactions sécurisées et messagerie intégrée</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Stats Section */}
        <Reveal className='relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-8 md:p-12 mb-24 shadow-xl shadow-primary/20'>
          <div className='absolute -top-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl'></div>
          <div className='relative grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white'>
            {[
              { value: '100+', label: 'Influenceurs' },
              { value: '50+', label: 'Marques' },
              { value: '80+', label: 'Collaborations' },
              { value: '98%', label: 'Satisfaction' }
            ].map((stat) => (
              <div key={stat.label}>
                <div className='text-4xl md:text-5xl font-bold mb-2'>{stat.value}</div>
                <div className='text-sm md:text-base opacity-90'>{stat.label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Values Section */}
        <div className='mb-24'>
          <Reveal className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900'>
              Nos Valeurs
            </h2>
          </Reveal>
          <div className='grid md:grid-cols-3 gap-8'>
            {[
              {
                bg: 'bg-green-100', text: 'text-green-600', title: 'Transparence',
                desc: 'Des prix clairs, des statistiques vérifiées et une communication honnête entre toutes les parties.',
                path: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              },
              {
                bg: 'bg-purple-100', text: 'text-purple-600', title: 'Collaboration',
                desc: "Nous croyons que les meilleures campagnes naissent d'une vraie collaboration entre marques et créateurs.",
                path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
              },
              {
                bg: 'bg-orange-100', text: 'text-orange-600', title: 'Innovation',
                desc: 'Nous innovons constamment pour offrir les meilleurs outils aux marques et aux influenceurs.',
                path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'
              }
            ].map((value, i) => (
              <Reveal key={value.title} delay={i * 0.1}>
                <div className='h-full bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100'>
                  <div className={`w-16 h-16 ${value.bg} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                    <svg className={`w-8 h-8 ${value.text}`} fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={value.path}/>
                    </svg>
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 text-center mb-3'>{value.title}</h3>
                  <p className='text-gray-600 text-center leading-relaxed'>{value.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className='mb-24'>
          <Reveal className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900'>
              Comment ça marche ?
            </h2>
          </Reveal>
          <div className='grid md:grid-cols-2 gap-8'>
            {/* Pour les Marques */}
            <Reveal className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-blue-100/50'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <span className='w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold shadow-md shadow-primary/30'>
                  M
                </span>
                Pour les Marques
              </h3>
              <div className='space-y-6'>
                {[
                  { title: 'Découvrez', desc: 'Parcourez notre catalogue de talents avec statistiques vérifiées' },
                  { title: 'Choisissez', desc: 'Sélectionnez le package qui correspond à vos besoins' },
                  { title: 'Collaborez', desc: 'Échangez directement via notre messagerie sécurisée' },
                  { title: 'Résultats', desc: "Recevez votre contenu et mesurez l'impact de votre campagne" }
                ].map((step, i) => (
                  <div className='flex gap-4' key={step.title}>
                    <div className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm'>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>{step.title}</h4>
                      <p className='text-gray-600'>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* Pour les Influenceurs */}
            <Reveal delay={0.15} className='bg-gradient-to-br from-pink-50 to-orange-50 rounded-3xl p-8 border border-pink-100/50'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <span className='w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold shadow-md shadow-pink-500/30'>
                  I
                </span>
                Pour les Influenceurs
              </h3>
              <div className='space-y-6'>
                {[
                  { title: 'Inscrivez-vous', desc: 'Créez votre profil et connectez vos réseaux sociaux' },
                  { title: 'Soyez visible', desc: 'Les marques découvrent votre profil et vos statistiques' },
                  { title: 'Recevez des offres', desc: 'Les marques vous contactent pour des collaborations' },
                  { title: 'Créez & Gagnez', desc: 'Créez du contenu authentique et monétisez votre passion' }
                ].map((step, i) => (
                  <div className='flex gap-4' key={step.title}>
                    <div className='w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0 shadow-sm'>
                      {i + 1}
                    </div>
                    <div>
                      <h4 className='font-semibold text-gray-900 mb-1'>{step.title}</h4>
                      <p className='text-gray-600'>{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        {/* Team Section */}
        <div className='mb-24'>
          <Reveal className='text-center mb-12'>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-4'>
              Notre Équipe
            </h2>
            <p className='text-gray-600 max-w-2xl mx-auto'>
              Une équipe passionnée dédiée à révolutionner le marketing d'influence
            </p>
          </Reveal>
          <div className='grid md:grid-cols-3 gap-8'>
            {[
              { initials: 'DI', gradient: 'from-primary to-blue-600', role: 'Direction', tagline: 'Leadership & Vision', desc: "Une direction experte avec 5+ ans d'expérience dans l'influence marketing" },
              { initials: 'TT', gradient: 'from-purple-500 to-pink-500', role: 'Tech Team', tagline: 'Développement & Innovation', desc: 'Développeurs passionnés créant une plateforme innovante et performante' },
              { initials: 'SC', gradient: 'from-green-500 to-blue-500', role: 'Support Client', tagline: 'Relations & Accompagnement', desc: 'Une équipe dédiée pour accompagner marques et influenceurs au quotidien' }
            ].map((member, i) => (
              <Reveal key={member.role} delay={i * 0.1} className='text-center group'>
                <div className={`w-32 h-32 bg-gradient-to-br ${member.gradient} rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  {member.initials}
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-1'>{member.role}</h3>
                <p className='text-primary font-medium mb-2'>{member.tagline}</p>
                <p className='text-gray-600 text-sm leading-relaxed'>{member.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Reveal className='relative overflow-hidden bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-8 md:p-16 text-center text-white shadow-xl shadow-primary/20'>
          <div className='absolute -bottom-16 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl'></div>
          <div className='relative'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Prêt à démarrer ?
            </h2>
            <p className='text-xl opacity-90 mb-8 max-w-2xl mx-auto'>
              Rejoignez des centaines de marques et d'influenceurs qui font confiance à Collabzz
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <button
                onClick={() => navigate('/for-brands')}
                className='bg-white text-primary px-8 py-3 rounded-full font-semibold hover:bg-gray-100 hover:scale-105 transition-all shadow-md'
              >
                Je suis une marque
              </button>
              <button
                onClick={() => navigate('/for-creators')}
                className='bg-transparent border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 hover:scale-105 transition-all'
              >
                Je suis influenceur
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  )
}

export default About
