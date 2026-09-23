import { createContext, useState, useContext, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from './AuthContext'

const MAX_FAVORITES = 500

const FavoritesContext = createContext()

export const useFavorites = () => {
    const context = useContext(FavoritesContext)
    if (!context) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return context
}

export const FavoritesProvider = ({ children }) => {
    // Lecture dès l'initialisation : avec un effet séparé, l'effet d'écriture ci-dessous
    // pouvait sauvegarder [] avant la relecture et effacer les favoris.
    const [favorites, setFavorites] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('favorites') || '[]')
            return Array.isArray(saved) ? saved : []
        } catch (error) {
            console.error('Erreur lors du chargement des favoris:', error)
            return []
        }
    })

    useEffect(() => {
        try {
            localStorage.setItem('favorites', JSON.stringify(favorites))
        } catch {
            // Stockage indisponible (navigation privée...) : les favoris restent en mémoire.
        }
    }, [favorites])

    // Favoris liés au compte (document favorites/{uid}) : ils suivent l'utilisateur d'un
    // appareil à l'autre. À la connexion, on fusionne ceux du compte et ceux de cet appareil.
    const { currentUser } = useAuth()
    const uid = currentUser?.uid || null
    const syncedUid = useRef(null)

    useEffect(() => {
        syncedUid.current = null
        if (!uid) return
        let cancelled = false
        getDoc(doc(db, 'favorites', uid))
            .then((snap) => {
                if (cancelled) return
                const remote = Array.isArray(snap.data()?.ids) ? snap.data().ids : []
                setFavorites((local) => [...new Set([...remote, ...local])].slice(0, MAX_FAVORITES))
                syncedUid.current = uid
            })
            .catch((error) => console.error('Erreur lors du chargement des favoris du compte:', error))
        return () => { cancelled = true }
    }, [uid])

    useEffect(() => {
        // N'écrit qu'après la fusion initiale, sinon on écraserait les favoris du compte.
        if (!uid || syncedUid.current !== uid) return
        setDoc(doc(db, 'favorites', uid), { ids: favorites.slice(0, MAX_FAVORITES), updatedAt: serverTimestamp() })
            .catch((error) => console.error('Erreur lors de la sauvegarde des favoris:', error))
    }, [favorites, uid])

    const isFavorite = (influencerId) => favorites.includes(influencerId)

    const toggleFavorite = (influencerId) => {
        setFavorites((prev) =>
            prev.includes(influencerId)
                ? prev.filter((id) => id !== influencerId)
                : [...prev, influencerId]
        )
    }

    const value = {
        favorites,
        isFavorite,
        toggleFavorite
    }

    return (
        <FavoritesContext.Provider value={value}>
            {children}
        </FavoritesContext.Provider>
    )
}
