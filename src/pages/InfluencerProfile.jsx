import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext, normalizeInfluencer } from '../context/AppContext'
import SEO from '../components/SEO'
import { influencerSeo } from '../constants/seo'
import { computeTikTokStats } from '../utils/tiktokStats'
import { trackEvent } from '../utils/analytics'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { db } from '../config/firebase'
import { doc, getDoc, getDocFromServer, updateDoc } from 'firebase/firestore'
import { useToast } from '../context/ToastContext'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { Reveal } from '../components/PageKit'
import SmartImage from '../components/SmartImage'
import { hdPhotoURL } from '../utils/photoUrl'

const ADMIN_EMAIL = 'bechagraamine@gmail.com'

const InfluencerProfile = () => {
    const { influencerId } = useParams()
    const navigate = useNavigate()
    const { doctors, doctorsLoading } = useContext(AppContext)
    const { currentUser, userType } = useAuth()
    const { addToCart } = useCart()
    const toast = useToast()
    const { isFavorite, toggleFavorite } = useFavorites()
    // Deux sources indépendantes pour éviter que l'une n'efface l'autre selon l'ordre
    // d'arrivée des deux effets asynchrones : le profil public (via `doctors`) prime
    // toujours sur l'aperçu admin d'un profil pas encore approuvé.
    const [foundInfluencer, setFoundInfluencer] = useState(null)
    const [adminPreviewInfluencer, setAdminPreviewInfluencer] = useState(null)
    const influencer = foundInfluencer || adminPreviewInfluencer
    const [firebaseInfluencerId, setFirebaseInfluencerId] = useState(null)
    const [socialData, setSocialData] = useState(null)
    const [firebaseProfilePhoto, setFirebaseProfilePhoto] = useState(null)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [selectedPackage, setSelectedPackage] = useState('🎥 1 Vidéo TikTok')
    const [loading] = useState(false)
    const [shareCopied, setShareCopied] = useState(false)
    const [isLightboxOpen, setIsLightboxOpen] = useState(false)
    const [lightboxImageIndex, setLightboxImageIndex] = useState(0)
    const [profilePhotos, setProfilePhotos] = useState([])
    const [brandVideos, setBrandVideos] = useState([])
    const [customPricing, setCustomPricing] = useState(null)
    const [tiktokVideos, setTiktokVideos] = useState([])
    const [failedThumbnails, setFailedThumbnails] = useState({})
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [addToCartError, setAddToCartError] = useState('')
    const [isApprovedProfile, setIsApprovedProfile] = useState(true)
    const [approvingProfile, setApprovingProfile] = useState(false)
    const [directCheckDone, setDirectCheckDone] = useState(false)

    const [analyticsData, setAnalyticsData] = useState(null)
    const carouselRef = useRef(null)
    // Photos dont le fichier ne charge plus (ex. supprimé du Storage mais encore référencé) :
    // on les retire de la galerie au lieu d'afficher une case vide.
    const [brokenPhotoUrls, setBrokenPhotoUrls] = useState({})
    const markPhotoBroken = (url) => setBrokenPhotoUrls((prev) => (prev[url] ? prev : { ...prev, [url]: true }))

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
        // thumbnailHd : couverture d'origine (576x1024) ajoutée par le serveur ; sinon miniature 300x400.
        thumbnail: normalizeMediaUrl(video.thumbnailHd || video.thumbnail || video.coverImageUrl || video.cover_image_url),
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
            const { avgViews, engagementRate: normalizedEngagement } = computeTikTokStats(platformData)

            return {
                followers,
                avgViews,
                engagementRate: normalizedEngagement,
                likes,
                videoCount,
                totalViews
            }
        }

        setAnalyticsData({
            tiktok: buildPlatformAnalytics(socialData?.tiktok)
        })
    }, [socialData])

    useEffect(() => {
        if (!influencer) return
        trackEvent('view_item', {
            item_id: influencerId,
            item_name: influencer.name,
            item_category: influencer.category
        })
    }, [influencerId, Boolean(influencer)])

    // Prix basés sur les packages — utiliser le prix du profil (`fees`) comme fallback
    const packagePrices = {
        '🎥 1 Vidéo TikTok': customPricing?.tiktok_video ?? influencer?.fees ?? 800
    }

    // Obtenir le prix actuel selon le package sélectionné
    const currentPrice = packagePrices[selectedPackage] ?? influencer?.fees ?? 500

    const isAdminViewer = currentUser?.email === ADMIN_EMAIL

    // Scroll uniquement au changement de profil (pas à chaque rechargement de `doctors`).
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [influencerId])

    // Recherche synchrone (déjà en mémoire) dans la liste des influenceurs approuvés.
    useEffect(() => {
        const found = doctors.find(doc => doc._id === influencerId)
        setFoundInfluencer(found || null)
        setIsApprovedProfile(Boolean(found))
    }, [doctors, influencerId])

    // Charge les données Firestore (photos, réseaux, tarifs...) une seule fois par profil visité :
    // ne dépend ni de `doctors` ni de l'objet `currentUser` pour éviter de relancer inutilement
    // cette requête réseau (et donc de retarder l'affichage des photos) à chaque re-render.
    useEffect(() => {
        setDirectCheckDone(false)
        // Repartir sur une base propre : évite d'afficher un instant les photos/données
        // du profil précédemment visité en naviguant directement d'un profil à un autre.
        setProfilePhotos([])
        setFirebaseProfilePhoto(null)
        setSocialData(null)
        setTiktokVideos([])
        setBrandVideos([])
        setCustomPricing(null)
        setAdminPreviewInfluencer(null)
        setBrokenPhotoUrls({})

        const loadSocialData = async () => {
            try {
                const docRef = doc(db, 'influencers', influencerId)
                const docSnap = await getDoc(docRef)

                if (docSnap.exists()) {
                    const data = docSnap.data()
                    // Stocker l'ID Firebase réel
                    setFirebaseInfluencerId(docSnap.id)
                    // Charger la photo de profil uploadée
                    if (data.photoURL) {
                        setFirebaseProfilePhoto(hdPhotoURL(data.photoURL))
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

                    // L'admin peut prévisualiser un profil pas encore approuvé
                    // (donc absent de la liste publique `doctors`) pour décider de le valider.
                    // `foundInfluencer` (liste publique) reste toujours prioritaire sur cet aperçu.
                    if (isAdminViewer) {
                        setAdminPreviewInfluencer(normalizeInfluencer(docSnap))
                    }
                } else {
                    console.error('Influenceur non trouvé dans Firebase avec ID:', influencerId)
                }
            } catch (error) {
                console.error('Erreur lors du chargement des données sociales:', error)
            } finally {
                setDirectCheckDone(true)
            }
        }

        if (influencerId) {
            loadSocialData()
        } else {
            setDirectCheckDone(true)
        }
    }, [influencerId, isAdminViewer])

    // Fonctions pour le lightbox
    const openLightbox = (index) => {
        setLightboxImageIndex(index)
        setIsLightboxOpen(true)
        // Sur <html> et non <body> : overflow sur body casse la carte de prix sticky.
        document.documentElement.style.overflow = 'hidden'
    }

    const closeLightbox = () => {
        setIsLightboxOpen(false)
        document.documentElement.style.overflow = ''
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

    // Photos affichées : celles ajoutées par l'influenceur en priorité, sinon les
    // miniatures de ses 3 dernières vidéos TikTok si le compte est connecté. Tant que
    // les données Firestore ne sont pas encore arrivées, on ne se rabat pas encore sur
    // le fallback (ça évite un flash "photo de profil x3" avant les vraies photos).
    const displayPhotos = useMemo(() => {
        if (profilePhotos.length > 0) return profilePhotos
        if (!directCheckDone) return []
        return tiktokVideos
            .slice(0, 3)
            .filter((video) => video.thumbnail)
            .map((video) => ({ id: video.id || video.url, url: video.thumbnail }))
    }, [profilePhotos, tiktokVideos, directCheckDone])

    const isGalleryLoading = !directCheckDone && profilePhotos.length === 0
    const visiblePhotos = useMemo(
        () => displayPhotos.filter((photo) => photo.url && !brokenPhotoUrls[photo.url]),
        [displayPhotos, brokenPhotoUrls]
    )

    // Photo de profil : celle ajoutée par l'influenceur en priorité, sinon sa photo TikTok.
    const displayAvatar = firebaseProfilePhoto || socialData?.tiktok?.avatarUrl || influencer?.image

    // Nombre de photos de la galerie (la photo de profil seule s'il n'y en a pas d'autres)
    const totalImages = visiblePhotos.length > 0 ? visiblePhotos.length : 1

    // Fonctions pour naviguer dans le lightbox
    const nextImageUpdated = () => {
        setLightboxImageIndex((prev) => (prev + 1) % totalImages)
    }

    const previousImageUpdated = () => {
        setLightboxImageIndex((prev) => (prev - 1 + totalImages) % totalImages)
    }

    // Obtenir l'URL de l'image actuelle dans le lightbox
    const getCurrentLightboxImage = () => {
        if (visiblePhotos.length > 0) {
            return visiblePhotos[lightboxImageIndex]?.url || influencer.image
        }
        return influencer.image
    }

    // Fonction pour partager le profil
    const handleShare = async () => {
        const shareUrl = window.location.href
        const shareData = {
            title: influencer?.tiktokUsername ? `@${influencer.tiktokUsername}` : 'Profil Collabzz',
            url: shareUrl
        }

        if (navigator.share) {
            try {
                await navigator.share(shareData)
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    console.error('Erreur lors du partage:', error)
                }
            }
            return
        }

        try {
            await navigator.clipboard.writeText(shareUrl)
            setShareCopied(true)
            setTimeout(() => setShareCopied(false), 2000)
        } catch (error) {
            console.error('Erreur lors de la copie du lien:', error)
        }
    }

    // Fonction pour approuver le profil directement depuis l'aperçu admin
    const handleApproveProfile = async () => {
        if (!firebaseInfluencerId) return

        setApprovingProfile(true)
        try {
            await updateDoc(doc(db, 'influencers', firebaseInfluencerId), { approved: true })
            setIsApprovedProfile(true)
        } catch (error) {
            console.error('Erreur lors de la validation du profil:', error)
            toast.error('Erreur lors de la validation du profil')
        } finally {
            setApprovingProfile(false)
        }
    }

    // Fonction pour ajouter au panier
    const handleAddToCart = () => {
        if (!influencer) return

        if (!currentUser) {
            navigate('/login?type=brand&isSignUp=true')
            return
        }

        if (userType === 'influencer') {
            setAddToCartError('Seules les marques peuvent ajouter au panier')
            return
        }
        
        // Vérifier que nous avons l'ID Firebase
        if (!firebaseInfluencerId) {
            toast.error('Erreur: ID de l\'influenceur non trouvé')
            console.error('Firebase influencer ID manquant')
            return
        }

        const cartItem = {
            influencerId: firebaseInfluencerId, // Utiliser l'ID Firebase réel
            influencerName: influencer.name,
            // Pseudo affiché dans le panier (le vrai nom n'est jamais montré publiquement)
            influencerUsername: influencer.tiktokUsername || '',
            influencerCategory: influencer.speciality || '',
            influencerImage: influencer.image,
            package: selectedPackage,
            price: currentPrice
        }
        
        addToCart(cartItem)
        
        toast.success('Ajouté au panier !')
    }

    // Force la mise à jour des vidéos TikTok (bouton visible par le créateur sur son propre profil).
    const refreshTikTok = async () => {
        try {
            const idToken = await currentUser.getIdToken()
            const resp = await fetch('/api/force_tiktok_update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ influencerId: firebaseInfluencerId })
            })

            if (!resp.ok) throw new Error('Erreur serveur')

            // Recharger les données sociales depuis Firestore
            const docSnap = await getDocFromServer(doc(db, 'influencers', firebaseInfluencerId))
            if (docSnap.exists()) {
                const data = docSnap.data()
                const rawTikTok = Array.isArray(data.tiktokVideos) && data.tiktokVideos.length > 0
                    ? data.tiktokVideos
                    : data.socialAccounts?.tiktok?.recentVideos

                setTiktokVideos(normalizeTikTokVideos(rawTikTok))
            }
        } catch (err) {
            console.error('Erreur rafraîchissement TikTok:', err)
            toast.error('Impossible de rafraîchir les posts pour le moment.')
        }
    }

    if (!influencer) {
        if (doctorsLoading || !directCheckDone) {
            return (
                <div className='flex justify-center py-32'>
                    <div className='animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900' aria-label='Chargement' />
                </div>
            )
        }
        return (
            <div className='text-center py-20'>
                <p className='text-lg text-gray-700 font-medium'>Ce profil est introuvable ou n’est pas encore validé.</p>
                <p className='text-sm text-gray-500 mt-2'>Revenez un peu plus tard, ou contactez-nous si vous pensez qu’il s’agit d’une erreur.</p>
            </div>
        )
    }

    const currentAnalytics = analyticsData?.tiktok
    const isFollowersLocked = !currentUser
    const isAnalyticsLocked = !currentUser
    const resolvedFollowersCount = currentAnalytics?.followers
        ?? socialData?.tiktok?.followers
        ?? influencer?.followers?.tiktok

    // Verrouillé : valeurs factices sous le flou, les vraies ne sont pas rendues dans le DOM.
    const displayedFollowersCount = isFollowersLocked
        ? '00 000'
        : Number.isFinite(Number(resolvedFollowersCount))
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

    // Nom et prénom réels jamais affichés publiquement : on montre le pseudo TikTok à la place.
    const publicDisplayName = influencer.tiktokUsername
        ? `@${influencer.tiktokUsername}`
        : (influencer.speciality || 'Créateur de contenu')

    const locationLabel = [influencer.city, influencer.country].filter(Boolean).join(', ')
    const isTikTokConnected = Boolean(socialData?.tiktok?.username || influencer.tiktokUsername)
    const galleryPhotos = visiblePhotos.length > 0
        ? visiblePhotos
        : [{ id: 'fallback-0', url: influencer.image }]

    const iconBtn = 'cursor-pointer inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-900 hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
    const favorite = isFavorite(influencerId)

    const shareFavButtons = (
        <div className='flex gap-2'>
            <button onClick={handleShare} className={iconBtn}>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z' />
                </svg>
                {shareCopied ? 'Lien copié !' : 'Partager'}
            </button>
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => toggleFavorite(influencerId)}
                aria-pressed={favorite}
                className={`${iconBtn} ${favorite ? 'border-primary text-primary-dark bg-primary/10' : ''}`}
            >
                <motion.svg
                    key={favorite ? 'on' : 'off'}
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className='w-5 h-5' fill={favorite ? 'currentColor' : 'none'} stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'
                >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' />
                </motion.svg>
                {favorite ? 'Enregistré' : 'Enregistrer'}
            </motion.button>
        </div>
    )

    return (
        <MotionConfig reducedMotion='user'>
        <div className='pt-8 md:pt-12 pb-20'>
            <SEO
                {...influencerSeo({ id: influencerId, tiktokUsername: influencer.tiktokUsername, category: influencer.speciality, city: influencer.city, image: displayAvatar })}
                noindex={!isApprovedProfile}
            />
            {!isApprovedProfile && currentUser?.email === ADMIN_EMAIL && (
                <div className='mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4'>
                    <p className='text-sm text-orange-800 font-medium'>
                        {"Aperçu admin — ce profil n'est pas encore approuvé et n'est pas visible publiquement."}
                    </p>
                    <button
                        onClick={handleApproveProfile}
                        disabled={approvingProfile}
                        className='cursor-pointer px-4 py-2 text-sm font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap'
                    >
                        {approvingProfile ? 'Validation...' : 'Approuver ce profil'}
                    </button>
                </div>
            )}

            <AnimatePresence>
                {addToCartError && (
                    <motion.div
                        role='alert'
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className='fixed top-28 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700 shadow-lg'
                    >
                        <p className='text-sm sm:text-base font-medium text-center'>{addToCartError}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* En-tête */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className='flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-6'
            >
                <div className='flex items-center gap-4 min-w-0'>
                    <SmartImage width={80}
                        src={displayAvatar}
                        alt=''
                        className='w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-white shadow-lg flex-shrink-0'
                        loading='eager'
                    />
                    <div className='min-w-0'>
                        <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark'>{influencer.speciality}</p>
                        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight truncate'>{publicDisplayName}</h1>
                        {locationLabel && <p className='text-gray-500 mt-0.5'>{locationLabel}</p>}
                    </div>
                </div>
                <div className='hidden md:block'>{shareFavButtons}</div>
            </motion.div>

            {/* Galerie : mosaïque sur desktop, carrousel sur mobile */}
            <div className='mb-10'>
                <div className='hidden lg:grid grid-cols-4 grid-rows-2 gap-3 h-[30rem]'>
                    {isGalleryLoading ? (
                        <>
                            <div className='col-span-2 row-span-2 rounded-3xl bg-gray-100 animate-pulse' />
                            <div className='col-span-2 rounded-3xl bg-gray-100 animate-pulse' />
                            <div className='col-span-2 rounded-3xl bg-gray-100 animate-pulse' />
                        </>
                    ) : galleryPhotos.slice(0, 3).map((photo, index) => (
                        <motion.button
                            key={photo.id || photo.url}
                            type='button'
                            onClick={() => openLightbox(index)}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
                            className={`group relative overflow-hidden rounded-3xl bg-gray-100 cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary ${
                                index === 0 ? 'col-span-2 row-span-2' : galleryPhotos.length === 2 ? 'col-span-2 row-span-2' : 'col-span-2'
                            }`}
                            aria-label={`Agrandir la photo ${index + 1}`}
                        >
                            <SmartImage width={index === 0 ? 960 : 640}
                                src={photo.url}
                                alt={`${publicDisplayName} ${index + 1}`}
                                className='w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                                loading={index === 0 ? 'eager' : 'lazy'}
                                onError={() => markPhotoBroken(photo.url)}
                            />
                            {index === 2 && galleryPhotos.length > 3 && (
                                <span className='absolute bottom-4 right-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg'>
                                    Voir les {galleryPhotos.length} photos
                                </span>
                            )}
                        </motion.button>
                    ))}
                </div>

                <div className='lg:hidden'>
                    <div
                        ref={carouselRef}
                        className='flex overflow-x-auto scrollbar-hide snap-x snap-mandatory rounded-3xl'
                        onScroll={(e) => setCurrentImageIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.offsetWidth))}
                    >
                        {isGalleryLoading ? (
                            <div className='flex-shrink-0 w-full h-80 bg-gray-100 animate-pulse' />
                        ) : galleryPhotos.map((photo, index) => (
                            <button key={photo.id || photo.url} type='button' onClick={() => openLightbox(index)} className='flex-shrink-0 w-full snap-center cursor-pointer' aria-label={`Agrandir la photo ${index + 1}`}>
                                <SmartImage width={640}
                                    src={photo.url}
                                    alt={`${publicDisplayName} ${index + 1}`}
                                    className='w-full h-80 sm:h-96 object-cover'
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    onError={() => markPhotoBroken(photo.url)}
                                />
                            </button>
                        ))}
                    </div>
                    {galleryPhotos.length > 1 && (
                        <div className='flex justify-center gap-1.5 mt-3'>
                            {galleryPhotos.map((photo, index) => (
                                <button
                                    key={photo.id || photo.url}
                                    type='button'
                                    aria-label={`Photo ${index + 1}`}
                                    onClick={() => carouselRef.current?.scrollTo({ left: index * carouselRef.current.offsetWidth, behavior: 'smooth' })}
                                    className={`h-2 rounded-full transition-all duration-300 ${currentImageIndex === index ? 'w-6 bg-gray-900' : 'w-2 bg-gray-300'}`}
                                />
                            ))}
                        </div>
                    )}
                    <div className='mt-5 md:hidden'>{shareFavButtons}</div>
                </div>
            </div>

            <div className='grid lg:grid-cols-12 gap-10 lg:gap-12'>
                {/* Colonne principale */}
                <div className='lg:col-span-8 space-y-12 order-2 lg:order-1'>
                    {/* Badges vérifiables */}
                    <Reveal className='flex flex-wrap gap-2'>
                        {isApprovedProfile && (
                            <span className='inline-flex items-center gap-2 rounded-full bg-green-50 text-green-800 border border-green-200 px-4 py-2 text-sm font-semibold'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
                                Profil vérifié par Collabzz
                            </span>
                        )}
                        {isTikTokConnected && (
                            <span className='inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-900 px-4 py-2 text-sm font-semibold'>
                                <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path d='M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' /></svg>
                                Compte TikTok connecté
                            </span>
                        )}
                        <span className='inline-flex items-center gap-2 rounded-full bg-gray-100 text-gray-900 px-4 py-2 text-sm font-semibold'>
                            <span className={isFollowersLocked ? 'blur-[5px] select-none' : ''} aria-hidden={isFollowersLocked || undefined}>{displayedFollowersCount}</span>
                            abonnés
                            {isFollowersLocked && <span className='sr-only'>(réservé aux membres)</span>}
                        </span>
                    </Reveal>

                    {/* À propos */}
                    <Reveal>
                        <h2 className='text-2xl font-bold text-gray-900 mb-3'>À propos</h2>
                        <p className='text-lg text-gray-700 leading-relaxed whitespace-pre-line'>{influencer.about}</p>
                    </Reveal>

                    {/* Statistiques */}
                    <Reveal as='section' className='relative overflow-hidden rounded-3xl bg-gray-900 text-white p-6 sm:p-8'>
                        <h2 className='text-2xl font-bold mb-6'>Statistiques TikTok</h2>
                        <div className={isAnalyticsLocked ? 'select-none pointer-events-none blur-[10px]' : ''} aria-hidden={isAnalyticsLocked || undefined}>
                            <dl className='grid grid-cols-3 gap-3 sm:gap-4'>
                                {[
                                    { label: 'Abonnés', value: isAnalyticsLocked ? '00,0 k' : formatCompactNumber(currentAnalytics?.followers) },
                                    { label: secondaryMetricLabel, value: isAnalyticsLocked ? '00,0 k' : formatCompactNumber(secondaryMetricValue) },
                                    {
                                        label: 'Engagement (estimé)',
                                        value: isAnalyticsLocked
                                            ? '0,0 %'
                                            : currentAnalytics?.engagementRate != null
                                                ? `${currentAnalytics.engagementRate.toLocaleString('fr-FR')} %`
                                                : '—',
                                        title: "Likes + commentaires + partages des vidéos récentes, plus une estimation des enregistrements (non fournis par l'API TikTok publique), rapportés aux vues."
                                    }
                                ].map((stat) => (
                                    <div key={stat.label} className='flex flex-col-reverse rounded-2xl bg-white/5 border border-white/10 p-4 sm:p-5'>
                                        <dt className='text-xs sm:text-sm text-gray-400 mt-1'>{stat.label}</dt>
                                        <dd className='text-2xl sm:text-3xl font-bold tracking-tight' title={stat.title}>{stat.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                        {isAnalyticsLocked && (
                            <div className='absolute inset-0 top-16 flex items-center justify-center p-4'>
                                <button
                                    type='button'
                                    onClick={() => navigate('/login?type=brand&isSignUp=true')}
                                    className='cursor-pointer flex items-center gap-3 max-w-md rounded-2xl bg-white text-gray-900 text-left px-5 py-4 shadow-2xl hover:bg-gray-50 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                >
                                    <span className='w-11 h-11 rounded-full bg-primary/20 text-primary-dark flex items-center justify-center flex-shrink-0'>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' /></svg>
                                    </span>
                                    <span className='font-semibold leading-snug'>Créez un compte gratuit pour accéder aux statistiques des créateurs</span>
                                </button>
                            </div>
                        )}
                    </Reveal>

                    {/* Collaborations avec des marques */}
                    {brandVideos.length > 0 && (
                        <Reveal as='section'>
                            <h2 className='text-2xl font-bold text-gray-900 mb-5'>Collaborations avec des marques</h2>
                            <ul className='grid sm:grid-cols-2 gap-3'>
                                {brandVideos.map((video) => (
                                    <li key={video.id}>
                                        <a
                                            href={video.url}
                                            target='_blank'
                                            rel='noopener noreferrer'
                                            className='group flex items-center gap-4 rounded-2xl border border-gray-200 p-4 hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                        >
                                            <span className='w-12 h-12 rounded-xl bg-primary/15 text-primary-dark flex items-center justify-center flex-shrink-0'>
                                                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' /></svg>
                                            </span>
                                            <span className='flex-1 min-w-0'>
                                                <span className='block font-semibold text-gray-900 truncate'>{video.brandName}</span>
                                                <span className='text-sm text-gray-500'>Voir la vidéo</span>
                                            </span>
                                            <svg className='w-5 h-5 text-gray-400 transition-transform duration-200 group-hover:translate-x-1' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14' /></svg>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    )}
                </div>

                {/* Carte de réservation, collée au scroll */}
                <aside className='lg:col-span-4 order-1 lg:order-2'>
                    <div className='lg:sticky lg:top-28 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5'>
                        <p className='text-sm text-gray-500'>Prix de la prestation</p>
                        <p className='text-4xl font-bold text-gray-900 tracking-tight mb-5'>{currentPrice} €</p>

                        <fieldset className='mb-5'>
                            <legend className='text-sm font-semibold text-gray-900 mb-2'>Prestation</legend>
                            <label className='flex items-start gap-3 rounded-2xl border-2 border-gray-900 p-4 cursor-pointer'>
                                <input
                                    type='radio'
                                    name='package'
                                    value='🎥 1 Vidéo TikTok'
                                    checked={selectedPackage === '🎥 1 Vidéo TikTok'}
                                    onChange={(e) => setSelectedPackage(e.target.value)}
                                    className='mt-1 accent-gray-900'
                                />
                                <span>
                                    <span className='block font-semibold text-gray-900'>1 vidéo TikTok</span>
                                    <span className='block text-sm text-gray-600 leading-relaxed'>La vidéo TikTok comprend votre tag et tout texte que vous souhaitez inclure.</span>
                                </span>
                            </label>
                        </fieldset>

                        <button
                            onClick={handleAddToCart}
                            disabled={loading || (currentUser && userType === 'influencer')}
                            className='cursor-pointer w-full flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white py-3.5 font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' /></svg>
                            Ajouter au panier
                        </button>
                        <button
                            onClick={() => navigate('/contact')}
                            className='cursor-pointer w-full mt-3 rounded-full border border-gray-300 py-3.5 font-semibold text-gray-900 hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        >
                            Négocier un pack
                        </button>

                        <ul className='mt-6 pt-5 border-t border-gray-200 space-y-2.5 text-sm text-gray-600'>
                            <li className='flex items-center gap-2.5'>
                                <svg className='w-4 h-4 text-gray-900 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' /></svg>
                                Paiement protégé jusqu’à validation du contenu
                            </li>
                            <li className='flex items-center gap-2.5'>
                                <svg className='w-4 h-4 text-gray-900 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' /></svg>
                                Messagerie avec le créateur après la commande
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>

            {/* Derniers posts */}
            <Reveal as='section' className='mt-16'>
                <div className='flex items-center justify-between gap-4 mb-6'>
                    <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>Ses derniers posts</h2>
                    {currentUser && firebaseInfluencerId && currentUser.uid === firebaseInfluencerId && (
                        <button
                            onClick={refreshTikTok}
                            className='cursor-pointer text-sm font-semibold px-4 py-2 rounded-full border border-gray-300 hover:border-gray-900 transition-colors duration-200'
                        >
                            Rafraîchir
                        </button>
                    )}
                </div>

                {tiktokVideos.length > 0 ? (
                    <ul className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5'>
                        {tiktokVideos.map((video, index) => {
                            const videoKey = video.id || video.url || `video-${index}`
                            const isThumbnailFailed = Boolean(failedThumbnails[videoKey])
                            const canOpenVideo = Boolean(video.url)

                            return (
                                <Reveal as='li' key={videoKey} delay={Math.min(index, 7) * 0.05}>
                                    <button
                                        type='button'
                                        disabled={!canOpenVideo}
                                        onClick={() => canOpenVideo && openTikTokModal(video)}
                                        className='group w-full text-left cursor-pointer disabled:cursor-default focus-visible:outline-none'
                                    >
                                        <div className='relative aspect-[9/16] rounded-2xl overflow-hidden bg-gray-900 mb-3 group-focus-visible:ring-4 group-focus-visible:ring-primary'>
                                            {video.thumbnail && !isThumbnailFailed ? (
                                                <SmartImage width={320}
                                                    src={video.thumbnail}
                                                    alt=''
                                                    className='absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105'
                                                    loading='lazy'
                                                    referrerPolicy='no-referrer'
                                                    onError={() => setFailedThumbnails((previous) => ({ ...previous, [videoKey]: true }))}
                                                />
                                            ) : (
                                                <div className='absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900' />
                                            )}
                                            <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
                                            {canOpenVideo ? (
                                                <span className='absolute inset-0 flex items-center justify-center'>
                                                    <span className='w-14 h-14 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110'>
                                                        <svg className='w-6 h-6 ml-0.5' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path d='M8 5v14l11-7z' /></svg>
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className='absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs px-3 py-2'>Lien vidéo non disponible</span>
                                            )}
                                            {/* Vues et likes : réservés aux membres, comme les autres statistiques */}
                                            {!isAnalyticsLocked && (video.views > 0 || video.likes > 0) && (
                                                <span className='absolute bottom-3 left-3 right-3 flex gap-2 text-white text-xs font-semibold'>
                                                    {video.views > 0 && <span className='rounded-full bg-black/60 backdrop-blur px-2 py-1'>{formatCompactNumber(video.views)} vues</span>}
                                                    {video.likes > 0 && <span className='rounded-full bg-black/60 backdrop-blur px-2 py-1'>{formatCompactNumber(video.likes)} likes</span>}
                                                </span>
                                            )}
                                        </div>
                                        <p className='text-sm text-gray-900 font-medium line-clamp-2'>{video.title || 'Vidéo TikTok'}</p>
                                        <p className='text-xs text-gray-500 mt-0.5'>{video.date || formatRelativeDate(video.createTime)}</p>
                                    </button>
                                </Reveal>
                            )
                        })}
                    </ul>
                ) : (
                    <div className='flex flex-col items-center justify-center py-16 px-6 text-center rounded-3xl border border-dashed border-gray-300'>
                        <p className='text-gray-900 font-semibold'>Aucune vidéo publiée pour le moment</p>
                        <p className='text-sm text-gray-500 mt-1'>{"Cet influenceur n'a pas encore publié de vidéo TikTok publique."}</p>
                    </div>
                )}
            </Reveal>

            {/* Modal vidéo TikTok */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        role='dialog'
                        aria-modal='true'
                        aria-label={selectedVideo.title || 'Vidéo TikTok'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4'
                        onClick={() => setSelectedVideo(null)}
                    >
                        <button
                            onClick={() => setSelectedVideo(null)}
                            className='cursor-pointer absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center z-20'
                            aria-label='Fermer'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </button>
                        <motion.div
                            initial={{ scale: 0.94, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.94, opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className='relative w-full max-w-md aspect-[9/16]'
                            onClick={(e) => e.stopPropagation()}
                        >
                            <iframe
                                src={selectedVideo.embedUrl}
                                title={selectedVideo.title || 'Vidéo TikTok'}
                                className='w-full h-full rounded-2xl bg-black'
                                allow='fullscreen; autoplay; encrypted-media; picture-in-picture'
                                allowFullScreen
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox photos */}
            <AnimatePresence>
                {isLightboxOpen && (
                    <motion.div
                        role='dialog'
                        aria-modal='true'
                        aria-label='Photos du créateur'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className='fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4'
                        onClick={closeLightbox}
                    >
                        <button onClick={closeLightbox} className='cursor-pointer absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center z-20' aria-label='Fermer'>
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' /></svg>
                        </button>

                        {totalImages > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); previousImageUpdated() }}
                                className='cursor-pointer absolute left-4 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center z-20'
                                aria-label='Photo précédente'
                            >
                                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' /></svg>
                            </button>
                        )}

                        <div className='max-w-5xl max-h-[85vh] flex items-center justify-center' onClick={(e) => e.stopPropagation()}>
                            <AnimatePresence mode='wait'>
                                <motion.img
                                    key={lightboxImageIndex}
                                    src={getCurrentLightboxImage()}
                                    alt={`${publicDisplayName} ${lightboxImageIndex + 1}`}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ duration: 0.2 }}
                                    className='max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl'
                                />
                            </AnimatePresence>
                        </div>

                        {totalImages > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); nextImageUpdated() }}
                                className='cursor-pointer absolute right-4 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center z-20'
                                aria-label='Photo suivante'
                            >
                                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' /></svg>
                            </button>
                        )}

                        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-white/10 px-4 py-2 rounded-full' onClick={(e) => e.stopPropagation()}>
                            {lightboxImageIndex + 1} / {totalImages}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        </MotionConfig>
    )
}

export default InfluencerProfile
