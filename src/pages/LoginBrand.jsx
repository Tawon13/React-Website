import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginBrand = () => {
    const navigate = useNavigate()
    const { signUpBrand, signIn } = useAuth()
    const [isSignUp, setIsSignUp] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        companyName: '',
        brandName: '',
        email: '',
        password: '',
        confirmPassword: '',
        contactPerson: '',
        phone: '',
        website: '',
        industry: 'Fashion',
        companySize: '1-10',
        address: '',
        city: '',
        country: '',
        siret: '',
        description: ''
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
                await signUpBrand(formData.email, formData.password, {
                    companyName: formData.companyName,
                    brandName: formData.brandName,
                    siret: formData.siret,
                    industry: formData.industry,
                    companySize: formData.companySize,
                    description: formData.description,
                    contactPerson: formData.contactPerson,
                    phone: formData.phone,
                    website: formData.website,
                    address: formData.address,
                    city: formData.city,
                    country: formData.country
                })

                alert('Compte entreprise créé avec succès !')
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
            <div className='max-w-2xl w-full bg-white rounded-xl shadow-lg p-8'>
                {/* Header */}
                <div className='text-center mb-8'>
                    <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                        {isSignUp ? 'Créer un compte Marque' : 'Connexion Marque'}
                    </h1>
                    <p className='text-gray-600'>
                        {isSignUp ? 'Commencez à collaborer avec nos influenceurs' : 'Bienvenue !'}
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
                            {/* Informations entreprise */}
                            <div className='border-b pb-4'>
                                <h3 className='text-lg font-semibold text-gray-800 mb-4'>Informations entreprise</h3>
                                
                                <div className='space-y-4'>
                                    {/* Nom de l'entreprise */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Nom de l'entreprise
                                        </label>
                                        <input
                                            type='text'
                                            name='companyName'
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='Nom officiel de votre entreprise'
                                            required
                                        />
                                    </div>

                                    {/* Nom de marque */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Nom de marque
                                        </label>
                                        <input
                                            type='text'
                                            name='brandName'
                                            value={formData.brandName}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='Nom commercial de votre marque'
                                            required
                                        />
                                    </div>

                                    {/* SIRET */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Numéro SIRET
                                        </label>
                                        <input
                                            type='text'
                                            name='siret'
                                            value={formData.siret}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='14 chiffres'
                                            required
                                        />
                                    </div>

                                    {/* Industrie et taille */}
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                                Secteur d'activité
                                            </label>
                                            <select
                                                name='industry'
                                                value={formData.industry}
                                                onChange={handleChange}
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                                required
                                            >
                                                <option value='Fashion'>Mode</option>
                                                <option value='Beauty'>Beauté</option>
                                                <option value='Tech'>Technologie</option>
                                                <option value='Food'>Alimentation</option>
                                                <option value='Travel'>Voyage</option>
                                                <option value='Sports'>Sport</option>
                                                <option value='Home'>Maison & Déco</option>
                                                <option value='Other'>Autre</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className='block text-sm font-medium text-gray-700 mb-1'>
                                                Taille de l'entreprise
                                            </label>
                                            <select
                                                name='companySize'
                                                value={formData.companySize}
                                                onChange={handleChange}
                                                className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                                required
                                            >
                                                <option value='1-10'>1-10 employés</option>
                                                <option value='11-50'>11-50 employés</option>
                                                <option value='51-200'>51-200 employés</option>
                                                <option value='201-500'>201-500 employés</option>
                                                <option value='500+'>500+ employés</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Description de votre marque
                                        </label>
                                        <textarea
                                            name='description'
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows='3'
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='Décrivez votre marque en quelques mots...'
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Informations de contact */}
                            <div className='border-b pb-4'>
                                <h3 className='text-lg font-semibold text-gray-800 mb-4'>Informations de contact</h3>
                                
                                <div className='space-y-4'>
                                    {/* Personne de contact */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Nom du contact principal
                                        </label>
                                        <input
                                            type='text'
                                            name='contactPerson'
                                            value={formData.contactPerson}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='Prénom Nom'
                                            required
                                        />
                                    </div>

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
                                            placeholder='+33 1 23 45 67 89'
                                            required
                                        />
                                    </div>

                                    {/* Site web */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Site web
                                        </label>
                                        <input
                                            type='url'
                                            name='website'
                                            value={formData.website}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='https://www.votresite.com'
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Adresse */}
                            <div className='pb-4'>
                                <h3 className='text-lg font-semibold text-gray-800 mb-4'>Adresse du siège</h3>
                                
                                <div className='space-y-4'>
                                    {/* Adresse */}
                                    <div>
                                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                                            Adresse
                                        </label>
                                        <input
                                            type='text'
                                            name='address'
                                            value={formData.address}
                                            onChange={handleChange}
                                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                                            placeholder='Numéro et nom de rue'
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
                                </div>
                            </div>
                        </>
                    )}

                    {/* Email */}
                    <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                            Email professionnel
                        </label>
                        <input
                            type='email'
                            name='email'
                            value={formData.email}
                            onChange={handleChange}
                            className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent'
                            placeholder='contact@votreentreprise.com'
                            required
                        />
                    </div>

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
                        {loading ? 'Chargement...' : (isSignUp ? 'Créer mon compte entreprise' : 'Se connecter')}
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

                {/* Link to Influencer Login */}
                <div className='mt-4 text-center'>
                    <p className='text-sm text-gray-500'>
                        Vous êtes un influenceur ?
                        <button
                            onClick={() => navigate('/login-influencer')}
                            className='text-primary font-medium ml-2 hover:underline'
                        >
                            Connexion influenceur
                        </button>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default LoginBrand
