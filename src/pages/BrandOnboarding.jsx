import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

const BrandOnboarding = () => {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [loading, setLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        budget: '',
        businessType: '',
        companySize: '',
        influencerTypes: [],
        platforms: []
    })

    const totalSteps = 5

    // Options pour chaque étape
    const budgetOptions = [
        'Moins de 1,000€',
        '1,000€ - 5,000€',
        '5,000€ - 10,000€',
        '10,000€ - 25,000€',
        '25,000€ - 50,000€',
        '50,000€+'
    ]

    const businessTypes = [
        { value: 'agency', label: 'Agence', icon: '🏢' },
        { value: 'ecommerce', label: 'E-commerce', icon: '🛒' },
        { value: 'website', label: 'Site Web/App', icon: '📱' },
        { value: 'local', label: 'Commerce Local', icon: '🏪' },
        { value: 'other', label: 'Autre', icon: '✨' }
    ]

    const companySizes = [
        'Juste moi',
        '2-10',
        '11-50',
        '51-500',
        '500+'
    ]

    const influencerCategories = [
        'Beauté',
        'Fashion',
        'Voyage',
        'Santé & Fitness',
        'Nourriture & Boisson',
        'Comédie & Divertissement',
        'Art & Photographie',
        'Famille & Enfants',
        'Musique & Danse',
        'Entrepreneur & Business',
        'Animaux & Animaux de compagnie',
        'Éducation',
        'Gaming',
        'Technologie',
        'Sports',
        'Lifestyle'
    ]

    const platformOptions = [
        { value: 'instagram', label: 'Instagram' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'ugc', label: 'Contenu Généré par les Utilisateurs' },
        { value: 'twitter', label: 'Twitter' },
        { value: 'twitch', label: 'Twitch' }
    ]

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSkip = () => {
        handleSubmit()
    }

    const handleSubmit = async () => {
        if (!currentUser) return

        setLoading(true)
        try {
            await updateDoc(doc(db, 'brands', currentUser.uid), {
                onboarding: {
                    completed: true,
                    budget: formData.budget,
                    businessType: formData.businessType,
                    companySize: formData.companySize,
                    influencerTypes: formData.influencerTypes,
                    platforms: formData.platforms,
                    completedAt: new Date().toISOString()
                }
            })

            navigate('/talents')
        } catch (error) {
            console.error('Error saving onboarding:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (field, value) => {
        setFormData(prev => {
            const currentValues = prev[field]
            if (currentValues.includes(value)) {
                return { ...prev, [field]: currentValues.filter(v => v !== value) }
            } else {
                return { ...prev, [field]: [...currentValues, value] }
            }
        })
    }

    const isStepValid = () => {
        switch (currentStep) {
            case 1:
                return formData.budget !== ''
            case 2:
                return formData.businessType !== ''
            case 3:
                return formData.companySize !== ''
            case 4:
                return formData.influencerTypes.length > 0
            case 5:
                return formData.platforms.length > 0
            default:
                return true
        }
    }

    return (
        <div className='min-h-screen bg-gray-50 py-8 px-4'>
            <div className='max-w-2xl mx-auto'>
                {/* Progress Bar */}
                <div className='mb-8'>
                    <div className='flex items-center justify-between mb-2'>
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className='text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                            </svg>
                        </button>
                        <span className='text-sm text-gray-600'>
                            Étape {currentStep} sur {totalSteps}
                        </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                            className='bg-primary rounded-full h-2 transition-all duration-300'
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className='bg-white rounded-2xl shadow-lg p-8 md:p-12'>
                    {/* Step 1: Budget */}
                    {currentStep === 1 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Quel est votre budget approximatif pour cette campagne ?
                            </h2>
                            <div className='space-y-3 mt-8'>
                                {budgetOptions.map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setFormData({ ...formData, budget: option })}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.budget === option
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className='flex items-center'>
                                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                                formData.budget === option ? 'border-gray-900' : 'border-gray-300'
                                            }`}>
                                                {formData.budget === option && (
                                                    <div className='w-3 h-3 rounded-full bg-gray-900' />
                                                )}
                                            </div>
                                            <span className='font-medium'>{option}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Business Type */}
                    {currentStep === 2 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Quel type d'entreprise êtes-vous ?
                            </h2>
                            <div className='space-y-3 mt-8'>
                                {businessTypes.map((type) => (
                                    <button
                                        key={type.value}
                                        onClick={() => setFormData({ ...formData, businessType: type.value })}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.businessType === type.value
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className='flex items-center'>
                                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                                formData.businessType === type.value ? 'border-gray-900' : 'border-gray-300'
                                            }`}>
                                                {formData.businessType === type.value && (
                                                    <div className='w-3 h-3 rounded-full bg-gray-900' />
                                                )}
                                            </div>
                                            <span className='text-2xl mr-3'>{type.icon}</span>
                                            <span className='font-medium'>{type.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Company Size */}
                    {currentStep === 3 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Combien de personnes travaillent dans votre entreprise ?
                            </h2>
                            <div className='space-y-3 mt-8'>
                                {companySizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setFormData({ ...formData, companySize: size })}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.companySize === size
                                                ? 'border-gray-900 bg-gray-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className='flex items-center'>
                                            <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                                                formData.companySize === size ? 'border-gray-900' : 'border-gray-300'
                                            }`}>
                                                {formData.companySize === size && (
                                                    <div className='w-3 h-3 rounded-full bg-gray-900' />
                                                )}
                                            </div>
                                            <span className='font-medium'>{size}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Influencer Types */}
                    {currentStep === 4 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Quel type d'influenceurs recherchez-vous ?
                            </h2>
                            <p className='text-gray-600 mb-6'>Sélectionnez toutes les catégories qui vous intéressent</p>
                            <div className='grid grid-cols-2 gap-3 mt-8'>
                                {influencerCategories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => toggleSelection('influencerTypes', category)}
                                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                                            formData.influencerTypes.includes(category)
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className='font-medium'>{category}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 5: Platforms */}
                    {currentStep === 5 && (
                        <div>
                            <h2 className='text-3xl font-bold mb-3'>
                                Quelle(s) plateforme(s) ciblez-vous ?
                            </h2>
                            <p className='text-gray-600 mb-6'>Sélectionnez une ou plusieurs plateformes</p>
                            <div className='space-y-3 mt-8'>
                                {platformOptions.map((platform) => (
                                    <button
                                        key={platform.value}
                                        onClick={() => toggleSelection('platforms', platform.value)}
                                        className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                                            formData.platforms.includes(platform.value)
                                                ? 'border-gray-900 bg-gray-900 text-white'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className='font-medium'>{platform.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className='mt-8 space-y-3'>
                        <button
                            onClick={handleNext}
                            disabled={!isStepValid() || loading}
                            className='w-full bg-gray-900 text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                            {loading ? 'Enregistrement...' : currentStep === totalSteps ? 'Terminer' : 'Continuer'}
                        </button>
                        {currentStep < totalSteps && (
                            <button
                                onClick={handleSkip}
                                className='w-full bg-white text-gray-900 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors border border-gray-200'
                            >
                                Passer
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className='text-center mt-6 text-sm text-gray-500'>
                    Ces informations nous aident à vous recommander les meilleurs influenceurs
                </div>
            </div>
        </div>
    )
}

export default BrandOnboarding
