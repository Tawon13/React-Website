import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { auth } from '../config/firebase'
import socialMediaImage from '../assets/social_media_login.jpg'

const ResetPassword = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const location = useLocation()
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
                navigate('/login-influencer')
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

    return (
        <div className='min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-orange-400 via-orange-500 to-red-500'>
            {/* Main Container */}
            <div className='w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row'>
                {/* Left Side - Image */}
                <div className='hidden lg:flex lg:w-1/2 p-8'>
                    <div className='w-full h-full rounded-2xl overflow-hidden'>
                        <img 
                            src={socialMediaImage} 
                            alt='Social Media' 
                            className='w-full h-full object-cover'
                        />
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className='w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12'>
                    <div className='w-full max-w-md'>
                        {verifying ? (
                            <div className='text-center py-12'>
                                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto'></div>
                                <p className='mt-4 text-gray-600'>Vérification du code...</p>
                            </div>
                        ) : success ? (
                            <div className='text-center'>
                                <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                    <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                    </svg>
                                </div>
                                <h1 className='text-3xl font-bold text-gray-900 mb-2'>Mot de passe modifié !</h1>
                                <p className='text-gray-600 mb-6'>
                                    Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
                                </p>
                            </div>
                        ) : !codeVerified ? (
                            <>
                                {/* Back Button */}
                                <button 
                                    onClick={() => navigate('/forgot-password')}
                                    className='mb-6 text-gray-600 hover:text-gray-900 transition-colors'
                                >
                                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                                    </svg>
                                </button>

                                {/* Title */}
                                <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-2'>
                                    Entrez le code
                                </h1>
                                <p className='text-gray-600 mb-8'>
                                    Copiez le code de vérification que vous avez reçu par email et collez-le ci-dessous
                                </p>

                                {/* Error Message */}
                                {error && (
                                    <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm'>
                                        {error}
                                    </div>
                                )}

                                {/* Code Input */}
                                <div className='mb-6'>
                                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                                        Code de vérification
                                    </label>
                                    <textarea
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value)}
                                        className='w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none font-mono text-sm'
                                        placeholder='Collez le code de vérification ici...'
                                        rows={3}
                                        required
                                    />
                                    <p className='text-xs text-gray-500 mt-2'>
                                        Le code commence généralement par "AIw..."
                                    </p>
                                </div>

                                {/* Verify Button */}
                                <button
                                    onClick={handleVerifyCode}
                                    disabled={loading || !verificationCode.trim()}
                                    className='w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4'
                                >
                                    {loading ? 'Vérification...' : 'Vérifier le code'}
                                </button>

                                {/* Resend Link */}
                                <div className='text-center'>
                                    <p className='text-sm text-gray-600'>
                                        Vous n'avez pas reçu le code ?{' '}
                                        <button
                                            onClick={() => navigate('/forgot-password')}
                                            className='text-gray-900 font-semibold hover:underline'
                                        >
                                            Renvoyer
                                        </button>
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Back Button */}
                                <button 
                                    onClick={() => navigate('/login-influencer')}
                                    className='mb-6 text-gray-600 hover:text-gray-900 transition-colors'
                                >
                                    <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                                    </svg>
                                </button>

                                {/* Title */}
                                <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-2'>
                                    Nouveau mot de passe
                                </h1>
                                <p className='text-gray-600 mb-8'>
                                    Choisissez un nouveau mot de passe pour votre compte {email}
                                </p>

                                {/* Error Message */}
                                {error && (
                                    <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm'>
                                        {error}
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className='space-y-4'>
                                    {/* New Password */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Nouveau mot de passe
                                        </label>
                                        <div className='relative'>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                                placeholder='Entrez votre nouveau mot de passe'
                                                required
                                            />
                                            <button
                                                type='button'
                                                onClick={() => setShowPassword(!showPassword)}
                                                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                            >
                                                {showPassword ? (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                    </svg>
                                                ) : (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                        <p className='text-xs text-gray-500 mt-1'>Au moins 6 caractères</p>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Confirmer le mot de passe
                                        </label>
                                        <div className='relative'>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                                placeholder='Confirmez votre mot de passe'
                                                required
                                            />
                                            <button
                                                type='button'
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                                            >
                                                {showConfirmPassword ? (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                                    </svg>
                                                ) : (
                                                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type='submit'
                                        disabled={loading}
                                        className='w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6'
                                    >
                                        {loading ? 'Modification en cours...' : 'Modifier le mot de passe'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ResetPassword
