import React from 'react'
import { useNavigate } from 'react-router-dom'

const ForBrands = () => {
    const navigate = useNavigate()

    return (
        <div className='min-h-screen'>
            {/* Hero Section */}
            <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 px-4'>
                <div className='max-w-6xl mx-auto text-center'>
                    <h1 className='text-4xl md:text-6xl font-bold mb-6'>
                        Trouvez les meilleurs influenceurs pour votre marque
                    </h1>
                    <p className='text-xl md:text-2xl mb-8 opacity-90'>
                        Accédez à des milliers de créateurs vérifiés et lancez vos campagnes en quelques clics
                    </p>
                    <button
                        onClick={() => navigate('/login-brand')}
                        className='bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105'
                    >
                        Commencer Gratuitement
                    </button>
                    <p className='mt-4 text-sm opacity-80'>Gratuit pour explorer · Payez uniquement pour les collaborations</p>
                </div>
            </div>

            {/* Stats Section */}
            <div className='bg-white py-12 px-4'>
                <div className='max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
                    <div>
                        <div className='text-4xl font-bold text-gray-900 mb-2'>250K+</div>
                        <div className='text-gray-600'>Influenceurs disponibles</div>
                    </div>
                    <div>
                        <div className='text-4xl font-bold text-gray-900 mb-2'>50K+</div>
                        <div className='text-gray-600'>Marques satisfaites</div>
                    </div>
                    <div>
                        <div className='text-4xl font-bold text-gray-900 mb-2'>100K+</div>
                        <div className='text-gray-600'>Campagnes lancées</div>
                    </div>
                    <div>
                        <div className='text-4xl font-bold text-gray-900 mb-2'>95%</div>
                        <div className='text-gray-600'>Taux de satisfaction</div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className='py-20 px-4 bg-gray-50'>
                <div className='max-w-6xl mx-auto'>
                    <h2 className='text-4xl font-bold text-center mb-16'>Comment ça fonctionne ?</h2>
                    <div className='grid md:grid-cols-3 gap-12'>
                        <div className='text-center'>
                            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <svg className='w-10 h-10 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-semibold mb-4'>1. Recherchez</h3>
                            <p className='text-gray-600'>
                                Explorez des milliers d'influenceurs vérifiés sur Instagram, TikTok et YouTube. Filtrez par niche, audience et prix.
                            </p>
                        </div>

                        <div className='text-center'>
                            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <svg className='w-10 h-10 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-semibold mb-4'>2. Collaborez</h3>
                            <p className='text-gray-600'>
                                Contactez les influenceurs, discutez de votre brief et validez les conditions de la collaboration directement sur la plateforme.
                            </p>
                        </div>

                        <div className='text-center'>
                            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <svg className='w-10 h-10 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-semibold mb-4'>3. Validez</h3>
                            <p className='text-gray-600'>
                                Recevez le contenu créé, validez-le et suivez les performances de vos campagnes en temps réel depuis votre dashboard.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className='py-20 px-4 bg-white'>
                <div className='max-w-6xl mx-auto'>
                    <h2 className='text-4xl font-bold text-center mb-16'>Pourquoi choisir Collabzz ?</h2>
                    <div className='grid md:grid-cols-2 gap-8'>
                        <div className='bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Influenceurs vérifiés</h3>
                                    <p className='text-gray-600'>Tous nos créateurs sont vérifiés pour garantir l'authenticité de leur audience et la qualité de leur contenu.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Paiement sécurisé</h3>
                                    <p className='text-gray-600'>Payez en toute confiance. Votre argent est protégé jusqu'à la livraison et validation du contenu.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                                        <path fillRule='evenodd' d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Gestion simplifiée</h3>
                                    <p className='text-gray-600'>Dashboard intuitif pour gérer toutes vos campagnes, communications et paiements en un seul endroit.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Analytics en temps réel</h3>
                                    <p className='text-gray-600'>Suivez les performances de vos campagnes avec des statistiques détaillées et des rapports automatisés.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Support dédié</h3>
                                    <p className='text-gray-600'>Une équipe d'experts à votre écoute pour vous accompagner dans vos campagnes d'influence marketing.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-gray-50 p-8 rounded-xl hover:shadow-lg transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-indigo-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Large réseau</h3>
                                    <p className='text-gray-600'>Accédez à 250,000+ créateurs sur Instagram, TikTok, YouTube dans toutes les niches possibles.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className='py-20 px-4 bg-gray-50'>
                <div className='max-w-6xl mx-auto'>
                    <h2 className='text-4xl font-bold text-center mb-16'>Ils nous font confiance</h2>
                    <div className='grid md:grid-cols-3 gap-8'>
                        <div className='bg-white p-8 rounded-xl shadow-md'>
                            <div className='flex items-center gap-1 mb-4'>
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className='w-5 h-5 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                    </svg>
                                ))}
                            </div>
                            <p className='text-gray-700 mb-4'>
                                "Collabzz a transformé notre stratégie marketing. Nous avons trouvé les influenceurs parfaits pour notre marque en quelques heures."
                            </p>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                                    <span className='font-semibold text-gray-700'>P</span>
                                </div>
                                <div>
                                    <div className='font-semibold'>Pierre Lefebvre</div>
                                    <div className='text-sm text-gray-500'>CMO, StyleCo</div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white p-8 rounded-xl shadow-md'>
                            <div className='flex items-center gap-1 mb-4'>
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className='w-5 h-5 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                    </svg>
                                ))}
                            </div>
                            <p className='text-gray-700 mb-4'>
                                "ROI exceptionnel ! Nos ventes ont augmenté de 300% grâce aux campagnes lancées sur Collabzz."
                            </p>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                                    <span className='font-semibold text-gray-700'>A</span>
                                </div>
                                <div>
                                    <div className='font-semibold'>Anna Rodriguez</div>
                                    <div className='text-sm text-gray-500'>Founder, BeautyPro</div>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white p-8 rounded-xl shadow-md'>
                            <div className='flex items-center gap-1 mb-4'>
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className='w-5 h-5 text-yellow-400' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                    </svg>
                                ))}
                            </div>
                            <p className='text-gray-700 mb-4'>
                                "Plateforme intuitive et service client réactif. Un vrai plaisir de travailler avec Collabzz."
                            </p>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                                    <span className='font-semibold text-gray-700'>T</span>
                                </div>
                                <div>
                                    <div className='font-semibold'>Thomas Bernard</div>
                                    <div className='text-sm text-gray-500'>Marketing Director, TechStart</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pricing Transparency */}
            <div className='py-20 px-4 bg-white'>
                <div className='max-w-4xl mx-auto text-center'>
                    <h2 className='text-4xl font-bold mb-8'>Tarification transparente</h2>
                    <div className='bg-gray-50 rounded-2xl p-12'>
                        <div className='text-6xl font-bold text-gray-900 mb-4'>0€</div>
                        <p className='text-xl text-gray-600 mb-6'>pour créer votre compte et explorer la plateforme</p>
                        <div className='space-y-3 text-left max-w-md mx-auto'>
                            <div className='flex items-center gap-3'>
                                <svg className='w-5 h-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                </svg>
                                <span>Accès illimité au catalogue d'influenceurs</span>
                            </div>
                            <div className='flex items-center gap-3'>
                                <svg className='w-5 h-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                </svg>
                                <span>Dashboard de gestion des campagnes</span>
                            </div>
                            <div className='flex items-center gap-3'>
                                <svg className='w-5 h-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                </svg>
                                <span>Messagerie sécurisée avec les créateurs</span>
                            </div>
                            <div className='flex items-center gap-3'>
                                <svg className='w-5 h-5 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
                                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                </svg>
                                <span>Paiement uniquement lors d'une collaboration</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className='bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-20 px-4'>
                <div className='max-w-4xl mx-auto text-center'>
                    <h2 className='text-4xl md:text-5xl font-bold mb-6'>
                        Lancez votre première campagne aujourd'hui
                    </h2>
                    <p className='text-xl mb-8 opacity-90'>
                        Rejoignez 50,000+ marques qui font confiance à Collabzz pour leurs campagnes d'influence
                    </p>
                    <button
                        onClick={() => navigate('/login-brand')}
                        className='bg-primary text-white px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105'
                    >
                        Créer mon compte gratuitement
                    </button>
                    <p className='mt-4 text-sm opacity-80'>Aucune carte bancaire requise · Configuration en 5 minutes</p>
                </div>
            </div>
        </div>
    )
}

export default ForBrands
