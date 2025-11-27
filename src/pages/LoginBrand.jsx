import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginBrand = () => {
    const navigate = useNavigate()
    const { signUpBrand, signIn } = useAuth()
    const [isSignUp, setIsSignUp] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPassword, setShowPassword] = useState(false)
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
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
        <div className='min-h-screen flex items-center justify-center py-12 px-4 bg-gray-50'>
            <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8'>
                {/* Header */}
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        {isSignUp ? 'Créer votre compte' : 'Connexion'}
                    </h1>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Message d'erreur */}
                    {error && (
                        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm'>
                            {error}
                        </div>
                    )}

                    {isSignUp && (
                        <>
                            {/* Google Sign Up */}
                            <button
                                type='button'
                                className='w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                            >
                                <svg className='w-5 h-5' viewBox='0 0 24 24'>
                                    <path fill='#4285F4' d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'/>
                                    <path fill='#34A853' d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'/>
                                    <path fill='#FBBC05' d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'/>
                                    <path fill='#EA4335' d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'/>
                                </svg>
                                <span className='font-medium'>S'inscrire avec Google</span>
                            </button>

                            {/* Apple Sign Up */}
                            <button
                                type='button'
                                className='w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                            >
                                <svg className='w-5 h-5' viewBox='0 0 24 24' fill='currentColor'>
                                    <path d='M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z'/>
                                </svg>
                                <span className='font-medium'>S'inscrire avec Apple</span>
                            </button>

                            {/* Divider */}
                            <div className='relative my-6'>
                                <div className='absolute inset-0 flex items-center'>
                                    <div className='w-full border-t border-gray-300'></div>
                                </div>
                                <div className='relative flex justify-center text-sm'>
                                    <span className='px-2 bg-white text-gray-500'>ou</span>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div>
                                <input
                                    type='text'
                                    name='fullName'
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                    placeholder='Nom complet'
                                    required
                                />
                            </div>

                            {/* Brand Name */}
                            <div>
                                <input
                                    type='text'
                                    name='brandName'
                                    value={formData.brandName}
                                    onChange={handleChange}
                                    className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                                    placeholder='Nom de marque'
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div>
                        <input
                            type='email'
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent'
                            placeholder='Email'
                            required
                        />
                    </div>

                    {/* Password */}
                    <div className='relative'>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name='password'
                            value={formData.password}
                            onChange={handleChange}
                            className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-10'
                            placeholder='Mot de passe'
                            required
                        />
                        <button
                            type='button'
                            onClick={() => setShowPassword(!showPassword)}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                        >
                            {showPassword ? (
                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' />
                                </svg>
                            ) : (
                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Submit Button */}
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading ? 'Chargement...' : (isSignUp ? 'S\'inscrire' : 'Se connecter')}
                    </button>

                    {/* Terms */}
                    {isSignUp && (
                        <p className='text-xs text-center text-gray-500 mt-4'>
                            En vous inscrivant, vous acceptez nos {' '}
                            <button
                                type='button'
                                onClick={() => navigate('/terms')}
                                className='text-gray-700 hover:underline'
                            >
                                Conditions d'Utilisation
                            </button>
                            {' '}et{' '}
                            <button
                                type='button'
                                onClick={() => navigate('/privacy')}
                                className='text-gray-700 hover:underline'
                            >
                                Politique de Confidentialité
                            </button>
                            .
                        </p>
                    )}
                </form>

                {/* Toggle Sign Up / Sign In */}
                <div className='mt-6 text-center'>
                    <p className='text-sm text-gray-600'>
                        {isSignUp ? 'Vous avez déjà un compte ?' : 'Vous n\'avez pas de compte ?'}
                        {' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className='text-gray-900 font-medium hover:underline'
                        >
                            {isSignUp ? 'Se connecter' : 'S\'inscrire'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginBrand
