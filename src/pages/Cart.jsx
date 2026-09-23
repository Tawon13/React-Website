import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { AppContext } from '../context/AppContext'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { CREATE_COLLABORATION_REQUEST_URL } from '../config/firebase'
import SEO from '../components/SEO'
import { trackEvent } from '../utils/analytics'
import { SERVICE_FEE_RATE } from '../constants/fees'
import { useToast } from '../context/ToastContext'
import { warmUpFunction } from '../utils/warmup'
import SmartImage from '../components/SmartImage'

const Cart = () => {
    const navigate = useNavigate()
    const { cartItems, removeFromCart, updateQuantity, clearCart, getTotal } = useCart()
    const { currentUser, userType } = useAuth()
    const toast = useToast()
    const { doctors } = useContext(AppContext)
    const [loading, setLoading] = useState(false)
    const [confirmClear, setConfirmClear] = useState(false)

    // Pseudo, catégorie et photo à jour depuis la liste des créateurs ; le vrai nom
    // (influencerName, envoyé au serveur) n'est jamais affiché.
    const describeItem = (item) => {
        const creator = doctors.find((d) => d._id === item.influencerId)
        const username = creator?.tiktokUsername || item.influencerUsername
        return {
            name: username ? `@${username}` : (creator?.speciality || item.influencerCategory || 'Créateur de contenu'),
            category: creator?.speciality || item.influencerCategory || '',
            image: creator?.image || item.influencerImage
        }
    }
    // Libellé de prestation sans l'emoji stocké dans la valeur (ex. « 🎥 1 Vidéo TikTok »).
    const packageLabel = (pkg) => (pkg || 'Collaboration').replace(/^[^\p{L}\p{N}]+/u, '')
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    // Réveille la fonction pendant que la marque consulte son panier, plutôt qu'au moment
    // où elle clique sur "Envoyer la demande" (voir utils/warmup.js).
    useEffect(() => {
        warmUpFunction(CREATE_COLLABORATION_REQUEST_URL)
    }, [])

    const subtotal = getTotal()
    const serviceFee = subtotal * SERVICE_FEE_RATE
    const grandTotal = subtotal + serviceFee

    const handleSendRequest = async () => {
        if (!currentUser) {
            toast.warning('Veuillez vous connecter en tant que marque pour continuer')
            navigate('/login?type=brand')
            return
        }

        if (userType !== 'brand') {
            toast.warning('Seules les marques peuvent envoyer des demandes de collaboration')
            return
        }

        if (cartItems.length === 0) {
            toast.warning('Votre panier est vide')
            return
        }

        setLoading(true)
        try {
            if (!CREATE_COLLABORATION_REQUEST_URL) {
                throw new Error('Configuration manquante côté frontend (URL de demande de collaboration).')
            }

            const idToken = await currentUser.getIdToken()
            const response = await fetch(CREATE_COLLABORATION_REQUEST_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    items: cartItems.map((item) => ({
                        influencerId: item.influencerId,
                        influencerName: item.influencerName,
                        package: item.package,
                        price: item.price,
                        quantity: item.quantity
                    }))
                })
            })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.error || 'Impossible d\'envoyer la demande')
            }

            trackEvent('generate_lead', {
                currency: 'EUR',
                value: grandTotal,
                items_count: cartItems.length
            })

            clearCart()
            navigate('/my-profile', { state: { initialTab: 'purchases', requestSent: true } })
        } catch (error) {
            console.error('Erreur complète:', error)
            console.error('Message d\'erreur:', error.message)
            console.error('Stack:', error.stack)
            toast.error(`Erreur lors de l'envoi de la demande: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const fmt = (value) => value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
    const isBrandUser = currentUser && userType === 'brand'

    return (
        <MotionConfig reducedMotion='user'>
        <div className='pt-10 md:pt-14 pb-20'>
            <SEO title='Panier' noindex />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className='mb-10'
            >
                <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>Panier</p>
                <h1 className='text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight'>Vos collaborations</h1>
                <p className='text-gray-600 text-lg mt-3' aria-live='polite'>
                    {itemCount === 0 ? 'Votre panier est vide.' : `${itemCount} prestation${itemCount > 1 ? 's' : ''} sélectionnée${itemCount > 1 ? 's' : ''}`}
                </p>
            </motion.div>

            {cartItems.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className='flex flex-col items-center text-center py-20 px-6 rounded-3xl border border-dashed border-gray-300'
                >
                    <div className='w-16 h-16 rounded-2xl bg-primary/15 text-primary-dark flex items-center justify-center mb-6'>
                        <svg className='w-8 h-8' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' /></svg>
                    </div>
                    <p className='text-xl font-semibold text-gray-900 mb-2'>Votre panier est vide</p>
                    <p className='text-gray-600 mb-8 max-w-md'>Découvrez nos talents et ajoutez des collaborations à votre panier.</p>
                    <button onClick={() => navigate('/talents')} className='cursor-pointer rounded-full bg-gray-900 text-white px-7 py-3.5 font-semibold hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'>
                        Découvrir les talents
                    </button>
                </motion.div>
            ) : (
                <div className='grid lg:grid-cols-12 gap-8'>
                    {/* Articles */}
                    <div className='lg:col-span-7 xl:col-span-8'>
                        <motion.ul layout className='space-y-3'>
                            <AnimatePresence mode='popLayout'>
                                {cartItems.map((item, index) => {
                                    const info = describeItem(item)
                                    const lineTotal = item.price * item.quantity * (1 + SERVICE_FEE_RATE)
                                    return (
                                        <motion.li
                                            key={item.id}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                                            transition={{ duration: 0.3, delay: index * 0.05, layout: { type: 'spring', stiffness: 350, damping: 34 } }}
                                            className='flex gap-4 rounded-3xl border border-gray-200 bg-white p-4 sm:p-5'
                                        >
                                            <Link to={`/influencer/${item.influencerId}`} className='flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl'>
                                                <SmartImage width={96} src={info.image} alt='' className='w-20 h-24 sm:w-24 sm:h-28 rounded-2xl object-cover bg-gray-100' />
                                            </Link>
                                            <div className='flex-1 min-w-0 flex flex-col'>
                                                <div className='flex items-start justify-between gap-3'>
                                                    <div className='min-w-0'>
                                                        <Link to={`/influencer/${item.influencerId}`} className='block font-semibold text-lg text-gray-900 truncate hover:underline underline-offset-4'>{info.name}</Link>
                                                        <p className='text-sm text-gray-500 truncate'>{packageLabel(item.package)}{info.category ? ` · ${info.category}` : ''}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        aria-label={`Retirer ${info.name} du panier`}
                                                        className='cursor-pointer w-9 h-9 -mr-1 rounded-full flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300'
                                                    >
                                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' /></svg>
                                                    </button>
                                                </div>

                                                <div className='flex items-end justify-between gap-3 mt-auto pt-3'>
                                                    <div className='inline-flex items-center rounded-full border border-gray-300' role='group' aria-label='Quantité'>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            aria-label='Diminuer la quantité'
                                                            className='cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                                        >
                                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M20 12H4' /></svg>
                                                        </button>
                                                        <motion.span key={item.quantity} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className='w-7 text-center font-semibold tabular-nums' aria-live='polite'>{item.quantity}</motion.span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            aria-label='Augmenter la quantité'
                                                            className='cursor-pointer w-9 h-9 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                                                        >
                                                            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' /></svg>
                                                        </button>
                                                    </div>
                                                    <div className='text-right'>
                                                        <p className='text-xl font-bold text-gray-900 whitespace-nowrap tabular-nums'>{fmt(lineTotal)} €</p>
                                                        <p className='text-xs text-gray-500 whitespace-nowrap'>
                                                            {item.price} €{item.quantity > 1 ? ` × ${item.quantity}` : ''} + frais (15 %)
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.li>
                                    )
                                })}
                            </AnimatePresence>
                        </motion.ul>

                        <div className='flex flex-wrap items-center justify-between gap-3 mt-5'>
                            <button onClick={() => navigate('/talents')} className='cursor-pointer inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline underline-offset-4'>
                                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 4v16m8-8H4' /></svg>
                                Ajouter d’autres créateurs
                            </button>
                            {confirmClear ? (
                                <span className='inline-flex items-center gap-2 text-sm'>
                                    <span className='text-gray-600'>Vider le panier ?</span>
                                    <button onClick={() => { clearCart(); setConfirmClear(false) }} className='cursor-pointer rounded-full bg-red-600 text-white px-3 py-1.5 font-semibold hover:bg-red-700'>Oui, vider</button>
                                    <button onClick={() => setConfirmClear(false)} className='cursor-pointer rounded-full border border-gray-300 px-3 py-1.5 font-semibold'>Annuler</button>
                                </span>
                            ) : (
                                <button onClick={() => setConfirmClear(true)} className='cursor-pointer text-sm font-semibold text-gray-500 hover:text-red-600 transition-colors duration-200'>
                                    Vider le panier
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Récapitulatif */}
                    <aside className='lg:col-span-5 xl:col-span-4'>
                        <div className='lg:sticky lg:top-28 space-y-4'>
                            <div className='rounded-3xl bg-gray-900 text-white p-6'>
                                <h2 className='text-xl font-bold mb-5'>Récapitulatif</h2>
                                <dl className='space-y-3 text-sm'>
                                    <div className='flex justify-between text-gray-300'>
                                        <dt>Prix des créateurs</dt>
                                        <dd className='tabular-nums'>{fmt(subtotal)} €</dd>
                                    </div>
                                    <div className='flex justify-between text-gray-300'>
                                        <dt>Frais de service (15 %)</dt>
                                        <dd className='tabular-nums'>{fmt(serviceFee)} €</dd>
                                    </div>
                                    <div className='flex justify-between items-baseline pt-4 mt-1 border-t border-white/10'>
                                        <dt className='font-semibold'>Total</dt>
                                        <dd className='text-3xl font-bold tabular-nums'>{fmt(grandTotal)} €</dd>
                                    </div>
                                </dl>

                                <button
                                    onClick={handleSendRequest}
                                    disabled={loading}
                                    className='cursor-pointer w-full mt-6 flex items-center justify-center gap-2 rounded-full bg-primary text-gray-900 py-3.5 font-semibold hover:bg-[#EDC085] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'
                                >
                                    {loading && <span className='w-4 h-4 rounded-full border-2 border-gray-900/30 border-t-gray-900 animate-spin' aria-hidden='true'></span>}
                                    {loading ? 'Envoi...' : 'Envoyer la demande'}
                                </button>
                                {!isBrandUser && (
                                    <p className='text-xs text-gray-400 text-center mt-3'>
                                        {currentUser ? 'Seules les marques peuvent envoyer des demandes.' : 'Vous devrez vous connecter avec un compte marque.'}
                                    </p>
                                )}
                            </div>

                            <div className='rounded-3xl border border-gray-200 p-6'>
                                <p className='font-semibold text-gray-900 mb-1'>Aucun paiement maintenant</p>
                                <p className='text-sm text-gray-600 mb-4'>{"Vous ne payez que les collaborations acceptées."}</p>
                                <ol className='space-y-3 text-sm'>
                                    {[
                                        'Vous envoyez votre demande',
                                        'Chaque créateur l’accepte ou la refuse',
                                        'Vous payez les collaborations acceptées',
                                        'Le créateur est payé après validation du contenu'
                                    ].map((stepText, i) => (
                                        <li key={stepText} className='flex items-center gap-3'>
                                            <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'}`}>{i + 1}</span>
                                            <span className={i === 0 ? 'font-semibold text-gray-900' : 'text-gray-600'}>{stepText}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </div>
        </MotionConfig>
    )
}

export default Cart
