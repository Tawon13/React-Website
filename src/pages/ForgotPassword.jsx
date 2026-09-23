import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../config/firebase'
import { AnimatePresence, motion } from 'motion/react'
import AuthLayout, { authInputClass, authLabelClass, authPrimaryBtn, authSecondaryBtn } from '../components/AuthLayout'
import SEO from '../components/SEO'

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

    const fade = { initial: { opacity: 0, x: 24 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -24 }, transition: { duration: 0.3 } }

    return (
        <AuthLayout panel='recovery' backLabel='Retour à la connexion' onBack={() => navigate('/login')}>
            <SEO title='Mot de passe oublié' noindex />
            <AnimatePresence mode='wait'>
                {!success ? (
                    <motion.div key='form' {...fade}>
                        <div className='w-14 h-14 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mb-6'>
                            <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' /></svg>
                        </div>
                        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3'>Mot de passe oublié ?</h1>
                        <p className='text-gray-600 mb-8 leading-relaxed'>
                            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                        </p>

                        {error && (
                            <div role='alert' className='mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm'>{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className='space-y-6'>
                            <div>
                                <label htmlFor='reset-email' className={authLabelClass}>Adresse email</label>
                                <input
                                    id='reset-email'
                                    type='email'
                                    autoComplete='email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={authInputClass}
                                    placeholder='nom@exemple.com'
                                    autoFocus
                                    required
                                />
                            </div>
                            <button type='submit' disabled={loading} className={authPrimaryBtn}>
                                {loading && <span className='w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin' aria-hidden='true'></span>}
                                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                            </button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div key='sent' {...fade}>
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                            className='w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center mb-6'
                        >
                            <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' /></svg>
                        </motion.div>
                        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3'>Email envoyé !</h1>
                        <p className='text-gray-600 mb-6 leading-relaxed' role='status'>
                            Nous avons envoyé un email à <strong className='text-gray-900'>{email}</strong>.
                        </p>
                        <ol className='rounded-2xl bg-gray-50 border border-gray-200 p-5 mb-8 space-y-3 text-sm text-gray-700'>
                            <li className='flex gap-3'>
                                <span className='w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0'>1</span>
                                {"Cliquez sur le lien dans l'email,"}
                            </li>
                            <li className='flex gap-3'>
                                <span className='w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0'>2</span>
                                ou copiez le code de vérification et saisissez-le manuellement.
                            </li>
                        </ol>
                        <div className='space-y-3'>
                            <button onClick={() => navigate('/reset-password')} className={authPrimaryBtn}>Entrer le code manuellement</button>
                            <button onClick={() => navigate('/login')} className={authSecondaryBtn}>Retour à la connexion</button>
                        </div>
                        <p className='text-sm text-gray-500 mt-6 text-center'>
                            {"Vous n'avez pas reçu l'email ? Pensez à vérifier vos spams, ou "}
                            <button onClick={() => setSuccess(false)} className='cursor-pointer font-semibold text-gray-900 underline underline-offset-4'>renvoyez-le</button>.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </AuthLayout>
    )
}

export default ForgotPassword
