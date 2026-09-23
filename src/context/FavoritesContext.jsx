import React, { createContext, useState, useContext, useEffect } from 'react'

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
