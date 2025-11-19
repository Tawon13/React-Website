import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { db } from '../config/firebase'
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    addDoc, 
    serverTimestamp,
    getDocs,
    doc,
    getDoc,
    updateDoc
} from 'firebase/firestore'

const Messages = () => {
    const navigate = useNavigate()
    const { currentUser, userType, userData } = useAuth()
    const [conversations, setConversations] = useState([])
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef(null)

    // Rediriger si non connecté
    useEffect(() => {
        if (!currentUser) {
            navigate('/login')
        }
    }, [currentUser, navigate])

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
                                }
                            } else {
                                // Récupérer la marque
                                const brandDoc = await getDoc(doc(db, 'brands', data.brandId))
                                if (brandDoc.exists()) {
                                    otherUserData = brandDoc.data()
                                }
                            }
                        } catch (error) {
                            console.error('Erreur lors de la récupération des données utilisateur:', error)
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

    // Charger les messages de la conversation sélectionnée
    useEffect(() => {
        if (!selectedConversation) return

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

    // Scroll automatique vers le bas
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

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

    if (loading) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
            </div>
        )
    }

    return (
        <div className='min-h-screen bg-gray-50 py-10'>
            <div className='max-w-7xl mx-auto px-4'>
                <div className='bg-white rounded-xl shadow-lg overflow-hidden' style={{ height: 'calc(100vh - 120px)' }}>
                    <div className='flex h-full'>
                        {/* Liste des conversations */}
                        <div className='w-full md:w-1/3 border-r border-gray-200 overflow-y-auto'>
                            <div className='p-4 border-b border-gray-200 bg-gray-50'>
                                <h2 className='text-xl font-bold text-gray-900'>Mes Messages</h2>
                                <p className='text-sm text-gray-600 mt-1'>
                                    {userType === 'brand' ? 'Vos conversations avec les influenceurs' : 'Vos conversations avec les marques'}
                                </p>
                            </div>

                            {conversations.length === 0 ? (
                                <div className='p-8 text-center'>
                                    <svg className='w-20 h-20 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'/>
                                    </svg>
                                    <h3 className='text-lg font-semibold text-gray-900 mb-2'>
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
                                            className='bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition'
                                        >
                                            Découvrir les Talents
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    {conversations.map((conv) => (
                                        <div
                                            key={conv.id}
                                            onClick={() => setSelectedConversation(conv)}
                                            className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition ${
                                                selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className='flex items-center gap-3'>
                                                <div className='w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0'>
                                                    {userType === 'brand' 
                                                        ? conv.otherUser?.name?.charAt(0) || 'I'
                                                        : conv.otherUser?.brandName?.charAt(0) || 'M'
                                                    }
                                                </div>
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-center justify-between'>
                                                        <h3 className='font-semibold text-gray-900 truncate'>
                                                            {userType === 'brand' 
                                                                ? conv.otherUser?.name || 'Influenceur'
                                                                : conv.otherUser?.brandName || 'Marque'
                                                            }
                                                        </h3>
                                                        <span className='text-xs text-gray-500 ml-2'>
                                                            {formatDate(conv.lastMessageAt)}
                                                        </span>
                                                    </div>
                                                    <p className='text-sm text-gray-600 truncate mt-1'>
                                                        {conv.lastMessage || 'Nouvelle conversation'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Zone de conversation */}
                        <div className='flex-1 flex flex-col'>
                            {selectedConversation ? (
                                <>
                                    {/* En-tête de la conversation */}
                                    <div className='p-4 border-b border-gray-200 bg-gray-50'>
                                        <div className='flex items-center gap-3'>
                                            <div className='w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold'>
                                                {userType === 'brand'
                                                    ? selectedConversation.otherUser?.name?.charAt(0) || 'I'
                                                    : selectedConversation.otherUser?.brandName?.charAt(0) || 'M'
                                                }
                                            </div>
                                            <div>
                                                <h3 className='font-semibold text-gray-900'>
                                                    {userType === 'brand'
                                                        ? selectedConversation.otherUser?.name || 'Influenceur'
                                                        : selectedConversation.otherUser?.brandName || 'Marque'
                                                    }
                                                </h3>
                                                <p className='text-xs text-gray-500'>
                                                    {userType === 'brand'
                                                        ? selectedConversation.otherUser?.email
                                                        : selectedConversation.otherUser?.email
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                                        {messages.length === 0 ? (
                                            <div className='text-center py-12'>
                                                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                                                    <svg className='w-8 h-8 text-primary' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'/>
                                                    </svg>
                                                </div>
                                                <p className='text-gray-700 font-medium mb-2'>Démarrez la conversation</p>
                                                <p className='text-sm text-gray-500'>
                                                    {userType === 'brand' 
                                                        ? 'Présentez votre projet et discutez des détails de la collaboration.'
                                                        : 'Échangez avec la marque pour finaliser les détails de votre collaboration.'}
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const isOwn = msg.senderId === currentUser.uid
                                                return (
                                                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-xs md:max-w-md ${isOwn ? 'bg-primary text-white' : 'bg-gray-200 text-gray-900'} rounded-lg px-4 py-2`}>
                                                            <p className='text-sm whitespace-pre-wrap break-words'>{msg.message}</p>
                                                            <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                                                                {formatDate(msg.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Formulaire d'envoi */}
                                    <form onSubmit={sendMessage} className='p-4 border-t border-gray-200 bg-gray-50'>
                                        <div className='flex gap-2'>
                                            <input
                                                type='text'
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder='Écrivez votre message...'
                                                className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary'
                                                disabled={sending}
                                            />
                                            <button
                                                type='submit'
                                                disabled={!newMessage.trim() || sending}
                                                className='px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition'
                                            >
                                                {sending ? (
                                                    <svg className='animate-spin h-5 w-5' fill='none' viewBox='0 0 24 24'>
                                                        <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                                        <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                                                    </svg>
                                                ) : (
                                                    'Envoyer'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </>
                            ) : (
                                <div className='flex-1 flex items-center justify-center bg-gray-50'>
                                    <div className='text-center'>
                                        <svg className='w-20 h-20 text-gray-400 mx-auto mb-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'/>
                                        </svg>
                                        <p className='text-gray-500 text-lg'>Sélectionnez une conversation</p>
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
