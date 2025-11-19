import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db, FUNCTIONS_URL } from '../config/firebase'

// Composant pour le profil des marques
const BrandProfile = ({ currentUser, userData }) => {
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('profile')

    useEffect(() => {
        const loadPurchases = async () => {
            if (!currentUser) return
            
            try {
                // Charger les achats/collaborations de la marque
                const q = query(
                    collection(db, 'collaborations'),
                    where('brandId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                )
                const querySnapshot = await getDocs(q)
                const purchasesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setPurchases(purchasesData)
            } catch (error) {
                console.error('Erreur lors du chargement des achats:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPurchases()
    }, [currentUser])

    const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0)
    const completedPurchases = purchases.filter(p => p.status === 'completed').length

    return (
        <div className='max-w-6xl mx-auto py-10 px-4'>
            {/* En-tête du profil */}
            <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
                <div className='flex items-center gap-6'>
                    <div className='w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold'>
                        {userData?.brandName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div className='flex-1'>
                        <h1 className='text-3xl font-bold text-gray-900'>{userData?.brandName || 'Ma Marque'}</h1>
                        <p className='text-gray-600 mt-1'>{currentUser.email}</p>
                        <p className='text-sm text-gray-500 mt-2'>{userData?.description || 'Aucune description'}</p>
                    </div>
                </div>
            </div>

            {/* Statistiques */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
                <div className='bg-white rounded-xl shadow-md p-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-gray-500 text-sm'>Total dépensé</p>
                            <p className='text-3xl font-bold text-gray-900'>{totalSpent.toLocaleString('fr-FR')} €</p>
                        </div>
                        <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                            <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z'/>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z' clipRule='evenodd'/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-xl shadow-md p-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-gray-500 text-sm'>Collaborations</p>
                            <p className='text-3xl font-bold text-gray-900'>{purchases.length}</p>
                        </div>
                        <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                            <svg className='w-6 h-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                                <path d='M9 2a1 1 0 000 2h2a1 1 0 100-2H9z'/>
                                <path fillRule='evenodd' d='M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z' clipRule='evenodd'/>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className='bg-white rounded-xl shadow-md p-6'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <p className='text-gray-500 text-sm'>Terminées</p>
                            <p className='text-3xl font-bold text-gray-900'>{completedPurchases}</p>
                        </div>
                        <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                            <svg className='w-6 h-6 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd'/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Onglets */}
            <div className='bg-white rounded-xl shadow-md mb-6'>
                <div className='border-b border-gray-200'>
                    <nav className='flex -mb-px'>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'profile'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Informations
                        </button>
                        <button
                            onClick={() => setActiveTab('purchases')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'purchases'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Mes Achats ({purchases.length})
                        </button>
                    </nav>
                </div>

                <div className='p-6'>
                    {activeTab === 'profile' && (
                        <div className='space-y-4'>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Nom de la marque</label>
                                <input
                                    type='text'
                                    value={userData?.brandName || ''}
                                    readOnly
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Email</label>
                                <input
                                    type='email'
                                    value={currentUser.email}
                                    readOnly
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Téléphone</label>
                                <input
                                    type='text'
                                    value={userData?.phone || 'Non renseigné'}
                                    readOnly
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50'
                                />
                            </div>
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>Site web</label>
                                <input
                                    type='text'
                                    value={userData?.website || 'Non renseigné'}
                                    readOnly
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50'
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'purchases' && (
                        <div>
                            {loading ? (
                                <div className='text-center py-8'>
                                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
                                </div>
                            ) : purchases.length > 0 ? (
                                <div className='space-y-4'>
                                    {purchases.map((purchase) => (
                                        <div key={purchase.id} className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition'>
                                            <div className='flex justify-between items-start'>
                                                <div className='flex-1'>
                                                    <h3 className='font-semibold text-gray-900'>{purchase.influencerName || 'Influenceur'}</h3>
                                                    <p className='text-sm text-gray-600 mt-1'>{purchase.description || 'Collaboration'}</p>
                                                    <p className='text-xs text-gray-500 mt-2'>
                                                        {purchase.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                                                    </p>
                                                </div>
                                                <div className='text-right'>
                                                    <p className='font-bold text-gray-900'>{purchase.amount?.toLocaleString('fr-FR') || '0'} €</p>
                                                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                                                        purchase.status === 'completed' 
                                                            ? 'bg-green-100 text-green-800'
                                                            : purchase.status === 'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {purchase.status === 'completed' ? 'Terminé' : 
                                                         purchase.status === 'pending' ? 'En cours' : 
                                                         purchase.status || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className='text-center py-12'>
                                    <svg className='w-16 h-16 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'/>
                                    </svg>
                                    <p className='text-gray-500 text-lg'>Aucun achat pour le moment</p>
                                    <p className='text-gray-400 text-sm mt-2'>Vos collaborations apparaîtront ici</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const MyProfile = () => {
    const { currentUser, userData, userType } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const popupRef = useRef(null)
    const [activeTab, setActiveTab] = useState('social')
    const [collaborations, setCollaborations] = useState([])
    const [loadingCollabs, setLoadingCollabs] = useState(true)

    const functionsOrigin = useMemo(() => {
        try {
            return new URL(FUNCTIONS_URL).origin
        } catch (error) {
            console.error('Invalid FUNCTIONS_URL, cannot validate OAuth responses.', error)
            return null
        }
    }, [])

    useEffect(() => {
        if (!functionsOrigin) return

        const successMessages = {
            'instagram-connected': 'Instagram connecté avec succès !',
            'tiktok-connected': 'TikTok connecté avec succès !',
            'youtube-connected': 'YouTube connecté avec succès !'
        }

        const handleMessage = (event) => {
            if (event.origin !== functionsOrigin) return
            const { type } = event.data || {}
            if (!successMessages[type]) return

            popupRef.current?.close()
            popupRef.current = null
            setMessage({ type: 'success', text: successMessages[type] })
            window.location.reload()
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [functionsOrigin])
    
    console.log('MyProfile - currentUser:', currentUser)
    console.log('MyProfile - userData:', userData)
    console.log('MyProfile - userType:', userType)
    
    const [socialAccounts, setSocialAccounts] = useState({
        instagram: {
            connected: false,
            username: '',
            followers: 0,
            lastUpdated: null
        },
        tiktok: {
            connected: false,
            username: '',
            followers: 0,
            lastUpdated: null
        },
        youtube: {
            connected: false,
            username: '',
            followers: 0,
            lastUpdated: null
        }
    })

    useEffect(() => {
        if (userData?.socialAccounts) {
            // Merger les données avec les valeurs par défaut
            setSocialAccounts({
                instagram: {
                    connected: userData.socialAccounts.instagram?.connected || false,
                    username: userData.socialAccounts.instagram?.username || '',
                    followers: userData.socialAccounts.instagram?.followers || 0,
                    lastUpdated: userData.socialAccounts.instagram?.lastUpdated || null
                },
                tiktok: {
                    connected: userData.socialAccounts.tiktok?.connected || false,
                    username: userData.socialAccounts.tiktok?.username || '',
                    followers: userData.socialAccounts.tiktok?.followers || 0,
                    lastUpdated: userData.socialAccounts.tiktok?.lastUpdated || null
                },
                youtube: {
                    connected: userData.socialAccounts.youtube?.connected || false,
                    username: userData.socialAccounts.youtube?.username || '',
                    followers: userData.socialAccounts.youtube?.followers || 0,
                    lastUpdated: userData.socialAccounts.youtube?.lastUpdated || null
                }
            })
        }
    }, [userData])

    // Charger les collaborations de l'influenceur
    useEffect(() => {
        const loadCollaborations = async () => {
            if (!currentUser) return
            
            try {
                const q = query(
                    collection(db, 'collaborations'),
                    where('influencerId', '==', currentUser.uid),
                    orderBy('createdAt', 'desc')
                )
                const querySnapshot = await getDocs(q)
                const collabsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                setCollaborations(collabsData)
            } catch (error) {
                console.error('Erreur lors du chargement des collaborations:', error)
            } finally {
                setLoadingCollabs(false)
            }
        }

        loadCollaborations()
    }, [currentUser])

    // Fonction pour connecter Instagram
    const openOAuthPopup = async (endpoint, windowName) => {
        if (!currentUser) {
            setMessage({ type: 'error', text: 'Vous devez être connecté pour lier un compte.' })
            return
        }

        const width = 500
        const height = 600
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const idToken = await currentUser.getIdToken()
        const popupUrl = new URL(endpoint)
        popupUrl.searchParams.set('userId', currentUser.uid)
        popupUrl.searchParams.set('idToken', idToken)

        const popup = window.open(
            popupUrl.toString(),
            windowName,
            `width=${width},height=${height},left=${left},top=${top}`
        )

        if (!popup) {
            throw new Error('Impossible d’ouvrir la fenêtre d’authentification (popup bloquée).')
        }

        popupRef.current = popup
    }

    const connectInstagram = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        
        try {
            await openOAuthPopup(`${FUNCTIONS_URL}/instagram_connect`, 'Instagram Login')
        } catch (error) {
            console.error('Error connecting Instagram:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la connexion à Instagram' })
        } finally {
            setLoading(false)
        }
    }

    // Fonction pour connecter TikTok
    const connectTikTok = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        
        try {
            await openOAuthPopup(`${FUNCTIONS_URL}/tiktok_connect`, 'TikTok Login')
        } catch (error) {
            console.error('Error connecting TikTok:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la connexion à TikTok' })
        } finally {
            setLoading(false)
        }
    }

    // Fonction pour connecter YouTube
    const connectYouTube = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        
        try {
            await openOAuthPopup(`${FUNCTIONS_URL}/youtube_connect`, 'YouTube Login')
        } catch (error) {
            console.error('Error connecting YouTube:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la connexion à YouTube' })
        } finally {
            setLoading(false)
        }
    }

    // Fonction pour déconnecter un réseau social
    const disconnectSocial = async (platform) => {
        if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${platform} ?`)) return
        
        setLoading(true)
        try {
            const updatedAccounts = { ...socialAccounts }
            updatedAccounts[platform] = {
                connected: false,
                username: '',
                followers: 0,
                lastUpdated: null
            }
            
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                socialAccounts: updatedAccounts,
                [`tokens.${platform}`]: null
            })
            
            setSocialAccounts(updatedAccounts)
            setMessage({ type: 'success', text: `${platform} déconnecté avec succès` })
        } catch (error) {
            console.error('Error disconnecting:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la déconnexion' })
        } finally {
            setLoading(false)
        }
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
        return num
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Jamais'
        return new Date(timestamp).toLocaleDateString('fr-FR')
    }

    if (userType === 'brand') {
        return <BrandProfile currentUser={currentUser} userData={userData} />
    }

    if (userType !== 'influencer') {
        return (
            <div className='max-w-4xl mx-auto py-10'>
                <div className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded'>
                    Chargement de votre profil...
                </div>
            </div>
        )
    }

    const totalReceived = collaborations.reduce((sum, collab) => sum + (collab.amount || 0), 0)
    const completedCollaborations = collaborations.filter(c => c.status === 'completed').length
    const pendingCollaborations = collaborations.filter(c => c.status === 'pending').length

    return (
        <div className='max-w-6xl mx-auto py-10 px-4'>
            {/* En-tête avec statistiques */}
            <div className='bg-white rounded-xl shadow-md p-6 mb-6'>
                <div className='flex items-center gap-6 mb-6'>
                    <div className='w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-3xl font-bold'>
                        {userData?.name?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <div className='flex-1'>
                        <h1 className='text-3xl font-bold text-gray-900'>{userData?.name || 'Mon Profil'}</h1>
                        <p className='text-gray-600 mt-1'>{currentUser.email}</p>
                        <p className='text-sm text-gray-500 mt-2'>@{userData?.username || 'username'}</p>
                    </div>
                </div>

                {/* Statistiques rapides */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='bg-green-50 rounded-lg p-4'>
                        <p className='text-gray-600 text-sm'>Total Reçu</p>
                        <p className='text-2xl font-bold text-green-600'>{totalReceived.toLocaleString('fr-FR')} €</p>
                    </div>
                    <div className='bg-yellow-50 rounded-lg p-4'>
                        <p className='text-gray-600 text-sm'>Collaborations en cours</p>
                        <p className='text-2xl font-bold text-yellow-600'>{pendingCollaborations}</p>
                    </div>
                    <div className='bg-blue-50 rounded-lg p-4'>
                        <p className='text-gray-600 text-sm'>Collaborations terminées</p>
                        <p className='text-2xl font-bold text-blue-600'>{completedCollaborations}</p>
                    </div>
                </div>
            </div>

            {/* Onglets */}
            <div className='bg-white rounded-xl shadow-md mb-6'>
                <div className='border-b border-gray-200'>
                    <nav className='flex -mb-px'>
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'social'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Réseaux Sociaux
                        </button>
                        <button
                            onClick={() => setActiveTab('collaborations')}
                            className={`py-4 px-6 font-medium text-sm border-b-2 ${
                                activeTab === 'collaborations'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Mes Collaborations ({collaborations.length})
                        </button>
                    </nav>
                </div>
            </div>
            
            {/* Contenu des onglets */}
            {activeTab === 'social' && (
                <div>
                    {/* Message de feedback */}
                    {message.text && (
                        <div className={`mb-6 px-4 py-3 rounded ${
                            message.type === 'success' 
                                ? 'bg-green-100 border border-green-400 text-green-700' 
                                : 'bg-red-100 border border-red-400 text-red-700'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Informations de base */}
                    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                        <h2 className='text-xl font-semibold mb-4'>Informations personnelles</h2>
                        <div className='space-y-2'>
                            <p><span className='font-medium'>Nom:</span> {userData?.name}</p>
                            <p><span className='font-medium'>Email:</span> {currentUser?.email}</p>
                            <p><span className='font-medium'>Ville:</span> {userData?.city}, {userData?.country}</p>
                            <p><span className='font-medium'>Catégorie:</span> {userData?.category}</p>
                        </div>
                    </div>

                    {/* Instagram */}
                    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-gradient-to-tr from-purple-600 via-pink-600 to-orange-600 rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/>
                            </svg>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold'>Instagram</h3>
                            {socialAccounts.instagram.connected && (
                                <p className='text-sm text-gray-600'>@{socialAccounts.instagram.username}</p>
                            )}
                        </div>
                    </div>
                    
                    {socialAccounts.instagram.connected ? (
                        <button
                            onClick={() => disconnectSocial('instagram')}
                            disabled={loading}
                            className='px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50'
                        >
                            Déconnecter
                        </button>
                    ) : (
                        <button
                            onClick={connectInstagram}
                            disabled={loading}
                            className='px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50'
                        >
                            {loading ? 'Connexion...' : 'Connecter'}
                        </button>
                    )}
                </div>
                
                {socialAccounts.instagram.connected && (
                    <div className='bg-gray-50 p-4 rounded-lg'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <p className='text-sm text-gray-600'>Abonnés</p>
                                <p className='text-2xl font-bold text-purple-600'>
                                    {formatNumber(socialAccounts.instagram.followers)}
                                </p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-600'>Dernière mise à jour</p>
                                <p className='text-sm font-medium'>
                                    {formatDate(socialAccounts.instagram.lastUpdated)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                    </div>

                    {/* TikTok */}
                    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-black rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.10-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z'/>
                            </svg>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold'>TikTok</h3>
                            {socialAccounts.tiktok.connected && (
                                <p className='text-sm text-gray-600'>@{socialAccounts.tiktok.username}</p>
                            )}
                        </div>
                    </div>
                    
                    {socialAccounts.tiktok.connected ? (
                        <button
                            onClick={() => disconnectSocial('tiktok')}
                            disabled={loading}
                            className='px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50'
                        >
                            Déconnecter
                        </button>
                    ) : (
                        <button
                            onClick={connectTikTok}
                            disabled={loading}
                            className='px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50'
                        >
                            {loading ? 'Connexion...' : 'Connecter'}
                        </button>
                    )}
                </div>
                
                {socialAccounts.tiktok.connected && (
                    <div className='bg-gray-50 p-4 rounded-lg'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <p className='text-sm text-gray-600'>Abonnés</p>
                                <p className='text-2xl font-bold text-black'>
                                    {formatNumber(socialAccounts.tiktok.followers)}
                                </p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-600'>Dernière mise à jour</p>
                                <p className='text-sm font-medium'>
                                    {formatDate(socialAccounts.tiktok.lastUpdated)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                    </div>

                    {/* YouTube */}
                    <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-3'>
                        <div className='w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center'>
                            <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 24 24'>
                                <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/>
                            </svg>
                        </div>
                        <div>
                            <h3 className='text-lg font-semibold'>YouTube</h3>
                            {socialAccounts.youtube.connected && (
                                <p className='text-sm text-gray-600'>{socialAccounts.youtube.username}</p>
                            )}
                        </div>
                    </div>
                    
                    {socialAccounts.youtube.connected ? (
                        <button
                            onClick={() => disconnectSocial('youtube')}
                            disabled={loading}
                            className='px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50'
                        >
                            Déconnecter
                        </button>
                    ) : (
                        <button
                            onClick={connectYouTube}
                            disabled={loading}
                            className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50'
                        >
                            {loading ? 'Connexion...' : 'Connecter'}
                        </button>
                    )}
                </div>
                
                {socialAccounts.youtube.connected && (
                    <div className='bg-gray-50 p-4 rounded-lg'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div>
                                <p className='text-sm text-gray-600'>Abonnés</p>
                                <p className='text-2xl font-bold text-red-600'>
                                    {formatNumber(socialAccounts.youtube.followers)}
                                </p>
                            </div>
                            <div>
                                <p className='text-sm text-gray-600'>Dernière mise à jour</p>
                                <p className='text-sm font-medium'>
                                    {formatDate(socialAccounts.youtube.lastUpdated)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                    </div>

                    {/* Info mise à jour automatique */}
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6'>
                    <div className='flex items-start gap-3'>
                        <svg className='w-5 h-5 text-blue-600 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                            <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                        </svg>
                        <div>
                            <h4 className='font-semibold text-blue-900 mb-1'>Mise à jour automatique</h4>
                            <p className='text-sm text-blue-700'>
                                Vos statistiques sont automatiquement mises à jour chaque jour. Vous n'avez pas besoin de vous reconnecter !
                            </p>
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* Onglet Collaborations */}
            {activeTab === 'collaborations' && (
                <div className='bg-white rounded-lg shadow-md p-6'>
                    {loadingCollabs ? (
                        <div className='text-center py-8'>
                            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
                        </div>
                    ) : collaborations.length > 0 ? (
                        <div className='space-y-4'>
                            {collaborations.map((collab) => (
                                <div key={collab.id} className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition'>
                                    <div className='flex justify-between items-start'>
                                        <div className='flex-1'>
                                            <h3 className='font-semibold text-gray-900'>{collab.brandName || 'Marque'}</h3>
                                            <p className='text-sm text-gray-600 mt-1'>{collab.description || 'Collaboration'}</p>
                                            <p className='text-xs text-gray-500 mt-2'>
                                                {collab.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                                            </p>
                                        </div>
                                        <div className='text-right'>
                                            <p className='font-bold text-green-600'>{collab.amount?.toLocaleString('fr-FR') || '0'} €</p>
                                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                                                collab.status === 'completed' 
                                                    ? 'bg-green-100 text-green-800'
                                                    : collab.status === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {collab.status === 'completed' ? 'Terminé' : 
                                                 collab.status === 'pending' ? 'En cours' : 
                                                 collab.status || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className='text-center py-12'>
                            <svg className='w-16 h-16 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'/>
                            </svg>
                            <p className='text-gray-500 text-lg'>Aucune collaboration pour le moment</p>
                            <p className='text-gray-400 text-sm mt-2'>Vos collaborations avec les marques apparaîtront ici</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default MyProfile
