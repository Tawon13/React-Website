import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { INFLUENCER_CATEGORIES } from '../constants/categories'
import { BUDGET_OPTIONS } from '../constants/budget'
import OnboardingLayout, { StepTitle, OptionButton, onboardingPrimaryBtn, onboardingSecondaryBtn } from '../components/OnboardingLayout'

const BrandOnboarding = () => {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [currentStep, setCurrentStep] = useState(1)
    const [direction, setDirection] = useState(1)
    const [loading, setLoading] = useState(false)
    
    const [formData, setFormData] = useState({
        budget: '',
        businessType: '',
        companySize: '',
        influencerTypes: []
    })

    const totalSteps = 4

    // Options pour chaque étape
    const budgetOptions = BUDGET_OPTIONS

    const businessTypes = [
        { value: 'agency', label: 'Agence', description: 'Vous gérez des campagnes pour des clients', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
        { value: 'ecommerce', label: 'E-commerce', description: 'Vous vendez des produits en ligne', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
        { value: 'website', label: 'Site web / App', description: 'Vous proposez un service numérique', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
        { value: 'local', label: 'Commerce local', description: 'Restaurant, boutique, salon…', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z' },
        { value: 'other', label: 'Autre', description: 'Un autre type d’activité', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' }
    ]

    const companySizes = [
        'Juste moi',
        '2-10',
        '11-50',
        '51-500',
        '500+'
    ]

    const influencerCategories = INFLUENCER_CATEGORIES

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setDirection(1)
            setCurrentStep(currentStep + 1)
        } else {
            handleSubmit()
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1)
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
                    completedAt: new Date().toISOString()
                }
            })

            navigate('/talents', {
                state: {
                    budget: formData.budget,
                    influencerTypes: formData.influencerTypes,
                    highlightRecommended: true
                }
            })
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
            default:
                return true
        }
    }

    return (
        <OnboardingLayout
            title='Bienvenue sur Collabzz'
            step={currentStep}
            totalSteps={totalSteps}
            direction={direction}
            onBack={handleBack}
            actions={
                <>
                    {currentStep < totalSteps && (
                        <button type='button' onClick={handleSkip} disabled={loading} className={onboardingSecondaryBtn}>
                            Passer et voir les talents
                        </button>
                    )}
                    <button type='button' onClick={handleNext} disabled={!isStepValid() || loading} className={onboardingPrimaryBtn}>
                        {loading && <span className='w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin' aria-hidden='true'></span>}
                        {loading ? 'Enregistrement...' : currentStep === totalSteps ? 'Voir mes recommandations' : 'Continuer'}
                    </button>
                </>
            }
        >
            {currentStep === 1 && (
                <>
                    <StepTitle eyebrow='Votre campagne' title='Quel est votre budget approximatif pour cette campagne ?' text='Nous vous proposerons des créateurs dont le tarif correspond.' />
                    <div role='radiogroup' aria-label='Budget' className='grid sm:grid-cols-2 gap-3'>
                        {budgetOptions.map((option) => (
                            <OptionButton key={option} label={option} selected={formData.budget === option} onClick={() => setFormData({ ...formData, budget: option })} />
                        ))}
                    </div>
                </>
            )}

            {currentStep === 2 && (
                <>
                    <StepTitle eyebrow='Votre entreprise' title={"Quel type d'entreprise êtes-vous ?"} />
                    <div role='radiogroup' aria-label="Type d'entreprise" className='space-y-3'>
                        {businessTypes.map((type) => (
                            <OptionButton
                                key={type.value}
                                icon={type.icon}
                                label={type.label}
                                description={type.description}
                                selected={formData.businessType === type.value}
                                onClick={() => setFormData({ ...formData, businessType: type.value })}
                            />
                        ))}
                    </div>
                </>
            )}

            {currentStep === 3 && (
                <>
                    <StepTitle eyebrow='Votre entreprise' title='Combien de personnes travaillent dans votre entreprise ?' />
                    <div role='radiogroup' aria-label="Taille de l'entreprise" className='grid sm:grid-cols-2 gap-3'>
                        {companySizes.map((size) => (
                            <OptionButton key={size} label={size === 'Juste moi' ? size : `${size} personnes`} selected={formData.companySize === size} onClick={() => setFormData({ ...formData, companySize: size })} />
                        ))}
                    </div>
                </>
            )}

            {currentStep === 4 && (
                <>
                    <StepTitle eyebrow='Vos créateurs' title={"Quel type d'influenceurs recherchez-vous ?"} text='Sélectionnez toutes les catégories qui vous intéressent.' />
                    <div role='group' aria-label="Catégories d'influenceurs" className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                        {influencerCategories.map((category) => (
                            <OptionButton
                                key={category}
                                multiple
                                compact
                                label={category}
                                selected={formData.influencerTypes.includes(category)}
                                onClick={() => toggleSelection('influencerTypes', category)}
                            />
                        ))}
                    </div>
                    <p className='text-sm text-gray-500 mt-6' aria-live='polite'>
                        {formData.influencerTypes.length > 0
                            ? `${formData.influencerTypes.length} catégorie${formData.influencerTypes.length > 1 ? 's' : ''} sélectionnée${formData.influencerTypes.length > 1 ? 's' : ''}`
                            : 'Ces informations nous aident à vous recommander les meilleurs influenceurs.'}
                    </p>
                </>
            )}
        </OnboardingLayout>
    )
}

export default BrandOnboarding
