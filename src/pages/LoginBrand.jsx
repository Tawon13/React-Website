import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import socialMediaImage from '../assets/social_media_login.jpg'

const LoginBrand = () => {
    const navigate = useNavigate()
    const { signUpBrand, signIn, signInWithGoogle, signInWithFacebook } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    const [formData, setFormData] = useState({
        fullName: '',
        brandName: '',
        email: '',
        password: ''
    })

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
            await signInWithGoogle(false) // false = brand
            navigate('/')
        } catch (error) {
            console.error('Google sign in error:', error)
            setError('Erreur lors de la connexion avec Google')
        } finally {
            setLoading(false)
        }
    }

    const handleFacebookSignIn = async () => {
        setError('')
        setLoading(true)
        try {
            await signInWithFacebook(false) // false = brand
            navigate('/')
        } catch (error) {
            console.error('Facebook sign in error:', error)
            setError('Erreur lors de la connexion avec Facebook')
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
                // Vérifier la longueur du mot de passe
                if (formData.password.length < 6) {
                    setError('Le mot de passe doit contenir au moins 6 caractères')
                    setLoading(false)
                    return
                }

                // Inscription
                await signUpBrand(formData.email, formData.password, {
                    fullName: formData.fullName,
                    brandName: formData.brandName
                })

                alert('Compte créé avec succès !')
                // Rediriger vers l'onboarding après l'inscription
                navigate('/brand-onboarding')
            } else {
                // Connexion
                await signIn(formData.email, formData.password)
                navigate('/')
            }
        } catch (error) {
            console.error('Error:', error)
            
            // Gestion des erreurs Firebase
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
                        {/* Back Button */}
                        <button 
                            onClick={() => navigate('/')}
                            className='mb-6 text-gray-600 hover:text-gray-900 transition-colors'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                        </button>

                        {/* Title */}
                        <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-2'>
                            {isSignUp ? 'Créer un compte' : 'Connexion'}
                        </h1>
                        <p className='text-gray-600 mb-8'>
                            {isSignUp ? (
                                <>
                                    Déjà membre ?{' '}
                                    <button
                                        type='button'
                                        onClick={() => setIsSignUp(false)}
                                        className='text-gray-900 font-semibold hover:underline'
                                    >
                                        Se connecter
                                    </button>
                                </>
                            ) : (
                                <>
                                    Nouveau sur Collabzz ?{' '}
                                    <button
                                        type='button'
                                        onClick={() => setIsSignUp(true)}
                                        className='text-gray-900 font-semibold hover:underline'
                                    >
                                        Créer un compte
                                    </button>
                                </>
                            )}
                        </p>

                        {/* Error Message */}
                        {error && (
                            <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm'>
                                {error}
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className='space-y-4'>
                            {isSignUp && (
                                <>
                                    {/* Full Name */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Nom complet
                                        </label>
                                        <input
                                            type='text'
                                            name='fullName'
                                            value={formData.fullName}
                                            onChange={handleChange}
                                            className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                            placeholder='John Doe'
                                            required
                                        />
                                    </div>

                                    {/* Brand Name */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Nom de la marque
                                        </label>
                                        <input
                                            type='text'
                                            name='brandName'
                                            value={formData.brandName}
                                            onChange={handleChange}
                                            className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                            placeholder='Ma Marque'
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* Email */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Email
                                </label>
                                <input
                                    type='email'
                                    name='email'
                                    value={formData.email}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                    placeholder='votre@email.com'
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-2'>
                                    Mot de passe
                                </label>
                                <div className='relative'>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name='password'
                                        value={formData.password}
                                        onChange={handleChange}
                                        className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                        placeholder='••••••••'
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
                            </div>

                        {/* Divider */}
                        <div className='relative my-6'>
                            <div className='absolute inset-0 flex items-center'>
                                <div className='w-full border-t border-gray-300'></div>
                            </div>
                            <div className='relative flex justify-center text-sm'>
                                <span className='px-4 bg-white text-gray-500'>ou</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className='space-y-3 mb-6'>
                            {/* Google Button */}
                            <button
                                type='button'
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className='w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <svg className='w-5 h-5' viewBox='0 0 24 24'>
                                    <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                                    <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                                    <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
                                    <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
                                </svg>
                                <span>Continuer avec Google</span>
                            </button>

                            {/* Facebook Button */}
                            <button
                                type='button'
                                onClick={handleFacebookSignIn}
                                disabled={loading}
                                className='w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-full hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                <svg className='w-5 h-5' fill='#1877F2' viewBox='0 0 24 24'>
                                    <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z'/>
                                </svg>
                                <span>Continuer avec Facebook</span>
                            </button>
                        </div>

                            {/* Forgot Password - Only on Login */}
                            {!isSignUp && (
                                <div className='text-right'>
                                    <button
                                        type='button'
                                        onClick={() => navigate('/forgot-password')}
                                        className='text-sm text-gray-600 hover:text-gray-900 hover:underline'
                                    >
                                        Mot de passe oublié ?
                                    </button>
                                </div>
                            )}

                            {/* Terms Checkbox - Only on Sign Up */}
                            {isSignUp && (
                                <div className='flex items-start gap-2'>
                                    <input
                                        type='checkbox'
                                        id='terms'
                                        checked={agreedToTerms}
                                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                                        className='mt-1 w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900'
                                        required
                                    />
                                    <label htmlFor='terms' className='text-sm text-gray-600'>
                                        J'accepte les{' '}
                                        <button
                                            type='button'
                                            onClick={() => navigate('/terms')}
                                            className='text-gray-900 hover:underline'
                                        >
                                            conditions d'utilisation
                                        </button>
                                        {' '}et la{' '}
                                        <button
                                            type='button'
                                            onClick={() => navigate('/privacy')}
                                            className='text-gray-900 hover:underline'
                                        >
                                            politique de confidentialité
                                        </button>
                                    </label>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type='submit'
                                disabled={loading}
                                className='w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                            >
                                {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoginBrand
