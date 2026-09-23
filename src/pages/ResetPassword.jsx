import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../config/firebase'
import { AnimatePresence, motion } from 'motion/react'
import AuthLayout, { authInputClass, authLabelClass, authPrimaryBtn } from '../components/AuthLayout'
import SEO from '../components/SEO'

const ResetPassword = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [email, setEmail] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [verifying, setVerifying] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [codeVerified, setCodeVerified] = useState(false)

    const oobCodeFromUrl = searchParams.get('oobCode')

    // Vérifier le code depuis l'URL au chargement
    useEffect(() => {
        const verifyCodeFromUrl = async () => {
            if (!oobCodeFromUrl) {
                // Pas de code dans l'URL, on attend que l'utilisateur entre le code
                return
            }

            setVerifying(true)
            try {
                const emailFromCode = await verifyPasswordResetCode(auth, oobCodeFromUrl)
                setEmail(emailFromCode)
                setVerificationCode(oobCodeFromUrl)
                setCodeVerified(true)
            } catch (error) {
                console.error('Error verifying code:', error)
                setError('Le lien de réinitialisation est invalide ou a expiré')
            } finally {
                setVerifying(false)
            }
        }

        verifyCodeFromUrl()
    }, [oobCodeFromUrl])

    const handleVerifyCode = async () => {
        if (!verificationCode.trim()) {
            setError('Veuillez entrer le code de vérification')
            return
        }

        setLoading(true)
        setError('')

        try {
            const emailFromCode = await verifyPasswordResetCode(auth, verificationCode.trim())
            setEmail(emailFromCode)
            setCodeVerified(true)
        } catch (error) {
            console.error('Error verifying code:', error)
            
            switch (error.code) {
                case 'auth/expired-action-code':
                    setError('Le code de vérification a expiré')
                    break
                case 'auth/invalid-action-code':
                    setError('Le code de vérification est invalide')
                    break
                default:
                    setError('Code invalide. Vérifiez et réessayez.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        // Vérifications
        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        setLoading(true)

        try {
            await confirmPasswordReset(auth, verificationCode, newPassword)
            setSuccess(true)
            
            // Rediriger vers la page de connexion après 3 secondes
            setTimeout(() => {
                navigate('/login')
            }, 3000)
        } catch (error) {
            console.error('Password reset error:', error)
            
            switch (error.code) {
                case 'auth/expired-action-code':
                    setError('Le lien de réinitialisation a expiré')
                    break
                case 'auth/invalid-action-code':
                    setError('Le lien de réinitialisation est invalide')
                    break
                case 'auth/weak-password':
                    setError('Le mot de passe est trop faible')
                    break
                default:
                    setError('Une erreur est survenue. Veuillez réessayer.')
            }
        } finally {
            setLoading(false)
        }
    }

    const fade = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.3 } }
    const eyeBtn = 'cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
    const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword
    const errorBox = error && (
        <div role='alert' className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm'>{error}</div>
    )

    return (
        <AuthLayout
            panel='recovery'
            backLabel={codeVerified ? 'Retour à la connexion' : 'Renvoyer un email'}
            onBack={() => navigate(codeVerified ? '/login' : '/forgot-password')}
        >
            <SEO title='Nouveau mot de passe' noindex />
            <AnimatePresence mode='wait'>
                {verifying ? (
                    <motion.div key='verifying' {...fade} className='text-center py-12' role='status'>
                        <div className='w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin mx-auto' aria-hidden='true'></div>
                        <p className='mt-4 text-gray-600'>Vérification du code...</p>
                    </motion.div>
                ) : success ? (
                    <motion.div key='success' {...fade} role='status'>
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                            className='w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-6'
                        >
                            <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                        </motion.div>
                        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3'>Mot de passe modifié !</h1>
                        <p className='text-gray-600 leading-relaxed mb-8'>
                            Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
                        </p>
                        <button onClick={() => navigate('/login')} className={authPrimaryBtn}>Se connecter maintenant</button>
                    </motion.div>
                ) : !codeVerified ? (
                    <motion.div key='code' {...fade}>
                        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3'>Entrez le code</h1>
                        <p className='text-gray-600 mb-8 leading-relaxed'>
                            Copiez le code de vérification que vous avez reçu par email et collez-le ci-dessous.
                        </p>
                        {errorBox}
                        <form onSubmit={(e) => { e.preventDefault(); handleVerifyCode() }} className='space-y-6'>
                            <div>
                                <label htmlFor='reset-code' className={authLabelClass}>Code de vérification</label>
                                <textarea
                                    id='reset-code'
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    className={`${authInputClass} resize-none font-mono text-sm`}
                                    placeholder='Collez le code de vérification ici...'
                                    rows={3}
                                    aria-describedby='reset-code-help'
                                    autoFocus
                                    required
                                />
                                <p id='reset-code-help' className='text-xs text-gray-500 mt-1.5'>{"Le code se trouve dans le lien de l'email, après « oobCode= »."}</p>
                            </div>
                            <button type='submit' disabled={loading || !verificationCode.trim()} className={authPrimaryBtn}>
                                {loading ? 'Vérification...' : 'Vérifier le code'}
                            </button>
                        </form>
                        <p className='text-sm text-gray-600 text-center mt-6'>
                            {"Vous n'avez pas reçu le code ? "}
                            <button onClick={() => navigate('/forgot-password')} className='cursor-pointer font-semibold text-gray-900 underline underline-offset-4'>Renvoyer</button>
                        </p>
                    </motion.div>
                ) : (
                    <motion.div key='new-password' {...fade}>
                        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3'>Nouveau mot de passe</h1>
                        <p className='text-gray-600 mb-8 leading-relaxed'>
                            Choisissez un nouveau mot de passe pour votre compte <strong className='text-gray-900'>{email}</strong>.
                        </p>
                        {errorBox}
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {/* Champ caché pour que le gestionnaire de mots de passe associe le bon compte */}
                            <input type='email' value={email} autoComplete='username' readOnly hidden />
                            <div>
                                <label htmlFor='new-password' className={authLabelClass}>Nouveau mot de passe</label>
                                <div className='relative'>
                                    <input
                                        id='new-password'
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete='new-password'
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className={`${authInputClass} pr-12`}
                                        placeholder='6 caractères minimum'
                                        minLength={6}
                                        aria-describedby='new-password-help'
                                        autoFocus
                                        required
                                    />
                                    <button type='button' onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className={eyeBtn}>
                                        {showPassword ? (<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>) : (<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>)}
                                    </button>
                                </div>
                                <p id='new-password-help' className='text-xs text-gray-500 mt-1.5'>Au moins 6 caractères</p>
                            </div>
                            <div>
                                <label htmlFor='confirm-password' className={authLabelClass}>Confirmer le mot de passe</label>
                                <div className='relative'>
                                    <input
                                        id='confirm-password'
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        autoComplete='new-password'
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`${authInputClass} pr-12`}
                                        placeholder='Retapez le mot de passe'
                                        required
                                    />
                                    <button type='button' onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} className={eyeBtn}>
                                        {showConfirmPassword ? (<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' /></svg>) : (<svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' /><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' /></svg>)}
                                    </button>
                                </div>
                                {confirmPassword.length > 0 && (
                                    <p className={`text-xs mt-1.5 ${passwordsMatch ? 'text-green-700' : 'text-gray-500'}`} aria-live='polite'>
                                        {passwordsMatch ? 'Les mots de passe correspondent.' : 'Les mots de passe ne correspondent pas encore.'}
                                    </p>
                                )}
                            </div>
                            <button type='submit' disabled={loading} className={`${authPrimaryBtn} mt-6`}>
                                {loading && <span className='w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin' aria-hidden='true'></span>}
                                {loading ? 'Modification en cours...' : 'Modifier le mot de passe'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    )
}

export default ResetPassword
