import React from 'react'

const Features = () => {
  return (
    <div className='my-20 px-4 sm:px-10 md:px-14 lg:px-20'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Sans Frais Initiaux */}
        <div className='bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all'>
          <div className='w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4'>
            <svg className='w-6 h-6 text-pink-600' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z'/>
              <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z' clipRule='evenodd'/>
            </svg>
          </div>
          <h3 className='text-xl font-semibold mb-3'>Sans Frais Initiaux</h3>
          <p className='text-gray-600 text-sm'>
            Recherchez des influenceurs gratuitement. Aucun abonnement, contrat ou frais cachés.
          </p>
        </div>

        {/* Influenceurs Vérifiés */}
        <div className='bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all'>
          <div className='w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4'>
            <svg className='w-6 h-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd'/>
            </svg>
          </div>
          <h3 className='text-xl font-semibold mb-3'>Influenceurs Vérifiés</h3>
          <p className='text-gray-600 text-sm'>
            Chaque influenceur est vérifié par nos soins. Recevez toujours du contenu de haute qualité et professionnel.
          </p>
        </div>

        {/* Chat Instantané */}
        <div className='bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all'>
          <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4'>
            <svg className='w-6 h-6 text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z'/>
              <path d='M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z'/>
            </svg>
          </div>
          <h3 className='text-xl font-semibold mb-3'>Chat Instantané</h3>
          <p className='text-gray-600 text-sm'>
            Discutez instantanément avec les influenceurs et restez en contact tout au long de la transaction.
          </p>
        </div>

        {/* Achats Sécurisés */}
        <div className='bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all'>
          <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4'>
            <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
              <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd'/>
            </svg>
          </div>
          <h3 className='text-xl font-semibold mb-3'>Achats Sécurisés</h3>
          <p className='text-gray-600 text-sm'>
            Votre argent est conservé en sécurité jusqu'à ce que vous approuviez le travail de l'influenceur.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Features
