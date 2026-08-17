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
    const [favorites, setFavorites] = useState([])

    useEffect(() => {
        const savedFavorites = localStorage.getItem('favorites')
        if (savedFavorites) {
            try {
                setFavorites(JSON.parse(savedFavorites))
            } catch (error) {
                console.error('Erreur lors du chargement des favoris:', error)
            }
        }
    }, [])

    useEffect(() => {
        localStorage.setItem('favorites', JSON.stringify(favorites))
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
