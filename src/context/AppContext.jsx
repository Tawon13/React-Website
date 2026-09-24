import { createContext, useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { assets } from "../assets/assets";
import { computeTikTokStats } from "../utils/tiktokStats";
import { hdPhotoURL } from "../utils/photoUrl";

export const AppContext = createContext()

export const normalizeInfluencer = (docSnap) => {
    const data = docSnap.data() || {}
    const { avgViews, engagementRate } = computeTikTokStats(data.socialAccounts?.tiktok)

    return {
        _id: docSnap.id,
        name: data.name || 'Influenceur',
        image: hdPhotoURL(data.photoURL) || data.socialAccounts?.tiktok?.avatarUrl || assets.profile_pic,
        speciality: data.category || 'Créateur de contenu',
        creatorType: data.creatorType === 'ugc' ? 'ugc' : 'influenceur',
        tiktokUsername: data.socialAccounts?.tiktok?.username || '',
        city: data.city || '',
        country: data.country || '',
        about: data.about || "Ce créateur n'a pas encore complété sa description.",
        fees: data.pricing?.tiktok_video || 800,
        rating: data.rating || 5,
        reviews: data.reviews || 0,
        followers: {
            tiktok: data.socialAccounts?.tiktok?.followers || 0
        },
        avgViews,
        engagementRate,
        createdAt: data.createdAt || null
    }
}

const AppContextProvider = (props) => {

    const currencySymbol = '$'
    const [doctors, setDoctors] = useState([])
    const [doctorsLoading, setDoctorsLoading] = useState(true)

    useEffect(() => {
        const loadInfluencers = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'influencers'))
                const approvedDocs = snapshot.docs.filter((docSnap) => docSnap.data()?.approved === true)
                setDoctors(approvedDocs.map(normalizeInfluencer))
            } catch (error) {
                console.error('Erreur lors du chargement des influenceurs:', error)
            } finally {
                setDoctorsLoading(false)
            }
        }

        loadInfluencers()
    }, [])

    const value = {
        doctors,
        doctorsLoading,
        currencySymbol
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
