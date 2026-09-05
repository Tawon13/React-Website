import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../context/AuthContext'
import { AppContext } from '../context/AppContext'
import { getBudgetRange } from '../constants/budget'
import SEO from '../components/SEO'

// Choisit le meilleur influenceur disponible pour une marque, en assouplissant les
// critères par étapes s'il n'y a pas de match parfait (niche + budget) : niche seule,
// puis budget seul, puis n'importe quel influenceur en dernier recours.
const pickBestMatch = (doctors, { budget, influencerTypes = [] } = {}) => {
    if (doctors.length === 0) return null

    const { max: budgetMax } = getBudgetRange(budget)
    const inBudget = (list) => list.filter((d) => Number(d.fees) <= budgetMax)
    const inCategory = influencerTypes.length > 0
        ? doctors.filter((d) => influencerTypes.includes(d.speciality))
        : []

    const pool = [inBudget(inCategory), inCategory, inBudget(doctors), doctors]
        .find((list) => list.length > 0) || []

    if (pool.length === 0) return null

    return [...pool].sort((a, b) => (b.followers?.tiktok || 0) - (a.followers?.tiktok || 0))[0]
}

const BrandRecommendation = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentUser } = useAuth()
    const { doctors, doctorsLoading } = useContext(AppContext)

    const [criteria, setCriteria] = useState(location.state || null)
    const [loadingCriteria, setLoadingCriteria] = useState(!location.state)

    // Si la page est ouverte directement (pas juste après l'onboarding), on relit les
    // critères enregistrés sur le profil de la marque.
    useEffect(() => {
        if (criteria || !currentUser) {
            setLoadingCriteria(false)
            return
        }

        const loadCriteria = async () => {
            try {
                const snap = await getDoc(doc(db, 'brands', currentUser.uid))
                const onboarding = snap.exists() ? snap.data()?.onboarding : null
                setCriteria({
                    budget: onboarding?.budget || '',
                    influencerTypes: onboarding?.influencerTypes || []
                })
            } catch (error) {
                console.error('Erreur lors du chargement des critères:', error)
                setCriteria({ budget: '', influencerTypes: [] })
            } finally {
                setLoadingCriteria(false)
            }
        }

        loadCriteria()
    }, [criteria, currentUser])

    const bestMatch = useMemo(() => pickBestMatch(doctors, criteria || {}), [doctors, criteria])
    const isLoading = loadingCriteria || doctorsLoading

    return (
        <div className='min-h-screen bg-gray-50 py-12 px-4'>
            <SEO title='Notre recommandation' noindex />
            <div className='max-w-xl mx-auto text-center'>
                {isLoading ? (
                    <div className='py-24'>
                        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
                    </div>
                ) : bestMatch ? (
                    <>
                        <h1 className='text-3xl font-bold text-gray-900 mb-3'>
                            Cet influenceur semble parfait par rapport à vos critères !
                        </h1>
                        <p className='text-gray-600 mb-8'>
                            En fonction de votre budget et de votre niche, voici notre recommandation.
                        </p>

                        <div
                            onClick={() => navigate(`/influencer/${bestMatch._id}`)}
                            className='bg-white rounded-2xl shadow-lg overflow-hidden text-left hover:shadow-xl transition-shadow mb-6 cursor-pointer'
                        >
                            <img
                                src={bestMatch.image}
                                alt={bestMatch.tiktokUsername ? `@${bestMatch.tiktokUsername}` : 'Influenceur'}
                                className='w-full h-72 object-cover'
                            />
                            <div className='p-6'>
                                {bestMatch.tiktokUsername && (
                                    <p className='text-xl font-semibold text-gray-900'>@{bestMatch.tiktokUsername}</p>
                                )}
                                <p className='text-gray-600 mt-1'>{bestMatch.speciality}</p>
                                <p className='text-primary text-lg font-semibold mt-3'>{bestMatch.fees}€ / vidéo</p>

                                <span className='inline-flex items-center gap-1.5 text-primary font-semibold mt-4'>
                                    Voir son profil
                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 8l4 4m0 0l-4 4m4-4H3' />
                                    </svg>
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/talents')}
                            className='w-full bg-white text-gray-900 py-3 rounded-full font-semibold border border-gray-200 hover:bg-gray-50 transition-colors'
                        >
                            Découvrir les autres profils disponibles
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className='text-3xl font-bold text-gray-900 mb-3'>
                            Pas encore d'influenceur disponible pour ces critères
                        </h1>
                        <p className='text-gray-600 mb-8'>
                            Découvrez dès maintenant l'ensemble de nos créateurs disponibles.
                        </p>
                        <button
                            onClick={() => navigate('/talents')}
                            className='w-full bg-primary text-white py-3 rounded-full font-semibold hover:bg-primary/90 transition-colors'
                        >
                            Découvrir les profils disponibles
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

export default BrandRecommendation
