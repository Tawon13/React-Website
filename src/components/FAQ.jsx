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
    <section aria-labelledby='faq-title' className='grid lg:grid-cols-12 gap-10'>
      <Helmet>
        <script type='application/ld+json'>{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className='lg:col-span-4'>
        <div className='lg:sticky lg:top-28'>
          <h2 id='faq-title' className='text-3xl md:text-4xl font-bold text-gray-900 mb-3'>Questions fréquentes</h2>
          <p className='text-gray-600 leading-relaxed'>
            {"Tout ce qu'il faut savoir avant de lancer votre première collaboration."}
          </p>
        </div>
      </div>

      <div className='lg:col-span-8 flex flex-col gap-3'>
        {FAQ_ITEMS.map((item, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={item.question}
              className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${isOpen ? 'border-gray-900 bg-white' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                className='cursor-pointer w-full flex items-center justify-between gap-4 text-left p-5 sm:p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-2xl'
              >
                <h3 className='text-base sm:text-lg font-semibold text-gray-900'>{item.question}</h3>
                <svg
                  className={`w-5 h-5 flex-shrink-0 text-primary-dark transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
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
                  <p className='px-5 sm:px-6 pb-5 sm:pb-6 text-gray-600 leading-relaxed'>
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default FAQ
