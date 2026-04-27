import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { db } from '../config/firebase'
import { doc, getDocFromServer, addDoc, collection, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

const InfluencerProfile = () => {
    const { influencerId } = useParams()
    const navigate = useNavigate()
    const { doctors } = useContext(AppContext)
    const { currentUser, userType, userData } = useAuth()
    const { addToCart } = useCart()
    const [influencer, setInfluencer] = useState(null)
    const [firebaseInfluencerId, setFirebaseInfluencerId] = useState(null)
    const [socialData, setSocialData] = useState(null)
    const [firebaseProfilePhoto, setFirebaseProfilePhoto] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedPackage, setSelectedPackage] = useState('🎥 1 Vidéo TikTok')
    const [loading, setLoading] = useState(false)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
    const [profilePhotos, setProfilePhotos] = useState([])
    const [brandVideos, setBrandVideos] = useState([])
    const [customPricing, setCustomPricing] = useState(null)
    const [tiktokVideos, setTiktokVideos] = useState([])
    const [failedThumbnails, setFailedThumbnails] = useState({})
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [addToCartError, setAddToCartError] = useState('')

    const [analyticsData, setAnalyticsData] = useState(null)

    const toNumber = (value) => {
        const num = Number(value)
        return Number.isFinite(num) ? num : 0
    }

    const formatCompactNumber = (value) => {
        if (value === null || value === undefined) return '—'
        const num = Number(value)
        if (!Number.isFinite(num) || num < 0) return '—'
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
        return num.toLocaleString('fr-FR')
    }

    const formatRelativeDate = (unixSeconds) => {
        const ts = Number(unixSeconds)
        if (!Number.isFinite(ts) || ts <= 0) return 'Récemment'

        const now = Date.now()
        const dateMs = ts * 1000
        const diffMs = Math.max(0, now - dateMs)
        const dayMs = 24 * 60 * 60 * 1000
        const days = Math.floor(diffMs / dayMs)

        if (days <= 0) return 'Aujourd’hui'
        if (days === 1) return 'Il y a 1 jour'
        if (days < 30) return `Il y a ${days} jours`

        return new Date(dateMs).toLocaleDateString('fr-FR')
    }

    const normalizeMediaUrl = (value) => {
        if (typeof value !== 'string') return ''
        const trimmedValue = value.trim()
        if (!trimmedValue) return ''
        return trimmedValue.startsWith('http://')
            ? `https://${trimmedValue.slice(7)}`
            : trimmedValue
    }

    const normalizeTikTokVideo = (video = {}) => ({
        id: video.id || video.videoId || null,
        title: video.title || video.description || 'Vidéo TikTok',
        thumbnail: normalizeMediaUrl(video.thumbnail || video.coverImageUrl || video.cover_image_url),
        url: normalizeMediaUrl(video.url || video.shareUrl || video.share_url),
        views: toNumber(video.views || video.viewCount || video.view_count),
        likes: toNumber(video.likes || video.likeCount || video.like_count),
        createTime: toNumber(video.createTime || video.create_time),
        date: video.date || ''
    })

    const normalizeTikTokVideos = (videos = []) => {
        if (!Array.isArray(videos)) return []
        return videos
            .map(normalizeTikTokVideo)
            .filter((video) => video.id || video.url || video.thumbnail)
    }

    const extractTikTokVideoId = (url = '') => {
        if (typeof url !== 'string') return ''
        const match = url.match(/\/video\/(\d+)/)
        return match?.[1] || ''
    }

    const getTikTokEmbedUrl = (video = {}) => {
        const videoId = String(video.id || extractTikTokVideoId(video.url || '')).trim()
        if (videoId) {
            return `https://www.tiktok.com/player/v1/${videoId}`
        }

        const normalizedUrl = normalizeMediaUrl(video.url)
        return normalizedUrl.includes('/video/')
            ? normalizedUrl.replace('/video/', '/embed/')
            : ''
    }

    const openTikTokModal = (video = {}) => {
        const embedUrl = getTikTokEmbedUrl(video)
        if (!embedUrl) return

        setSelectedVideo({
            ...video,
            embedUrl
        })
    }

    useEffect(() => {
        const buildPlatformAnalytics = (platformData = {}) => {
            const followers = toNumber(platformData.followers)
            const likes = toNumber(platformData.likes)
            const totalViews = toNumber(platformData.views)
            const videoCount = toNumber(platformData.videoCount)
            const explicitAvgViews = toNumber(platformData.avgViews)

            const avgViews = explicitAvgViews > 0
                ? explicitAvgViews
                : totalViews > 0 && videoCount > 0
                ? Math.round(totalViews / videoCount)
                : null

            let engagementRate = null
            if (totalViews > 0 && likes > 0) {
                engagementRate = (likes / totalViews) * 100
            } else if (followers > 0 && likes > 0 && videoCount > 0) {
                const likesPerVideo = likes / videoCount
                engagementRate = (likesPerVideo / followers) * 100
            }

            const normalizedEngagement = engagementRate !== null
                ? Number(Math.min(Math.max(engagementRate, 0), 100).toFixed(1))
                : null

            return {
                followers,
                avgViews,
                engagementRate: normalizedEngagement,
                likes,
                videoCount,
                totalViews,
                audienceLocation: Array.isArray(platformData.audienceLocation) ? platformData.audienceLocation : [],
                audienceAge: Array.isArray(platformData.audienceAge) ? platformData.audienceAge : [],
                audienceGender: platformData.audienceGender || null
            }
        }

        setAnalyticsData({
            tiktok: buildPlatformAnalytics(socialData?.tiktok)
        })
    }, [socialData])

    // Prix basés sur les packages
    const packagePrices = {
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
                // Force la lecture côté serveur pour éviter de rester bloqué sur une version cache.
                const docSnap = await getDocFromServer(docRef)
                
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    console.log('Données Firebase récupérées:', data)
                    // Stocker l'ID Firebase réel
                    setFirebaseInfluencerId(docSnap.id)
                    // Charger la photo de profil uploadée
                    if (data.photoURL) {
                        setFirebaseProfilePhoto(data.photoURL)
                    }
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
                    const rawTikTokVideos = Array.isArray(data.tiktokVideos) && data.tiktokVideos.length > 0
                        ? data.tiktokVideos
                        : data.socialAccounts?.tiktok?.recentVideos

                    setTiktokVideos(normalizeTikTokVideos(rawTikTokVideos))
                    setFailedThumbnails({})
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

    useEffect(() => {
        if (!addToCartError) return

        const timer = setTimeout(() => {
            setAddToCartError('')
        }, 3000)

        return () => clearTimeout(timer)
    }, [addToCartError])

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

        if (!currentUser) {
            setAddToCartError('Connectez-vous pour pouvoir ajouter au panier')
            return
        }

        if (userType === 'influencer') {
            setAddToCartError('Seules les marques peuvent ajouter au panier')
            return
        }
        
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

    const currentAnalytics = analyticsData?.tiktok
    const audienceLocations = currentAnalytics?.audienceLocation || []
    const audienceAges = currentAnalytics?.audienceAge || []
    const audienceGender = currentAnalytics?.audienceGender
    const canAddToCart = currentUser && userType === 'brand'
    const isFollowersLocked = !currentUser
    const isAnalyticsLocked = !currentUser
    const resolvedFollowersCount = currentAnalytics?.followers
        ?? socialData?.tiktok?.followers
        ?? influencer?.followers?.tiktok

    const displayedFollowersCount = Number.isFinite(Number(resolvedFollowersCount))
        ? Number(resolvedFollowersCount).toLocaleString('fr-FR')
        : (resolvedFollowersCount || '—')

    const secondaryMetricValue = currentAnalytics?.avgViews
        ?? (currentAnalytics?.videoCount > 0 ? currentAnalytics.videoCount : null)
        ?? (currentAnalytics?.likes > 0 ? currentAnalytics.likes : null)
    const secondaryMetricLabel = currentAnalytics?.avgViews
        ? 'Vues Moyennes'
        : currentAnalytics?.videoCount > 0
            ? 'Vidéos'
            : currentAnalytics?.likes > 0
                ? 'Likes'
                : 'Vues Moyennes'

    return (
        <div className='max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6'>
            {addToCartError && (
                <div className='fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-lg'>
                    <p className='text-sm sm:text-base font-medium text-center'>
                        {addToCartError}
                    </p>
                </div>
            )}

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
                            src={firebaseProfilePhoto || influencer.image} 
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
                                <div className='flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs sm:text-sm select-none'>
                                    <svg className='w-3.5 h-3.5 sm:w-4 sm:h-4' fill='currentColor' viewBox='0 0 24 24'>
                                        <path d='M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/>
                                    </svg>
                                    <span className={`font-medium ${isFollowersLocked ? 'blur-[5px]' : ''}`}>
                                        {displayedFollowersCount}
                                    </span>
                                    <span className='hidden sm:inline text-gray-600'>Followers</span>
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
                                <option value='🎥 1 Vidéo TikTok'>🎥 1 Vidéo TikTok</option>
                            </select>
                            <p className='text-xs text-gray-600 leading-relaxed'>
                                  La vidéo TikTok comprend votre tag et tout texte que vous souhaitez inclure.
                            </p>
                        </div>

                        <button 
                            onClick={handleAddToCart}
                            disabled={loading || !canAddToCart}
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

            {/* Analytics Section */}
            <div className='mt-10 bg-white rounded-2xl shadow-lg p-6 md:p-8 relative overflow-hidden'>

                <h2 className='relative z-20 text-2xl font-bold mb-6'>Analytics TikTok</h2>

                <div className={`relative z-0 ${isAnalyticsLocked ? 'select-none pointer-events-none blur-[10px] scale-[1.02]' : ''}`}>

                    {/* Stats Cards */}
                    <div className='grid grid-cols-3 gap-4 md:gap-6 mb-8'>
                        <div>
                            <div className='text-2xl md:text-3xl font-bold text-gray-900'>
                                {formatCompactNumber(currentAnalytics?.followers)}
                            </div>
                            <div className='text-sm text-gray-600 mt-1'>Abonnés</div>
                        </div>
                        <div>
                            <div className='text-2xl md:text-3xl font-bold text-gray-900'>
                                {formatCompactNumber(secondaryMetricValue)}
                            </div>
                            <div className='text-sm text-gray-600 mt-1'>{secondaryMetricLabel}</div>
                        </div>
                        <div>
                            <div className='text-2xl md:text-3xl font-bold text-gray-900'>
                                {currentAnalytics?.engagementRate !== null && currentAnalytics?.engagementRate !== undefined
                                    ? `${currentAnalytics.engagementRate}%`
                                    : '—'}
                            </div>
                            <div className='text-sm text-gray-600 mt-1'>Engagement</div>
                        </div>
                    </div>

                    {/* Audience Data */}
                    <div className='grid md:grid-cols-2 gap-8'>
                        {/* Audience Location */}
                        <div>
                            <h3 className='text-lg font-semibold mb-4'>Localisation du Public</h3>
                            {audienceLocations.length > 0 ? (
                                <div className='space-y-3'>
                                    {audienceLocations.map((location, index) => (
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
                            ) : (
                                <p className='text-sm text-gray-500'>Données de localisation non fournies.</p>
                            )}
                        </div>

                        {/* Audience Age */}
                        <div>
                            <h3 className='text-lg font-semibold mb-4'>Âge du Public</h3>
                            {audienceAges.length > 0 ? (
                                <div className='flex items-end justify-between h-48 gap-2'>
                                    {audienceAges.map((age, index) => {
                                    // Calculer la hauteur proportionnelle au pourcentage réel
                                    const height = (age.percentage / 100) * 100 // pourcentage direct
                                    const isHighest = age.percentage === Math.max(...audienceAges.map(a => a.percentage))
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
                            ) : (
                                <p className='text-sm text-gray-500'>Données d’âge non fournies.</p>
                            )}
                        </div>
                    </div>

                    {/* Audience Gender */}
                    <div className='mt-8'>
                        <h3 className='text-lg font-semibold mb-4'>Genre du Public</h3>
                        {audienceGender ? (
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
                                        <circle
                                            cx='50'
                                            cy='50'
                                            r='40'
                                            fill='none'
                                            stroke='#5569ff'
                                            strokeWidth='20'
                                            strokeDasharray={`${audienceGender.male * 2.51} ${251 - (audienceGender.male * 2.51)}`}
                                        />
                                    </svg>
                                </div>
                                <div className='space-y-3'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-4 h-4 rounded-full bg-primary' />
                                        <span className='text-sm text-gray-700'>Homme</span>
                                        <span className='text-sm font-semibold text-gray-900'>{audienceGender.male}%</span>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-4 h-4 rounded-full bg-gray-300' />
                                        <span className='text-sm text-gray-700'>Femme</span>
                                        <span className='text-sm font-semibold text-gray-900'>{audienceGender.female}%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className='text-sm text-gray-500'>Données de genre non fournies.</p>
                        )}
                    </div>
                </div>

                {isAnalyticsLocked && (
                    <div className='absolute inset-0 z-20 flex items-center justify-center p-4'>
                        <button
                            type='button'
                            onClick={() => navigate('/login?isSignUp=true')}
                            className='max-w-md rounded-lg bg-black/90 px-5 py-4 text-left text-white shadow-2xl hover:bg-black transition-colors'
                        >
                            <div className='flex items-center gap-3'>
                                <div className='flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/10'>
                                    <svg className='h-6 w-6' viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 11V7a4 4 0 10-8 0v4m8 0H4m8 0v10H4v-10m8 0h8m-8 0a4 4 0 118 0v4m-8-4v10h8v-10m0 0h-8' />
                                    </svg>
                                </div>
                                <span className='text-base sm:text-lg font-medium leading-snug'>
                                    Créez un compte gratuit pour accéder aux statistiques des créateurs
                                </span>
                            </div>
                        </button>
                    </div>
                )}
            </div>

            {/* Section Derniers Posts */}
            <div className='mt-10 bg-white rounded-2xl shadow-lg p-6 md:p-8'>
                <h2 className='text-2xl font-bold mb-6'>Ses Derniers Posts</h2>
                
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {tiktokVideos.length > 0 ? (
                        tiktokVideos.map((video, index) => {
                            const videoKey = video.id || video.url || `video-${index}`
                            const isThumbnailFailed = Boolean(failedThumbnails[videoKey])
                            const fallbackGradient = index % 3 === 0
                                ? 'bg-gradient-to-br from-pink-500 to-purple-600'
                                : index % 3 === 1
                                    ? 'bg-gradient-to-br from-blue-500 to-cyan-600'
                                    : 'bg-gradient-to-br from-orange-500 to-red-600'
                            const canOpenVideo = Boolean(video.url)

                            return (
                            <div 
                                key={video.id || index} 
                                className={`group ${canOpenVideo ? 'cursor-pointer' : 'cursor-default'}`}
                                onClick={() => {
                                      if (canOpenVideo) openTikTokModal(video)
                                }}
                            >
                                <div className='relative aspect-[9/16] bg-gray-100 rounded-xl overflow-hidden mb-3 hover:opacity-90 transition-opacity'>
                                    {/* Thumbnail */}
                                      {video.thumbnail && !isThumbnailFailed ? (
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title || 'Thumbnail TikTok'}
                                            className='absolute inset-0 w-full h-full object-cover'
                                              loading='lazy'
                                              referrerPolicy='no-referrer'
                                              onError={() => {
                                                  setFailedThumbnails((previous) => ({
                                                      ...previous,
                                                      [videoKey]: true
                                                  }))
                                              }}
                                        />
                                    ) : (
                                        <div className={`absolute inset-0 flex items-center justify-center ${fallbackGradient}`}>
                                            <svg className='w-20 h-20 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                                <path d='M8 5v14l11-7z'/>
                                            </svg>
                                        </div>
                                    )}

                                    {canOpenVideo && (
                                        <div className='absolute inset-0 flex items-center justify-center'>
                                            <svg className='w-16 h-16 text-white drop-shadow-lg' fill='currentColor' viewBox='0 0 24 24'>
                                                <path d='M8 5v14l11-7z'/>
                                            </svg>
                                        </div>
                                    )}

                                    {!canOpenVideo && (
                                        <div className='absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-3 py-2'>
                                            Lien vidéo non disponible
                                        </div>
                                    )}

                                    {/* Badge vues */}
                                    {video.views && (
                                        <div className='absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                                <path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/>
                                                <path fillRule='evenodd' d='M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z' clipRule='evenodd'/>
                                            </svg>
                                            {formatCompactNumber(video.views)}
                                        </div>
                                    )}

                                    {/* Badge likes */}
                                    {video.likes && (
                                        <div className='absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1'>
                                            <svg className='w-3 h-3' fill='currentColor' viewBox='0 0 20 20'>
                                                <path fillRule='evenodd' d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z' clipRule='evenodd'/>
                                            </svg>
                                            {formatCompactNumber(video.likes)}
                                        </div>
                                    )}
                                </div>
                                <div className='space-y-1'>
                                    <p className='text-sm text-gray-900 font-medium line-clamp-2 group-hover:text-primary transition-colors'>
                                        {video.title || 'Vidéo TikTok'}
                                    </p>
                                    <p className='text-xs text-gray-500'>
                                        {video.date || formatRelativeDate(video.createTime)}
                                    </p>
                                </div>
                            </div>
                            )
                        })
                    ) : (
                        // Exemple de posts si aucune vidéo n'est ajoutée
                        <>
                            <div 
                                className='group cursor-pointer'
                                  onClick={() => openTikTokModal({
                                      id: '7583700688794848534',
                                      url: 'https://www.tiktok.com/@armigno/video/7583700688794848534?lang=fr'
                                  })}
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
                                  onClick={() => openTikTokModal({
                                      id: '7582181799346933014',
                                      url: 'https://www.tiktok.com/@armigno/video/7582181799346933014?lang=fr'
                                  })}
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
                              src={selectedVideo.embedUrl}
                              title={selectedVideo.title || 'Vidéo TikTok'}
                              className='w-full h-full rounded-xl bg-black'
                              allow='fullscreen; autoplay; encrypted-media; picture-in-picture'
                              allowFullScreen
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
