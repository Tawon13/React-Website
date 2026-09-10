import { getBudgetRange } from '../constants/budget'

// Choisit le meilleur influenceur disponible pour une marque, en assouplissant les
// critères par étapes s'il n'y a pas de match parfait (niche + budget) : niche seule,
// puis budget seul, puis n'importe quel influenceur en dernier recours.
export const pickBestMatch = (doctors, { budget, influencerTypes = [] } = {}) => {
    if (!doctors || doctors.length === 0) return null

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
