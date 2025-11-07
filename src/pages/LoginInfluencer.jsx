import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginInfluencer = () => {
    const navigate = useNavigate()
    const { signUpInfluencer, signIn } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        phone: '',
        city: '',
        country: '',
        category: 'Fashion',
        instagram: '',
        tiktok: '',
        youtube: ''
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
                // Vérifier que les mots de passe correspondent
                if (formData.password !== formData.confirmPassword) {
                    setError('Les mots de passe ne correspondent pas')
                    setLoading(false)
                    return
                }

                // Vérifier la longueur du mot de passe
                if (formData.password.length < 6) {
                    setError('Le mot de passe doit contenir au moins 6 caractères')
                    setLoading(false)
                    return
                }

                // Inscription
                await signUpInfluencer(formData.email, formData.password, {
                    name: formData.name,
                    username: formData.username,
                    phone: formData.phone,
                    city: formData.city,
                    country: formData.country,
                    category: formData.category,
                    instagram: formData.instagram,
                    tiktok: formData.tiktok,
                    youtube: formData.youtube
                })

                alert('Compte créé avec succès !')
                navigate('/')
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
        <div className='min-h-screen flex items-center justify-center py-12 px-4'>
            <div className='max-w-md w-full bg-white rounded-xl shadow-lg p-8'>
                {/* Header */}
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        {isSignUp ? 'Créer un compte Influenceur' : 'Connexion Influenceur'}
                    </h1>
                    <p className='text-gray-600'>
                        {isSignUp ? 'Rejoignez notre communauté de créateurs' : 'Bon retour parmi nous !'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className='space-y-4'>
                    {/* Message d'erreur */}
                    {error && (
                        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg'>
                            {error}
                        </div>
                    )}

                    {isSignUp && (
                        <>
                            {/* Nom complet */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Nom complet
                                </label>
                                <input
                                    type='text'
                                    name='name'
                                    value={formData.name}
                                    onChange={handleChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                    placeholder='Votre nom complet'
                                    required
                                />
                            </div>

                            {/* Nom d'utilisateur */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Nom d'utilisateur
                                </label>
                                <input
                                    type='text'
                                    name='username'
                                    value={formData.username}
                                    onChange={handleChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                    placeholder='@votre_username'
                                    required
                                />
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Email
                        </label>
                        <input
                            type='email'
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                            placeholder='votre@email.com'
                            required
                        />
                    </div>

                    {isSignUp && (
                        <>
                            {/* Téléphone */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Téléphone
                                </label>
                                <input
                                    type='tel'
                                    name='phone'
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                    placeholder='+33 6 12 34 56 78'
                                    required
                                />
                            </div>

                            {/* Ville et Pays */}
                            <div className='grid grid-cols-2 gap-4'>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Ville
                                    </label>
                                    <input
                                        type='text'
                                        name='city'
                                        value={formData.city}
                                        onChange={handleChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                        placeholder='Paris'
                                        required
                                    />
                                </div>
                                <div>
                                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                                        Pays
                                    </label>
                                    <input
                                        type='text'
                                        name='country'
                                        value={formData.country}
                                        onChange={handleChange}
                                        className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                        placeholder='France'
                                        required
                                    />
                                </div>
                            </div>

                            {/* Catégorie */}
                            <div>
                                <label className='block text-sm font-medium text-gray-700 mb-1'>
                                    Catégorie principale
                                </label>
                                <select
                                    name='category'
                                    value={formData.category}
                                    onChange={handleChange}
                                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                    required
                                >
                                    <option value='Fashion'>Fashion</option>
                                    <option value='Beauty'>Beauty</option>
                                    <option value='Lifestyle'>Lifestyle</option>
                                    <option value='Gaming'>Gaming</option>
                                    <option value='Travel'>Travel</option>
                                    <option value='Food'>Food</option>
                                    <option value='Fitness'>Fitness</option>
                                    <option value='Tech'>Tech</option>
                                </select>
                            </div>

                            {/* Réseaux sociaux */}
                            <div className='border-t pt-4'>
                                <h3 className='text-sm font-semibold text-gray-700 mb-3'>Vos réseaux sociaux</h3>
                                
                                <div className='space-y-3'>
                                    {/* Instagram */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Instagram
                                        </label>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-gray-500'>@</span>
                                            <input
                                                type='text'
                                                name='instagram'
                                                value={formData.instagram}
                                                onChange={handleChange}
                                                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                                placeholder='votre_instagram'
                                            />
                                        </div>
                                    </div>

                                    {/* TikTok */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            TikTok
                                        </label>
                                        <div className='flex items-center gap-2'>
                                            <span className='text-gray-500'>@</span>
                                            <input
                                                type='text'
                                                name='tiktok'
                                                value={formData.tiktok}
                                                onChange={handleChange}
                                                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                                placeholder='votre_tiktok'
                                            />
                                        </div>
                                    </div>

                                    {/* YouTube */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            YouTube (optionnel)
                                        </label>
                                        <input
                                            type='text'
                                            name='youtube'
                                            value={formData.youtube}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='Nom de votre chaîne'
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Mot de passe */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Mot de passe
                        </label>
                        <input
                            type='password'
                            name='password'
                            value={formData.password}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                            placeholder='••••••••'
                            required
                        />
                    </div>

                    {isSignUp && (
                        <div>
                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                Confirmer le mot de passe
                            </label>
                            <input
                                type='password'
                                name='confirmPassword'
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                placeholder='••••••••'
                                required
                            />
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all mt-6 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                        {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte' : 'Se connecter')}
                    </button>
                </form>

                {/* Toggle Sign Up / Sign In */}
                <div className='mt-6 text-center'>
                    <p className='text-gray-600'>
                        {isSignUp ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className='text-primary font-semibold ml-2 hover:underline'
                        >
                            {isSignUp ? 'Se connecter' : "S'inscrire"}
                        </button>
                    </p>
                </div>

                {/* Link to Brand Login */}
                <div className='mt-4 text-center'>
                    <p className='text-sm text-gray-500'>
                        Vous êtes une marque ?
                        <button
                            onClick={() => navigate('/login-brand')}
                            className='text-primary font-medium ml-2 hover:underline'
                        >
                            Connexion marque
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginInfluencer
