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
    const [firebaseInfluencerId, setFirebaseInfluencerId] = useState(null)
    const [socialData, setSocialData] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedPackage, setSelectedPackage] = useState('📸 1 Post Instagram')
    const [loading, setLoading] = useState(false)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
    const [profilePhotos, setProfilePhotos] = useState([])
    const [brandVideos, setBrandVideos] = useState([])
    const [customPricing, setCustomPricing] = useState(null)
    const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('instagram')
    const [tiktokVideos, setTiktokVideos] = useState([])
    const [selectedVideo, setSelectedVideo] = useState(null)

    // Fonction pour générer des données analytics uniques par influenceur
    const generateAnalyticsData = (influencerId) => {
        // Créer un seed basé sur l'ID de l'influenceur
        const seed = influencerId ? influencerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 1000
        
        // Fonction de génération pseudo-aléatoire basée sur le seed
        const seededRandom = (min, max, offset = 0) => {
            const x = Math.sin(seed + offset) * 10000
            return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min
        }

        // Générer différents formats de nombres
        const formatFollowers = (platform) => {
            const base = seededRandom(500, 3000, platform === 'instagram' ? 1 : platform === 'tiktok' ? 2 : 3)
            return base >= 1000 ? `${(base / 1000).toFixed(1)}M` : `${base}k`
        }

        const formatViews = (platform) => {
            const base = seededRandom(200, 1500, platform === 'instagram' ? 10 : platform === 'tiktok' ? 20 : 30)
            return base >= 1000 ? `${(base / 1000).toFixed(1)}M` : `${base}k`
        }

        const generateAgeDistribution = (platformOffset) => {
            const ages = [
                { range: '13-17', percentage: seededRandom(3, 20, platformOffset + 1) },
                { range: '18-24', percentage: seededRandom(30, 55, platformOffset + 2) },
                { range: '25-34', percentage: seededRandom(20, 45, platformOffset + 3) },
                { range: '35-44', percentage: seededRandom(5, 20, platformOffset + 4) },
                { range: '45-64', percentage: seededRandom(2, 15, platformOffset + 5) }
            ]
            // Normaliser pour que le total soit proche de 100%
            const total = ages.reduce((sum, age) => sum + age.percentage, 0)
            return ages.map(age => ({
                ...age,
                percentage: Math.round((age.percentage / total) * 100)
            }))
        }

        const generateLocation = (platformOffset) => {
            const locations = [
                { country: 'France', flag: '🇫🇷', percentage: seededRandom(35, 65, platformOffset + 1) },
                { country: seededRandom(0, 1, platformOffset + 2) === 0 ? 'Belgique' : 'Canada', 
                  flag: seededRandom(0, 1, platformOffset + 2) === 0 ? '🇧🇪' : '🇨🇦', 
                  percentage: seededRandom(5, 15, platformOffset + 3) },
                { country: 'Suisse', flag: '🇨🇭', percentage: seededRandom(3, 10, platformOffset + 4) }
            ]
            const usedPercentage = locations.reduce((sum, loc) => sum + loc.percentage, 0)
            locations.push({ country: 'Autre', flag: '🌍', percentage: 100 - usedPercentage })
            return locations
        }

        return {
            instagram: {
                followers: formatFollowers('instagram'),
                avgViews: formatViews('instagram'),
                engagement: `${(seededRandom(25, 65, 100) / 10).toFixed(1)}%`,
                audienceLocation: generateLocation(10),
                audienceAge: generateAgeDistribution(20),
                audienceGender: {
                    male: seededRandom(40, 75, 200),
                    female: 100 - seededRandom(40, 75, 200)
                }
            },
            tiktok: {
                followers: formatFollowers('tiktok'),
                avgViews: formatViews('tiktok'),
                engagement: `${(seededRandom(30, 70, 300) / 10).toFixed(1)}%`,
                audienceLocation: generateLocation(40),
                audienceAge: generateAgeDistribution(50),
                audienceGender: {
                    male: seededRandom(35, 70, 400),
                    female: 100 - seededRandom(35, 70, 400)
                }
            },
            youtube: {
                followers: formatFollowers('youtube'),
                avgViews: formatViews('youtube'),
                engagement: `${(seededRandom(20, 60, 500) / 10).toFixed(1)}%`,
                audienceLocation: generateLocation(70),
                audienceAge: generateAgeDistribution(80),
                audienceGender: {
                    male: seededRandom(45, 80, 600),
                    female: 100 - seededRandom(45, 80, 600)
                }
            }
        }
    }

    const [analyticsData, setAnalyticsData] = useState(null)

    // Générer les analytics au chargement ou changement d'influenceur
    useEffect(() => {
        if (influencerId) {
            setAnalyticsData(generateAnalyticsData(influencerId))
        }
    }, [influencerId])

    // Prix basés sur les packages
    const packagePrices = {
        '📸 1 Post Instagram': customPricing?.instagram_post || 500,
        '📖 1 Story Instagram': customPricing?.instagram_story || 200,
        '🎥 1 Vidéo TikTok': customPricing?.tiktok_video || 800
    }

    // Obtenir le prix actuel selon le package sélectionné
    const currentPrice = packagePrices[selectedPackage] || 500

    useEffect(() => {
        // Scroll vers le haut de la page
        window.scrollTo(0, 0)
        
        const foundInfluencer = doctors.find(doc => doc._id === influencerId)
        console.log('Recherche influenceur avec ID:', influencerId)
        console.log('Influenceur trouvé dans doctors:', foundInfluencer)
        setInfluencer(foundInfluencer)
        
        // Charger les données sociales depuis Firestore si disponibles
        const loadSocialData = async () => {
            try {
                console.log('Tentative de chargement depuis Firebase avec ID:', influencerId)
                const docRef = doc(db, 'influencers', influencerId)
                const docSnap = await getDoc(docRef)
                
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    console.log('Données Firebase récupérées:', data)
                    // Stocker l'ID Firebase réel
                    setFirebaseInfluencerId(docSnap.id)
                    if (data.socialAccounts) {
                        setSocialData(data.socialAccounts)
                    }
                    // Charger les photos du profil
                    if (data.profilePhotos) {
                        setProfilePhotos(data.profilePhotos)
                    }
                    // Charger les vidéos de collaborations
                    if (data.brandVideos) {
                        setBrandVideos(data.brandVideos)
                    }
                    // Charger les prix personnalisés
                    if (data.pricing) {
                        setCustomPricing(data.pricing)
                    }
                    // Charger les vidéos TikTok
                    if (data.tiktokVideos) {
                        setTiktokVideos(data.tiktokVideos)
                    }
                } else {
                    console.error('Influenceur non trouvé dans Firebase avec ID:', influencerId)
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données sociales:', error)
            }
        }
        
        if (influencerId) {
            loadSocialData()
        }
    }, [doctors, influencerId])

    // Fonctions pour le lightbox
    const openLightbox = (index) => {
        setLightboxImageIndex(index)
        setIsLightboxOpen(true)
        document.body.style.overflow = 'hidden' // Empêcher le scroll
    }

    const closeLightbox = () => {
        setIsLightboxOpen(false)
        document.body.style.overflow = 'auto' // Réactiver le scroll
    }

    const nextImage = () => {
        setLightboxImageIndex((prev) => (prev + 1) % 3)
    }

    const previousImage = () => {
        setLightboxImageIndex((prev) => (prev - 1 + 3) % 3)
    }

    // Gestion des touches clavier
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isLightboxOpen) return
            
            if (e.key === 'Escape') closeLightbox()
            if (e.key === 'ArrowRight') nextImage()
            if (e.key === 'ArrowLeft') previousImage()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isLightboxOpen])

    // Obtenir le nombre total d'images (photos personnalisées ou 3 par défaut)
    const totalImages = profilePhotos.length > 0 ? profilePhotos.length : 3
    
    // Fonctions pour naviguer dans le lightbox
    const nextImageUpdated = () => {
        setLightboxImageIndex((prev) => (prev + 1) % totalImages)
    }

    const previousImageUpdated = () => {
        setLightboxImageIndex((prev) => (prev - 1 + totalImages) % totalImages)
    }

    // Obtenir l'URL de l'image actuelle dans le lightbox
    const getCurrentLightboxImage = () => {
        if (profilePhotos.length > 0) {
            return profilePhotos[lightboxImageIndex]?.url || influencer.image
        }
        return influencer.image
    }

    // Fonction pour ajouter au panier
    const handleAddToCart = () => {
        if (!influencer) return
        
        // Vérifier que nous avons l'ID Firebase
        if (!firebaseInfluencerId) {
            alert('Erreur: ID de l\'influenceur non trouvé')
            console.error('Firebase influencer ID manquant')
            return
        }

        const cartItem = {
            influencerId: firebaseInfluencerId, // Utiliser l'ID Firebase réel
            influencerName: influencer.name,
            influencerImage: influencer.image,
            package: selectedPackage,
            price: currentPrice
        }
        
        console.log('Ajout au panier:', cartItem)
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
                    {profilePhotos.length > 0 ? (
                        profilePhotos.slice(0, 3).map((photo, index) => (
                            <div key={photo.id} className={`${index === 0 ? 'col-span-1' : 'col-span-1'} cursor-pointer${index === 2 ? ' relative' : ''}`} onClick={() => openLightbox(index)}>
                                <img 
                                    src={photo.url} 
                                    alt={`${influencer.name} ${index + 1}`}
                                    className='w-full h-[400px] object-cover rounded-lg hover:opacity-90 transition-opacity'
                                />
                                {index === 2 && profilePhotos.length > 3 && (
                                    <button className='absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:bg-gray-50 transition-colors pointer-events-none'>
                                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                            <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                                        </svg>
                                        Voir Plus
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        // Photos par défaut si aucune photo personnalisée
                        <>
                            <div className='col-span-1 cursor-pointer' onClick={() => openLightbox(0)}>
                                <img 
                                    src={influencer.image} 
                                    alt={`${influencer.name} 1`}
                                    className='w-full h-[400px] object-cover rounded-lg hover:opacity-90 transition-opacity'
                                />
                            </div>
                            <div className='col-span-1 cursor-pointer' onClick={() => openLightbox(1)}>
                                <img 
                                    src={influencer.image} 
                                    alt={`${influencer.name} 2`}
                                    className='w-full h-[400px] object-cover rounded-lg hover:opacity-90 transition-opacity'
                                />
                            </div>
                            <div className='col-span-1 relative cursor-pointer' onClick={() => openLightbox(2)}>
                                <img 
                                    src={influencer.image} 
                                    alt={`${influencer.name} 3`}
                                    className='w-full h-[400px] object-cover rounded-lg hover:opacity-90 transition-opacity'
                                />
                                <button className='absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg hover:bg-gray-50 transition-colors pointer-events-none'>
                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                                        <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                                    </svg>
                                    Voir Plus
                                </button>
                            </div>
                        </>
                    )}
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
                        {profilePhotos.length > 0 ? (
                            profilePhotos.map((photo, index) => (
                                <div key={photo.id} className='flex-shrink-0 w-full snap-center cursor-pointer' onClick={() => openLightbox(index)}>
                                    <img 
                                        src={photo.url} 
                                        alt={`${influencer.name} ${index + 1}`}
                                        className='w-full h-64 sm:h-80 object-cover rounded-lg'
                                    />
                                </div>
                            ))
                        ) : (
                            // Photos par défaut
                            <>
                                <div className='flex-shrink-0 w-full snap-center cursor-pointer' onClick={() => openLightbox(0)}>
                                    <img 
                                        src={influencer.image} 
                                        alt={`${influencer.name} 1`}
                                        className='w-full h-64 sm:h-80 object-cover rounded-lg'
                                    />
                                </div>
                                <div className='flex-shrink-0 w-full snap-center cursor-pointer' onClick={() => openLightbox(1)}>
                                    <img 
                                        src={influencer.image} 
                                        alt={`${influencer.name} 2`}
                                        className='w-full h-64 sm:h-80 object-cover rounded-lg'
                                    />
                                </div>
                                <div className='flex-shrink-0 w-full snap-center cursor-pointer' onClick={() => openLightbox(2)}>
                                    <img 
                                        src={influencer.image} 
                                        alt={`${influencer.name} 3`}
                                        className='w-full h-64 sm:h-80 object-cover rounded-lg'
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    
                    {/* Indicateurs de pagination cliquables */}
                    <div className='flex justify-center gap-2 mt-4'>
                        {(profilePhotos.length > 0 ? profilePhotos : [0, 1, 2]).map((item, index) => (
                            <button
                                key={profilePhotos.length > 0 ? item.id : index}
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

                    {/* Section Vidéos de Collaborations */}
                    {brandVideos.length > 0 && (
                        <div className='mb-6'>
                            <h3 className='text-xl font-semibold mb-4'>Collaborations avec des Marques</h3>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                {brandVideos.map((video) => (
                                    <div key={video.id} className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                                        <div className='flex items-start gap-3'>
                                            <div className='w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0'>
                                                <svg className='w-6 h-6 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' />
                                                </svg>
                                            </div>
                                            <div className='flex-1'>
                                                <h4 className='font-semibold text-gray-900'>{video.brandName}</h4>
                                                <a
                                                    href={video.url}
                                                    target='_blank'
                                                    rel='noopener noreferrer'
                                                    className='text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1'
                                                >
                                                    Voir la vidéo
                                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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

            {/* Analytics Section */}
            <div className='mt-10 bg-white rounded-2xl shadow-lg p-6 md:p-8'>
                <h2 className='text-2xl font-bold mb-6'>Analytics</h2>
                
                {/* Tabs */}
                <div className='flex gap-4 mb-8 border-b border-gray-200'>
                    <button
                        onClick={() => setActiveAnalyticsTab('instagram')}
                        className={`pb-3 px-4 font-medium transition-colors relative ${
                            activeAnalyticsTab === 'instagram'
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className='flex items-center gap-2'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/>
                            </svg>
                            Instagram
                        </div>
                        {activeAnalyticsTab === 'instagram' && (
                            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary' />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveAnalyticsTab('tiktok')}
                        className={`pb-3 px-4 font-medium transition-colors relative ${
                            activeAnalyticsTab === 'tiktok'
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className='flex items-center gap-2'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z'/>
                            </svg>
                            TikTok
                        </div>
                        {activeAnalyticsTab === 'tiktok' && (
                            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary' />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveAnalyticsTab('youtube')}
                        className={`pb-3 px-4 font-medium transition-colors relative ${
                            activeAnalyticsTab === 'youtube'
                                ? 'text-primary'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <div className='flex items-center gap-2'>
                            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/>
                            </svg>
                            YouTube
                        </div>
                        {activeAnalyticsTab === 'youtube' && (
                            <div className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary' />
                        )}
                    </button>
                </div>

                {/* Stats Cards */}
                <div className='grid grid-cols-3 gap-4 md:gap-6 mb-8'>
                    <div>
                        <div className='text-2xl md:text-3xl font-bold text-gray-900'>
                            {analyticsData && analyticsData[activeAnalyticsTab]?.followers}
                        </div>
                        <div className='text-sm text-gray-600 mt-1'>Abonnés</div>
                    </div>
                    <div>
                        <div className='text-2xl md:text-3xl font-bold text-gray-900'>
                            {analyticsData && analyticsData[activeAnalyticsTab]?.avgViews}
                        </div>
                        <div className='text-sm text-gray-600 mt-1'>Vues Moyennes</div>
                    </div>
                    <div>
                        <div className='text-2xl md:text-3xl font-bold text-gray-900'>
                            {analyticsData && analyticsData[activeAnalyticsTab]?.engagement}
                        </div>
                        <div className='text-sm text-gray-600 mt-1'>Engagement</div>
                    </div>
                </div>

                {/* Audience Data */}
                <div className='grid md:grid-cols-2 gap-8'>
                    {/* Audience Location */}
                    <div>
                        <h3 className='text-lg font-semibold mb-4'>Localisation du Public</h3>
                        <div className='space-y-3'>
                            {analyticsData && analyticsData[activeAnalyticsTab]?.audienceLocation.map((location, index) => (
                                <div key={index} className='flex items-center gap-3'>
                                    <span className='text-2xl'>{location.flag}</span>
                                    <div className='flex-1'>
                                        <div className='flex items-center justify-between mb-1'>
                                            <span className='text-sm font-medium text-gray-700'>{location.country}</span>
                                            <span className='text-sm font-semibold text-gray-900'>{location.percentage}%</span>
                                        </div>
                                        <div className='w-full bg-gray-200 rounded-full h-2'>
                                            <div 
                                                className='bg-primary h-2 rounded-full transition-all'
                                                style={{ width: `${location.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Audience Age */}
                    <div>
                        <h3 className='text-lg font-semibold mb-4'>Âge du Public</h3>
                        <div className='flex items-end justify-between h-48 gap-2'>
                            {analyticsData && analyticsData[activeAnalyticsTab]?.audienceAge.map((age, index) => {
                                // Calculer la hauteur proportionnelle au pourcentage réel
                                const height = (age.percentage / 100) * 100 // pourcentage direct
                                const isHighest = age.percentage === Math.max(...analyticsData[activeAnalyticsTab].audienceAge.map(a => a.percentage))
                                return (
                                    <div key={index} className='flex-1 flex flex-col items-center justify-end' style={{ height: '100%' }}>
                                        <div className='text-xs font-semibold mb-1'>{age.percentage}%</div>
                                        <div 
                                            className='w-full rounded-t-lg transition-all' 
                                            style={{ 
                                                height: `${height}%`,
                                                backgroundColor: isHighest ? '#5569ff' : '#e0e0e0'
                                            }}
                                        />
                                        <div className='text-xs text-gray-600 mt-2'>{age.range}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Audience Gender */}
                <div className='mt-8'>
                    <h3 className='text-lg font-semibold mb-4'>Genre du Public</h3>
                    <div className='flex items-center gap-6'>
                        <div className='relative w-32 h-32'>
                            <svg className='w-full h-full transform -rotate-90' viewBox='0 0 100 100'>
                                {/* Female segment */}
                                <circle
                                    cx='50'
                                    cy='50'
                                    r='40'
                                    fill='none'
                                    stroke='#e0e0e0'
                                    strokeWidth='20'
                                />
                                {/* Male segment */}
                                {analyticsData && (
                                    <circle
                                        cx='50'
                                        cy='50'
                                        r='40'
                                        fill='none'
                                        stroke='#5569ff'
                                        strokeWidth='20'
                                        strokeDasharray={`${analyticsData[activeAnalyticsTab]?.audienceGender.male * 2.51} ${251 - (analyticsData[activeAnalyticsTab]?.audienceGender.male * 2.51)}`}
                                    />
                                )}
                            </svg>
                        </div>
                        {analyticsData && (
                            <div className='space-y-3'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-4 h-4 rounded-full bg-primary' />
                                    <span className='text-sm text-gray-700'>Homme</span>
                                    <span className='text-sm font-semibold text-gray-900'>{analyticsData[activeAnalyticsTab]?.audienceGender.male}%</span>
                                </div>
                                <div className='flex items-center gap-3'>
                                    <div className='w-4 h-4 rounded-full bg-gray-300' />
                                    <span className='text-sm text-gray-700'>Femme</span>
                                    <span className='text-sm font-semibold text-gray-900'>{analyticsData[activeAnalyticsTab]?.audienceGender.female}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section Derniers Posts */}
            <div className='mt-10 bg-white rounded-2xl shadow-lg p-6 md:p-8'>
                <h2 className='text-2xl font-bold mb-6'>Ses Derniers Posts</h2>
                
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {tiktokVideos.length > 0 ? (
                        tiktokVideos.map((video, index) => (
                            <div 
                                key={video.id || index} 
                                className='group cursor-pointer'
                                onClick={() => setSelectedVideo(video.url)}
                            >
                                <div className='relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden mb-3 hover:opacity-90 transition-opacity'>
                                    {/* Thumbnail avec gradient */}
                                    <div className={`absolute inset-0 flex items-center justify-center ${
                                        index % 3 === 0 ? 'bg-gradient-to-br from-pink-500 to-purple-600' :
                                        index % 3 === 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                                        'bg-gradient-to-br from-orange-500 to-red-600'
                                    }`}>
                                        <svg className='w-20 h-20 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                            <path d='M8 5v14l11-7z'/>
                                        </svg>
                                    </div>
                                    {/* Badge vues */}
                                    {video.views && (
                                        <div className='absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                                <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/>
                                                <path fillRule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clipRule='evenodd'/>
                                            </svg>
                                            {video.views}
                                        </div>
                                    )}
                                    {/* Badge likes */}
                                    {video.likes && (
                                        <div className='absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd'/>
                                            </svg>
                                            {video.likes}
                                        </div>
                                    )}
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-primary transition-colors'>
                                        {video.title || 'Vidéo TikTok'}
                                    </p>
                                    <p className='text-xs text-gray-500'>{video.date || 'Récemment'}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        // Exemple de posts si aucune vidéo n'est ajoutée
                        <>
                            <div 
                                className='group cursor-pointer'
                                onClick={() => window.open('https://www.tiktok.com/@armigno/video/7583700688794848534?lang=fr', '_blank')}
                            >
                                <div className='relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden mb-3 hover:opacity-90 transition-opacity'>
                                    <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600'>
                                        <svg className='w-20 h-20 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                            <path d='M8 5v14l11-7z'/>
                                        </svg>
                                    </div>
                                    <div className='absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                            <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/>
                                            <path fillRule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clipRule='evenodd'/>
                                        </svg>
                                        1.2M
                                    </div>
                                    <div className='absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd'/>
                                        </svg>
                                        45.2K
                                    </div>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-primary transition-colors'>
                                        Cliquez pour voir la vidéo
                                    </p>
                                    <p className='text-xs text-gray-500'>Il y a 2 jours</p>
                                </div>
                            </div>

                            <div 
                                className='group cursor-pointer'
                                onClick={() => window.open('https://www.tiktok.com/@armigno/photo/7582254909920169238?lang=fr', '_blank')}
                            >
                                <div className='relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden mb-3 hover:opacity-90 transition-opacity'>
                                    <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-600'>
                                        <svg className='w-20 h-20 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                            <path d='M8 5v14l11-7z'/>
                                        </svg>
                                    </div>
                                    <div className='absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                            <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/>
                                            <path fillRule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clipRule='evenodd'/>
                                        </svg>
                                        850K
                                    </div>
                                    <div className='absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd'/>
                                        </svg>
                                        32.5K
                                    </div>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-primary transition-colors'>
                                        Cliquez pour voir la photo
                                    </p>
                                    <p className='text-xs text-gray-500'>Il y a 3 jours</p>
                                </div>
                            </div>

                            <div 
                                className='group cursor-pointer'
                                onClick={() => window.open('https://www.tiktok.com/@armigno/video/7582181799346933014?lang=fr', '_blank')}
                            >
                                <div className='relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden mb-3 hover:opacity-90 transition-opacity'>
                                    <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-600'>
                                        <svg className='w-20 h-20 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                            <path d='M8 5v14l11-7z'/>
                                        </svg>
                                    </div>
                                    <div className='absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                            <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/>
                                            <path fillRule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clipRule='evenodd'/>
                                        </svg>
                                        920K
                                    </div>
                                    <div className='absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                        <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                            <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd'/>
                                        </svg>
                                        38.7K
                                    </div>
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-primary transition-colors'>
                                        Cliquez pour voir la vidéo
                                    </p>
                                    <p className='text-xs text-gray-500'>Il y a 4 jours</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {tiktokVideos.length === 0 && (
                    <p className='text-center text-sm text-gray-500 mt-6'>
                        💡 Les influenceurs peuvent ajouter leurs vidéos TikTok depuis leur profil
                    </p>
                )}
            </div>

            {/* Modal Vidéo TikTok */}
            {selectedVideo && (
                <div 
                    className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4'
                    onClick={() => setSelectedVideo(null)}
                >
                    <button
                        onClick={() => setSelectedVideo(null)}
                        className='absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20'
                        aria-label='Fermer'
                    >
                        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                    
                    <div 
                        className='relative w-full max-w-md aspect-[9/16]'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={selectedVideo.replace('/video/', '/embed/')}
                            className='w-full h-full rounded-xl'
                            allowFullScreen
                            allow='encrypted-media'
                        />
                    </div>
                </div>
            )}

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div 
                    className='fixed inset-0 z-50 flex items-center justify-center'
                    onClick={closeLightbox}
                >
                    {/* Backdrop avec flou */}
                    <div className='absolute inset-0 bg-black/90 backdrop-blur-md' />
                    
                    {/* Contenu du lightbox */}
                    <div className='relative z-10 w-full h-full flex items-center justify-center p-4'>
                        {/* Bouton fermer */}
                        <button
                            onClick={closeLightbox}
                            className='absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-20'
                            aria-label='Fermer'
                        >
                            <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                            </svg>
                        </button>

                        {/* Bouton précédent */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                previousImageUpdated()
                            }}
                            className='absolute left-4 text-white hover:text-gray-300 transition-colors z-20 bg-black/50 rounded-full p-3 hover:bg-black/70'
                            aria-label='Photo précédente'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                        </button>

                        {/* Image */}
                        <div 
                            className='max-w-5xl max-h-[90vh] flex items-center justify-center'
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={getCurrentLightboxImage()}
                                alt={`${influencer.name} ${lightboxImageIndex + 1}`}
                                className='max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl'
                            />
                        </div>

                        {/* Bouton suivant */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                nextImageUpdated()
                            }}
                            className='absolute right-4 text-white hover:text-gray-300 transition-colors z-20 bg-black/50 rounded-full p-3 hover:bg-black/70'
                            aria-label='Photo suivante'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                            </svg>
                        </button>

                        {/* Indicateur de position */}
                        <div 
                            className='absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-4 py-2 rounded-full'
                            onClick={(e) => e.stopPropagation()}
                        >
                            {lightboxImageIndex + 1} / {totalImages}
                        </div>

                        {/* Miniatures */}
                        {totalImages <= 5 && (
                            <div 
                                className='absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2'
                                onClick={(e) => e.stopPropagation()}
                            >
                                {profilePhotos.length > 0 ? (
                                    profilePhotos.map((photo, index) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setLightboxImageIndex(index)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                lightboxImageIndex === index 
                                                    ? 'border-white scale-110' 
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={`Miniature ${index + 1}`}
                                                className='w-full h-full object-cover'
                                            />
                                        </button>
                                    ))
                                ) : (
                                    [0, 1, 2].map((index) => (
                                        <button
                                            key={index}
                                            onClick={() => setLightboxImageIndex(index)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                                lightboxImageIndex === index 
                                                    ? 'border-white scale-110' 
                                                    : 'border-transparent opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img
                                                src={influencer.image}
                                                alt={`Miniature ${index + 1}`}
                                                className='w-full h-full object-cover'
                                            />
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default InfluencerProfile
