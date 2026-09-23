import React, { createContext, useState, useContext, useEffect } from 'react'

const CartContext = createContext()

export const useCart = () => {
    const context = useContext(CartContext)
    if (!context) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}

export const CartProvider = ({ children }) => {
    // Lecture dès l'initialisation : avec un effet séparé, l'effet d'écriture ci-dessous
    // pouvait sauvegarder [] avant la relecture et vider le panier.
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem('cart') || '[]')
            return Array.isArray(saved) ? saved : []
        } catch (error) {
            console.error('Erreur lors du chargement du panier:', error)
            return []
        }
    })

    // Sauvegarder le panier dans le localStorage à chaque modification
    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(cartItems))
        } catch {
            // Stockage indisponible (navigation privée...) : le panier reste en mémoire.
        }
    }, [cartItems])

    // Ajouter un article au panier
    const addToCart = (item) => {
        setCartItems(prevItems => {
            // Vérifier si l'item existe déjà
            const existingItemIndex = prevItems.findIndex(
                i => i.influencerId === item.influencerId && i.package === item.package
            )

            if (existingItemIndex > -1) {
                // Si l'item existe, augmenter la quantité (sans muter l'objet existant :
                // en StrictMode la fonction est appelée deux fois et ajoutait +2)
                return prevItems.map((i, index) =>
                    index === existingItemIndex ? { ...i, quantity: i.quantity + 1 } : i
                )
            } else {
                // Sinon, ajouter un nouvel item
                return [...prevItems, { ...item, quantity: 1, id: Date.now() }]
            }
        })
    }

    // Supprimer un article du panier
    const removeFromCart = (itemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId))
    }

    // Mettre à jour la quantité
    const updateQuantity = (itemId, quantity) => {
        if (quantity < 1) {
            removeFromCart(itemId)
            return
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId ? { ...item, quantity } : item
            )
        )
    }

    // Vider le panier
    const clearCart = () => {
        setCartItems([])
    }

    // Calculer le total
    const getTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
    }

    // Obtenir le nombre total d'articles
    const getItemCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0)
    }

    const value = {
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount
    }

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    )
}
