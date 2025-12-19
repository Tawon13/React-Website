import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../config/firebase'
import socialMediaImage from '../assets/social_media_login.jpg'

const ForgotPassword = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            await sendPasswordResetEmail(auth, email)
            setSuccess(true)
        } catch (error) {
            console.error('Password reset error:', error)
            
            switch (error.code) {
                case 'auth/user-not-found':
                    setError('Aucun compte trouvé avec cet email')
                    break
                case 'auth/invalid-email':
                    setError('Email invalide')
                    break
                case 'auth/too-many-requests':
                    setError('Trop de tentatives. Veuillez réessayer plus tard')
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
                            onClick={() => navigate('/login-influencer')}
                            className='mb-6 text-gray-600 hover:text-gray-900 transition-colors'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                        </button>

                        {!success ? (
                            <>
                                {/* Title */}
                                <h1 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-2'>
                                    Mot de passe oublié ?
                                </h1>
                                <p className='text-gray-600 mb-8'>
                                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                                </p>

                                {/* Error Message */}
                                {error && (
                                    <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm'>
                                        {error}
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleSubmit} className='space-y-6'>
                                    {/* Email */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-2'>
                                            Adresse email
                                        </label>
                                        <input
                                            type='email'
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className='w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all'
                                            placeholder='votre@email.com'
                                            required
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        type='submit'
                                        disabled={loading}
                                        className='w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                                    >
                                        {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                                    </button>
                                </form>

                                {/* Back to Login */}
                                <div className='mt-6 text-center'>
                                    <button
                                        onClick={() => navigate('/login-influencer')}
                                        className='text-sm text-gray-600 hover:text-gray-900 transition-colors'
                                    >
                                        Retour à la connexion
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Success Message */}
                                <div className='text-center'>
                                    <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                        <svg className='w-8 h-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                                        </svg>
                                    </div>
                                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                                        Email envoyé !
                                    </h1>
                                    <p className='text-gray-600 mb-4'>
                                        Nous avons envoyé un email avec un code de vérification à <strong>{email}</strong>.
                                    </p>
                                    <div className='bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-left'>
                                        <p className='font-semibold text-sm text-gray-900 mb-2'>Deux options :</p>
                                        <ul className='space-y-2 text-sm text-gray-700'>
                                            <li className='flex items-start'>
                                                <span className='mr-2'>1.</span>
                                                <span>Cliquez sur le lien dans l'email</span>
                                            </li>
                                            <li className='flex items-start'>
                                                <span className='mr-2'>2.</span>
                                                <span>Ou copiez le code de vérification et entrez-le ci-dessous</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => navigate('/reset-password')}
                                        className='w-full bg-gray-900 text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition-all mb-3'
                                    >
                                        Entrer le code manuellement
                                    </button>
                                    <button
                                        onClick={() => navigate('/login-influencer')}
                                        className='w-full bg-white border-2 border-gray-900 text-gray-900 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all'
                                    >
                                        Retour à la connexion
                                    </button>
                                    <p className='text-sm text-gray-500 mt-4'>
                                        Vous n'avez pas reçu l'email ?{' '}
                                        <button
                                            onClick={() => setSuccess(false)}
                                            className='text-gray-900 font-semibold underline hover:text-primary transition-colors'
                                        >
                                            Renvoyer
                                        </button>
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPassword
