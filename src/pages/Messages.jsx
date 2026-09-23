import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { db, SEND_MESSAGE_NOTIFICATION_URL } from '../config/firebase'
import { storage } from '../config/storage'
import SEO from '../components/SEO'
import { trackEvent } from '../utils/analytics'
import { useToast } from '../context/ToastContext'
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
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

// Les conversations créées avant l'introduction du verrou paiement restent débloquées
// (miroir de isMessagingUnlocked() dans firestore.rules — garder les deux synchronisés).
const MESSAGING_GATE_CUTOFF_MS = new Date('2026-09-07T00:00:00Z').getTime()
const isMessagingUnlocked = (conv) => {
    if (!conv) return false
    if (conv.paymentUnlocked === true) return true
    const createdAtMs = conv.createdAt?.toMillis?.()
    return typeof createdAtMs === 'number' && createdAtMs < MESSAGING_GATE_CUTOFF_MS
}

// Limite alignée sur storage.rules (dossier deliveries/).
const MAX_VIDEO_MB = 500

const REVIEW_BADGES = {
    pending: { label: 'En attente de validation', className: 'bg-amber-100 text-amber-800' },
    approved: { label: 'Vidéo validée', className: 'bg-green-100 text-green-800' },
    changes_requested: { label: 'Modifications demandées', className: 'bg-orange-100 text-orange-800' }
}

const Icon = ({ d, className = 'w-5 h-5' }) => (
    <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={d} />
    </svg>
)

const ICON = {
    video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
    send: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8',
    back: 'M15 19l-7-7 7-7',
    search: 'M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z',
    chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    check: 'M5 13l4 4L19 7',
    edit: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
}

// Carte d'une vidéo livrée : lecteur, statut, et actions selon le rôle.
const VideoDeliveryCard = ({ msg, isOwn, version, isBrand, isInfluencer, onApprove, onRequestChanges, onUploadNew, reviewing }) => {
    const [showChangesForm, setShowChangesForm] = useState(false)
    const [feedback, setFeedback] = useState('')
    const badge = REVIEW_BADGES[msg.reviewStatus] || REVIEW_BADGES.pending
    const canReview = isBrand && msg.reviewStatus === 'pending'

    return (
        <div className={`w-full max-w-sm rounded-2xl overflow-hidden border shadow-sm ${isOwn ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className='flex items-center justify-between gap-2 px-4 pt-3 pb-2'>
                <span className='inline-flex items-center gap-1.5 text-sm font-semibold'>
                    <Icon d={ICON.video} className='w-4 h-4' />
                    Vidéo livrée · version {version}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${badge.className}`}>{badge.label}</span>
            </div>
            <video
                src={msg.videoUrl}
                controls
                playsInline
                preload='metadata'
                className='w-full max-h-[26rem] bg-black'
            >
                <a href={msg.videoUrl} target='_blank' rel='noopener noreferrer'>Télécharger la vidéo</a>
            </video>
            <div className='px-4 py-3 space-y-3'>
                {msg.message && <p className='text-sm whitespace-pre-wrap break-words'>{msg.message}</p>}
                <a href={msg.videoUrl} target='_blank' rel='noopener noreferrer' className={`text-xs underline underline-offset-4 ${isOwn ? 'text-gray-300' : 'text-gray-500'}`}>
                    Ouvrir / télécharger {msg.fileName ? `(${msg.fileName})` : ''}
                </a>

                {msg.reviewStatus === 'changes_requested' && msg.reviewFeedback && (
                    <div className={`rounded-xl p-3 text-sm ${isOwn ? 'bg-white/10' : 'bg-orange-50 text-orange-900'}`}>
                        <p className='font-semibold mb-1'>Modifications demandées :</p>
                        <p className='whitespace-pre-wrap break-words'>{msg.reviewFeedback}</p>
                    </div>
                )}

                {canReview && !showChangesForm && (
                    <div className='grid grid-cols-2 gap-2 pt-1'>
                        <button
                            type='button'
                            disabled={reviewing}
                            onClick={() => onApprove(msg)}
                            className='cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full bg-gray-900 text-white px-3 py-2.5 text-sm font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        >
                            <Icon d={ICON.check} className='w-4 h-4' />
                            Valider
                        </button>
                        <button
                            type='button'
                            disabled={reviewing}
                            onClick={() => setShowChangesForm(true)}
                            className='cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-full border border-gray-300 px-3 py-2.5 text-sm font-semibold hover:border-gray-900 transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        >
                            <Icon d={ICON.edit} className='w-4 h-4' />
                            Modifications
                        </button>
                    </div>
                )}

                <AnimatePresence>
                    {canReview && showChangesForm && (
                        <motion.form
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className='overflow-hidden'
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (feedback.trim()) onRequestChanges(msg, feedback.trim())
                            }}
                        >
                            <label htmlFor={`feedback-${msg.id}`} className='block text-sm font-semibold mb-1.5'>Quelles modifications souhaitez-vous ?</label>
                            <textarea
                                id={`feedback-${msg.id}`}
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                rows={3}
                                maxLength={1000}
                                autoFocus
                                placeholder='Ex. : mettre le produit en avant dès les 3 premières secondes, ajouter le code promo…'
                                className='w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-900 focus:ring-2 focus:ring-primary/40 resize-none'
                            />
                            <div className='flex gap-2 mt-2'>
                                <button type='button' onClick={() => setShowChangesForm(false)} className='cursor-pointer flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm font-semibold'>Annuler</button>
                                <button type='submit' disabled={!feedback.trim() || reviewing} className='cursor-pointer flex-1 rounded-full bg-gray-900 text-white px-3 py-2 text-sm font-semibold disabled:opacity-50'>Envoyer</button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {isInfluencer && msg.reviewStatus === 'changes_requested' && (
                    <button
                        type='button'
                        onClick={onUploadNew}
                        className='cursor-pointer w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-gray-900 px-3 py-2.5 text-sm font-semibold hover:bg-[#EDC085] transition-colors duration-200'
                    >
                        <Icon d={ICON.video} className='w-4 h-4' />
                        Déposer une nouvelle version
                    </button>
                )}
            </div>
        </div>
    )
}

const Messages = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { currentUser, userType, userData, loading: authLoading } = useAuth()
    const { clearCart } = useCart()
    const toast = useToast()
    const [conversations, setConversations] = useState([])
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
    const [selectedConversation, setSelectedConversation] = useState(null)
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [shouldScroll, setShouldScroll] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [uploadProgress, setUploadProgress] = useState(null)
    const [reviewing, setReviewing] = useState(false)
    const messagesContainerRef = useRef(null)
    const videoInputRef = useRef(null)

    const isBrand = userType === 'brand'
    const isInfluencer = userType === 'influencer'

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
            trackEvent('collaboration_payment_success')
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

        try {
            const q = query(
                conversationsRef,
                where(isBrand ? 'brandId' : 'influencerId', '==', currentUser.uid)
            )

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                if (snapshot.empty) {
                    setConversations([])
                    setLoading(false)
                    return
                }

                const convs = await Promise.all(
                    snapshot.docs.map(async (docSnap) => {
                        const data = docSnap.data()
                        const fallback = isBrand
                            ? { name: data.influencerName || 'Influenceur', email: data.influencerEmail || '' }
                            : { brandName: data.brandName || 'Marque', email: data.brandEmail || '' }

                        // Récupérer les infos de l'autre utilisateur
                        // Profil public de l'autre participant (photo, pseudo...). Le nom et l'email
                        // ne sont plus dans le profil public : ils viennent de la conversation.
                        let otherUserData = fallback
                        try {
                            const otherDoc = await getDoc(isBrand
                                ? doc(db, 'influencers', data.influencerId)
                                : doc(db, 'brands', data.brandId))
                            if (otherDoc.exists()) otherUserData = { ...fallback, ...otherDoc.data() }
                        } catch (error) {
                            console.error('Erreur lors de la récupération des données utilisateur:', error)
                        }

                        return { id: docSnap.id, ...data, otherUser: otherUserData }
                    })
                )

                // Trier par date de dernier message (si disponible)
                convs.sort((a, b) => {
                    const aTime = a.lastMessageAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0
                    const bTime = b.lastMessageAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0
                    return bTime - aTime
                })

                setConversations(convs)
                // Garder la conversation ouverte à jour (ex. paymentUnlocked qui passe à true).
                setSelectedConversation((current) => (current ? convs.find((c) => c.id === current.id) || current : current))
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
    const selectedConversationId = selectedConversation?.id
    useEffect(() => {
        if (!selectedConversationId) return

        // Scroll vers le bas lors du changement de conversation
        setShouldScroll(true)

        const messagesRef = collection(db, 'conversations', selectedConversationId, 'messages')
        const q = query(messagesRef, orderBy('createdAt', 'asc'))

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })))

            // Marquer comme lus les messages reçus (autorisé par firestore.rules : champ `read` seul)
            snapshot.docs.forEach((docSnap) => {
                const msg = docSnap.data()
                if (msg.senderId !== currentUser.uid && !msg.read) {
                    updateDoc(doc(db, 'conversations', selectedConversationId, 'messages', docSnap.id), { read: true })
                        .catch((error) => console.error('Erreur marquage lu:', error))
                }
            })
        })

        return () => unsubscribe()
    }, [selectedConversationId, currentUser])

    // Scroll automatique vers le bas seulement si nécessaire, limité à la zone de
    // messages elle-même (scrollIntoView ferait aussi défiler toute la page).
    useEffect(() => {
        if (shouldScroll && messages.length > 0 && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
            setShouldScroll(false)
        }
    }, [messages, shouldScroll])

    // Prévenir l'autre participant par email (best-effort, ne doit pas bloquer l'envoi)
    const notifyOtherParty = async (conversationId) => {
        if (!SEND_MESSAGE_NOTIFICATION_URL) return
        try {
            const idToken = await currentUser.getIdToken()
            await fetch(SEND_MESSAGE_NOTIFICATION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ conversationId })
            })
        } catch (notifyError) {
            console.error('Erreur lors de la notification par email:', notifyError)
        }
    }

    // Ajoute un message et met à jour l'aperçu de la conversation.
    const postMessage = async (conversationId, fields, preview) => {
        await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
            senderId: currentUser.uid,
            senderName: isBrand ? userData?.brandName : userData?.name,
            senderType: userType,
            createdAt: serverTimestamp(),
            read: false,
            ...fields
        })
        await updateDoc(doc(db, 'conversations', conversationId), {
            lastMessage: preview,
            lastMessageAt: serverTimestamp(),
            lastMessageBy: currentUser.uid
        })
        setShouldScroll(true)
        notifyOtherParty(conversationId)
    }

    const sendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim() || !selectedConversation || sending) return

        if (!isMessagingUnlocked(selectedConversation)) {
            toast.warning('La messagerie est disponible une fois la collaboration payée.')
            return
        }

        setSending(true)
        try {
            await postMessage(selectedConversation.id, { message: newMessage.trim() }, newMessage.trim())
            setNewMessage('')
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error)
            toast.error('Erreur lors de l\'envoi du message')
        } finally {
            setSending(false)
        }
    }

    // Dépôt d'une vidéo par l'influenceur : envoi dans Storage avec progression, puis
    // message « video_delivery » en attente de validation par la marque.
    const handleVideoSelected = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file || !selectedConversation) return

        if (!file.type.startsWith('video/')) {
            toast.error('Le fichier doit être une vidéo (MP4, MOV…).')
            return
        }
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
            toast.error(`La vidéo dépasse ${MAX_VIDEO_MB} Mo.`)
            return
        }

        const conversationId = selectedConversation.id
        const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-80)
        const path = `deliveries/${conversationId}/${Date.now()}_${safeName}`

        try {
            setUploadProgress(0)
            const task = uploadBytesResumable(storageRef(storage, path), file, { contentType: file.type })
            await new Promise((resolve, reject) => {
                task.on('state_changed',
                    (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                    reject,
                    resolve)
            })
            const videoUrl = await getDownloadURL(task.snapshot.ref)
            await postMessage(conversationId, {
                type: 'video_delivery',
                message: newMessage.trim(),
                videoUrl,
                storagePath: path,
                fileName: file.name,
                fileSize: file.size,
                reviewStatus: 'pending'
            }, 'Vidéo envoyée pour validation')
            setNewMessage('')
            toast.success('Vidéo envoyée ! La marque va pouvoir la valider.')
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la vidéo:', error)
            toast.error('Impossible d\'envoyer la vidéo. Réessayez.')
        } finally {
            setUploadProgress(null)
        }
    }

    const reviewDelivery = async (msg, status, feedback = '') => {
        if (!selectedConversation) return
        setReviewing(true)
        try {
            await updateDoc(doc(db, 'conversations', selectedConversation.id, 'messages', msg.id), {
                reviewStatus: status,
                reviewFeedback: feedback,
                reviewedAt: serverTimestamp()
            })
            const text = status === 'approved'
                ? 'Vidéo validée. Merci pour ce contenu !'
                : `Modifications demandées : ${feedback}`
            await postMessage(selectedConversation.id, { message: text }, status === 'approved' ? 'Vidéo validée' : 'Modifications demandées')
            toast.success(status === 'approved' ? 'Vidéo validée.' : 'Demande de modifications envoyée.')
        } catch (error) {
            console.error('Erreur lors de la validation de la vidéo:', error)
            toast.error('Impossible d\'enregistrer votre réponse. Réessayez.')
        } finally {
            setReviewing(false)
        }
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return ''
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
        const diff = Date.now() - date

        if (diff < 60000) return 'À l\'instant'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} h`
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }

    const getDisplayName = (conv) => (
        isBrand ? conv.otherUser?.name || 'Influenceur' : conv.otherUser?.brandName || 'Marque'
    )
    const getAvatar = (conv) => (
        isBrand ? conv.otherUser?.photoURL || conv.otherUser?.socialAccounts?.tiktok?.avatarUrl : conv.otherUser?.photoURL
    )
    const getSubtitle = (conv) => {
        const username = conv.otherUser?.socialAccounts?.tiktok?.username
        return isBrand && username ? `@${username}` : conv.otherUser?.email
    }

    const filteredConversations = useMemo(() => {
        if (!searchTerm.trim()) return conversations
        const term = searchTerm.trim().toLowerCase()
        return conversations.filter((conv) => getDisplayName(conv).toLowerCase().includes(term))
    }, [conversations, searchTerm, userType])

    // Numéro de version de chaque vidéo livrée, dans l'ordre de la conversation.
    const deliveryVersions = useMemo(() => {
        const versions = {}
        let count = 0
        messages.forEach((msg) => {
            if (msg.type === 'video_delivery') versions[msg.id] = ++count
        })
        return versions
    }, [messages])

    const Avatar = ({ conv, size = 'w-12 h-12' }) => {
        const url = getAvatar(conv)
        const name = getDisplayName(conv)
        return url
            ? <img src={url} alt='' className={`${size} rounded-full object-cover flex-shrink-0`} />
            : <div className={`${size} rounded-full bg-gray-900 text-primary flex items-center justify-center font-bold flex-shrink-0`}>{name.charAt(0).toUpperCase()}</div>
    }

    if (loading) {
        return (
            <div className='flex items-center justify-center py-40'>
                <div className='w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin' aria-label='Chargement' />
            </div>
        )
    }

    const unlocked = isMessagingUnlocked(selectedConversation)
    const isUploading = uploadProgress !== null

    return (
        <MotionConfig reducedMotion='user'>
        <div className='pb-10'>
            <SEO title='Messagerie' noindex />
            <AnimatePresence>
                {showPaymentSuccess && (
                    <motion.div
                        role='status'
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className='fixed top-28 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-lg flex items-center gap-3'
                    >
                        <Icon d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' className='w-5 h-5 text-green-700 flex-shrink-0' />
                        <p className='text-sm sm:text-base font-medium text-green-800'>
                            {"Paiement confirmé ! Merci d'avoir réalisé une collaboration chez Collabzz."}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className='hidden sm:flex items-end justify-between mb-6 pt-4'>
                <div>
                    <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-2'>Messagerie</p>
                    <h1 className='text-3xl md:text-4xl font-bold text-gray-900 tracking-tight'>
                        {isBrand ? 'Échangez avec vos créateurs' : 'Échangez avec les marques'}
                    </h1>
                </div>
            </div>

            <div className='bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-900/5 overflow-hidden h-[calc(100dvh-9rem)] sm:h-[calc(100dvh-14rem)] min-h-[520px]'>
                <div className='flex h-full'>
                    {/* Liste des conversations */}
                    <div className={`w-full md:w-[340px] md:flex-shrink-0 border-r border-gray-100 flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                        <div className='p-4 border-b border-gray-100'>
                            <h2 className='text-xl font-bold text-gray-900 sm:hidden mb-3'>Messages</h2>
                            <label htmlFor='conv-search' className='sr-only'>Rechercher une conversation</label>
                            <div className='relative'>
                                <Icon d={ICON.search} className='w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
                                <input
                                    id='conv-search'
                                    type='search'
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder='Rechercher…'
                                    className='w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-base sm:text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition'
                                />
                            </div>
                        </div>

                        <div className='flex-1 overflow-y-auto'>
                            {conversations.length === 0 ? (
                                <div className='p-8 text-center'>
                                    <div className='w-16 h-16 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mx-auto mb-4'>
                                        <Icon d={ICON.chat} className='w-8 h-8' />
                                    </div>
                                    <h3 className='font-semibold text-gray-900 mb-2'>{"Vous n'avez pas encore de collaborations"}</h3>
                                    <p className='text-sm text-gray-500 mb-5'>
                                        {isBrand
                                            ? 'Parcourez nos talents et créez votre première collaboration pour commencer à échanger.'
                                            : "Les marques pourront vous contacter dès qu'elles auront créé une collaboration avec vous."}
                                    </p>
                                    {isBrand && (
                                        <button onClick={() => navigate('/talents')} className='cursor-pointer rounded-full bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors duration-200'>
                                            Découvrir les talents
                                        </button>
                                    )}
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <p className='p-8 text-center text-sm text-gray-500'>Aucune conversation ne correspond à « {searchTerm} »</p>
                            ) : (
                                <ul className='p-2'>
                                    {filteredConversations.map((conv) => {
                                        const isSelected = selectedConversation?.id === conv.id
                                        const isUnread = conv.lastMessageBy && conv.lastMessageBy !== currentUser.uid && !isSelected
                                        const displayName = getDisplayName(conv)
                                        return (
                                            <li key={conv.id}>
                                                <button
                                                    onClick={() => setSelectedConversation(conv)}
                                                    aria-current={isSelected || undefined}
                                                    className={`cursor-pointer w-full text-left px-3 py-3 rounded-2xl flex items-center gap-3 transition-colors duration-200 ${isSelected ? 'bg-gray-900 text-white' : 'hover:bg-gray-50'}`}
                                                >
                                                    <Avatar conv={conv} />
                                                    <div className='flex-1 min-w-0'>
                                                        <div className='flex items-center justify-between gap-2'>
                                                            <p className={`truncate ${isUnread ? 'font-bold' : 'font-semibold'}`}>{displayName}</p>
                                                            <span className={`text-xs flex-shrink-0 ${isSelected ? 'text-gray-400' : 'text-gray-400'}`}>{formatDate(conv.lastMessageAt)}</span>
                                                        </div>
                                                        <div className='flex items-center justify-between gap-2 mt-0.5'>
                                                            <p className={`text-sm truncate ${isSelected ? 'text-gray-300' : isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                                {conv.lastMessage || 'Nouvelle conversation'}
                                                            </p>
                                                            {isUnread && <span className='w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0' aria-label='Non lu'></span>}
                                                        </div>
                                                    </div>
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* Zone de conversation */}
                    <div className={`flex-1 flex-col min-w-0 bg-gray-50 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                        {selectedConversation ? (
                            <>
                                <div className='px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3'>
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        aria-label='Retour aux conversations'
                                        className='md:hidden cursor-pointer w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100'
                                    >
                                        <Icon d={ICON.back} />
                                    </button>
                                    <Avatar conv={selectedConversation} size='w-10 h-10' />
                                    <div className='min-w-0'>
                                        <h3 className='font-semibold text-gray-900 truncate'>{getDisplayName(selectedConversation)}</h3>
                                        <p className='text-xs text-gray-500 truncate'>{getSubtitle(selectedConversation)}</p>
                                    </div>
                                </div>

                                <div ref={messagesContainerRef} className='flex-1 overflow-y-auto px-4 sm:px-6 py-5'>
                                    {messages.length === 0 ? (
                                        <div className='text-center py-12'>
                                            <div className='w-14 h-14 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mx-auto mb-4'>
                                                <Icon d={ICON.chat} className='w-7 h-7' />
                                            </div>
                                            <p className='text-gray-900 font-semibold mb-1'>Démarrez la conversation</p>
                                            <p className='text-sm text-gray-500 max-w-xs mx-auto'>
                                                {isBrand
                                                    ? 'Présentez votre projet et discutez des détails de la collaboration.'
                                                    : 'Échangez avec la marque, puis déposez votre vidéo ici une fois réalisée.'}
                                            </p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isOwn = msg.senderId === currentUser.uid
                                            const prevMsg = messages[index - 1]
                                            const isGrouped = prevMsg && prevMsg.senderId === msg.senderId && prevMsg.type !== 'video_delivery' && msg.type !== 'video_delivery'
                                            return (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} ${isGrouped ? 'mt-1' : 'mt-4'}`}
                                                >
                                                    {msg.type === 'video_delivery' ? (
                                                        <VideoDeliveryCard
                                                            msg={msg}
                                                            isOwn={isOwn}
                                                            version={deliveryVersions[msg.id]}
                                                            isBrand={isBrand}
                                                            isInfluencer={isInfluencer}
                                                            reviewing={reviewing}
                                                            onApprove={(m) => reviewDelivery(m, 'approved')}
                                                            onRequestChanges={(m, feedback) => reviewDelivery(m, 'changes_requested', feedback)}
                                                            onUploadNew={() => videoInputRef.current?.click()}
                                                        />
                                                    ) : (
                                                        <div className={`max-w-[85%] sm:max-w-md px-4 py-2.5 ${isOwn ? 'bg-gray-900 text-white rounded-2xl rounded-br-md' : 'bg-white text-gray-900 rounded-2xl rounded-bl-md border border-gray-200'}`}>
                                                            <p className='text-[15px] whitespace-pre-wrap break-words'>{msg.message}</p>
                                                        </div>
                                                    )}
                                                    <span className='text-[11px] text-gray-400 mt-1 px-1'>{formatDate(msg.createdAt)}</span>
                                                </motion.div>
                                            )
                                        })
                                    )}
                                </div>

                                {/* Composer */}
                                <form onSubmit={sendMessage} className='p-3 sm:p-4 border-t border-gray-100 bg-white'>
                                    {!unlocked && (
                                        <div className='mb-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900'>
                                            <Icon d={ICON.lock} className='w-4 h-4 flex-shrink-0' />
                                            {isBrand
                                                ? 'La messagerie sera disponible une fois que vous aurez payé cette collaboration.'
                                                : 'La messagerie sera disponible une fois que la marque aura payé cette collaboration.'}
                                        </div>
                                    )}

                                    <AnimatePresence>
                                        {isUploading && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className='overflow-hidden'
                                                role='status'
                                            >
                                                <div className='mb-3 rounded-xl bg-gray-100 px-4 py-3'>
                                                    <div className='flex justify-between text-sm font-medium text-gray-900 mb-2'>
                                                        <span>Envoi de la vidéo…</span>
                                                        <span className='tabular-nums'>{uploadProgress} %</span>
                                                    </div>
                                                    <div className='h-2 rounded-full bg-gray-200 overflow-hidden'>
                                                        <motion.div className='h-full bg-gray-900 rounded-full' animate={{ width: `${uploadProgress}%` }} transition={{ ease: 'easeOut' }} />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className='flex items-center gap-2'>
                                        {isInfluencer && (
                                            <>
                                                <input ref={videoInputRef} type='file' accept='video/*' className='hidden' onChange={handleVideoSelected} />
                                                <button
                                                    type='button'
                                                    onClick={() => videoInputRef.current?.click()}
                                                    disabled={!unlocked || isUploading}
                                                    className='cursor-pointer flex-shrink-0 inline-flex items-center gap-2 h-11 px-4 rounded-full border border-gray-300 text-sm font-semibold text-gray-900 hover:border-gray-900 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                                >
                                                    <Icon d={ICON.video} />
                                                    <span className='hidden sm:inline'>Déposer la vidéo</span>
                                                    <span className='sr-only sm:hidden'>Déposer la vidéo</span>
                                                </button>
                                            </>
                                        )}
                                        <label htmlFor='new-message' className='sr-only'>Votre message</label>
                                        <input
                                            id='new-message'
                                            type='text'
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder={unlocked ? (isInfluencer ? 'Message (ou texte joint à la vidéo)…' : 'Écrivez votre message…') : 'Messagerie verrouillée avant paiement'}
                                            className='flex-1 min-w-0 px-4 py-2.5 bg-gray-100 rounded-full text-base sm:text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition disabled:opacity-60'
                                            disabled={sending || !unlocked}
                                        />
                                        <button
                                            type='submit'
                                            aria-label='Envoyer'
                                            disabled={!newMessage.trim() || sending || !unlocked}
                                            className='cursor-pointer w-11 h-11 flex-shrink-0 flex items-center justify-center bg-gray-900 text-white rounded-full hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                        >
                                            {sending
                                                ? <span className='w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin' aria-hidden='true'></span>
                                                : <Icon d={ICON.send} className='w-5 h-5 rotate-90' />}
                                        </button>
                                    </div>
                                    {isInfluencer && unlocked && (
                                        <p className='text-xs text-gray-500 mt-2 px-1'>
                                            Vidéo terminée ? Déposez-la ici ({MAX_VIDEO_MB} Mo max) : la marque pourra la valider ou demander des modifications.
                                        </p>
                                    )}
                                </form>
                            </>
                        ) : (
                            <div className='flex-1 hidden md:flex items-center justify-center p-8'>
                                <div className='text-center'>
                                    <div className='w-16 h-16 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mx-auto mb-4'>
                                        <Icon d={ICON.chat} className='w-8 h-8' />
                                    </div>
                                    <p className='text-gray-900 font-semibold text-lg'>Sélectionnez une conversation</p>
                                    <p className='text-sm text-gray-500 mt-1'>Choisissez une conversation dans la liste pour commencer</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </MotionConfig>
    )
}

export default Messages
