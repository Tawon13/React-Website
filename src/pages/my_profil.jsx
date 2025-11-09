import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db, FUNCTIONS_URL } from '../config/firebase'

const MyProfile = () => {
    const { currentUser, userData, userType } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    
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

    // Fonction pour connecter Instagram
    const connectInstagram = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        
        try {
            // URL de votre Cloud Function
            const functionUrl = `${FUNCTIONS_URL}/connectInstagram`
            
            // Ouvrir popup OAuth Instagram
            const width = 500
            const height = 600
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2
            
            const popup = window.open(
                `${functionUrl}?userId=${currentUser.uid}`,
                'Instagram Login',
                `width=${width},height=${height},left=${left},top=${top}`
            )
            
            // Écouter le message de retour de la popup
            window.addEventListener('message', async (event) => {
                if (event.data.type === 'instagram-connected') {
                    popup?.close()
                    setMessage({ type: 'success', text: 'Instagram connecté avec succès !' })
                    // Recharger les données
                    window.location.reload()
                }
            })
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
            const functionUrl = `${FUNCTIONS_URL}/tiktok_connect`
            
            const width = 500
            const height = 600
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2
            
            const popup = window.open(
                `${functionUrl}?userId=${currentUser.uid}`,
                'TikTok Login',
                `width=${width},height=${height},left=${left},top=${top}`
            )
            
            window.addEventListener('message', async (event) => {
                if (event.data.type === 'tiktok-connected') {
                    popup?.close()
                    setMessage({ type: 'success', text: 'TikTok connecté avec succès !' })
                    window.location.reload()
                }
            })
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
            const functionUrl = `${FUNCTIONS_URL}/youtube_connect`
            
            const width = 500
            const height = 600
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2
            
            const popup = window.open(
                `${functionUrl}?userId=${currentUser.uid}`,
                'YouTube Login',
                `width=${width},height=${height},left=${left},top=${top}`
            )
            
            window.addEventListener('message', async (event) => {
                if (event.data.type === 'youtube-connected') {
                    popup?.close()
                    setMessage({ type: 'success', text: 'YouTube connecté avec succès !' })
                    window.location.reload()
                }
            })
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

    if (userType !== 'influencer') {
        return (
            <div className='max-w-4xl mx-auto py-10'>
                <div className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded'>
                    Cette fonctionnalité est réservée aux influenceurs
                </div>
            </div>
        )
    }

    return (
        <div className='max-w-4xl mx-auto py-10'>
            <h1 className='text-3xl font-bold mb-8'>Mon Profil - Réseaux Sociaux</h1>
            
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
    )
}

export default MyProfile