import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, MARK_PAYOUT_PAID_URL } from '../config/firebase'
import SEO from '../components/SEO'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import { privateProfileRef } from '../utils/privateProfile'
import { useToast } from '../context/ToastContext'

const ADMIN_EMAIL = 'bechagraamine@gmail.com'

const Admin = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [pendingPayouts, setPendingPayouts] = useState([])
  const [paidPayouts, setPaidPayouts] = useState([])
  const [markingPaidId, setMarkingPaidId] = useState('')
  const [activeTab, setActiveTab] = useState('influencers')
  const [approvingId, setApprovingId] = useState('')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInfluencers: 0,
    totalBrands: 0,
    totalContacts: 0,
    pendingApproval: 0
  })

  useEffect(() => {
    // Vérifier si l'utilisateur est admin
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAdmin(true)
        loadAdminData()
      } else {
        setIsAdmin(false)
        setLoading(false)
        navigate('/')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const loadAdminData = async () => {
    try {
      // Charger les influenceurs
      // Données privées (nom, email, téléphone, SIRET...) : sous-document private/profile,
      // lisible par l'admin uniquement. Fusionnées avec le profil public pour l'affichage.
      const withPrivate = (collectionName, snapshot, userType) => Promise.all(snapshot.docs.map(async (docSnap) => {
        let privateData = {}
        try {
          const privateSnap = await getDoc(privateProfileRef(db, collectionName, docSnap.id))
          if (privateSnap.exists()) privateData = privateSnap.data()
        } catch (error) {
          console.error('Erreur lecture profil privé:', error)
        }
        return { id: docSnap.id, ...docSnap.data(), ...privateData, userType }
      }))

      const influencersSnapshot = await getDocs(collection(db, 'influencers'))
      const influencersData = await withPrivate('influencers', influencersSnapshot, 'influenceur')

      // Charger les marques
      const brandsSnapshot = await getDocs(collection(db, 'brands'))
      const brandsData = await withPrivate('brands', brandsSnapshot, 'marque')

      // Combiner les deux : influenceurs en attente de validation en premier,
      // puis du compte le plus récent au plus ancien.
      const getCreatedAtMillis = (user) => {
        const time = new Date(user.createdAt).getTime()
        return Number.isFinite(time) ? time : 0
      }

      const allUsers = [...influencersData, ...brandsData].sort((a, b) => {
        const aPending = a.userType === 'influenceur' && a.approved !== true ? 0 : 1
        const bPending = b.userType === 'influenceur' && b.approved !== true ? 0 : 1
        if (aPending !== bPending) return aPending - bPending
        return getCreatedAtMillis(b) - getCreatedAtMillis(a)
      })
      setUsers(allUsers)

      // Charger les messages de contact
      const contactsQuery = query(collection(db, 'contacts'), orderBy('timestamp', 'desc'))
      const contactsSnapshot = await getDocs(contactsQuery)
      const contactsData = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setContacts(contactsData)

      // Charger les collaborations à payer (virement manuel) et l'historique des virements
      const collabsSnapshot = await getDocs(collection(db, 'collaborations'))
      const collabsData = collabsSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }))

      const readyCollabs = collabsData.filter(c => c.payoutStatus === 'ready_for_transfer')
      const paidCollabs = collabsData
        .filter(c => c.payoutStatus === 'paid')
        .sort((a, b) => (b.paidOutAt?.toMillis?.() || 0) - (a.paidOutAt?.toMillis?.() || 0))

      const readyWithBankDetails = await Promise.all(
        readyCollabs.map(async (collab) => {
          try {
            const bankSnap = await getDoc(doc(db, 'bankDetails', collab.influencerId))
            return { ...collab, bankDetails: bankSnap.exists() ? bankSnap.data() : null }
          } catch (error) {
            console.error('Erreur lors du chargement du RIB:', error)
            return { ...collab, bankDetails: null }
          }
        })
      )

      setPendingPayouts(readyWithBankDetails)
      setPaidPayouts(paidCollabs)

      // Calculer les statistiques
      const calculatedStats = {
        totalUsers: allUsers.length,
        totalInfluencers: influencersData.length,
        totalBrands: brandsData.length,
        totalContacts: contactsData.length,
        pendingApproval: influencersData.filter(i => i.approved !== true).length
      }
      setStats(calculatedStats)

      setLoading(false)
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
      setLoading(false)
    }
  }

  const deleteUser = async (userId, userType) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const collection = userType === 'influenceur' ? 'influencers' : 'brands'
        await deleteDoc(doc(db, collection, userId))
        setUsers(users.filter(u => u.id !== userId))
        setStats(prev => ({
          ...prev,
          totalUsers: prev.totalUsers - 1,
          totalInfluencers: userType === 'influenceur' ? prev.totalInfluencers - 1 : prev.totalInfluencers,
          totalBrands: userType === 'marque' ? prev.totalBrands - 1 : prev.totalBrands
        }))
        toast.success('Utilisateur supprimé avec succès')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleApproveInfluencer = async (influencerId, approve) => {
    setApprovingId(influencerId)
    try {
      await updateDoc(doc(db, 'influencers', influencerId), { approved: approve })
      setUsers((prev) => prev.map((u) => (u.id === influencerId ? { ...u, approved: approve } : u)))
      setStats((prev) => ({
        ...prev,
        pendingApproval: prev.pendingApproval + (approve ? -1 : 1)
      }))
    } catch (error) {
      console.error('Erreur lors de la validation du profil:', error)
      toast.error('Erreur lors de la validation du profil')
    } finally {
      setApprovingId('')
    }
  }

  const handleSetCreatorType = async (influencerId, creatorType) => {
    try {
      await updateDoc(doc(db, 'influencers', influencerId), { creatorType })
      setUsers((prev) => prev.map((u) => (u.id === influencerId ? { ...u, creatorType } : u)))
    } catch (error) {
      console.error('Erreur lors de la mise à jour du type de créateur:', error)
      toast.error('Erreur lors de la mise à jour du type de créateur')
    }
  }

  const deleteContact = async (contactId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      try {
        await deleteDoc(doc(db, 'contacts', contactId))
        setContacts(contacts.filter(c => c.id !== contactId))
        toast.success('Message supprimé avec succès')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleMarkPaid = async (collaborationId) => {
    if (!MARK_PAYOUT_PAID_URL) {
      toast.error('Configuration manquante: VITE_MARK_PAYOUT_PAID_URL')
      return
    }
    if (!window.confirm('Confirmez-vous avoir effectué le virement bancaire à l\'influenceur ?')) return

    setMarkingPaidId(collaborationId)
    try {
      const idToken = await auth.currentUser.getIdToken()
      const response = await fetch(MARK_PAYOUT_PAID_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ collaborationId })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Erreur lors de la validation du virement')
      }

      const paidCollab = pendingPayouts.find(c => c.id === collaborationId)
      setPendingPayouts(prev => prev.filter(c => c.id !== collaborationId))
      if (paidCollab) {
        setPaidPayouts(prev => [{ ...paidCollab, payoutStatus: 'paid' }, ...prev])
      }
    } catch (error) {
      console.error('Erreur lors du marquage du virement:', error)
      toast.error(error.message || 'Erreur lors du marquage du virement')
    } finally {
      setMarkingPaidId('')
    }
  }

  if (loading) {
    return (
      <div className='min-h-[70vh] flex items-center justify-center' role='status' aria-label='Chargement'>
        <div className='animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-primary'></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  const influencers = users.filter((u) => u.userType === 'influenceur')
  const brands = users.filter((u) => u.userType === 'marque')

  const statCards = [
    { label: 'Utilisateurs', value: stats.totalUsers },
    { label: 'Influenceurs', value: stats.totalInfluencers },
    { label: 'Marques', value: stats.totalBrands },
    { label: 'À valider', value: stats.pendingApproval, highlight: stats.pendingApproval > 0 },
    { label: 'Messages', value: stats.totalContacts }
  ]

  const tabs = [
    { id: 'influencers', label: 'Influenceurs', count: stats.totalInfluencers },
    { id: 'brands', label: 'Marques', count: stats.totalBrands },
    { id: 'contacts', label: 'Messages', count: stats.totalContacts },
    { id: 'payouts', label: 'Paiements', count: pendingPayouts.length }
  ]

  const th = 'px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500'
  const td = 'px-5 py-4 whitespace-nowrap text-sm'
  const Empty = ({ children }) => <div className='text-center py-12 text-sm text-gray-500'>{children}</div>

  return (
    <div className='min-h-screen bg-[#FAFAF8] py-10 px-4 sm:px-6 lg:px-8'>
      <SEO title='Admin' noindex />
      <div className='max-w-7xl mx-auto'>
        <header className='mb-8'>
          <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark'>Administration</p>
          <h1 className='mt-1 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight'>Tableau de bord</h1>
          <p className='mt-2 text-gray-600 text-sm'>Connecté en tant que {auth.currentUser?.email}</p>
        </header>

        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8'>
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl p-5 border ${card.highlight ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-100 text-gray-900'}`}
            >
              <p className={`text-sm ${card.highlight ? 'text-white/70' : 'text-gray-500'}`}>{card.label}</p>
              <p className='mt-1 text-3xl font-bold tabular-nums'>{card.value}</p>
            </div>
          ))}
        </div>

        <div role='tablist' aria-label='Sections' className='flex gap-2 overflow-x-auto pb-1 mb-6'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role='tab'
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-900'
              }`}
            >
              {tab.label} <span className={activeTab === tab.id ? 'text-white/60' : 'text-gray-400'}>{tab.count}</span>
            </button>
          ))}
        </div>

        <div className='bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden'>
          {activeTab === 'influencers' && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-100'>
                <thead className='bg-gray-50/80'>
                  <tr>
                    <th className={th}>Nom</th>
                    <th className={th}>Email</th>
                    <th className={th}>Réseaux</th>
                    <th className={th}>Statut</th>
                    <th className={th}>Type</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {influencers.map((user) => (
                    <tr key={user.id} className='hover:bg-gray-50/60'>
                      <td className={`${td} font-medium text-gray-900`}>{user.name || 'N/A'}</td>
                      <td className={`${td} text-gray-500`}>{user.email}</td>
                      <td className={`${td} text-gray-500`}>
                        <div className='flex gap-1.5'>
                          {user.socialAccounts?.tiktok?.connected && <span className='px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700'>TikTok</span>}
                          {user.socialAccounts?.instagram?.connected && <span className='px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700'>Instagram</span>}
                          {user.socialAccounts?.youtube?.connected && <span className='px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-700'>YouTube</span>}
                        </div>
                      </td>
                      <td className={td}>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          user.approved === true ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.approved === true ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {user.approved === true ? 'Validé' : 'En attente'}
                        </span>
                      </td>
                      <td className={td}>
                        <select
                          aria-label={`Type de créateur de ${user.name || 'cet influenceur'}`}
                          value={user.creatorType === 'ugc' ? 'ugc' : 'influenceur'}
                          onChange={(e) => handleSetCreatorType(user.id, e.target.value)}
                          className='text-sm border border-gray-200 rounded-full px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40'
                        >
                          <option value='influenceur'>Influenceur</option>
                          <option value='ugc'>Créateur UGC</option>
                        </select>
                      </td>
                      <td className={td}>
                        <div className='flex items-center gap-2'>
                          <a
                            href={`/influencer/${user.id}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-100 transition-colors'
                          >
                            Voir
                          </a>
                          <button
                            onClick={() => handleApproveInfluencer(user.id, user.approved !== true)}
                            disabled={approvingId === user.id}
                            className={`px-3 py-1.5 rounded-full font-medium transition-colors disabled:opacity-50 ${
                              user.approved === true ? 'text-gray-700 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                          >
                            {approvingId === user.id
                              ? '...'
                              : user.approved === true ? 'Retirer' : 'Approuver'}
                          </button>
                          <button
                            onClick={() => deleteUser(user.id, user.userType)}
                            className='px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors'
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {influencers.length === 0 && <Empty>Aucun influenceur</Empty>}
            </div>
          )}

          {activeTab === 'brands' && (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-100'>
                <thead className='bg-gray-50/80'>
                  <tr>
                    <th className={th}>Marque</th>
                    <th className={th}>SIRET</th>
                    <th className={th}>Contact</th>
                    <th className={th}>Email</th>
                    <th className={th}>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {brands.map((user) => (
                    <tr key={user.id} className='hover:bg-gray-50/60'>
                      <td className={`${td} font-medium text-gray-900`}>{user.brandName || 'N/A'}</td>
                      <td className={`${td} text-gray-500 font-mono`}>{user.siret || '—'}</td>
                      <td className={`${td} text-gray-500`}>{user.contactPerson || user.fullName || '—'}</td>
                      <td className={`${td} text-gray-500`}>{user.email}</td>
                      <td className={td}>
                        <button
                          onClick={() => deleteUser(user.id, user.userType)}
                          className='px-3 py-1.5 rounded-full text-red-600 hover:bg-red-50 transition-colors'
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {brands.length === 0 && <Empty>Aucune marque</Empty>}
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className='divide-y divide-gray-100'>
              {contacts.map((contact) => (
                <article key={contact.id} className='p-5 sm:p-6 flex justify-between items-start gap-4 hover:bg-gray-50/60'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-2 mb-2'>
                      <span className='px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 capitalize'>
                        {contact.userType}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {contact.timestamp?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                      </span>
                    </div>
                    <h3 className='font-semibold text-gray-900'>{contact.subject}</h3>
                    <p className='text-sm text-gray-500 mt-0.5'>
                      {contact.name} · <a href={`mailto:${contact.email}`} className='underline decoration-primary underline-offset-2'>{contact.email}</a>
                    </p>
                    <p className='text-sm text-gray-700 mt-3 whitespace-pre-line'>{contact.message}</p>
                  </div>
                  <button
                    onClick={() => deleteContact(contact.id)}
                    aria-label='Supprimer ce message'
                    className='p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0'
                  >
                    <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
                      <path fillRule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clipRule='evenodd'/>
                    </svg>
                  </button>
                </article>
              ))}
              {contacts.length === 0 && <Empty>Aucun message</Empty>}
            </div>
          )}

          {activeTab === 'payouts' && (
            <div className='p-5 sm:p-6 space-y-10'>
              <section>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>À virer ({pendingPayouts.length})</h2>
                <div className='space-y-4'>
                  {pendingPayouts.map((collab) => (
                    <div key={collab.id} className='rounded-2xl border border-amber-200 bg-amber-50/60 p-5'>
                      <div className='flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4'>
                        <div className='min-w-0 flex-1'>
                          <h3 className='font-semibold text-gray-900'>{collab.influencerName || 'Influenceur'}</h3>
                          <p className='text-sm text-gray-600'>Marque : {collab.brandName || 'N/A'} — {collab.description || 'Collaboration'}</p>
                          <p className='text-sm text-gray-700 mt-2'>
                            Payé par la marque (frais inclus) : {collab.amount?.toLocaleString('fr-FR') || '0'} € — À virer à l’influenceur : <span className='font-bold text-gray-900'>{collab.influencerPayoutAmount?.toLocaleString('fr-FR') || '0'} €</span>
                          </p>
                          {collab.bankDetails ? (
                            <div className='text-sm text-gray-700 mt-3 bg-white rounded-xl p-3 border border-gray-200 space-y-0.5'>
                              <p><span className='font-medium'>Titulaire :</span> {collab.bankDetails.accountHolderName}</p>
                              <p className='font-mono'><span className='font-medium font-sans'>IBAN :</span> {collab.bankDetails.iban}</p>
                              {collab.bankDetails.bic && (
                                <p className='font-mono'><span className='font-medium font-sans'>BIC :</span> {collab.bankDetails.bic}</p>
                              )}
                            </div>
                          ) : (
                            <p className='text-sm text-red-600 font-medium mt-2'>RIB manquant — l’influenceur doit le renseigner dans son profil</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleMarkPaid(collab.id)}
                          disabled={!collab.bankDetails || markingPaidId === collab.id}
                          className='px-5 py-2.5 text-sm font-semibold rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap transition-colors'
                        >
                          {markingPaidId === collab.id ? 'Validation...' : 'Marquer comme viré'}
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingPayouts.length === 0 && <Empty>Aucun virement en attente</Empty>}
                </div>
              </section>

              <section>
                <h2 className='text-lg font-semibold text-gray-900 mb-4'>Historique des virements</h2>
                <div className='overflow-x-auto rounded-2xl border border-gray-100'>
                  <table className='min-w-full divide-y divide-gray-100'>
                    <thead className='bg-gray-50/80'>
                      <tr>
                        <th className={th}>Influenceur</th>
                        <th className={th}>Marque</th>
                        <th className={th}>Montant versé</th>
                        <th className={th}>Date</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-100'>
                      {paidPayouts.map((collab) => (
                        <tr key={collab.id}>
                          <td className={`${td} text-gray-900`}>{collab.influencerName || 'N/A'}</td>
                          <td className={`${td} text-gray-500`}>{collab.brandName || 'N/A'}</td>
                          <td className={`${td} text-gray-900 tabular-nums`}>{collab.influencerPayoutAmount?.toLocaleString('fr-FR') || '0'} €</td>
                          <td className={`${td} text-gray-500`}>
                            {collab.paidOutAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {paidPayouts.length === 0 && <Empty>Aucun virement effectué</Empty>}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Admin
