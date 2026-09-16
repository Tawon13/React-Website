import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'

const FAQ_ITEMS = [
  {
    question: "Combien coûte Collabzz ?",
    answer: "L'inscription et la recherche d'influenceurs sont entièrement gratuites : aucun abonnement ni frais cachés. Chaque créateur fixe librement le tarif affiché sur son profil, auquel s'ajoutent 15% de frais de service lors de votre commande. Le créateur perçoit toujours 100% du prix qu'il a fixé."
  },
  {
    question: "Comment se déroule une collaboration ?",
    answer: "Vous ajoutez les prestations qui vous intéressent à votre panier, puis vous envoyez votre demande de collaboration. L'influenceur la reçoit et l'accepte, vous échangez ensuite votre brief par messagerie directement sur la plateforme, et vous validez le contenu une fois livré."
  },
  {
    question: "Comment les influenceurs sont-ils vérifiés ?",
    answer: "Chaque créateur connecte son compte TikTok à Collabzz : ses abonnés, ses vues et son taux d'engagement sont donc des statistiques réelles, et non des chiffres déclarés. Notre équipe valide ensuite manuellement chaque profil avant sa mise en ligne."
  },
  {
    question: "Mon paiement est-il sécurisé ?",
    answer: "Oui. Votre argent est conservé en sécurité et n'est versé à l'influenceur qu'une fois le contenu livré et approuvé par vous. Si la prestation n'est pas réalisée, vous n'êtes pas débité."
  },
  {
    question: "Je suis créateur de contenu, comment rejoindre la plateforme ?",
    answer: "Créez votre compte créateur gratuitement, connectez votre compte TikTok, choisissez votre catégorie et fixez vos tarifs. Dès que votre profil est validé par notre équipe, il devient visible par les marques qui peuvent vous contacter directement."
  }
]

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(0)

  // Balisage FAQPage pour que les questions puissent remonter dans les résultats Google.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  }

  return (
    <div className='my-20 px-4 sm:px-10 md:px-14 lg:px-20'>
      <Helmet>
        <script type='application/ld+json'>{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <h2 className='text-2xl sm:text-3xl font-medium text-center mb-2'>Questions fréquentes</h2>
      <p className='text-gray-600 text-sm text-center mb-10'>
        {"Tout ce qu'il faut savoir avant de lancer votre première collaboration."}
      </p>

      <div className='max-w-3xl mx-auto flex flex-col gap-4'>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={item.question}
              className={`bg-white rounded-xl overflow-hidden transition-shadow duration-300 ${isOpen ? 'shadow-lg' : 'shadow-md hover:shadow-lg'}`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                className='w-full flex items-center justify-between gap-4 text-left p-5 sm:p-6'
              >
                <h3 className='text-base sm:text-lg font-semibold text-gray-900'>{item.question}</h3>
                <svg
                  className={`w-5 h-5 flex-shrink-0 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                </svg>
              </button>
              {/* La transition 0fr -> 1fr permet d'animer une hauteur automatique,
                  sans avoir à mesurer le contenu en JavaScript. */}
              <div
                id={`faq-answer-${index}`}
                aria-hidden={!isOpen}
                className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className='overflow-hidden'>
                  <p className='px-5 sm:px-6 pb-5 sm:pb-6 text-gray-600 text-sm leading-relaxed'>
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default FAQ
