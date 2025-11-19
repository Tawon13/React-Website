import React from 'react'
import { useNavigate } from 'react-router-dom'

const About = () => {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      {/* Hero Section */}
      <div className='bg-primary text-white py-20 px-4'>
        <div className='max-w-6xl mx-auto text-center'>
          <h1 className='text-4xl md:text-5xl font-bold mb-6'>
            À Propos de Collabzz
          </h1>
          <p className='text-xl md:text-2xl opacity-90 max-w-3xl mx-auto'>
            La plateforme qui connecte les marques avec les meilleurs talents du marketing d'influence
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className='max-w-6xl mx-auto py-16 px-4'>
        <div className='grid md:grid-cols-2 gap-12 items-center mb-20'>
          <div>
            <h2 className='text-3xl md:text-4xl font-bold text-gray-900 mb-6'>
              Notre Mission
            </h2>
            <p className='text-lg text-gray-700 mb-4 leading-relaxed'>
              Chez <span className='font-semibold text-primary'>Collabzz</span>, nous croyons au pouvoir de l'authenticité et de la créativité. Notre mission est de simplifier et d'optimiser les collaborations entre marques et influenceurs.
            </p>
            <p className='text-lg text-gray-700 leading-relaxed'>
              Nous offrons une plateforme intuitive où les marques peuvent découvrir des talents authentiques, et où les créateurs de contenu peuvent monétiser leur passion tout en restant fidèles à leur communauté.
            </p>
          </div>
          <div className='bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 md:p-12'>
            <div className='space-y-6'>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M13 10V3L4 14h7v7l9-11h-7z'/>
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>Rapidité</h3>
                  <p className='text-gray-600'>Trouvez et collaborez avec des influenceurs en quelques clics</p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/>
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>Qualité</h3>
                  <p className='text-gray-600'>Des créateurs vérifiés avec des communautés engagées</p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='w-12 h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'/>
                  </svg>
                </div>
                <div>
                  <h3 className='font-semibold text-gray-900 mb-2'>Sécurité</h3>
                  <p className='text-gray-600'>Transactions sécurisées et messagerie intégrée</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className='bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 md:p-12 mb-20'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white'>
            <div>
              <div className='text-4xl md:text-5xl font-bold mb-2'>500+</div>
              <div className='text-sm md:text-base opacity-90'>Influenceurs</div>
            </div>
            <div>
              <div className='text-4xl md:text-5xl font-bold mb-2'>200+</div>
              <div className='text-sm md:text-base opacity-90'>Marques</div>
            </div>
            <div>
              <div className='text-4xl md:text-5xl font-bold mb-2'>1000+</div>
              <div className='text-sm md:text-base opacity-90'>Collaborations</div>
            </div>
            <div>
              <div className='text-4xl md:text-5xl font-bold mb-2'>98%</div>
              <div className='text-sm md:text-base opacity-90'>Satisfaction</div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className='mb-20'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12'>
            Nos Valeurs
          </h2>
          <div className='grid md:grid-cols-3 gap-8'>
            <div className='bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto'>
                <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z'/>
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-900 text-center mb-4'>Transparence</h3>
              <p className='text-gray-600 text-center'>
                Des prix clairs, des statistiques vérifiées et une communication honnête entre toutes les parties.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto'>
                <svg className='w-8 h-8 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'/>
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-900 text-center mb-4'>Collaboration</h3>
              <p className='text-gray-600 text-center'>
                Nous croyons que les meilleures campagnes naissent d'une vraie collaboration entre marques et créateurs.
              </p>
            </div>

            <div className='bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow'>
              <div className='w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto'>
                <svg className='w-8 h-8 text-orange-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z'/>
                </svg>
              </div>
              <h3 className='text-xl font-bold text-gray-900 text-center mb-4'>Innovation</h3>
              <p className='text-gray-600 text-center'>
                Nous innovons constamment pour offrir les meilleurs outils aux marques et aux influenceurs.
              </p>
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className='mb-20'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12'>
            Comment ça marche ?
          </h2>
          <div className='grid md:grid-cols-2 gap-12'>
            {/* Pour les Marques */}
            <div className='bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <span className='w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold'>
                  M
                </span>
                Pour les Marques
              </h3>
              <div className='space-y-6'>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    1
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Découvrez</h4>
                    <p className='text-gray-600'>Parcourez notre catalogue de talents avec statistiques vérifiées</p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    2
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Choisissez</h4>
                    <p className='text-gray-600'>Sélectionnez le package qui correspond à vos besoins</p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    3
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Collaborez</h4>
                    <p className='text-gray-600'>Échangez directement via notre messagerie sécurisée</p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    4
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Résultats</h4>
                    <p className='text-gray-600'>Recevez votre contenu et mesurez l'impact de votre campagne</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pour les Influenceurs */}
            <div className='bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-8'>
              <h3 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
                <span className='w-10 h-10 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold'>
                  I
                </span>
                Pour les Influenceurs
              </h3>
              <div className='space-y-6'>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    1
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Inscrivez-vous</h4>
                    <p className='text-gray-600'>Créez votre profil et connectez vos réseaux sociaux</p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    2
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Soyez visible</h4>
                    <p className='text-gray-600'>Les marques découvrent votre profil et vos statistiques</p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    3
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Recevez des offres</h4>
                    <p className='text-gray-600'>Les marques vous contactent pour des collaborations</p>
                  </div>
                </div>
                <div className='flex gap-4'>
                  <div className='w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0'>
                    4
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>Créez & Gagnez</h4>
                    <p className='text-gray-600'>Créez du contenu authentique et monétisez votre passion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className='mb-20'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4'>
            Notre Équipe
          </h2>
          <p className='text-gray-600 text-center max-w-2xl mx-auto mb-12'>
            Une équipe passionnée dédiée à révolutionner le marketing d'influence
          </p>
          <div className='grid md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold'>
                DI
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-1'>Direction</h3>
              <p className='text-primary font-medium mb-2'>Leadership & Vision</p>
              <p className='text-gray-600 text-sm'>
                Une direction experte avec 5+ ans d'expérience dans l'influence marketing
              </p>
            </div>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold'>
                TT
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-1'>Tech Team</h3>
              <p className='text-primary font-medium mb-2'>Développement & Innovation</p>
              <p className='text-gray-600 text-sm'>
                Développeurs passionnés créant une plateforme innovante et performante
              </p>
            </div>
            <div className='text-center'>
              <div className='w-32 h-32 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-bold'>
                SC
              </div>
              <h3 className='text-xl font-bold text-gray-900 mb-1'>Support Client</h3>
              <p className='text-primary font-medium mb-2'>Relations & Accompagnement</p>
              <p className='text-gray-600 text-sm'>
                Une équipe dédiée pour accompagner marques et influenceurs au quotidien
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-8 md:p-12 text-center text-white'>
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Prêt à démarrer ?
          </h2>
          <p className='text-xl opacity-90 mb-8 max-w-2xl mx-auto'>
            Rejoignez des centaines de marques et d'influenceurs qui font confiance à Collabzz
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button
              onClick={() => navigate('/login-brand')}
              className='bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition'
            >
              Je suis une marque
            </button>
            <button
              onClick={() => navigate('/login-influencer')}
              className='bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition'
            >
              Je suis influenceur
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About
