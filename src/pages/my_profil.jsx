import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { doc, updateDoc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore'
import { privateProfileRef } from '../utils/privateProfile'
import {
    db,
    TIKTOK_CONNECT_URL,
    TIKTOK_CALLBACK_URL,
    STRIPE_APPROVE_COLLAB_URL,
    STRIPE_CREATE_CHECKOUT_URL,
    RESPOND_TO_COLLABORATION_REQUEST_URL,
    DISPUTE_COLLABORATION_URL
} from '../config/firebase'
import PhotoUpload from '../components/PhotoUpload'
import PortfolioGallery from '../components/PortfolioGallery'
import SEO from '../components/SEO'
import { useToast } from '../context/ToastContext'
import { warmUpFunction } from '../utils/warmup'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'

// Libellé + couleur du badge de statut d'une collaboration, communs marque/influenceur.
const COLLAB_STATUS_BADGES = {
    pending_acceptance: { label: 'En attente de réponse', className: 'bg-blue-100 text-blue-800' },
    accepted_awaiting_payment: { label: 'Acceptée - à payer', className: 'bg-purple-100 text-purple-800' },
    declined: { label: 'Refusée', className: 'bg-red-100 text-red-800' },
    pending: { label: 'En cours', className: 'bg-yellow-100 text-yellow-800' },
    completed: { label: 'Terminé', className: 'bg-green-100 text-green-800' },
    refunded: { label: 'Annulée - remboursée', className: 'bg-gray-200 text-gray-700' }
}

const getCollabStatusBadge = (status) =>
    COLLAB_STATUS_BADGES[status] || { label: status || 'N/A', className: 'bg-gray-100 text-gray-800' }

// ---------- Éléments d'interface communs aux espaces marque et créateur ----------

const fieldLabel = 'block text-sm font-semibold text-gray-800 mb-1.5'
const fieldInput = 'w-full px-4 py-3 text-base bg-white border border-gray-300 rounded-xl hover:border-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-primary/40 outline-none transition-colors duration-200'
const primaryBtn = 'cursor-pointer inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-6 py-3 font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
const pillBtn = 'cursor-pointer inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:border-gray-900 transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
const pillBtnDark = 'cursor-pointer inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
const pillBtnDanger = 'cursor-pointer inline-flex items-center justify-center rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300'

const ProfileHeader = ({ photoURL, initial, eyebrow, title, subtitle, description, website, stats, action }) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className='relative overflow-hidden rounded-3xl bg-gray-900 text-white p-6 sm:p-8 mb-8'
    >
        <div className='absolute -top-32 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl' aria-hidden='true'></div>
        <div className='relative flex flex-col md:flex-row md:items-center gap-6'>
            {photoURL ? (
                <img src={photoURL} alt='' className='w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-white/10 flex-shrink-0' />
            ) : (
                <div className='w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary text-gray-900 flex items-center justify-center text-3xl font-bold flex-shrink-0'>{initial}</div>
            )}
            <div className='flex-1 min-w-0'>
                <p className='text-sm font-semibold uppercase tracking-wider text-primary mb-1'>{eyebrow}</p>
                <h1 className='text-3xl sm:text-4xl font-bold tracking-tight truncate'>{title}</h1>
                <p className='text-gray-400 mt-1 truncate'>{subtitle}</p>
                {description && <p className='text-sm text-gray-300 mt-2 max-w-xl'>{description}</p>}
                {website && (
                    <a href={website.startsWith('http') ? website : `https://${website}`} target='_blank' rel='noopener noreferrer' className='text-sm text-primary underline underline-offset-4 mt-1 inline-block'>
                        {website}
                    </a>
                )}
            </div>
            {action && (
                <button onClick={action.onClick} className='cursor-pointer self-start md:self-center rounded-full bg-white text-gray-900 px-5 py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'>
                    {action.label}
                </button>
            )}
        </div>
        {stats && (
            <dl className={`relative grid grid-cols-2 ${stats.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-3 mt-8`}>
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 + i * 0.06 }}
                        className='flex flex-col-reverse rounded-2xl bg-white/5 border border-white/10 p-4'
                    >
                        <dt className='text-xs sm:text-sm text-gray-400 mt-1'>{stat.label}</dt>
                        <dd className='text-2xl sm:text-3xl font-bold tracking-tight'>{stat.value}</dd>
                    </motion.div>
                ))}
            </dl>
        )}
    </motion.div>
)

// Section dépliable : les titres restent toujours visibles (pas de débordement comme
// avec des onglets sur mobile), un clic ouvre ou ferme le contenu.
const AccordionSection = ({ id, title, description, badge, open, onToggle, children }) => (
    <section className={`rounded-3xl border bg-white overflow-hidden transition-colors duration-200 ${open ? 'border-gray-900' : 'border-gray-200 hover:border-gray-400'}`}>
        <h2>
            <button
                type='button'
                id={`section-${id}-button`}
                aria-expanded={open}
                aria-controls={`section-${id}`}
                onClick={onToggle}
                className='cursor-pointer w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary rounded-3xl'
            >
                <span className='min-w-0'>
                    <span className='flex items-center gap-2 text-lg sm:text-xl font-bold text-gray-900'>
                        {title}
                        {badge > 0 && <span className='rounded-full bg-primary text-gray-900 text-xs font-bold px-2 py-0.5'>{badge}</span>}
                    </span>
                    {description && <span className='block text-sm text-gray-500 mt-0.5'>{description}</span>}
                </span>
                <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${open ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7' />
                    </motion.svg>
                </span>
            </button>
        </h2>
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    id={`section-${id}`}
                    role='region'
                    aria-labelledby={`section-${id}-button`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className='overflow-hidden'
                >
                    <div className='px-5 sm:px-6 pb-6'>{children}</div>
                </motion.div>
            )}
        </AnimatePresence>
    </section>
)

const Card = ({ title, text, action, className = '', children }) => (
    <div className={`rounded-2xl bg-gray-50 p-5 ${className}`}>
        <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5'>
            <div className='min-w-0'>
                <h3 className='text-lg font-bold text-gray-900'>{title}</h3>
                {text && <p className='text-sm text-gray-500 mt-1'>{text}</p>}
            </div>
            {action && <div className='flex-shrink-0 whitespace-nowrap'>{action}</div>}
        </div>
        {children}
    </div>
)

const EmptyState = ({ title, text, action }) => (
    <div className='flex flex-col items-center text-center py-16 px-6 rounded-3xl border border-dashed border-gray-300'>
        <div className='w-14 h-14 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mb-5'>
            <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' /></svg>
        </div>
        <p className='text-lg font-semibold text-gray-900 mb-1'>{title}</p>
        <p className='text-gray-500 max-w-md mb-6'>{text}</p>
        {action && <button onClick={action.onClick} className={primaryBtn}>{action.label}</button>}
    </div>
)

// Détail du paiement d'une collaboration (séquestre, validations, versement).
const PaymentDetails = ({ collab }) => {
    if (collab.status === 'pending_acceptance' || collab.status === 'declined') return null
    const items = [
        collab.paymentStatus && ['Paiement', collab.paymentStatus === 'funds_held' ? 'Fonds sécurisés' : collab.paymentStatus],
        collab.paymentStatus === 'funds_held' && ['Validation marque', collab.brandApproved ? 'Oui' : 'Non'],
        collab.paymentStatus === 'funds_held' && ['Validation influenceur', collab.influencerApproved ? 'Oui' : 'Non'],
        collab.payoutStatus === 'ready_for_transfer' && ['Versement', 'En attente de virement'],
        collab.payoutStatus === 'paid' && ['Versement', 'Effectué']
    ].filter(Boolean)
    if (items.length === 0) return null
    return (
        <ul className='flex flex-wrap gap-1.5 mt-3'>
            {items.map(([label, value]) => (
                <li key={label} className='rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700'>
                    <span className='text-gray-500'>{label} :</span> <span className='font-semibold'>{value}</span>
                </li>
            ))}
        </ul>
    )
}

// Composant pour le profil des marques
const BrandProfile = ({ currentUser, userData }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const toast = useToast()
    const { refreshUserData } = useAuth()
    const [purchases, setPurchases] = useState([])
    const [loading, setLoading] = useState(true)
    const [approvingId, setApprovingId] = useState('')
    const [payingId, setPayingId] = useState('')
    const [savingInfo, setSavingInfo] = useState(false)
    const [profileForm, setProfileForm] = useState({
        phone: userData?.phone || '',
        website: userData?.website || '',
        description: userData?.description || ''
    })

    const handleSaveProfileInfo = async () => {
        setSavingInfo(true)
        try {
            // Le téléphone est une donnée privée (sous-document private/profile).
            await setDoc(privateProfileRef(db, 'brands', currentUser.uid), {
                phone: profileForm.phone.trim()
            }, { merge: true })
            await updateDoc(doc(db, 'brands', currentUser.uid), {
                website: profileForm.website.trim(),
                description: profileForm.description.trim(),
                updatedAt: new Date().toISOString()
            })
            await refreshUserData()
            toast.success('Informations mises à jour avec succès')
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error)
            toast.error('Erreur lors de la mise à jour des informations')
        } finally {
            setSavingInfo(false)
        }
    }

    const handlePhotoUploaded = async (url) => {
        try {
            await updateDoc(doc(db, 'brands', currentUser.uid), {
                photoURL: url,
                updatedAt: new Date().toISOString()
            })
            await refreshUserData()
            toast.success('Photo mise à jour avec succès')
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la photo:', error)
            toast.error('Erreur lors de la mise à jour de la photo')
        }
    }
    const [disputingId, setDisputingId] = useState('')
    const [openSections, setOpenSections] = useState({ collabs: true, infos: false })
    const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    const [showRequestSent, setShowRequestSent] = useState(Boolean(location.state?.requestSent))

    useEffect(() => {
        if (!showRequestSent) return
        const timeout = setTimeout(() => setShowRequestSent(false), 6000)
        return () => clearTimeout(timeout)
    }, [showRequestSent])

    const handlePayNow = async (purchaseId) => {
        if (!STRIPE_CREATE_CHECKOUT_URL) {
            toast.error('Configuration Stripe manquante pour le paiement.')
            return
        }

        setPayingId(purchaseId)
        try {
            const idToken = await currentUser.getIdToken()
            const response = await fetch(STRIPE_CREATE_CHECKOUT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationIds: [purchaseId] })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Impossible de créer la session de paiement')
            }
            if (!data?.url) {
                throw new Error('Stripe n\'a pas retourné d\'URL de paiement')
            }

            window.location.href = data.url
        } catch (error) {
            console.error('Erreur paiement:', error)
            toast.error(error.message || 'Erreur lors du paiement')
        } finally {
            setPayingId('')
        }
    }

    const handleApprovePurchase = async (purchaseId) => {
        if (!STRIPE_APPROVE_COLLAB_URL) {
            toast.error('Configuration Stripe manquante pour la validation.')
            return
        }

        setApprovingId(purchaseId)
        try {
            const idToken = await currentUser.getIdToken()
            const response = await fetch(STRIPE_APPROVE_COLLAB_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId: purchaseId })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Erreur lors de la validation')
            }

            setPurchases((prev) =>
                prev.map((purchase) =>
                    purchase.id === purchaseId
                        ? {
                              ...purchase,
                              brandApproved: true,
                              payoutStatus: data?.awaitingManualTransfer ? 'ready_for_transfer' : purchase.payoutStatus
                          }
                        : purchase
                )
            )

            toast.success(data?.awaitingManualTransfer
                ? 'Validation confirmée. Le virement à l\'influenceur sera effectué sous peu.'
                : 'Validation enregistrée. En attente de validation influenceur.')
        } catch (error) {
            console.error('Erreur validation marque:', error)
            toast.error(error.message || 'Erreur lors de la validation')
        } finally {
            setApprovingId('')
        }
    }

    const handleDisputeCollaboration = async (purchaseId) => {
        if (!DISPUTE_COLLABORATION_URL) {
            toast.error('Configuration manquante pour signaler un désaccord.')
            return
        }

        if (!window.confirm('Confirmez-vous vouloir annuler cette collaboration ? La marque sera intégralement remboursée et le versement à l\'influenceur ne sera pas effectué.')) {
            return
        }

        setDisputingId(purchaseId)
        try {
            const idToken = await currentUser.getIdToken()
            const response = await fetch(DISPUTE_COLLABORATION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId: purchaseId })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Erreur lors du remboursement')
            }

            setPurchases((prev) =>
                prev.map((purchase) =>
                    purchase.id === purchaseId
                        ? { ...purchase, status: 'refunded', paymentStatus: 'refunded' }
                        : purchase
                )
            )

            toast.success('Collaboration annulée et remboursée.')
        } catch (error) {
            console.error('Erreur remboursement:', error)
            toast.error(error.message || 'Erreur lors du remboursement')
        } finally {
            setDisputingId('')
        }
    }

    useEffect(() => {
        const loadPurchases = async () => {
            if (!currentUser) return
            
            try {
                // Charger les achats/collaborations de la marque
                const q = query(
                    collection(db, 'collaborations'),
                    where('brandId', '==', currentUser.uid)
                    // Temporairement supprimé orderBy en attendant l'index
                    // orderBy('createdAt', 'desc')
                )
                const querySnapshot = await getDocs(q)
                let purchasesData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                
                // Tri côté client
                purchasesData.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0
                    const bTime = b.createdAt?.toMillis?.() || 0
                    return bTime - aTime
                })
                
                setPurchases(purchasesData)
            } catch (error) {
                console.error('Erreur lors du chargement des achats:', error)
            } finally {
                setLoading(false)
            }
        }

        loadPurchases()
    }, [currentUser])

    const totalSpent = purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0)
    const pendingPurchases = purchases.filter(p => p.status === 'pending').length
    const completedPurchases = purchases.filter(p => p.status === 'completed').length

    const brandStats = [
        { label: 'Total dépensé', value: `${totalSpent.toLocaleString('fr-FR')} €` },
        { label: 'Collaborations', value: purchases.length },
        { label: 'En cours', value: pendingPurchases },
        { label: 'Terminées', value: completedPurchases }
    ]

    return (
        <MotionConfig reducedMotion='user'>
        <div className='pt-8 md:pt-12 pb-20'>
            <SEO title='Mon profil' noindex />
            <AnimatePresence>
                {showRequestSent && (
                    <motion.div
                        role='status'
                        initial={{ opacity: 0, y: -12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        className='fixed top-28 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-lg flex items-center gap-3'
                    >
                        <svg className='w-5 h-5 text-green-700 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' /></svg>
                        <p className='text-sm sm:text-base font-medium text-green-800'>
                            {"Demande envoyée ! Vous serez invité(e) à payer dès qu'un influenceur accepte."}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <ProfileHeader
                photoURL={userData?.photoURL}
                initial={userData?.brandName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                eyebrow='Espace marque'
                title={userData?.brandName || 'Ma marque'}
                subtitle={currentUser.email}
                description={userData?.description}
                website={userData?.website}
                stats={brandStats}
            />

            <div className='space-y-3'>
                <AccordionSection
                    id='brand-collabs'
                    title={`Mes collaborations (${purchases.length})`}
                    description='Suivi, paiements et validations'
                    open={openSections.collabs}
                    onToggle={() => toggleSection('collabs')}
                >
                        {loading ? (
                            <div className='flex justify-center py-16'><div className='w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin' aria-label='Chargement' /></div>
                        ) : purchases.length > 0 ? (
                            <ul className='space-y-3'>
                                {purchases.map((purchase) => {
                                    const badge = getCollabStatusBadge(purchase.status)
                                    return (
                                        <li key={purchase.id} className='rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 hover:border-gray-400 transition-colors duration-200'>
                                            <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                                                <div className='min-w-0'>
                                                    <div className='flex flex-wrap items-center gap-2 mb-1'>
                                                        <h3 className='text-lg font-semibold text-gray-900 truncate'>{purchase.influencerName || 'Influenceur'}</h3>
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
                                                    </div>
                                                    <p className='text-sm text-gray-600'>{purchase.description || purchase.package || 'Collaboration'}</p>
                                                    <p className='text-xs text-gray-400 mt-1'>{purchase.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}</p>
                                                    <PaymentDetails collab={purchase} />
                                                </div>
                                                <p className='text-2xl font-bold text-gray-900 whitespace-nowrap'>{purchase.amount?.toLocaleString('fr-FR') || '0'} €</p>
                                            </div>
                                            <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100'>
                                                <button onClick={() => navigate('/messages', { state: { influencerId: purchase.influencerId } })} className={pillBtn}>
                                                    Ouvrir la conversation
                                                </button>
                                                {purchase.status === 'accepted_awaiting_payment' && (
                                                    <button onClick={() => handlePayNow(purchase.id)} disabled={payingId === purchase.id} className={pillBtnDark}>
                                                        {payingId === purchase.id ? 'Redirection...' : 'Payer maintenant'}
                                                    </button>
                                                )}
                                                {purchase.paymentStatus === 'funds_held' && !purchase.brandApproved && (
                                                    <button onClick={() => handleApprovePurchase(purchase.id)} disabled={approvingId === purchase.id} className={pillBtnDark}>
                                                        {approvingId === purchase.id ? 'Validation...' : 'Valider et autoriser le déblocage'}
                                                    </button>
                                                )}
                                                {purchase.paymentStatus === 'funds_held' && purchase.payoutStatus !== 'ready_for_transfer' && purchase.payoutStatus !== 'paid' && (
                                                    <button onClick={() => handleDisputeCollaboration(purchase.id)} disabled={disputingId === purchase.id} className={pillBtnDanger}>
                                                        {disputingId === purchase.id ? 'Traitement...' : 'Signaler un désaccord et rembourser'}
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <EmptyState
                                title='Aucune collaboration pour le moment'
                                text='Vos collaborations apparaîtront ici.'
                                action={{ label: 'Découvrir les talents', onClick: () => navigate('/talents') }}
                            />
                        )}
                </AccordionSection>

                <AccordionSection
                    id='brand-infos'
                    title='Informations'
                    description='Logo, coordonnées et description de la marque'
                    open={openSections.infos}
                    onToggle={() => toggleSection('infos')}
                >
                        <div className='grid lg:grid-cols-2 gap-8'>
                            <div>
                                <PhotoUpload
                                    userId={currentUser.uid}
                                    currentPhotoURL={userData?.photoURL || ''}
                                    onPhotoUploaded={handlePhotoUploaded}
                                    label='Logo / photo de la marque'
                                    folder='profile_photos'
                                />
                            </div>
                            <div className='space-y-5'>
                                <div>
                                    <label htmlFor='brand-name' className={fieldLabel}>Nom de la marque</label>
                                    <input id='brand-name' type='text' value={userData?.brandName || ''} readOnly className={`${fieldInput} bg-gray-50 text-gray-600`} />
                                </div>
                                <div>
                                    <label htmlFor='brand-email' className={fieldLabel}>Email</label>
                                    <input id='brand-email' type='email' value={currentUser.email} readOnly className={`${fieldInput} bg-gray-50 text-gray-600`} />
                                </div>
                                <div>
                                    <label htmlFor='brand-phone' className={fieldLabel}>Téléphone</label>
                                    <input id='brand-phone' type='tel' autoComplete='tel' value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder='+33 6 12 34 56 78' className={fieldInput} />
                                </div>
                                <div>
                                    <label htmlFor='brand-website' className={fieldLabel}>Site web</label>
                                    <input id='brand-website' type='url' autoComplete='url' value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} placeholder='https://votresite.com' className={fieldInput} />
                                </div>
                                <div>
                                    <label htmlFor='brand-description' className={fieldLabel}>Description</label>
                                    <textarea id='brand-description' value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value.slice(0, 280) })} placeholder='Présentez votre marque en quelques mots...' rows={4} className={`${fieldInput} resize-none`} />
                                    <p className='text-xs text-gray-400 mt-1 text-right'>{profileForm.description.length}/280</p>
                                </div>
                                <div className='flex justify-end'>
                                    <button type='button' onClick={handleSaveProfileInfo} disabled={savingInfo} className={primaryBtn}>
                                        {savingInfo ? 'Enregistrement...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                </AccordionSection>
            </div>
        </div>
        </MotionConfig>
    )
}

const MyProfile = () => {
    const navigate = useNavigate()
    const { currentUser, userData, userType, refreshUserData } = useAuth()
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })
    const [openSections, setOpenSections] = useState({ collabs: true, public: false, account: false })
    const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
    const popupRef = useRef(null)
    const [collaborations, setCollaborations] = useState([])
    const [loadingCollabs, setLoadingCollabs] = useState(true)
    const [profilePhotos, setProfilePhotos] = useState([])
    const [brandVideos, setBrandVideos] = useState([])
    const [pricing, setPricing] = useState({
        tiktok_video: 800
    })
    const [approvingCollabId, setApprovingCollabId] = useState('')
    const [respondingCollabId, setRespondingCollabId] = useState('')
    const [disputingCollabId, setDisputingCollabId] = useState('')
    const [bankDetails, setBankDetails] = useState({ accountHolderName: '', iban: '', bic: '' })

    // Réveille la fonction pendant que l'influenceur consulte son profil, plutôt qu'au
    // moment où il clique sur accepter/refuser (voir utils/warmup.js).
    useEffect(() => {
        if (userType === 'influencer') {
            warmUpFunction(RESPOND_TO_COLLABORATION_REQUEST_URL)
        }
    }, [userType])
    const [bankDetailsSaved, setBankDetailsSaved] = useState(false)
    const [editingBankDetails, setEditingBankDetails] = useState(false)
    const [savingBankDetails, setSavingBankDetails] = useState(false)

    const functionsOrigin = useMemo(() => {
        try {
            // Le popup TikTok envoie son postMessage depuis tiktok_callback_handler,
            // pas depuis tiktok_connect : ce sont deux Cloud Run distincts avec des
            // origines différentes, il faut valider contre celle du callback.
            return new URL(TIKTOK_CALLBACK_URL).origin
        } catch (error) {
            console.error('Invalid Cloud Run URL, cannot validate OAuth responses.', error)
            return null
        }
    }, [])

    useEffect(() => {
        if (!functionsOrigin) return

        const successMessages = {
            'tiktok-connected': 'TikTok connecté avec succès !'
        }

        const handleMessage = async (event) => {
            if (event.origin !== functionsOrigin) return
            const { type } = event.data || {}
            if (!successMessages[type]) return

            popupRef.current?.close()
            popupRef.current = null
            setMessage({ type: 'success', text: successMessages[type] })
            await refreshUserData()
        }

        window.addEventListener('message', handleMessage)
        return () => window.removeEventListener('message', handleMessage)
    }, [functionsOrigin, refreshUserData])
    
    console.log('MyProfile - currentUser:', currentUser)
    console.log('MyProfile - userData:', userData)
    console.log('MyProfile - userType:', userType)
    
    const [socialAccounts, setSocialAccounts] = useState({
        tiktok: {
            connected: false,
            username: '',
            followers: 0,
            lastUpdated: null
        }
    })

    useEffect(() => {
        if (userData?.socialAccounts) {
            const toNumber = (value) => {
                const num = Number(value)
                return Number.isFinite(num) ? num : 0
            }

            const normalizeSocialAccount = (account = {}) => ({
                connected: Boolean(account.connected),
                username: account.username || account.displayName || '',
                followers: toNumber(account.followers),
                lastUpdated: account.lastUpdated || null
            })

            // Merger les données avec les valeurs par défaut
            setSocialAccounts({
                tiktok: normalizeSocialAccount(userData.socialAccounts.tiktok)
            })
        }
        
        // Charger les photos, vidéos et prix du profil
        if (userData?.profilePhotos) setProfilePhotos(userData.profilePhotos)
        if (userData?.brandVideos) setBrandVideos(userData.brandVideos)
        if (userData?.pricing) setPricing(userData.pricing)
    }, [userData])

    // Charger le RIB de l'influenceur (collection séparée, non publique)
    useEffect(() => {
        const loadBankDetails = async () => {
            if (!currentUser) return
            try {
                const snap = await getDoc(doc(db, 'bankDetails', currentUser.uid))
                if (snap.exists()) {
                    const data = snap.data()
                    setBankDetails({
                        accountHolderName: data.accountHolderName || '',
                        iban: data.iban || '',
                        bic: data.bic || ''
                    })
                    setBankDetailsSaved(true)
                }
            } catch (error) {
                console.error('Erreur lors du chargement du RIB:', error)
            }
        }

        loadBankDetails()
    }, [currentUser])

    // Charger les collaborations de l'influenceur
    useEffect(() => {
        const loadCollaborations = async () => {
            if (!currentUser) return
            
            console.log('Chargement collaborations pour influenceur ID:', currentUser.uid)
            
            try {
                const q = query(
                    collection(db, 'collaborations'),
                    where('influencerId', '==', currentUser.uid)
                    // Temporairement supprimé orderBy en attendant l'index
                    // orderBy('createdAt', 'desc')
                )
                const querySnapshot = await getDocs(q)
                let collabsData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                
                // Tri côté client en attendant l'index
                collabsData.sort((a, b) => {
                    const aTime = a.createdAt?.toMillis?.() || 0
                    const bTime = b.createdAt?.toMillis?.() || 0
                    return bTime - aTime
                })
                
                console.log('Collaborations trouvées:', collabsData)
                setCollaborations(collabsData)
            } catch (error) {
                console.error('Erreur lors du chargement des collaborations:', error)
            } finally {
                setLoadingCollabs(false)
            }
        }

        loadCollaborations()
    }, [currentUser])

    // Ouvre une popup OAuth pour TikTok
    const openOAuthPopup = async (endpoint, windowName) => {
        if (!currentUser) {
            setMessage({ type: 'error', text: 'Vous devez être connecté pour lier un compte.' })
            return
        }

        const width = 500
        const height = 600
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const idToken = await currentUser.getIdToken()
        const popupUrl = new URL(endpoint)
        popupUrl.searchParams.set('userId', currentUser.uid)
        popupUrl.searchParams.set('idToken', idToken)

        const popup = window.open(
            popupUrl.toString(),
            windowName,
            `width=${width},height=${height},left=${left},top=${top}`
        )

        if (!popup) {
            throw new Error('Impossible d’ouvrir la fenêtre d’authentification (popup bloquée).')
        }

        popupRef.current = popup
    }

    // Fonction pour connecter TikTok
    const connectTikTok = async () => {
        setLoading(true)
        setMessage({ type: '', text: '' })
        
        try {
            await openOAuthPopup(TIKTOK_CONNECT_URL, 'TikTok Login')
        } catch (error) {
            console.error('Error connecting TikTok:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la connexion à TikTok' })
        } finally {
            setLoading(false)
        }
    }

    const handleSaveBankDetails = async () => {
        const accountHolderName = bankDetails.accountHolderName.trim()
        const iban = bankDetails.iban.replace(/\s+/g, '').toUpperCase()
        const bic = bankDetails.bic.replace(/\s+/g, '').toUpperCase()

        if (!accountHolderName) {
            setMessage({ type: 'error', text: 'Veuillez indiquer le titulaire du compte' })
            return
        }

        if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
            setMessage({ type: 'error', text: 'IBAN invalide, vérifiez le format saisi' })
            return
        }

        setSavingBankDetails(true)
        setMessage({ type: '', text: '' })
        try {
            await setDoc(doc(db, 'bankDetails', currentUser.uid), {
                accountHolderName,
                iban,
                bic,
                updatedAt: serverTimestamp()
            }, { merge: true })

            setBankDetails({ accountHolderName, iban, bic })
            setBankDetailsSaved(true)
            setEditingBankDetails(false)
            setMessage({ type: 'success', text: 'Coordonnées bancaires enregistrées' })
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement du RIB:', error)
            setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement des coordonnées bancaires' })
        } finally {
            setSavingBankDetails(false)
        }
    }

    const respondToCollaborationRequest = async (collaborationId, accept) => {
        if (!RESPOND_TO_COLLABORATION_REQUEST_URL) {
            setMessage({ type: 'error', text: 'Configuration manquante pour répondre à cette demande.' })
            return
        }

        setRespondingCollabId(collaborationId)
        try {
            const idToken = await currentUser.getIdToken()
            const response = await fetch(RESPOND_TO_COLLABORATION_REQUEST_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId, accept })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Erreur lors de la réponse à la demande')
            }

            setCollaborations((prev) =>
                prev.map((collab) =>
                    collab.id === collaborationId
                        ? { ...collab, status: data.status, influencerAccepted: accept }
                        : collab
                )
            )

            setMessage({
                type: 'success',
                text: accept
                    ? 'Demande acceptée. La marque a été prévenue et peut maintenant payer.'
                    : 'Demande refusée. La marque a été prévenue.'
            })
        } catch (error) {
            console.error('Erreur réponse à la demande:', error)
            setMessage({ type: 'error', text: error.message || 'Erreur lors de la réponse à la demande' })
        } finally {
            setRespondingCollabId('')
        }
    }

    const approveCollaborationAsInfluencer = async (collaborationId) => {
        if (!STRIPE_APPROVE_COLLAB_URL) {
            setMessage({ type: 'error', text: 'Configuration Stripe manquante pour la validation.' })
            return
        }

        setApprovingCollabId(collaborationId)
        try {
            const idToken = await currentUser.getIdToken()
            const response = await fetch(STRIPE_APPROVE_COLLAB_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Erreur lors de la validation')
            }

            setCollaborations((prev) =>
                prev.map((collab) =>
                    collab.id === collaborationId
                        ? {
                              ...collab,
                              influencerApproved: true,
                              payoutStatus: data?.awaitingManualTransfer ? 'ready_for_transfer' : collab.payoutStatus
                          }
                        : collab
                )
            )

            setMessage({
                type: 'success',
                text: data?.awaitingManualTransfer
                    ? 'Validation confirmée. Vous recevrez votre virement (85%) sous peu, une fois traité par l\'équipe.'
                    : 'Validation enregistrée. En attente de validation marque.'
            })
        } catch (error) {
            console.error('Erreur validation influenceur:', error)
            setMessage({ type: 'error', text: error.message || 'Erreur lors de la validation' })
        } finally {
            setApprovingCollabId('')
        }
    }

    const disputeCollaborationAsInfluencer = async (collaborationId) => {
        if (!DISPUTE_COLLABORATION_URL) {
            setMessage({ type: 'error', text: 'Configuration manquante pour signaler un désaccord.' })
            return
        }

        if (!window.confirm('Confirmez-vous vouloir annuler cette collaboration ? La marque sera intégralement remboursée et vous ne recevrez pas de versement.')) {
            return
        }

        setDisputingCollabId(collaborationId)
        try {
            const idToken = await currentUser.getIdToken()
            const response = await fetch(DISPUTE_COLLABORATION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({ collaborationId })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Erreur lors du remboursement')
            }

            setCollaborations((prev) =>
                prev.map((collab) =>
                    collab.id === collaborationId
                        ? { ...collab, status: 'refunded', paymentStatus: 'refunded' }
                        : collab
                )
            )

            setMessage({ type: 'success', text: 'Collaboration annulée. La marque a été remboursée.' })
        } catch (error) {
            console.error('Erreur remboursement:', error)
            setMessage({ type: 'error', text: error.message || 'Erreur lors du remboursement' })
        } finally {
            setDisputingCollabId('')
        }
    }

    // Fonction pour déconnecter un réseau social
    const disconnectSocial = async (platform) => {
        if (!confirm(`Êtes-vous sûr de vouloir déconnecter ${platform} ?`)) return
        
        setLoading(true)
        try {
            const updatedAccounts = { ...socialAccounts }
            updatedAccounts[platform] = {
                connected: false,
                username: '',
                followers: 0,
                lastUpdated: null
            }
            
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                socialAccounts: updatedAccounts,
                [`tokens.${platform}`]: null
            })
            
            setSocialAccounts(updatedAccounts)
            setMessage({ type: 'success', text: `${platform} déconnecté avec succès` })
        } catch (error) {
            console.error('Error disconnecting:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la déconnexion' })
        } finally {
            setLoading(false)
        }
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
        return num
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Jamais'

        let dateValue = null

        if (typeof timestamp?.toDate === 'function') {
            dateValue = timestamp.toDate()
        } else if (
            typeof timestamp === 'object' &&
            timestamp !== null &&
            typeof timestamp.seconds === 'number'
        ) {
            dateValue = new Date(timestamp.seconds * 1000)
        } else {
            dateValue = new Date(timestamp)
        }

        if (Number.isNaN(dateValue.getTime())) return 'Jamais'
        return dateValue.toLocaleDateString('fr-FR')
    }

    // Fonction pour ajouter une vidéo de collaboration
    const handleAddVideo = async () => {
        const url = prompt('Entrez l\'URL de la vidéo TikTok :')
        if (!url) return

        const brandName = prompt('Nom de la marque :')
        if (!brandName) return

        try {
            const newVideo = {
                id: Date.now(),
                url: url,
                brandName: brandName,
                addedAt: new Date().toISOString()
            }
            
            const updatedVideos = [...brandVideos, newVideo]
            setBrandVideos(updatedVideos)
            
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                brandVideos: updatedVideos
            })
            
            setMessage({ type: 'success', text: 'Vidéo ajoutée avec succès' })
        } catch (error) {
            console.error('Error adding video:', error)
            setMessage({ type: 'error', text: 'Erreur lors de l\'ajout de la vidéo' })
        }
    }

    // Fonction pour supprimer une vidéo
    const handleDeleteVideo = async (videoId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette vidéo ?')) return

        try {
            const updatedVideos = brandVideos.filter(v => v.id !== videoId)
            setBrandVideos(updatedVideos)
            
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                brandVideos: updatedVideos
            })
            
            setMessage({ type: 'success', text: 'Vidéo supprimée' })
        } catch (error) {
            console.error('Error deleting video:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
        }
    }

    // Fonction pour mettre à jour les prix
    const handleUpdatePricing = async () => {
        try {
            await updateDoc(doc(db, 'influencers', currentUser.uid), {
                pricing: pricing
            })
            
            setMessage({ type: 'success', text: 'Prix mis à jour avec succès' })
        } catch (error) {
            console.error('Error updating pricing:', error)
            setMessage({ type: 'error', text: 'Erreur lors de la mise à jour des prix' })
        }
    }

    if (userType === 'brand') {
        return <BrandProfile currentUser={currentUser} userData={userData} />
    }

    if (userType !== 'influencer') {
        return (
            <div className='pt-10 pb-20'>
                <SEO title='Mon profil' noindex />
                <EmptyState
                    title='Connectez-vous pour accéder à votre profil'
                    text='Retrouvez vos collaborations, vos informations et vos paiements.'
                    action={{ label: 'Se connecter', onClick: () => navigate('/login', { state: { from: '/my-profile' } }) }}
                />
            </div>
        )
    }

    const totalReceived = collaborations.reduce((sum, collab) => sum + (collab.baseAmount ?? collab.amount ?? 0), 0)
    const completedCollaborations = collaborations.filter(c => c.status === 'completed').length
    const pendingCollaborations = collaborations.filter(c => c.status === 'pending').length
    const pendingRequests = collaborations.filter(c => c.status === 'pending_acceptance').length
    const tiktokUsername = socialAccounts.tiktok.username || userData?.socialAccounts?.tiktok?.username

    return (
        <MotionConfig reducedMotion='user'>
        <div className='pt-8 md:pt-12 pb-20'>
            <SEO title='Mon profil' noindex />

            <ProfileHeader
                photoURL={userData?.photoURL}
                initial={userData?.name?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                eyebrow='Espace créateur'
                title={tiktokUsername ? `@${tiktokUsername}` : (userData?.name || 'Mon profil')}
                subtitle={currentUser.email}
                stats={[
                    { label: 'Total reçu', value: `${totalReceived.toLocaleString('fr-FR')} €` },
                    { label: 'En cours', value: pendingCollaborations },
                    { label: 'Terminées', value: completedCollaborations }
                ]}
                action={{ label: 'Voir mon profil public', onClick: () => navigate(`/influencer/${currentUser.uid}`) }}
            />

            <AnimatePresence>
                {message.text && (
                    <motion.div
                        role={message.type === 'success' ? 'status' : 'alert'}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className='overflow-hidden'
                    >
                        <div className={`mb-6 px-4 py-3 rounded-2xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                            {message.text}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className='space-y-3'>
                <AccordionSection
                    id='collabs'
                    title='Collaborations'
                    description='Demandes des marques et collaborations en cours'
                    badge={pendingRequests}
                    open={openSections.collabs}
                    onToggle={() => toggleSection('collabs')}
                >
                        {loadingCollabs ? (
                            <div className='flex justify-center py-16'><div className='w-10 h-10 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin' aria-label='Chargement' /></div>
                        ) : collaborations.length > 0 ? (
                            <ul className='space-y-3'>
                                {collaborations.map((collab) => {
                                    const badge = getCollabStatusBadge(collab.status)
                                    const inProgress = collab.paymentStatus === 'funds_held' && collab.payoutStatus !== 'paid'
                                    return (
                                        <li key={collab.id} className='rounded-3xl border border-gray-200 bg-white p-5 sm:p-6 hover:border-gray-400 transition-colors duration-200'>
                                            <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-4'>
                                                <div className='min-w-0'>
                                                    <div className='flex flex-wrap items-center gap-2 mb-1'>
                                                        <h3 className='text-lg font-semibold text-gray-900 truncate'>{collab.brandName || 'Marque'}</h3>
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${badge.className}`}>{badge.label}</span>
                                                    </div>
                                                    <p className='text-sm text-gray-600'>{collab.description || collab.package || 'Collaboration'}</p>
                                                    <p className='text-xs text-gray-400 mt-1'>{collab.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}</p>
                                                    {collab.status !== 'pending_acceptance' && collab.status !== 'declined' && collab.status !== 'accepted_awaiting_payment' && (
                                                        <PaymentDetails collab={collab} />
                                                    )}
                                                </div>
                                                <p className='text-2xl font-bold text-gray-900 whitespace-nowrap'>{(collab.baseAmount ?? collab.amount)?.toLocaleString('fr-FR') || '0'} €</p>
                                            </div>

                                            {inProgress && (
                                                <div className='mt-4 flex items-start gap-3 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-gray-900'>
                                                    <svg className='w-5 h-5 text-primary-dark flex-shrink-0 mt-0.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' /></svg>
                                                    <p>Vidéo terminée ? Déposez-la dans la conversation : la marque pourra la valider ou vous demander des modifications.</p>
                                                </div>
                                            )}

                                            <div className='flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100'>
                                                <button onClick={() => navigate('/messages', { state: { brandId: collab.brandId } })} className={inProgress ? pillBtnDark : pillBtn}>
                                                    {inProgress ? 'Déposer ma vidéo' : 'Ouvrir la conversation'}
                                                </button>
                                                {collab.status === 'pending_acceptance' && (
                                                    <>
                                                        <button onClick={() => respondToCollaborationRequest(collab.id, true)} disabled={respondingCollabId === collab.id} className={pillBtnDark}>
                                                            {respondingCollabId === collab.id ? '...' : 'Accepter'}
                                                        </button>
                                                        <button onClick={() => respondToCollaborationRequest(collab.id, false)} disabled={respondingCollabId === collab.id} className={pillBtn}>
                                                            Refuser
                                                        </button>
                                                    </>
                                                )}
                                                {collab.paymentStatus === 'funds_held' && !collab.influencerApproved && (
                                                    <button onClick={() => approveCollaborationAsInfluencer(collab.id)} disabled={approvingCollabId === collab.id} className={pillBtn}>
                                                        {approvingCollabId === collab.id ? 'Validation...' : 'Valider et demander le versement'}
                                                    </button>
                                                )}
                                                {collab.paymentStatus === 'funds_held' && collab.payoutStatus !== 'ready_for_transfer' && collab.payoutStatus !== 'paid' && (
                                                    <button onClick={() => disputeCollaborationAsInfluencer(collab.id)} disabled={disputingCollabId === collab.id} className={pillBtnDanger}>
                                                        {disputingCollabId === collab.id ? 'Traitement...' : 'Signaler un désaccord et rembourser'}
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : (
                            <EmptyState
                                title='Aucune collaboration pour le moment'
                                text='Les demandes des marques apparaîtront ici. Complétez votre profil public pour être plus visible.'
                                action={{ label: 'Compléter mon profil public', onClick: () => setOpenSections((prev) => ({ ...prev, public: true })) }}
                            />
                        )}
                </AccordionSection>

                <AccordionSection
                    id='public'
                    title='Profil public'
                    description='Photo, prix, portfolio et vidéos visibles par les marques'
                    open={openSections.public}
                    onToggle={() => toggleSection('public')}
                >
                    <div className='grid lg:grid-cols-2 gap-4'>
                        <Card title='Photo de profil' text='Elle apparaît sur votre profil et dans les résultats de recherche.'>
                            <PhotoUpload
                                userId={currentUser.uid}
                                currentPhotoURL={userData?.photoURL || ''}
                                onPhotoUploaded={async (url) => {
                                    try {
                                        await updateDoc(doc(db, 'influencers', currentUser.uid), {
                                            photoURL: url,
                                            updatedAt: new Date().toISOString()
                                        })
                                        await refreshUserData() // Rafraîchir les données
                                        setMessage({ type: 'success', text: 'Photo de profil mise à jour' })
                                    } catch (error) {
                                        console.error('Error updating photo:', error)
                                        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
                                    }
                                }}
                                label='Photo de profil principale'
                                folder='profile_photos'
                            />
                        </Card>

                        <Card title='Tarification' text='Vous touchez 100 % de ce prix : les frais de service sont payés par la marque.'>
                            <label htmlFor='price-tiktok' className={fieldLabel}>Prix d’une vidéo TikTok</label>
                            <div className='relative'>
                                <input
                                    id='price-tiktok'
                                    type='number'
                                    inputMode='numeric'
                                    value={pricing.tiktok_video}
                                    onChange={(e) => setPricing({ ...pricing, tiktok_video: parseInt(e.target.value) || 0 })}
                                    className={`${fieldInput} pr-10 text-lg font-semibold`}
                                    min='0'
                                />
                                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold'>€</span>
                            </div>
                            <button onClick={handleUpdatePricing} className={`${primaryBtn} w-full mt-4`}>Enregistrer le prix</button>
                        </Card>

                        <Card className='lg:col-span-2' title='Portfolio' text='Ajoutez vos meilleures photos pour montrer votre style aux marques.'>
                            <PortfolioGallery
                                userId={currentUser.uid}
                                photos={profilePhotos}
                                onPhotosUpdated={async (updatedPhotos) => {
                                    try {
                                        setProfilePhotos(updatedPhotos)
                                        await updateDoc(doc(db, 'influencers', currentUser.uid), {
                                            profilePhotos: updatedPhotos,
                                            updatedAt: new Date().toISOString()
                                        })
                                        setMessage({ type: 'success', text: 'Portfolio mis à jour' })
                                    } catch (error) {
                                        console.error('Error updating portfolio:', error)
                                        setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
                                    }
                                }}
                                maxPhotos={12}
                                maxSize={5}
                            />
                        </Card>

                        <Card
                            className='lg:col-span-2'
                            title='Collaborations vidéo'
                            text='Partagez vos collaborations passées avec des marques : elles apparaissent sur votre profil public.'
                            action={<button onClick={handleAddVideo} className={pillBtnDark}>+ Ajouter une vidéo</button>}
                        >
                            {brandVideos.length > 0 ? (
                                <ul className='grid sm:grid-cols-2 gap-3'>
                                    {brandVideos.map((video) => (
                                        <li key={video.id} className='flex items-start justify-between gap-3 rounded-2xl border border-gray-200 p-4'>
                                            <div className='min-w-0'>
                                                <p className='font-semibold text-gray-900 truncate'>{video.brandName}</p>
                                                <a href={video.url} target='_blank' rel='noopener noreferrer' className='text-sm text-gray-600 underline underline-offset-4 break-all line-clamp-1'>{video.url}</a>
                                                <p className='text-xs text-gray-400 mt-1'>Ajoutée le {new Date(video.addedAt).toLocaleDateString('fr-FR')}</p>
                                            </div>
                                            <button onClick={() => handleDeleteVideo(video.id)} aria-label={`Supprimer la vidéo ${video.brandName}`} className='cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 transition-colors duration-200'>
                                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className='text-sm text-gray-500 text-center py-6'>Aucune vidéo pour le moment.</p>
                            )}
                        </Card>
                    </div>
                </AccordionSection>

                <AccordionSection
                    id='account'
                    title='Compte & paiements'
                    description='Informations, compte TikTok et RIB'
                    open={openSections.account}
                    onToggle={() => toggleSection('account')}
                >
                    <div className='grid lg:grid-cols-2 gap-4'>
                        <Card title='Informations personnelles' text='Visibles uniquement par vous et par l’équipe Collabzz.'>
                            <dl className='divide-y divide-gray-100'>
                                {[
                                    ['Nom', userData?.name],
                                    ['Email', currentUser?.email],
                                    ['Ville', [userData?.city, userData?.country].filter(Boolean).join(', ')],
                                    ['Catégorie', userData?.category]
                                ].map(([label, value]) => (
                                    <div key={label} className='flex justify-between gap-4 py-3 text-sm'>
                                        <dt className='text-gray-500'>{label}</dt>
                                        <dd className='font-medium text-gray-900 text-right break-all'>{value || '—'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>

                        <Card title='Compte TikTok' text='Vos statistiques sont mises à jour automatiquement chaque jour.'>
                            <div className='flex items-center justify-between gap-4'>
                                <div className='flex items-center gap-3 min-w-0'>
                                    <span className='w-12 h-12 bg-black rounded-2xl flex items-center justify-center flex-shrink-0'>
                                        <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path d='M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.10-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z' /></svg>
                                    </span>
                                    <div className='min-w-0'>
                                        <p className='font-semibold text-gray-900'>TikTok</p>
                                        <p className='text-sm text-gray-500 truncate'>{socialAccounts.tiktok.connected ? `@${socialAccounts.tiktok.username}` : 'Non connecté'}</p>
                                    </div>
                                </div>
                                {socialAccounts.tiktok.connected ? (
                                    <button onClick={() => disconnectSocial('tiktok')} disabled={loading} className={pillBtnDanger}>Déconnecter</button>
                                ) : (
                                    <button onClick={connectTikTok} disabled={loading} className={pillBtnDark}>{loading ? 'Connexion...' : 'Connecter'}</button>
                                )}
                            </div>
                            {socialAccounts.tiktok.connected && (
                                <dl className='grid grid-cols-2 gap-3 mt-5'>
                                    <div className='flex flex-col-reverse rounded-2xl bg-gray-50 p-4'>
                                        <dt className='text-xs text-gray-500 mt-1'>Abonnés</dt>
                                        <dd className='text-2xl font-bold text-gray-900'>{formatNumber(socialAccounts.tiktok.followers)}</dd>
                                    </div>
                                    <div className='flex flex-col-reverse rounded-2xl bg-gray-50 p-4'>
                                        <dt className='text-xs text-gray-500 mt-1'>Dernière mise à jour</dt>
                                        <dd className='text-sm font-semibold text-gray-900'>{formatDate(socialAccounts.tiktok.lastUpdated)}</dd>
                                    </div>
                                </dl>
                            )}
                        </Card>

                        <Card className='lg:col-span-2' title='Coordonnées bancaires (RIB)' text='Renseignez votre RIB pour recevoir vos virements. Une fois une collaboration validée par vous et la marque, nous vous versons 100 % du prix que vous avez fixé.'>
                            {bankDetailsSaved && !editingBankDetails ? (
                                <div className='flex items-center justify-between gap-4 rounded-2xl bg-gray-50 p-4'>
                                    <div>
                                        <p className='text-sm font-semibold text-gray-900'>{bankDetails.accountHolderName}</p>
                                        <p className='text-sm text-gray-600 font-mono'>•••• •••• •••• {bankDetails.iban.slice(-4)}</p>
                                    </div>
                                    <button onClick={() => setEditingBankDetails(true)} className={pillBtn}>Modifier</button>
                                </div>
                            ) : (
                                <div className='grid sm:grid-cols-3 gap-4'>
                                    <div>
                                        <label htmlFor='rib-holder' className={fieldLabel}>Titulaire du compte</label>
                                        <input id='rib-holder' type='text' autoComplete='name' value={bankDetails.accountHolderName} onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })} className={fieldInput} placeholder='Nom et prénom' />
                                    </div>
                                    <div>
                                        <label htmlFor='rib-iban' className={fieldLabel}>IBAN</label>
                                        <input id='rib-iban' type='text' value={bankDetails.iban} onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })} className={`${fieldInput} font-mono`} placeholder='FR76 XXXX XXXX XXXX XXXX XXXX XXX' />
                                    </div>
                                    <div>
                                        <label htmlFor='rib-bic' className={fieldLabel}>BIC / SWIFT (optionnel)</label>
                                        <input id='rib-bic' type='text' value={bankDetails.bic} onChange={(e) => setBankDetails({ ...bankDetails, bic: e.target.value })} className={`${fieldInput} font-mono`} placeholder='BNPAFRPPXXX' />
                                    </div>
                                    <div className='sm:col-span-3 flex gap-2 justify-end'>
                                        {bankDetailsSaved && <button onClick={() => setEditingBankDetails(false)} className={pillBtn}>Annuler</button>}
                                        <button onClick={handleSaveBankDetails} disabled={savingBankDetails} className={primaryBtn}>
                                            {savingBankDetails ? 'Enregistrement...' : 'Enregistrer le RIB'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                </AccordionSection>
            </div>
        </div>
        </MotionConfig>
    )
}

export default MyProfile
