import React from 'react'
import { useNavigate } from 'react-router-dom'

const ForCreators = () => {
    const navigate = useNavigate()

    return (
        <div className='min-h-screen'>
            {/* Hero Section */}
            <div className='bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20 px-4'>
                <div className='max-w-6xl mx-auto text-center'>
                    <h1 className='text-4xl md:text-6xl font-bold mb-6'>
                        Gagnez de l'argent en tant que Créateur
                    </h1>
                    <p className='text-xl md:text-2xl mb-8 opacity-90'>
                        Rejoignez des milliers d'influenceurs qui collaborent avec les plus grandes marques
                    </p>
                    <button
                        onClick={() => navigate('/login-influencer')}
                        className='bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105'
                    >
                        Commencer Gratuitement
                    </button>
                    <p className='mt-4 text-sm opacity-80'>Gratuit pour toujours · Aucune carte requise</p>
                </div>
            </div>

            {/* Stats Section */}
            <div className='bg-gray-50 py-12 px-4'>
                <div className='max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
                    <div>
                        <div className='text-4xl font-bold text-primary mb-2'>250K+</div>
                        <div className='text-gray-600'>Créateurs actifs</div>
                    </div>
                    <div>
                        <div className='text-4xl font-bold text-primary mb-2'>50K+</div>
                        <div className='text-gray-600'>Marques partenaires</div>
                    </div>
                    <div>
                        <div className='text-4xl font-bold text-primary mb-2'>100K+</div>
                        <div className='text-gray-600'>Collaborations réussies</div>
                    </div>
                    <div>
                        <div className='text-4xl font-bold text-primary mb-2'>5M€+</div>
                        <div className='text-gray-600'>Versés aux créateurs</div>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <div className='py-20 px-4'>
                <div className='max-w-6xl mx-auto'>
                    <h2 className='text-4xl font-bold text-center mb-16'>Comment ça marche ?</h2>
                    <div className='grid md:grid-cols-3 gap-12'>
                        <div className='text-center'>
                            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <svg className='w-10 h-10 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-semibold mb-4'>1. Créez votre profil</h3>
                            <p className='text-gray-600'>
                                Inscrivez-vous gratuitement, connectez vos réseaux sociaux et créez un profil professionnel qui met en valeur votre contenu.
                            </p>
                        </div>

                        <div className='text-center'>
                            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <svg className='w-10 h-10 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-semibold mb-4'>2. Trouvez des marques</h3>
                            <p className='text-gray-600'>
                                Explorez les opportunités de collaboration avec des marques qui correspondent à votre niche et vos valeurs.
                            </p>
                        </div>

                        <div className='text-center'>
                            <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6'>
                                <svg className='w-10 h-10 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
                                </svg>
                            </div>
                            <h3 className='text-2xl font-semibold mb-4'>3. Gagnez de l'argent</h3>
                            <p className='text-gray-600'>
                                Créez du contenu, validez-le avec la marque, et recevez votre paiement de manière sécurisée.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Section */}
            <div className='bg-gray-50 py-20 px-4'>
                <div className='max-w-6xl mx-auto'>
                    <h2 className='text-4xl font-bold text-center mb-16'>Pourquoi rejoindre Collabzz ?</h2>
                    <div className='grid md:grid-cols-2 gap-8'>
                        <div className='bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>100% Gratuit</h3>
                                    <p className='text-gray-600'>Pas de frais d'inscription, pas d'abonnement. Nous ne prenons une commission que lorsque vous gagnez de l'argent.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Paiements sécurisés</h3>
                                    <p className='text-gray-600'>Votre argent est protégé. Les paiements sont libérés uniquement après validation de votre travail.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z' />
                                        <path d='M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Support dédié</h3>
                                    <p className='text-gray-600'>Notre équipe est là pour vous aider à chaque étape de vos collaborations.</p>
                                </div>
                            </div>
                        </div>

                        <div className='bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow'>
                            <div className='flex items-start gap-4'>
                                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z' />
                                        <path fillRule='evenodd' d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z' clipRule='evenodd' />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className='text-xl font-semibold mb-2'>Opportunités illimitées</h3>
                                    <p className='text-gray-600'>Accédez à des milliers de marques cherchant à collaborer avec des créateurs comme vous.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials */}
            <div className='py-20 px-4'>
                <div className='max-w-6xl mx-auto'>
                    <h2 className='text-4xl font-bold text-center mb-16'>Ce que disent nos créateurs</h2>
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
                                "Collabzz m'a permis de transformer ma passion en revenu. J'ai collaboré avec plus de 20 marques en 6 mois !"
                            </p>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center'>
                                    <span className='font-semibold text-primary'>S</span>
                                </div>
                                <div>
                                    <div className='font-semibold'>Sophie Martin</div>
                                    <div className='text-sm text-gray-500'>@sophiestyle · 45K followers</div>
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
                                "La plateforme est intuitive et les paiements sont toujours à temps. Je recommande à 100% !"
                            </p>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center'>
                                    <span className='font-semibold text-primary'>M</span>
                                </div>
                                <div>
                                    <div className='font-semibold'>Marc Dubois</div>
                                    <div className='text-sm text-gray-500'>@marctravels · 120K followers</div>
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
                                "Excellent moyen de monétiser mon contenu. Les marques sont sérieuses et professionnelles."
                            </p>
                            <div className='flex items-center gap-3'>
                                <div className='w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center'>
                                    <span className='font-semibold text-primary'>L</span>
                                </div>
                                <div>
                                    <div className='font-semibold'>Laura Chen</div>
                                    <div className='text-sm text-gray-500'>@laurafitness · 80K followers</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className='bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20 px-4'>
                <div className='max-w-4xl mx-auto text-center'>
                    <h2 className='text-4xl md:text-5xl font-bold mb-6'>
                        Prêt à commencer votre aventure ?
                    </h2>
                    <p className='text-xl mb-8 opacity-90'>
                        Rejoignez des milliers de créateurs qui gagnent déjà de l'argent avec leur contenu
                    </p>
                    <button
                        onClick={() => navigate('/login-influencer')}
                        className='bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:shadow-2xl transition-all transform hover:scale-105'
                    >
                        Créer mon compte gratuitement
                    </button>
                    <p className='mt-4 text-sm opacity-80'>Inscription en 2 minutes · Sans engagement</p>
                </div>
            </div>
        </div>
    )
}

export default ForCreators
