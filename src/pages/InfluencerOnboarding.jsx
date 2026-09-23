import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, TIKTOK_CONNECT_URL, TIKTOK_CALLBACK_URL } from '../config/firebase'
import { storage } from '../config/storage'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { compressImage } from '../utils/imageCompression'
import OnboardingLayout, { StepTitle, OptionButton, onboardingPrimaryBtn, onboardingSecondaryBtn } from '../components/OnboardingLayout'

const InfluencerOnboarding = () => {
    const navigate = useNavigate()
    const { currentUser, userData, refreshUserData } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [direction, setDirection] = useState(1)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const popupRef = useRef(null)

    const [category, setCategory] = useState('')
    const [photos, setPhotos] = useState([])
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [tiktokConnected, setTiktokConnected] = useState(false)
    // Vide par défaut : « 300 » n'est qu'un exemple affiché en gris (placeholder).
    const [price, setPrice] = useState('')

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
            setDirection(1)
            setCurrentStep(currentStep + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1)
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSubmit = async () => {
        if (!currentUser) return

        setLoading(true)
        try {
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                category,
                pricing: { tiktok_video: Number(price) },
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
            case 5:
                return Number(price) > 0
            default:
                return true
        }
    }

    const STEPS_PREVIEW = [
        ['Votre catégorie', 'pour apparaître dans les bonnes recherches'],
        ['Vos photos', 'pour montrer votre style'],
        ['Votre compte TikTok', 'pour afficher vos vraies statistiques'],
        ['Votre tarif', 'que vous touchez en entier']
    ]

    return (
        <OnboardingLayout
            title='Créez votre profil'
            step={currentStep}
            totalSteps={totalSteps}
            direction={direction}
            onBack={handleBack}
            actions={
                <>
                    {currentStep === 4 && !tiktokConnected && (
                        <button type='button' onClick={handleNext} className={onboardingSecondaryBtn}>Le faire plus tard</button>
                    )}
                    {currentStep === 3 && photos.length === 0 && (
                        <button type='button' onClick={handleNext} className={onboardingSecondaryBtn}>Ajouter plus tard</button>
                    )}
                    <button type='button' onClick={handleNext} disabled={!isStepValid() || loading || uploadingPhoto} className={onboardingPrimaryBtn}>
                        {loading && <span className='w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin' aria-hidden='true'></span>}
                        {loading ? 'Enregistrement...' : currentStep === 1 ? 'Commencer' : currentStep === totalSteps ? 'Terminer mon profil' : 'Continuer'}
                    </button>
                </>
            }
        >
            {message && (
                <div role='alert' className='mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm'>{message}</div>
            )}

            {currentStep === 1 && (
                <>
                    <StepTitle
                        eyebrow='Bienvenue'
                        title={firstName ? `Bonjour ${firstName} !` : 'Bonjour !'}
                        text='Complétons votre profil en quelques étapes pour que les marques puissent vous trouver.'
                    />
                    <ol className='space-y-3 mb-8'>
                        {STEPS_PREVIEW.map(([label, detail], i) => (
                            <motion.li
                                key={label}
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 + i * 0.07 }}
                                className='flex items-center gap-4 rounded-2xl bg-gray-50 px-5 py-4'
                            >
                                <span className='w-9 h-9 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center flex-shrink-0'>{i + 1}</span>
                                <span><span className='font-semibold text-gray-900'>{label}</span> <span className='text-gray-500'>{detail}</span></span>
                            </motion.li>
                        ))}
                    </ol>
                    <div className='flex items-start gap-3 rounded-2xl border border-gray-200 px-5 py-4 text-sm text-gray-600'>
                        <svg className='w-5 h-5 text-gray-900 flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' /></svg>
                        Votre nom et prénom ne seront jamais affichés sur votre profil public : ils restent privés.
                    </div>
                </>
            )}

            {currentStep === 2 && (
                <>
                    <StepTitle eyebrow='Catégorie' title='Quelle est votre catégorie ?' text='Choisissez celle qui correspond le mieux à votre contenu.' />
                    <div role='radiogroup' aria-label='Catégorie' className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                        {INFLUENCER_CATEGORIES.map((cat) => (
                            <OptionButton key={cat} compact label={cat} selected={category === cat} onClick={() => setCategory(cat)} />
                        ))}
                    </div>
                </>
            )}

            {currentStep === 3 && (
                <>
                    <StepTitle eyebrow='Photos' title='Ajoutez des photos à votre profil' text='Montrez votre travail aux marques. Facultatif : vous pourrez en ajouter plus tard.' />
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                        {photos.map((photo) => (
                            <motion.img
                                key={photo.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={photo.url}
                                alt='Photo de votre profil'
                                className='w-full aspect-[4/5] object-cover rounded-2xl'
                            />
                        ))}
                        <label className={`flex flex-col items-center justify-center gap-2 aspect-[4/5] rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors duration-200 focus-within:ring-2 focus-within:ring-primary ${uploadingPhoto ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-gray-900 hover:bg-gray-50'}`}>
                            <input type='file' accept='image/*' onChange={handleAddPhoto} disabled={uploadingPhoto} className='sr-only' />
                            {uploadingPhoto ? (
                                <span className='w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin' aria-hidden='true'></span>
                            ) : (
                                <span className='w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center'>
                                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' /></svg>
                                </span>
                            )}
                            <span className='text-sm font-semibold text-gray-900'>{uploadingPhoto ? 'Envoi en cours...' : 'Ajouter une photo'}</span>
                        </label>
                    </div>
                </>
            )}

            {currentStep === 4 && (
                <>
                    <StepTitle eyebrow='TikTok' title='Connectez votre compte TikTok' text='Vos abonnés et statistiques seront affichés automatiquement sur votre profil, et mis à jour chaque jour.' />
                    <AnimatePresence mode='wait'>
                        {tiktokConnected ? (
                            <motion.div
                                key='connected'
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className='flex items-center gap-4 rounded-2xl bg-green-50 border border-green-200 px-5 py-4'
                                role='status'
                            >
                                <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }} className='w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0'>
                                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M5 13l4 4L19 7' /></svg>
                                </motion.span>
                                <span>
                                    <span className='block font-semibold text-green-900'>TikTok connecté avec succès</span>
                                    {userData?.socialAccounts?.tiktok?.username && <span className='text-sm text-green-800'>@{userData.socialAccounts.tiktok.username}</span>}
                                </span>
                            </motion.div>
                        ) : (
                            <motion.button
                                key='connect'
                                type='button'
                                onClick={connectTikTok}
                                disabled={loading}
                                whileTap={{ scale: 0.98 }}
                                className='cursor-pointer w-full flex items-center justify-center gap-3 rounded-2xl bg-black text-white px-5 py-5 text-lg font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                            >
                                <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                                    <path d='M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z' />
                                </svg>
                                {loading ? 'Ouverture de TikTok...' : 'Connecter TikTok'}
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <p className='text-sm text-gray-500 mt-4'>Une fenêtre TikTok va s’ouvrir. Autorisez les fenêtres pop-up si rien ne s’affiche.</p>
                </>
            )}

            {currentStep === 5 && (
                <>
                    <StepTitle eyebrow='Tarif' title='Fixez votre tarif' text='Prix pour une vidéo TikTok sponsorisée. Vous pourrez le modifier à tout moment depuis votre profil.' />
                    <label htmlFor='onboarding-price' className='block text-sm font-semibold text-gray-800 mb-2'>Prix d’une vidéo TikTok</label>
                    <div className='relative'>
                        <input
                            id='onboarding-price'
                            type='number'
                            inputMode='numeric'
                            min='0'
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder='300'
                            className='w-full px-5 py-5 border-2 border-gray-200 rounded-2xl text-4xl font-bold text-gray-900 placeholder:text-gray-300 focus:border-gray-900 focus:ring-2 focus:ring-primary/40 outline-none transition-colors duration-200'
                        />
                        <span className='absolute right-5 top-1/2 -translate-y-1/2 text-3xl font-bold text-gray-400'>€</span>
                    </div>
                    <div className='flex items-start gap-3 rounded-2xl bg-primary/10 px-5 py-4 mt-5 text-sm text-gray-900'>
                        <svg className='w-5 h-5 text-primary-dark flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
                        Vous touchez 100 % de ce prix : les frais de service Collabzz sont payés par la marque.
                    </div>
                </>
            )}
        </OnboardingLayout>
    )
}

export default InfluencerOnboarding
