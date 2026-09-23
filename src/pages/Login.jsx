import { useEffect, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import AuthLayout, { authInputClass, authLabelClass } from '../components/AuthLayout'
import SEO from '../components/SEO'
import { lookupSiret } from '../utils/siret'
import { useToast } from '../context/ToastContext'

const EMPTY_FORM = {
    firstName: '',
    lastName: '',
    phone: '',
    fullName: '',
    brandName: '',
    siret: '',
    email: '',
    password: ''
}

const Login = () => {
    const navigate = useNavigate()
    const routerLocation = useLocation()
    const location = window.location.pathname
    const [searchParams] = useSearchParams()
    const { signUpInfluencer, signUpBrand, signIn, signInWithGoogle, signInWithFacebook, sendVerificationCode, verifyEmailCode } = useAuth()
    const toast = useToast()

    // Après connexion, revenir à la page d'origine (ex: /messages?brandId=...)
    // si l'utilisateur a été redirigé ici depuis une page protégée.
    const redirectTarget = routerLocation.state?.from

    // Compte fraîchement créé, en attente de la saisie du code de vérification email.
    const [pendingUser, setPendingUser] = useState(null)
    const [codeInput, setCodeInput] = useState('')
    const [codeError, setCodeError] = useState('')
    const [verifyingCode, setVerifyingCode] = useState(false)
    const [resendingCode, setResendingCode] = useState(false)
    const [codeResent, setCodeResent] = useState(false)

    // Déterminer si c'est un influenceur ou une marque (par défaut influenceur)
    // Support du paramètre query ou du chemin URL
    const getDefaultType = () => {
        const queryType = searchParams.get('type')
        if (queryType) return queryType
        if (location.includes('login-brand')) return 'brand'
        return 'influencer'
    }
    
    const [userType, setUserType] = useState(getDefaultType())
    const [isSignUp, setIsSignUp] = useState(searchParams.get('isSignUp') === 'true' || false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    
    const [formData, setFormData] = useState({ ...EMPTY_FORM })

    // Recherche de l'entreprise dans le répertoire officiel (Sirene) à partir du SIRET
    // saisi, pour proposer le nom de la marque plutôt que de le faire retaper à la main.
    const [siretLookup, setSiretLookup] = useState({ status: 'idle', suggestion: null })

    useEffect(() => {
        if (userType !== 'brand' || formData.siret.length !== 14) {
            setSiretLookup({ status: 'idle', suggestion: null })
            return
        }

        let cancelled = false
        setSiretLookup({ status: 'loading', suggestion: null })

        const timeoutId = setTimeout(async () => {
            try {
                const result = await lookupSiret(formData.siret)
                if (cancelled) return
                setSiretLookup(
                    result.found
                        ? { status: 'found', suggestion: result }
                        : { status: 'not_found', suggestion: null }
                )
            } catch (error) {
                if (!cancelled) {
                    console.error('Erreur lors de la vérification du SIRET:', error)
                    setSiretLookup({ status: 'error', suggestion: null })
                }
            }
        }, 400)

        return () => {
            cancelled = true
            clearTimeout(timeoutId)
        }
    }, [formData.siret, userType])

    const handleSiretChange = (e) => {
        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 14)
        setFormData((prev) => ({ ...prev, siret: digitsOnly }))
    }

    const acceptSiretSuggestion = () => {
        if (!siretLookup.suggestion) return
        setFormData((prev) => ({ ...prev, brandName: siretLookup.suggestion.name }))
        setSiretLookup((prev) => ({ ...prev, status: 'confirmed' }))
    }

    const getSocialAuthErrorMessage = (error, providerLabel) => {
        switch (error?.code) {
            case 'auth/unauthorized-domain':
                return 'Domaine non autorisé dans Firebase. Ajoutez votre domaine Vercel dans Authentication > Settings > Authorized domains.'
            case 'auth/operation-not-allowed':
                return `${providerLabel} n'est pas activé dans Firebase Authentication.`
            case 'auth/popup-blocked':
                return 'La popup de connexion a été bloquée par le navigateur. Autorisez les popups puis réessayez.'
            case 'auth/popup-closed-by-user':
                return 'La popup a été fermée avant la fin de la connexion.'
            case 'auth/cancelled-popup-request':
                return 'Une autre popup de connexion est déjà en cours.'
            case 'auth/network-request-failed':
                return 'Erreur réseau pendant la connexion. Vérifiez votre connexion internet.'
            default:
                return `Erreur lors de la connexion avec ${providerLabel}${error?.code ? ` (${error.code})` : ''}`
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleGoogleSignIn = async () => {
        setError('')
        setLoading(true)
        try {
            await signInWithGoogle(userType === 'influencer')
            navigate(redirectTarget || '/')
        } catch (error) {
            console.error('Google sign in error:', error)
            setError(getSocialAuthErrorMessage(error, 'Google'))
        } finally {
            setLoading(false)
        }
    }

    const handleFacebookSignIn = async () => {
        setError('')
        setLoading(true)
        try {
            await signInWithFacebook(userType === 'influencer')
            navigate(redirectTarget || '/')
        } catch (error) {
            console.error('Facebook sign in error:', error)
            setError(getSocialAuthErrorMessage(error, 'Facebook'))
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (isSignUp && !agreedToTerms) {
            setError('Vous devez accepter les conditions d\'utilisation')
            return
        }

        setLoading(true)

        try {
            if (isSignUp) {
                if (formData.password.length < 6) {
                    setError('Le mot de passe doit contenir au moins 6 caractères')
                    setLoading(false)
                    return
                }

                let user
                if (userType === 'influencer') {
                    const fullName = `${formData.firstName} ${formData.lastName}`
                    user = await signUpInfluencer(formData.email, formData.password, {
                        name: fullName,
                        phone: formData.phone
                    })
                } else {
                    user = await signUpBrand(formData.email, formData.password, {
                        fullName: formData.fullName,
                        brandName: formData.brandName,
                        siret: formData.siret
                    })
                }

                // Le compte est créé mais pas encore utilisable : on attend que l'utilisateur
                // saisisse le code reçu par email pour valider son adresse.
                setPendingUser(user)
            } else {
                await signIn(formData.email, formData.password)
                navigate(redirectTarget || '/')
            }
        } catch (error) {
            console.error('Error:', error)
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setError('Cet email est déjà utilisé')
                    break
                case 'auth/invalid-email':
                    setError('Email invalide')
                    break
                case 'auth/weak-password':
                    setError('Le mot de passe est trop faible')
                    break
                case 'auth/user-not-found':
                    setError('Aucun compte trouvé avec cet email')
                    break
                case 'auth/wrong-password':
                    setError('Mot de passe incorrect')
                    break
                case 'auth/invalid-credential':
                    setError('Email ou mot de passe incorrect')
                    break
                case 'auth/too-many-requests':
                    setError('Trop de tentatives. Réessayez dans quelques minutes ou réinitialisez votre mot de passe.')
                    break
                default:
                    setError('Une erreur est survenue. Veuillez réessayer.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyCode = async (e) => {
        e.preventDefault()
        setCodeError('')
        setVerifyingCode(true)
        try {
            await verifyEmailCode(pendingUser, codeInput.trim())
            toast.success('Compte créé avec succès !')
            if (userType === 'brand') {
                navigate('/brand-onboarding')
            } else {
                navigate('/influencer-onboarding')
            }
        } catch (error) {
            setCodeError(error.message || 'Code invalide')
        } finally {
            setVerifyingCode(false)
        }
    }

    const handleResendCode = async () => {
        setCodeError('')
        setCodeResent(false)
        setResendingCode(true)
        try {
            await sendVerificationCode(pendingUser)
            setCodeResent(true)
        } catch (error) {
            setCodeError(error.message || "Impossible de renvoyer le code")
        } finally {
            setResendingCode(false)
        }
    }

    const resetForType = (type) => {
        setUserType(type)
        setFormData({ ...EMPTY_FORM })
        setSiretLookup({ status: 'idle', suggestion: null })
        setError('')
    }

    const inputClass = authInputClass
    const labelClass = authLabelClass
    const fieldMotion = {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: 'auto' },
        exit: { opacity: 0, height: 0 },
        transition: { duration: 0.25, ease: 'easeOut' }
    }

    return (
        <AuthLayout
            panel={userType === 'brand' ? 'brand' : 'influencer'}
            backLabel={pendingUser ? 'Modifier mes informations' : 'Retour au site'}
            onBack={pendingUser ? () => setPendingUser(null) : undefined}
        >
            <SEO title={isSignUp ? 'Créer un compte' : 'Connexion'} noindex />
                    <AnimatePresence mode='wait'>
                    {pendingUser ? (
                        <motion.div key='verify' initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.3 }}>
                            <div className='w-14 h-14 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mb-6'>
                                <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' /></svg>
                            </div>
                            <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3'>Vérifiez votre email</h1>
                            <p className='text-gray-600 mb-8 leading-relaxed'>
                                Nous avons envoyé un code à 6 chiffres à{' '}
                                <span className='font-semibold text-gray-900'>{pendingUser.email}</span>.
                                Saisissez-le ci-dessous pour activer votre compte.
                            </p>

                            {codeError && (
                                <div role='alert' className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm'>{codeError}</div>
                            )}
                            {codeResent && !codeError && (
                                <div role='status' className='mb-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl text-sm'>Un nouveau code a été envoyé.</div>
                            )}

                            <form onSubmit={handleVerifyCode} className='space-y-4'>
                                <div>
                                    <label htmlFor='verify-code' className={labelClass}>Code de vérification</label>
                                    <input
                                        id='verify-code'
                                        type='text'
                                        inputMode='numeric'
                                        autoComplete='one-time-code'
                                        maxLength={6}
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                                        className={`${inputClass} text-center text-2xl tracking-[0.5em] font-semibold`}
                                        placeholder='------'
                                        autoFocus
                                        required
                                    />
                                </div>
                                <button
                                    type='submit'
                                    disabled={verifyingCode || codeInput.length !== 6}
                                    className='cursor-pointer w-full bg-gray-900 text-white py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                                >
                                    {verifyingCode ? 'Vérification...' : 'Vérifier'}
                                </button>
                                <button
                                    type='button'
                                    onClick={handleResendCode}
                                    disabled={resendingCode}
                                    className='cursor-pointer w-full text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors duration-200 disabled:opacity-50'
                                >
                                    {resendingCode ? 'Envoi...' : 'Renvoyer le code'}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div key='auth' initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.3 }}>
                            {/* Marque / influenceur */}
                            <div role='radiogroup' aria-label='Type de compte' className='grid grid-cols-2 bg-gray-100 p-1 rounded-full mb-8'>
                                {[{ id: 'influencer', label: 'Je suis influenceur' }, { id: 'brand', label: 'Je suis une marque' }].map((type) => (
                                    <button
                                        key={type.id}
                                        type='button'
                                        role='radio'
                                        aria-checked={userType === type.id}
                                        onClick={() => resetForType(type.id)}
                                        className={`cursor-pointer relative py-2.5 px-3 rounded-full text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${userType === type.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                                    >
                                        {userType === type.id && (
                                            <motion.span layoutId='auth-type-pill' className='absolute inset-0 rounded-full bg-white shadow-md' transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                                        )}
                                        <span className='relative'>{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence mode='wait' initial={false}>
                                <motion.div
                                    key={isSignUp ? 'signup' : 'signin'}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                    className='mb-8'
                                >
                                    <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2'>
                                        {isSignUp ? 'Créer un compte' : 'Bon retour !'}
                                    </h1>
                                    <p className='text-gray-600'>
                                        {isSignUp ? 'Déjà membre ?' : 'Nouveau sur Collabzz ?'}{' '}
                                        <button
                                            type='button'
                                            onClick={() => { setIsSignUp(!isSignUp); setError('') }}
                                            className='cursor-pointer font-semibold text-gray-900 underline underline-offset-4 hover:text-primary-dark transition-colors duration-200'
                                        >
                                            {isSignUp ? 'Se connecter' : 'Créer un compte gratuit'}
                                        </button>
                                    </p>
                                </motion.div>
                            </AnimatePresence>

                            {/* Connexion rapide */}
                            <div className='grid grid-cols-2 gap-3'>
                                <button
                                    type='button'
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className='cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-full font-semibold text-gray-800 hover:border-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                >
                                    <svg className='w-5 h-5' viewBox='0 0 24 24' aria-hidden='true'>
                                        <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z' />
                                        <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z' />
                                        <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z' />
                                        <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z' />
                                    </svg>
                                    Google
                                </button>
                                <button
                                    type='button'
                                    onClick={handleFacebookSignIn}
                                    disabled={loading}
                                    className='cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-full font-semibold text-gray-800 hover:border-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                >
                                    <svg className='w-5 h-5' fill='#1877F2' viewBox='0 0 24 24' aria-hidden='true'>
                                        <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                                    </svg>
                                    Facebook
                                </button>
                            </div>

                            <div className='relative my-7' aria-hidden='true'>
                                <div className='absolute inset-0 flex items-center'><div className='w-full border-t border-gray-200'></div></div>
                                <div className='relative flex justify-center text-sm'><span className='px-4 bg-white text-gray-500'>ou avec votre email</span></div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div role='alert' {...fieldMotion} className='overflow-hidden'>
                                        <div className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm'>{error}</div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSubmit}>
                                <AnimatePresence initial={false}>
                                    {isSignUp && userType === 'influencer' && (
                                        <motion.div key='influencer-fields' {...fieldMotion} className='overflow-hidden'>
                                            <div className='grid grid-cols-2 gap-3 pb-4'>
                                                <div>
                                                    <label htmlFor='firstName' className={labelClass}>Prénom</label>
                                                    <input id='firstName' type='text' name='firstName' autoComplete='given-name' value={formData.firstName} onChange={handleChange} className={inputClass} placeholder='Jean' required />
                                                </div>
                                                <div>
                                                    <label htmlFor='lastName' className={labelClass}>Nom</label>
                                                    <input id='lastName' type='text' name='lastName' autoComplete='family-name' value={formData.lastName} onChange={handleChange} className={inputClass} placeholder='Dupont' required />
                                                </div>
                                            </div>
                                            <div className='pb-4'>
                                                <label htmlFor='phone' className={labelClass}>Numéro de téléphone</label>
                                                <input
                                                    id='phone'
                                                    type='tel'
                                                    name='phone'
                                                    autoComplete='tel'
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                    placeholder='06 12 34 56 78'
                                                    pattern='(?:\+33|0)[1-9](?:[ .-]?\d{2}){4}'
                                                    title='Numéro français, ex : 06 12 34 56 78 ou +33 6 12 34 56 78'
                                                    aria-describedby='phone-help'
                                                    required
                                                />
                                                <p id='phone-help' className='text-xs text-gray-500 mt-1.5'>{"Utilisé pour vous prévenir par SMS dès qu'une marque vous contacte."}</p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {isSignUp && userType === 'brand' && (
                                        <motion.div key='brand-fields' {...fieldMotion} className='overflow-hidden'>
                                            <div className='pb-4'>
                                                <label htmlFor='fullName' className={labelClass}>Nom complet</label>
                                                <input id='fullName' type='text' name='fullName' autoComplete='name' value={formData.fullName} onChange={handleChange} className={inputClass} placeholder='Camille Martin' required />
                                            </div>
                                            <div className='pb-4'>
                                                <label htmlFor='siret' className={labelClass}>Numéro de SIRET</label>
                                                <input
                                                    id='siret'
                                                    type='text'
                                                    inputMode='numeric'
                                                    name='siret'
                                                    value={formData.siret}
                                                    onChange={handleSiretChange}
                                                    className={inputClass}
                                                    placeholder='14 chiffres'
                                                    pattern='\d{14}'
                                                    title='Le SIRET doit contenir 14 chiffres'
                                                    aria-describedby='siret-help'
                                                    required
                                                />
                                                <p id='siret-help' className='text-xs text-gray-500 mt-1.5'>Utilisé pour vérifier votre entreprise et simplifier vos factures.</p>

                                                <div aria-live='polite'>
                                                    {siretLookup.status === 'loading' && (
                                                        <p className='flex items-center gap-2 text-sm text-gray-500 mt-2'>
                                                            <span className='w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin' aria-hidden='true'></span>
                                                            Recherche de votre entreprise...
                                                        </p>
                                                    )}
                                                    {siretLookup.status === 'found' && siretLookup.suggestion && (
                                                        <div className='mt-2 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm'>
                                                            <p className='text-gray-700'>
                                                                Nous avons trouvé : <span className='font-semibold text-gray-900'>{siretLookup.suggestion.name}</span>
                                                                {siretLookup.suggestion.address && <> — {siretLookup.suggestion.address}</>}
                                                            </p>
                                                            {siretLookup.suggestion.closed && (
                                                                <p className='text-orange-700 mt-1'>Cet établissement apparaît comme fermé dans le répertoire officiel.</p>
                                                            )}
                                                            <button type='button' onClick={acceptSiretSuggestion} className='cursor-pointer mt-2 font-semibold text-gray-900 underline underline-offset-4'>
                                                                {"Oui, c'est bien ma marque : utiliser ce nom"}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {siretLookup.status === 'confirmed' && (
                                                        <p className='text-sm text-green-700 mt-2'>Nom confirmé depuis le répertoire officiel des entreprises.</p>
                                                    )}
                                                    {siretLookup.status === 'not_found' && (
                                                        <p className='text-sm text-gray-500 mt-2'>Aucune entreprise trouvée avec ce numéro. Vérifiez-le ou renseignez le nom de votre marque ci-dessous.</p>
                                                    )}
                                                    {siretLookup.status === 'error' && (
                                                        <p className='text-sm text-gray-500 mt-2'>Impossible de vérifier ce SIRET pour le moment. Vous pouvez renseigner le nom de votre marque manuellement.</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className='pb-4'>
                                                <label htmlFor='brandName' className={labelClass}>Nom de la marque</label>
                                                <input id='brandName' type='text' name='brandName' autoComplete='organization' value={formData.brandName} onChange={handleChange} className={inputClass} placeholder='Ma Marque' required />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className='pb-4'>
                                    <label htmlFor='email' className={labelClass}>Adresse email</label>
                                    <input id='email' type='email' name='email' autoComplete='email' value={formData.email} onChange={handleChange} className={inputClass} placeholder='nom@exemple.com' required />
                                </div>

                                <div className='pb-2'>
                                    <div className='flex items-center justify-between mb-1.5'>
                                        <label htmlFor='password' className='text-sm font-semibold text-gray-800'>Mot de passe</label>
                                        {!isSignUp && (
                                            <button type='button' onClick={() => navigate('/forgot-password')} className='cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200'>
                                                Mot de passe oublié ?
                                            </button>
                                        )}
                                    </div>
                                    <div className='relative'>
                                        <input
                                            id='password'
                                            type={showPassword ? 'text' : 'password'}
                                            name='password'
                                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`${inputClass} pr-12`}
                                            placeholder={isSignUp ? '6 caractères minimum' : '••••••••'}
                                            minLength={isSignUp ? 6 : undefined}
                                            required
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                            className='cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                        >
                                            {showPassword ? (
                                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                                                </svg>
                                            ) : (
                                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Conditions : avant le bouton d'envoi */}
                                <AnimatePresence initial={false}>
                                    {isSignUp && (
                                        <motion.div key='terms' {...fieldMotion} className='overflow-hidden'>
                                            <div className='flex items-start gap-3 pt-3'>
                                                <input
                                                    type='checkbox'
                                                    id='terms'
                                                    checked={agreedToTerms}
                                                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                                                    className='mt-0.5 w-5 h-5 rounded border-gray-300 accent-gray-900 cursor-pointer'
                                                    required
                                                />
                                                <label htmlFor='terms' className='text-sm text-gray-600 leading-relaxed'>
                                                    {"J'accepte les "}
                                                    <a href='/terms' target='_blank' rel='noopener noreferrer' className='font-semibold text-gray-900 underline underline-offset-4'>{"conditions d'utilisation"}</a>
                                                    {' et la '}
                                                    <a href='/privacy' target='_blank' rel='noopener noreferrer' className='font-semibold text-gray-900 underline underline-offset-4'>politique de confidentialité</a>
                                                </label>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type='submit'
                                    disabled={loading}
                                    className='cursor-pointer w-full mt-6 flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                                >
                                    {loading && <span className='w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin' aria-hidden='true'></span>}
                                    {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
                                </button>
                            </form>
                        </motion.div>
                    )}
                    </AnimatePresence>
        </AuthLayout>
    )
}

export default Login
