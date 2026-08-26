import { logEvent } from 'firebase/analytics'
import { analytics } from '../config/firebase'

// Enregistre un événement Firebase Analytics (GA4). Ne doit jamais faire
// planter l'app si l'analytics est bloqué (ad-blocker, cookies désactivés...).
export const trackEvent = (eventName, params) => {
    if (!analytics) return
    try {
        logEvent(analytics, eventName, params)
    } catch (error) {
        console.error('Analytics event failed:', eventName, error)
    }
}
