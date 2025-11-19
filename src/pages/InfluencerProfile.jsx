import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { db } from '../config/firebase'
import { doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'
import RecentInstagramPosts from '../components/RecentInstagramPosts'

const InfluencerProfile = () => {
    const { influencerId } = useParams()
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)
    const { currentUser, userType, userData } = useAuth()
    const { addToCart } = useCart()
    const [influencer, setInfluencer] = useState(null)
    const [socialData, setSocialData] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedPackage, setSelectedPackage] = useState('📸 1 Post Instagram')
    const [loading, setLoading] = useState(false)

    // Prix basés sur les packages
    const packagePrices = {
        '📸 1 Post Instagram': 500,
        '📖 1 Story Instagram': 200,
        '🎥 1 Vidéo TikTok': 800
    }

    // Obtenir le prix actuel selon le package sélectionné
    const currentPrice = packagePrices[selectedPackage] || 500

    useEffect(() => {
        // Scroll vers le haut de la page
        window.scrollTo(0, 0)
        
        const foundInfluencer = doctors.find(doc => doc._id === influencerId)
        setInfluencer(foundInfluencer)
        
        // Charger les données sociales depuis Firestore si disponibles
        const loadSocialData = async () => {
            try {
                const docRef = doc(db, 'influencers', influencerId)
                const docSnap = await getDoc(docRef)
                
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    if (data.socialAccounts) {
                        setSocialData(data.socialAccounts)
                    }
                }
            } catch (error) {
                console.log('Pas de données sociales disponibles')
            }
        }
        
        if (influencerId) {
            loadSocialData()
        }
    }, [doctors, influencerId])

    // Fonction pour ajouter au panier
    const handleAddToCart = () => {
        if (!influencer) return

        const cartItem = {
            influencerId: influencerId,
            influencerName: influencer.name,
            influencerImage: influencer.image,
            package: selectedPackage,
            price: currentPrice
        }

        addToCart(cartItem)
        
        // Notification visuelle
        const notification = document.createElement('div')
        notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce'
        notification.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span>Ajouté au panier !</span>
            </div>
        `
        document.body.appendChild(notification)
        
        setTimeout(() => {
            notification.remove()
        }, 3000)
    }

    if (!influencer) {
        return <div className="text-center py-20">Chargement...</div>
    }

    return (
        <div className='max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6'>
            {/* Header with title - Boutons visibles uniquement sur Desktop */}
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
                <h1 className='text-xl sm:text-2xl font-semibold'>INFLUENCEUR LIFESTYLE!</h1>
                <div className='hidden sm:flex gap-2 sm:gap-4'>
                    <button className='flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm'>
                        <svg className='w-4 h-4 sm:w-5 sm:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                        </svg>
                        <span>Partager</span>
                    </button>
                    <button className='flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm'>
                        <svg className='w-4 h-4 sm:w-5 sm:h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                        </svg>
                        <span>Enregistrer</span>
                    </button>
                </div>
            </div>

            {/* Photo Gallery - Responsive avec défilement */}
            <div className='relative mb-4'>
                {/* Desktop: 3 photos en grille */}
                <div className='hidden lg:grid lg:grid-cols-3 gap-4'>
                    <div className='col-span-1'>
                        <img 
                            src={influencer.image} 
                            alt={`${influencer.name} 1`}
                            className='w-full h-[400px] object-cover rounded-lg'
                        />
                    </div>
                    <div className='col-span-1'>
                        <img 
                            src={influencer.image} 
                            alt={`${influencer.name} 2`}
                            className='w-full h-[400px] object-cover rounded-lg'
                        />
                    </div>
                    <div className='col-span-1 relative'>
                        <img 
                            src={influencer.image} 
                            alt={`${influencer.name} 3`}
                            className='w-full h-[400px] object-cover rounded-lg'
                        />
                        <button className='absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:bg-gray-50 transition-colors'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                            </svg>
                            Voir Plus
                        </button>
                    </div>
                </div>

                {/* Tablet & Mobile: Carousel avec défilement horizontal - 1 photo à la fois */}
                <div className='lg:hidden relative'>
                    <div 
                        className='flex gap-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-smooth'
                        onScroll={(e) => {
                            const scrollLeft = e.target.scrollLeft;
                            const imageWidth = e.target.offsetWidth;
                            const index = Math.round(scrollLeft / imageWidth);
                            setCurrentImageIndex(index);
                        }}
                    >
                        {/* Photo 1 */}
                        <div className='flex-shrink-0 w-full snap-center'>
                            <img 
                                src={influencer.image} 
                                alt={`${influencer.name} 1`}
                                className='w-full h-64 sm:h-80 object-cover rounded-lg'
                            />
                        </div>
                        {/* Photo 2 */}
                        <div className='flex-shrink-0 w-full snap-center'>
                            <img 
                                src={influencer.image} 
                                alt={`${influencer.name} 2`}
                                className='w-full h-64 sm:h-80 object-cover rounded-lg'
                            />
                        </div>
                        {/* Photo 3 */}
                        <div className='flex-shrink-0 w-full snap-center'>
                            <img 
                                src={influencer.image} 
                                alt={`${influencer.name} 3`}
                                className='w-full h-64 sm:h-80 object-cover rounded-lg'
                            />
                        </div>
                    </div>
                    
                    {/* Indicateurs de pagination cliquables */}
                    <div className='flex justify-center gap-2 mt-4'>
                        {[0, 1, 2].map((index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    const container = document.querySelector('.overflow-x-auto');
                                    if (container) {
                                        container.scrollTo({
                                            left: index * container.offsetWidth,
                                            behavior: 'smooth'
                                        });
                                    }
                                }}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                    currentImageIndex === index ? 'bg-gray-800' : 'bg-gray-300'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Boutons Partager/Enregistrer sur Mobile - Sous la photo */}
            <div className='flex sm:hidden gap-2 mb-6'>
                <button className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                    </svg>
                    Partager
                </button>
                <button className='flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg hover:bg-gray-50 text-sm'>
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                    </svg>
                    Enregistrer
                </button>
            </div>

            {/* Content Grid */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8'>
                {/* Left Column - Profile Info */}
                <div className='lg:col-span-2 order-2 lg:order-1'>
                    {/* Profile Header */}
                    <div className='flex items-start gap-4 mb-6'>
                        <img 
                            src={influencer.image} 
                            alt={influencer.name}
                            className='w-20 h-20 rounded-full object-cover'
                        />
                        <div className='flex-1'>
                            <div className='flex flex-wrap items-center gap-2 mb-2'>
                                <h2 className='text-xl sm:text-2xl font-semibold'>{influencer.name}</h2>
                                <div className='flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded text-xs sm:text-sm'>
                                    <svg className='w-4 h-4 sm:w-5 sm:h-5 text-yellow-500' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                                    </svg>
                                    <span className='font-semibold'>{influencer.rating}</span>
                                    <span className='hidden sm:inline'>· {influencer.reviews} Avis</span>
                                    <span className='sm:hidden'>({influencer.reviews})</span>
                                </div>
                            </div>
                            <p className='text-sm sm:text-base text-gray-600 mb-3'>{influencer.city}, {influencer.country}</p>
                            <div className='flex flex-wrap gap-2'>
                                <div className='flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs sm:text-sm'>
                                    <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                                        <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/>
                                    </svg>
                                    <span className='font-medium'>{influencer.followers.instagram}</span>
                                    <span className='hidden sm:inline text-gray-600'>Followers</span>
                                </div>
                                <div className='flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs sm:text-sm'>
                                    <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                                        <path d='M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/>
                                    </svg>
                                    <span className='font-medium'>{influencer.followers.tiktok}</span>
                                    <span className='hidden sm:inline text-gray-600'>Followers</span>
                                </div>
                                <div className='flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs sm:text-sm'>
                                    <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                                        <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/>
                                    </svg>
                                    <span className='font-medium'>{influencer.followers.youtube}</span>
                                    <span className='text-gray-600'>Followers</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badge */}
                    <div className='flex items-center gap-3 bg-gray-50 p-4 rounded-lg mb-6'>
                        <div className='w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                            <svg className='w-6 h-6 text-red-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd' />
                            </svg>
                        </div>
                        <div>
                            <h3 className='font-semibold'>{influencer.name.split('-')[0]} est un Top Créateur</h3>
                            <p className='text-sm text-gray-600'>Les Top Créateurs ont complété plusieurs commandes et ont une haute évaluation de la part des marques.</p>
                        </div>
                    </div>

                    {/* About */}
                    <div className='mb-6'>
                        <p className='text-gray-700 leading-relaxed'>
                            {influencer.about}
                        </p>
                    </div>
                </div>

                {/* Right Column - Pricing */}
                <div className='lg:col-span-1 order-1 lg:order-2'>
                    <div className='border rounded-lg p-4 sm:p-6 lg:sticky lg:top-4'>
                        <div className='text-2xl sm:text-3xl font-bold mb-4'>{currentPrice}€</div>
                        
                        <div className='mb-4'>
                            <select 
                                value={selectedPackage}
                                onChange={(e) => setSelectedPackage(e.target.value)}
                                className='w-full border rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 mb-2 bg-white text-sm sm:text-base'
                            >
                                <option value='📖 1 Story Instagram'>📖 1 Story Instagram</option>
                                <option value='📸 1 Post Instagram'>📸 1 Post Instagram</option>
                                <option value='🎥 1 Vidéo TikTok'>🎥 1 Vidéo TikTok</option>
                            </select>
                            <p className='text-xs text-gray-600 leading-relaxed'>
                                Une story ou post comprend votre tag et tout texte que vous souhaitez inclure.
                            </p>
                        </div>

                        <button 
                            onClick={handleAddToCart}
                            disabled={loading}
                            className='w-full bg-primary text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-primary/90 transition-colors mb-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'/>
                            </svg>
                            Ajouter au Panier
                        </button>

                        <div className='text-center text-xs sm:text-sm text-gray-600 mb-4'>ou</div>

                        <button 
                            onClick={() => navigate('/contact')}
                            className='w-full border border-gray-300 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-50 transition-colors'
                        >
                            Négocier un Pack
                        </button>
                    </div>
                </div>
            </div>

            {/* Section Posts Instagram Récents */}
            {socialData?.instagram?.recentMedia && (
                <RecentInstagramPosts recentMedia={socialData.instagram.recentMedia} />
            )}
        </div>
    )
}

export default InfluencerProfile
