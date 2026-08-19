import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { db } from '../config/firebase'
import SEO from '../components/SEO'
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore'

const AVATAR_GRADIENTS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-600'
]

const getAvatarGradient = (name) => {
    const str = name || ''
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length]
}

const Messages = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentUser, userType, userData, loading: authLoading } = useAuth()
    const { clearCart } = useCart()
    const [conversations, setConversations] = useState([])
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [shouldScroll, setShouldScroll] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const messagesContainerRef = useRef(null)

    // Rediriger si non connecté, en conservant la page visée (ex: lien reçu par email)
    // pour y revenir automatiquement une fois connecté.
    useEffect(() => {
        if (authLoading) return
        if (!currentUser) {
            navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
        }
    }, [currentUser, authLoading, navigate, location])

    // Confirmation après un paiement Stripe réussi : vider le panier et afficher un message,
    // puis nettoyer l'URL pour ne pas redéclencher au rechargement de la page.
    useEffect(() => {
        const params = new URLSearchParams(location.search)
        if (params.get('payment') === 'success') {
            clearCart()
            setShowPaymentSuccess(true)
            const influencerId = params.get('influencerId')
            navigate('/messages', { replace: true, state: influencerId ? { influencerId } : undefined })
            const timeout = setTimeout(() => setShowPaymentSuccess(false), 6000)
            return () => clearTimeout(timeout)
        }
    }, [location.search])

    // Charger les conversations
    useEffect(() => {
        if (!currentUser || !userType) {
            setLoading(false)
            return
        }

        const conversationsRef = collection(db, 'conversations')
        let q

        try {
            if (userType === 'brand') {
                // Pour les marques : conversations où ils sont brandId
                q = query(
                    conversationsRef,
                    where('brandId', '==', currentUser.uid)
                )
            } else {
                // Pour les influenceurs : conversations où ils sont influencerId
                q = query(
                    conversationsRef,
                    where('influencerId', '==', currentUser.uid)
                )
            }

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                if (snapshot.empty) {
                    setConversations([])
                    setLoading(false)
                    return
                }

                const convs = await Promise.all(
                    snapshot.docs.map(async (docSnap) => {
                        const data = docSnap.data()

                        // Récupérer les infos de l'autre utilisateur
                        let otherUserData = {}
                        try {
                            if (userType === 'brand') {
                                // Récupérer l'influenceur
                                const influencerDoc = await getDoc(doc(db, 'influencers', data.influencerId))
                                if (influencerDoc.exists()) {
                                    otherUserData = influencerDoc.data()
                                } else {
                                    // Utiliser les données stockées dans la conversation
                                    otherUserData = {
                                        name: data.influencerName || 'Influenceur',
                                        email: data.influencerEmail || ''
                                    }
                                }
                            } else {
                                // Récupérer la marque
                                const brandDoc = await getDoc(doc(db, 'brands', data.brandId))
                                if (brandDoc.exists()) {
                                    otherUserData = brandDoc.data()
                                } else {
                                    // Utiliser les données stockées dans la conversation
                                    otherUserData = {
                                        brandName: data.brandName || 'Marque',
                                        email: data.brandEmail || ''
                                    }
                                }
                            }
                        } catch (error) {
                            console.error('Erreur lors de la récupération des données utilisateur:', error)
                            // En cas d'erreur, utiliser les données de la conversation
                            if (userType === 'brand') {
                                otherUserData = {
                                    name: data.influencerName || 'Influenceur',
                                    email: data.influencerEmail || ''
                                }
                            } else {
                                otherUserData = {
                                    brandName: data.brandName || 'Marque',
                                    email: data.brandEmail || ''
                                }
                            }
                        }

                        return {
                            id: docSnap.id,
                            ...data,
                            otherUser: otherUserData
                        }
                    })
                )

                // Trier par date de dernier message (si disponible)
                convs.sort((a, b) => {
                    const aTime = a.lastMessageAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0
                    const bTime = b.lastMessageAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0
                    return bTime - aTime
                })

                setConversations(convs)
                setLoading(false)
            }, (error) => {
                console.error('Erreur lors du chargement des conversations:', error)
                setLoading(false)
            })

            return () => unsubscribe()
        } catch (error) {
            console.error('Erreur lors de la configuration de la requête:', error)
            setLoading(false)
        }
    }, [currentUser, userType])

    // Sélectionner automatiquement la bonne conversation quand on arrive depuis :
    // - "Mes Collaborations" côté influenceur (clic sur une collaboration -> brandId)
    // - un paiement Stripe réussi côté marque (-> influencerId)
    // - le lien "Voir la demande" reçu par email par l'influenceur (?brandId=... dans l'URL,
    //   pas de state React Router puisque c'est une navigation externe)
    // Ne s'applique qu'une fois pour ne pas re-forcer la sélection après un retour manuel.
    const appliedRedirectRef = useRef(false)
    useEffect(() => {
        if (appliedRedirectRef.current || conversations.length === 0) return

        const params = new URLSearchParams(location.search)
        const brandId = location.state?.brandId || params.get('brandId')
        const influencerId = location.state?.influencerId || params.get('influencerId')
        if (!brandId && !influencerId) return

        const match = brandId
            ? conversations.find((conv) => conv.brandId === brandId)
            : conversations.find((conv) => conv.influencerId === influencerId)

        if (match) {
            appliedRedirectRef.current = true
            setSelectedConversation(match)
        }
    }, [conversations, location.state, location.search])

    // Charger les messages de la conversation sélectionnée
    useEffect(() => {
        if (!selectedConversation) return

        // Scroll vers le bas lors du changement de conversation
        setShouldScroll(true)

        const messagesRef = collection(db, 'conversations', selectedConversation.id, 'messages')
        const q = query(messagesRef, orderBy('createdAt', 'asc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
            setMessages(msgs)

            // Marquer les messages comme lus
            snapshot.docs.forEach(async (docSnap) => {
                const msg = docSnap.data()
                if (msg.senderId !== currentUser.uid && !msg.read) {
                    await updateDoc(doc(db, 'conversations', selectedConversation.id, 'messages', docSnap.id), {
                        read: true
                    })
                }
            })
        })

        return () => unsubscribe()
    }, [selectedConversation, currentUser])

    // Scroll automatique vers le bas seulement si nécessaire, limité à la zone de
    // messages elle-même (scrollIntoView ferait aussi défiler toute la page).
    useEffect(() => {
        if (shouldScroll && messages.length > 0 && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
            setShouldScroll(false)
        }
    }, [messages, shouldScroll])

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation || sending) return

        setSending(true)
        try {
            const messagesRef = collection(db, 'conversations', selectedConversation.id, 'messages')
            await addDoc(messagesRef, {
                senderId: currentUser.uid,
                senderName: userType === 'brand' ? userData?.brandName : userData?.name,
                senderType: userType,
                message: newMessage.trim(),
                createdAt: serverTimestamp(),
                read: false
            })

            // Mettre à jour la conversation
            await updateDoc(doc(db, 'conversations', selectedConversation.id), {
                lastMessage: newMessage.trim(),
                lastMessageAt: serverTimestamp(),
                lastMessageBy: currentUser.uid
            })

            setNewMessage('')
            // Activer le scroll après l'envoi
            setShouldScroll(true)
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error)
            alert('Erreur lors de l\'envoi du message')
        } finally {
            setSending(false)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        const now = new Date()
        const diff = now - date

        if (diff < 60000) return 'À l\'instant'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }

    const getDisplayName = (conv) => (
        userType === 'brand'
            ? conv.otherUser?.name || 'Influenceur'
            : conv.otherUser?.brandName || 'Marque'
    )

    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations
        const term = searchTerm.trim().toLowerCase()
        return conversations.filter((conv) => getDisplayName(conv).toLowerCase().includes(term))
    }, [conversations, searchTerm, userType])

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100'>
                <div className='animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary'></div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-10'>
            <SEO title='Messagerie' noindex />
            {showPaymentSuccess && (
                <div className='fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg flex items-center gap-3'>
                    <svg className='w-5 h-5 text-green-600 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/>
                    </svg>
                    <p className='text-sm sm:text-base font-medium text-green-800'>
                        Paiement confirmé ! Merci d'avoir réalisé une collaboration chez Collabzz.
                    </p>
                </div>
            )}
            <div className='max-w-7xl mx-auto px-4'>
                <div className='mb-6 hidden sm:block'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>Messages</h1>
                    <p className='text-sm text-gray-500 mt-1'>
                        {userType === 'brand' ? 'Échangez avec vos influenceurs' : 'Échangez avec les marques'}
                    </p>
                </div>

                <div className='bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 overflow-hidden' style={{ height: 'calc(100vh - 160px)', minHeight: '520px' }}>
                    <div className='flex h-full'>
                        {/* Liste des conversations */}
                        <div className={`w-full md:w-[360px] md:flex-shrink-0 border-r border-gray-100 flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                            <div className='p-4 sm:p-5 border-b border-gray-100'>
                                <h2 className='text-lg font-bold text-gray-900 sm:hidden mb-3'>Messages</h2>
                                <div className='relative'>
                                    <svg className='w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z'/>
                                    </svg>
                                    <input
                                        type='text'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder='Rechercher une conversation...'
                                        className='w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white focus:border-primary/30 transition'
                                    />
                                </div>
                            </div>

                            <div className='flex-1 overflow-y-auto'>
                                {conversations.length === 0 ? (
                                    <div className='p-8 text-center'>
                                        <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                                            <svg className='w-9 h-9 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'/>
                                            </svg>
                                        </div>
                                        <h3 className='text-base font-semibold text-gray-900 mb-2'>
                                            Vous n'avez pas encore de collaborations
                                        </h3>
                                        <p className='text-sm text-gray-500 mb-4'>
                                            {userType === 'brand'
                                                ? 'Parcourez nos talents et créez votre première collaboration pour commencer à échanger.'
                                                : 'Les marques pourront vous contacter dès qu\'elles auront créé une collaboration avec vous.'}
                                        </p>
                                        {userType === 'brand' && (
                                            <button
                                                onClick={() => navigate('/talents')}
                                                className='bg-primary text-white px-6 py-2.5 rounded-full font-medium hover:bg-primary/90 transition shadow-sm'
                                            >
                                                Découvrir les Talents
                                            </button>
                                        )}
                                    </div>
                                ) : filteredConversations.length === 0 ? (
                                    <div className='p-8 text-center text-sm text-gray-500'>
                                        Aucune conversation ne correspond à "{searchTerm}"
                                    </div>
                                ) : (
                                    <div className='py-1'>
                                        {filteredConversations.map((conv) => {
                                            const isSelected = selectedConversation?.id === conv.id
                                            const isUnread = conv.lastMessageBy && conv.lastMessageBy !== currentUser.uid && !isSelected
                                            const displayName = getDisplayName(conv)
                                            return (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => setSelectedConversation(conv)}
                                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition border-l-4 ${
                                                        isSelected
                                                            ? 'bg-primary/5 border-primary'
                                                            : 'border-transparent hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarGradient(displayName)} flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 shadow-sm`}>
                                                        {displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='flex items-center justify-between gap-2'>
                                                            <h3 className={`truncate ${isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                                                                {displayName}
                                                            </h3>
                                                            <span className='text-xs text-gray-400 flex-shrink-0'>
                                                                {formatDate(conv.lastMessageAt)}
                                                            </span>
                                                        </div>
                                                        <div className='flex items-center justify-between gap-2 mt-0.5'>
                                                            <p className={`text-sm truncate ${isUnread ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                                                                {conv.lastMessage || 'Nouvelle conversation'}
                                                            </p>
                                                            {isUnread && (
                                                                <span className='w-2 h-2 rounded-full bg-primary flex-shrink-0'></span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Zone de conversation */}
                        <div className={`flex-1 flex-col bg-gray-50/50 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                            {selectedConversation ? (
                                <>
                                    {/* En-tête de la conversation */}
                                    <div className='p-3 sm:p-4 border-b border-gray-100 bg-white flex items-center gap-3'>
                                        <button
                                            onClick={() => setSelectedConversation(null)}
                                            className='md:hidden p-1.5 -ml-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition'
                                        >
                                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7'/>
                                            </svg>
                                        </button>
                                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(getDisplayName(selectedConversation))} flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm`}>
                                            {getDisplayName(selectedConversation).charAt(0).toUpperCase()}
                                        </div>
                                        <div className='min-w-0'>
                                            <h3 className='font-semibold text-gray-900 truncate'>
                                                {getDisplayName(selectedConversation)}
                                            </h3>
                                            <p className='text-xs text-gray-400 truncate'>
                                                {selectedConversation.otherUser?.email}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div ref={messagesContainerRef} className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-3'>
                                        {messages.length === 0 ? (
                                            <div className='text-center py-12'>
                                                <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                                                    <svg className='w-8 h-8 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'/>
                                                    </svg>
                                                </div>
                                                <p className='text-gray-700 font-medium mb-2'>Démarrez la conversation</p>
                                                <p className='text-sm text-gray-500 max-w-xs mx-auto'>
                                                    {userType === 'brand'
                                                        ? 'Présentez votre projet et discutez des détails de la collaboration.'
                                                        : 'Échangez avec la marque pour finaliser les détails de votre collaboration.'}
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((msg, index) => {
                                                const isOwn = msg.senderId === currentUser.uid
                                                const prevMsg = messages[index - 1]
                                                const isGrouped = prevMsg && prevMsg.senderId === msg.senderId
                                                return (
                                                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-3'}`}>
                                                        <div
                                                            className={`max-w-[80%] sm:max-w-md px-4 py-2.5 shadow-sm ${
                                                                isOwn
                                                                    ? 'bg-primary text-white rounded-2xl rounded-br-md'
                                                                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-100'
                                                            }`}
                                                        >
                                                            <p className='text-sm whitespace-pre-wrap break-words'>{msg.message}</p>
                                                            <p className={`text-[11px] mt-1 text-right ${isOwn ? 'text-white/70' : 'text-gray-400'}`}>
                                                                {formatDate(msg.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>

                                    {/* Formulaire d'envoi */}
                                    <form onSubmit={sendMessage} className='p-3 sm:p-4 border-t border-gray-100 bg-white'>
                                        <div className='flex items-center gap-2'>
                                            <input
                                                type='text'
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder='Écrivez votre message...'
                                                className='flex-1 px-4 py-2.5 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white focus:border-primary/30 transition'
                                                disabled={sending}
                                            />
                                            <button
                                                type='submit'
                                                disabled={!newMessage.trim() || sending}
                                                className='w-11 h-11 flex-shrink-0 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm'
                                            >
                                                {sending ? (
                                                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                                    </svg>
                                                ) : (
                                                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
                                                        <path d='M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z'/>
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className='flex-1 hidden md:flex items-center justify-center'>
                                    <div className='text-center'>
                                        <div className='w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
                                            <svg className='w-9 h-9 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'/>
                                            </svg>
                                        </div>
                                        <p className='text-gray-700 font-medium text-lg'>Sélectionnez une conversation</p>
                                        <p className='text-sm text-gray-400 mt-2'>Choisissez une conversation dans la liste pour commencer</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Messages
