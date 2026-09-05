// Tranches de budget proposées à l'onboarding marque, et leur plage numérique associée
// (utilisée pour recommander des influenceurs dont le tarif rentre dans le budget).
export const BUDGET_OPTIONS = [
    'Moins de 1,000€',
    '1,000€ - 5,000€',
    '5,000€ - 10,000€',
    '10,000€ - 25,000€',
    '25,000€ - 50,000€',
    '50,000€+'
]

const BUDGET_RANGES = {
    'Moins de 1,000€': { min: 0, max: 1000 },
    '1,000€ - 5,000€': { min: 1000, max: 5000 },
    '5,000€ - 10,000€': { min: 5000, max: 10000 },
    '10,000€ - 25,000€': { min: 10000, max: 25000 },
    '25,000€ - 50,000€': { min: 25000, max: 50000 },
    '50,000€+': { min: 50000, max: Infinity }
}

export const getBudgetRange = (label) => BUDGET_RANGES[label] || { min: 0, max: Infinity }
