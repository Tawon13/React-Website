const STORAGE_KEY = 'collabzz_cookie_consent'

export const getConsent = () => {
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

export const setConsent = (value) => {
    try {
        localStorage.setItem(STORAGE_KEY, value)
    } catch {
        // Stockage indisponible (navigation privée...) : le bandeau réapparaîtra, sans casser l'app.
    }
}
