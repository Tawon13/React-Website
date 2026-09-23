import { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'

// Message du panneau de gauche selon le contexte (type de compte ou récupération d'accès).
const PANEL_CONTENT = {
    influencer: {
        title: 'Monétisez votre audience avec des marques qui vous ressemblent.',
        points: ['Inscription gratuite, sans abonnement', 'Vous fixez vos prix et en touchez 100 %', 'Paiement sécurisé après validation']
    },
    brand: {
        title: 'Trouvez les créateurs qui feront parler de votre marque.',
        points: ['Créateurs TikTok vérifiés', 'Tarifs affichés, sans agence', 'Paiement protégé jusqu’à la livraison']
    },
    recovery: {
        title: 'Retrouvez l’accès à votre compte en quelques instants.',
        points: ['Lien sécurisé envoyé par email', 'Vos collaborations et messages sont conservés', 'Besoin d’aide ? contact@collabzz.com']
    }
}

// Mise en page commune aux pages d'authentification : panneau visuel avec de vrais
// créateurs (desktop) à gauche, contenu à droite avec lien de retour.
const AuthLayout = ({ panel = 'influencer', backLabel = 'Retour au site', onBack, children }) => {
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)
    const content = PANEL_CONTENT[panel] || PANEL_CONTENT.influencer

    const panelCreators = useMemo(() => doctors
        .filter((item) => item.tiktokUsername && item.image && item.image !== assets.profile_pic)
        .sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))
        .slice(0, 3), [doctors])

    return (
        <MotionConfig reducedMotion='user'>
            <div className='min-h-screen bg-white lg:grid lg:grid-cols-2'>
                <aside className='hidden lg:flex lg:sticky lg:top-0 lg:h-screen relative flex-col justify-between gap-8 overflow-hidden bg-gray-900 text-white p-12 xl:p-16'>
                    <div className='absolute -top-40 -right-32 w-[34rem] h-[34rem] bg-primary/25 rounded-full blur-3xl' aria-hidden='true'></div>

                    <button onClick={() => navigate('/')} className='relative self-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'>
                        <img src={assets.logo} alt='Collabzz — retour à l’accueil' className='w-36 brightness-0 invert' />
                    </button>

                    <div className='relative'>
                        <div className='grid grid-cols-3 gap-3 mb-10 max-w-sm pt-6' aria-hidden='true'>
                            {panelCreators.map((item, i) => (
                                <motion.div
                                    key={item._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: i % 3 === 1 ? -24 : 0 }}
                                    transition={{ duration: 0.6, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                                    className='aspect-[3/4] rounded-2xl overflow-hidden bg-white/10'
                                >
                                    <img src={item.image} alt='' className='w-full h-full object-cover' />
                                </motion.div>
                            ))}
                        </div>

                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={panel}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                            >
                                <h2 className='text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-6 max-w-lg'>{content.title}</h2>
                                <ul className='space-y-3'>
                                    {content.points.map((point) => (
                                        <li key={point} className='flex items-center gap-3 text-gray-200'>
                                            <span className='w-6 h-6 rounded-full bg-primary text-gray-900 flex items-center justify-center flex-shrink-0'>
                                                <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M5 13l4 4L19 7' /></svg>
                                            </span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <p className='relative text-sm text-gray-400'>© {new Date().getFullYear()} Collabzz</p>
                </aside>

                <main className='flex flex-col min-h-screen px-5 sm:px-10 py-8'>
                    <div className='flex items-center justify-between mb-10'>
                        <button onClick={() => navigate('/')} className='lg:hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'>
                            <img src={assets.logo} alt='Collabzz — retour à l’accueil' className='w-32' />
                        </button>
                        <button
                            onClick={onBack || (() => navigate('/'))}
                            className='ml-auto cursor-pointer inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200'
                        >
                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' /></svg>
                            {backLabel}
                        </button>
                    </div>

                    <div className='w-full max-w-md mx-auto my-auto'>{children}</div>
                </main>
            </div>
        </MotionConfig>
    )
}

// Classes partagées par les formulaires d'authentification.
export const authInputClass = 'w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-primary/40 outline-none transition-colors duration-200'
export const authLabelClass = 'block text-sm font-semibold text-gray-800 mb-1.5'
export const authPrimaryBtn = 'cursor-pointer w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
export const authSecondaryBtn = 'cursor-pointer w-full border border-gray-300 text-gray-900 py-3.5 rounded-full font-semibold hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

export default AuthLayout
