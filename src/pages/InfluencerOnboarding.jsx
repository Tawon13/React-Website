import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, TIKTOK_CONNECT_URL, TIKTOK_CALLBACK_URL } from '../config/firebase'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { compressImage } from '../utils/imageCompression'

const InfluencerOnboarding = () => {
    const navigate = useNavigate()
    const { currentUser, userData, refreshUserData } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const popupRef = useRef(null)

    const [category, setCategory] = useState('')
    const [photos, setPhotos] = useState([])
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [tiktokConnected, setTiktokConnected] = useState(false)
    const [price, setPrice] = useState(800)

    const totalSteps = 5
    const firstName = userData?.name?.split(' ')[0] || ''

    useEffect(() => {
        if (userData?.category) setCategory(userData.category)
        if (Array.isArray(userData?.profilePhotos)) setPhotos(userData.profilePhotos)
        if (userData?.socialAccounts?.tiktok?.connected) setTiktokConnected(true)
        if (userData?.pricing?.tiktok_video) setPrice(userData.pricing.tiktok_video)
    }, [userData])

    // Connexion TikTok : la popup OAuth envoie un postMessage depuis l'origine du callback.
    const functionsOrigin = useMemo(() => {
        try {
            return new URL(TIKTOK_CALLBACK_URL).origin
        } catch (error) {
            console.error('Invalid Cloud Run URL, cannot validate OAuth responses.', error)
            return null
        }
    }, [])

    useEffect(() => {
        if (!functionsOrigin) return

        const handleMessage = async (event) => {
            if (event.origin !== functionsOrigin) return
            const { type } = event.data || {}
            if (type !== 'tiktok-connected') return

            popupRef.current?.close()
            popupRef.current = null
            setTiktokConnected(true)
            await refreshUserData()
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [functionsOrigin, refreshUserData])

    const connectTikTok = async () => {
        if (!currentUser) return
        setLoading(true)
        try {
            const width = 500
            const height = 600
            const left = window.screen.width / 2 - width / 2
            const top = window.screen.height / 2 - height / 2

            const idToken = await currentUser.getIdToken()
            const popupUrl = new URL(TIKTOK_CONNECT_URL)
            popupUrl.searchParams.set('userId', currentUser.uid)
            popupUrl.searchParams.set('idToken', idToken)

            const popup = window.open(
                popupUrl.toString(),
                'TikTok Login',
                `width=${width},height=${height},left=${left},top=${top}`
            )
            if (!popup) {
                throw new Error('Impossible d’ouvrir la fenêtre d’authentification (popup bloquée).')
            }
            popupRef.current = popup
        } catch (error) {
            console.error('Erreur connexion TikTok:', error)
            setMessage('Erreur lors de la connexion à TikTok')
        } finally {
            setLoading(false)
        }
    }

    const handleAddPhoto = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            setMessage('Veuillez sélectionner une image')
            return
        }

        setUploadingPhoto(true)
        try {
            const compressedFile = await compressImage(file)

            const timestamp = Date.now()
            const storageRef = ref(storage, `influencers/${currentUser.uid}/photos/${timestamp}.jpg`)
            const snapshot = await uploadBytes(storageRef, compressedFile)
            const downloadURL = await getDownloadURL(snapshot.ref)

            const newPhoto = { id: timestamp, url: downloadURL, path: snapshot.ref.fullPath, addedAt: new Date().toISOString() }
            const updatedPhotos = [...photos, newPhoto]
            setPhotos(updatedPhotos)

            await updateDoc(doc(db, 'influencers', currentUser.uid), { profilePhotos: updatedPhotos })
        } catch (error) {
            console.error('Erreur ajout photo:', error)
            setMessage('Erreur lors de l\'ajout de la photo')
        } finally {
            setUploadingPhoto(false)
            e.target.value = ''
        }
    }

    const handleNext = () => {
        setMessage('')
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    const handleSubmit = async () => {
        if (!currentUser) return

        setLoading(true)
        try {
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                category,
                pricing: { tiktok_video: Number(price) || 800 },
                onboardingCompleted: true,
                updatedAt: new Date().toISOString()
            })
            await refreshUserData()
            navigate('/my-profile')
        } catch (error) {
            console.error('Erreur enregistrement onboarding:', error)
            setMessage('Erreur lors de l\'enregistrement')
        } finally {
            setLoading(false)
        }
    }

    const isStepValid = () => {
        switch (currentStep) {
            case 2:
                return category !== ''
            default:
                return true
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4'>
            <div className='max-w-2xl mx-auto'>
                {/* Progress Bar */}
                <div className='mb-8'>
                    <div className='flex items-center justify-between mb-2'>
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className='text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                        </button>
                        <span className='text-sm text-gray-600'>
                            Étape {currentStep} sur {totalSteps}
                        </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                            className='bg-primary rounded-full h-2 transition-all duration-300'
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                <div className='bg-white rounded-2xl shadow-lg p-8 md:p-12'>
                    {message && (
                        <div className='mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm'>
                            {message}
                        </div>
                    )}

                    {/* Step 1: Bienvenue */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Bonjour {firstName} !
                            </h2>
                            <p className='text-gray-600 mt-4'>
                                Complétons votre profil en quelques étapes pour que les marques puissent vous trouver.
                            </p>
                            <p className='text-sm text-gray-500 mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4'>
                                Votre nom et prénom ne seront jamais affichés sur votre profil public — ils restent privés.
                            </p>
                        </div>
                    )}

                    {/* Step 2: Catégorie */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Quelle est votre catégorie ?
                            </h2>
                            <p className='text-gray-600 mb-6'>Choisissez celle qui correspond le mieux à votre contenu</p>
                            <div className='grid grid-cols-2 gap-3 mt-8'>
                                {INFLUENCER_CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                                            category === cat
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className='font-medium'>{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Photos */}
                    {currentStep === 3 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Ajoutez des photos à votre profil
                            </h2>
                            <p className='text-gray-600 mb-6'>Montrez votre travail aux marques (facultatif, vous pourrez en ajouter plus tard)</p>

                            <div className='grid grid-cols-3 gap-3 mb-6'>
                                {photos.map((photo) => (
                                    <img
                                        key={photo.id}
                                        src={photo.url}
                                        alt='Photo de profil'
                                        className='w-full h-28 object-cover rounded-lg border border-gray-200'
                                    />
                                ))}
                            </div>

                            <label className='block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors'>
                                <input
                                    type='file'
                                    accept='image/*'
                                    onChange={handleAddPhoto}
                                    disabled={uploadingPhoto}
                                    className='hidden'
                                />
                                <span className='text-gray-600 font-medium'>
                                    {uploadingPhoto ? 'Envoi en cours...' : '+ Ajouter une photo'}
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Step 4: TikTok */}
                    {currentStep === 4 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Connectez votre compte TikTok
                            </h2>
                            <p className='text-gray-600 mb-8'>
                                Vos abonnés et statistiques seront affichés automatiquement sur votre profil public.
                            </p>

                            {tiktokConnected ? (
                                <div className='p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium text-center'>
                                    ✅ TikTok connecté avec succès
                                </div>
                            ) : (
                                <button
                                    onClick={connectTikTok}
                                    disabled={loading}
                                    className='w-full flex items-center justify-center gap-3 px-4 py-4 border-2 border-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all disabled:opacity-50'
                                >
                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                        <path d='M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z' />
                                    </svg>
                                    Connecter TikTok
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 5: Tarification */}
                    {currentStep === 5 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Fixez votre tarif
                            </h2>
                            <p className='text-gray-600 mb-8'>
                                Prix pour une vidéo TikTok sponsorisée. Vous pourrez le modifier à tout moment depuis votre profil.
                            </p>
                            <div className='relative'>
                                <input
                                    type='number'
                                    min='0'
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className='w-full px-4 py-4 border-2 border-gray-200 rounded-lg text-2xl font-semibold focus:border-gray-900 outline-none transition-colors'
                                />
                                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-500'>€</span>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className='mt-8 space-y-3'>
                        <button
                            onClick={handleNext}
                            disabled={!isStepValid() || loading}
                            className='w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {loading ? 'Enregistrement...' : currentStep === totalSteps ? 'Terminer' : 'Continuer'}
                        </button>
                        {currentStep === 4 && !tiktokConnected && (
                            <button
                                onClick={handleNext}
                                className='w-full bg-white text-gray-900 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200'
                            >
                                Le faire plus tard
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InfluencerOnboarding
