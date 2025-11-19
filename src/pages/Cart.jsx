import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc } from 'firebase/firestore'

const Cart = () => {
    const navigate = useNavigate()
    const { cartItems, removeFromCart, updateQuantity, clearCart, getTotal } = useCart()
    const { currentUser, userType, userData } = useAuth()
    const [loading, setLoading] = useState(false)

    const handleCheckout = async () => {
        if (!currentUser) {
            alert('Veuillez vous connecter en tant que marque pour continuer')
            navigate('/login-brand')
            return
        }

        if (userType !== 'brand') {
            alert('Seules les marques peuvent acheter des collaborations')
            return
        }

        if (cartItems.length === 0) {
            alert('Votre panier est vide')
            return
        }

        setLoading(true)
        try {
            // Créer les collaborations et conversations pour chaque item
            for (const item of cartItems) {
                // Récupérer les données de l'influenceur
                const influencerDocRef = doc(db, 'influencers', item.influencerId)
                const influencerDoc = await getDoc(influencerDocRef)
                
                if (!influencerDoc.exists()) {
                    console.error(`Influenceur ${item.influencerId} non trouvé`)
                    continue
                }

                const influencerData = influencerDoc.data()

                // Créer plusieurs collaborations si quantité > 1
                for (let i = 0; i < item.quantity; i++) {
                    // 1. Créer la collaboration
                    const collabData = {
                        brandId: currentUser.uid,
                        brandName: userData?.brandName || 'Marque',
                        brandEmail: currentUser.email,
                        influencerId: item.influencerId,
                        influencerName: influencerData.name || 'Influenceur',
                        influencerEmail: influencerData.email,
                        description: `Collaboration: ${item.package}`,
                        package: item.package,
                        amount: item.price,
                        status: 'pending',
                        createdAt: serverTimestamp()
                    }

                    const collabRef = await addDoc(collection(db, 'collaborations'), collabData)

                    // 2. Vérifier si une conversation existe déjà
                    const conversationsRef = collection(db, 'conversations')
                    const q = query(
                        conversationsRef,
                        where('brandId', '==', currentUser.uid),
                        where('influencerId', '==', item.influencerId)
                    )
                    const existingConvs = await getDocs(q)

                    if (existingConvs.empty) {
                        // 3. Créer une nouvelle conversation
                        await addDoc(collection(db, 'conversations'), {
                            brandId: currentUser.uid,
                            brandName: userData?.brandName || 'Marque',
                            influencerId: item.influencerId,
                            influencerName: influencerData.name || 'Influenceur',
                            collaborationId: collabRef.id,
                            lastMessage: `Nouvelle collaboration: ${item.package}`,
                            lastMessageAt: serverTimestamp(),
                            lastMessageBy: currentUser.uid,
                            createdAt: serverTimestamp()
                        })
                    }
                }
            }

            // Vider le panier après succès
            clearCart()
            alert(`${cartItems.length} collaboration(s) créée(s) avec succès !`)
            navigate('/messages')
        } catch (error) {
            console.error('Erreur lors de la création:', error)
            alert('Erreur lors de la création des collaborations')
        } finally {
            setLoading(false)
        }
    }

    if (cartItems.length === 0) {
        return (
            <div className='min-h-screen bg-gray-50 py-10'>
                <div className='max-w-7xl mx-auto px-4'>
                    <div className='text-center py-20'>
                        <svg className='w-24 h-24 text-gray-400 mx-auto mb-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'/>
                        </svg>
                        <h2 className='text-2xl font-bold text-gray-900 mb-2'>Votre panier est vide</h2>
                        <p className='text-gray-600 mb-6'>Découvrez nos talents et ajoutez des collaborations à votre panier</p>
                        <button
                            onClick={() => navigate('/talents')}
                            className='bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition'
                        >
                            Découvrir nos Talents
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 py-10'>
            <div className='max-w-7xl mx-auto px-4'>
                <div className='mb-6'>
                    <button
                        onClick={() => navigate(-1)}
                        className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
                    >
                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7'/>
                        </svg>
                        Retour
                    </button>
                    <h1 className='text-3xl font-bold text-gray-900'>Mon Panier</h1>
                    <p className='text-gray-600 mt-2'>{cartItems.reduce((sum, item) => sum + item.quantity, 0)} article(s)</p>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    {/* Liste des articles */}
                    <div className='lg:col-span-2 space-y-4'>
                        {cartItems.map((item) => (
                            <div key={item.id} className='bg-white rounded-lg shadow-md p-6'>
                                <div className='flex gap-4'>
                                    {/* Image de l'influenceur */}
                                    <div className='flex-shrink-0'>
                                        <img
                                            src={item.influencerImage}
                                            alt={item.influencerName}
                                            className='w-24 h-24 rounded-lg object-cover'
                                        />
                                    </div>

                                    {/* Détails */}
                                    <div className='flex-1'>
                                        <div className='flex justify-between items-start mb-2'>
                                            <div>
                                                <h3 className='font-semibold text-lg text-gray-900'>{item.influencerName}</h3>
                                                <p className='text-sm text-gray-600'>{item.package}</p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className='text-red-500 hover:text-red-700'
                                            >
                                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'/>
                                                </svg>
                                            </button>
                                        </div>

                                        <div className='flex items-center justify-between mt-4'>
                                            {/* Quantité */}
                                            <div className='flex items-center gap-3'>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className='w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100'
                                                >
                                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M20 12H4'/>
                                                    </svg>
                                                </button>
                                                <span className='font-medium w-8 text-center'>{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className='w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-100'
                                                >
                                                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4'/>
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Prix */}
                                            <div className='text-right'>
                                                <p className='text-xl font-bold text-gray-900'>{(item.price * item.quantity).toLocaleString('fr-FR')} €</p>
                                                {item.quantity > 1 && (
                                                    <p className='text-sm text-gray-500'>{item.price}€ × {item.quantity}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Résumé de la commande */}
                    <div className='lg:col-span-1'>
                        <div className='bg-white rounded-lg shadow-md p-6 sticky top-4'>
                            <h2 className='text-xl font-bold text-gray-900 mb-4'>Résumé</h2>
                            
                            <div className='space-y-3 mb-6'>
                                <div className='flex justify-between text-gray-600'>
                                    <span>Sous-total</span>
                                    <span>{getTotal().toLocaleString('fr-FR')} €</span>
                                </div>
                                <div className='flex justify-between text-gray-600'>
                                    <span>Frais de service</span>
                                    <span>0 €</span>
                                </div>
                                <div className='border-t pt-3 flex justify-between text-lg font-bold'>
                                    <span>Total</span>
                                    <span>{getTotal().toLocaleString('fr-FR')} €</span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={loading}
                                className='w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                            >
                                {loading ? (
                                    <>
                                        <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                        </svg>
                                        <span>Traitement...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'/>
                                        </svg>
                                        Valider la commande
                                    </>
                                )}
                            </button>

                            <button
                                onClick={clearCart}
                                className='w-full mt-3 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition'
                            >
                                Vider le panier
                            </button>

                            <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
                                <div className='flex items-start gap-3'>
                                    <svg className='w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                                        <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                                    </svg>
                                    <div className='text-sm text-blue-900'>
                                        <p className='font-semibold mb-1'>À propos de votre commande</p>
                                        <p>Après validation, vous pourrez communiquer directement avec les influenceurs via la messagerie.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart
