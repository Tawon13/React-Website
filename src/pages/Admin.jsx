import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db, MARK_PAYOUT_PAID_URL } from '../config/firebase'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'

const ADMIN_EMAIL = 'bechagraamine@gmail.com'

const Admin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [pendingPayouts, setPendingPayouts] = useState([])
  const [paidPayouts, setPaidPayouts] = useState([])
  const [markingPaidId, setMarkingPaidId] = useState('')
  const [activeTab, setActiveTab] = useState('users')
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
      const influencersSnapshot = await getDocs(collection(db, 'influencers'))
      console.log('Influencers snapshot size:', influencersSnapshot.size)
      const influencersData = influencersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        userType: 'influenceur'
      }))
      console.log('Influencers data:', influencersData)

      // Charger les marques
      const brandsSnapshot = await getDocs(collection(db, 'brands'))
      console.log('Brands snapshot size:', brandsSnapshot.size)
      const brandsData = brandsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        userType: 'marque'
      }))
      console.log('Brands data:', brandsData)

      // Combiner les deux, influenceurs en attente de validation en premier
      const allUsers = [...influencersData, ...brandsData].sort((a, b) => {
        const aPending = a.userType === 'influenceur' && a.approved !== true ? 0 : 1
        const bPending = b.userType === 'influenceur' && b.approved !== true ? 0 : 1
        return aPending - bPending
      })
      console.log('Total users:', allUsers.length)
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
      console.log('Calculated stats:', calculatedStats)
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
        alert('Utilisateur supprimé avec succès')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Erreur lors de la suppression')
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
      alert('Erreur lors de la validation du profil')
    } finally {
      setApprovingId('')
    }
  }

  const deleteContact = async (contactId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
      try {
        await deleteDoc(doc(db, 'contacts', contactId))
        setContacts(contacts.filter(c => c.id !== contactId))
        alert('Message supprimé avec succès')
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        alert('Erreur lors de la suppression')
      }
    }
  }

  const handleMarkPaid = async (collaborationId) => {
    if (!MARK_PAYOUT_PAID_URL) {
      alert('Configuration manquante: VITE_MARK_PAYOUT_PAID_URL')
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
      alert(error.message || 'Erreur lors du marquage du virement')
    } finally {
      setMarkingPaidId('')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto'>
        {/* En-tête */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>Panel Admin</h1>
          <p className='text-gray-600'>Bienvenue, {auth.currentUser?.email}</p>
        </div>

        {/* Statistiques */}
        <div className='grid grid-cols-1 md:grid-cols-5 gap-4 mb-6'>
          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-500 text-sm'>Total Utilisateurs</p>
                <p className='text-3xl font-bold text-gray-900'>{stats.totalUsers}</p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z'/>
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-500 text-sm'>Influenceurs</p>
                <p className='text-3xl font-bold text-primary'>{stats.totalInfluencers}</p>
              </div>
              <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd'/>
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-500 text-sm'>Marques</p>
                <p className='text-3xl font-bold text-green-600'>{stats.totalBrands}</p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-green-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M4 3a2 2 0 100 4h12a2 2 0 100-4H4z'/>
                  <path fillRule='evenodd' d='M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' clipRule='evenodd'/>
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-500 text-sm'>En attente de validation</p>
                <p className='text-3xl font-bold text-orange-600'>{stats.pendingApproval}</p>
              </div>
              <div className='w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd'/>
                </svg>
              </div>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow-md p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-gray-500 text-sm'>Messages</p>
                <p className='text-3xl font-bold text-purple-600'>{stats.totalContacts}</p>
              </div>
              <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center'>
                <svg className='w-6 h-6 text-purple-600' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z'/>
                  <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className='bg-white rounded-lg shadow-md mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex -mb-px'>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'users'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Utilisateurs ({stats.totalUsers})
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'contacts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Messages ({stats.totalContacts})
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`py-4 px-6 font-medium text-sm border-b-2 ${
                  activeTab === 'payouts'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Paiements ({pendingPayouts.length})
              </button>
            </nav>
          </div>

          {/* Contenu des onglets */}
          <div className='p-6'>
            {activeTab === 'users' && (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Nom</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Email</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Type</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Réseaux</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Validé</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>{user.name || 'N/A'}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-500'>{user.email}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.userType === 'influenceur' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.userType || 'N/A'}
                          </span>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          <div className='flex gap-2'>
                            {user.socialAccounts?.youtube?.connected && (
                              <span className='text-red-600' title='YouTube'>▶</span>
                            )}
                            {user.socialAccounts?.tiktok?.connected && (
                              <span className='text-black' title='TikTok'>♪</span>
                            )}
                            {user.socialAccounts?.instagram?.connected && (
                              <span className='text-pink-600' title='Instagram'>📷</span>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {user.userType === 'influenceur' ? (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              user.approved === true
                                ? 'bg-green-100 text-green-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {user.approved === true ? 'Validé' : 'En attente'}
                            </span>
                          ) : (
                            <span className='text-gray-400 text-sm'>—</span>
                          )}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <div className='flex items-center gap-3'>
                            {user.userType === 'influenceur' && (
                              <a
                                href={`/influencer/${user.id}`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-blue-600 hover:text-blue-800'
                              >
                                Voir le profil
                              </a>
                            )}
                            {user.userType === 'influenceur' && (
                              <button
                                onClick={() => handleApproveInfluencer(user.id, user.approved !== true)}
                                disabled={approvingId === user.id}
                                className={`disabled:opacity-50 ${
                                  user.approved === true
                                    ? 'text-gray-600 hover:text-gray-900'
                                    : 'text-primary hover:text-primary/80 font-medium'
                                }`}
                              >
                                {approvingId === user.id
                                  ? '...'
                                  : user.approved === true ? 'Retirer' : 'Approuver'}
                              </button>
                            )}
                            <button
                              onClick={() => deleteUser(user.id, user.userType)}
                              className='text-red-600 hover:text-red-900'
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>Aucun utilisateur</div>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <div className='space-y-4'>
                {contacts.map((contact) => (
                  <div key={contact.id} className='border border-gray-200 rounded-lg p-4 hover:bg-gray-50'>
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            contact.userType === 'marque' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {contact.userType}
                          </span>
                          <span className='text-sm text-gray-500'>
                            {contact.timestamp?.toDate?.()?.toLocaleDateString('fr-FR') || 'Date inconnue'}
                          </span>
                        </div>
                        <h3 className='font-semibold text-gray-900'>{contact.subject}</h3>
                        <p className='text-sm text-gray-600 mt-1'>
                          De: {contact.name} ({contact.email})
                        </p>
                        <p className='text-sm text-gray-700 mt-2'>{contact.message}</p>
                      </div>
                      <button
                        onClick={() => deleteContact(contact.id)}
                        className='text-red-600 hover:text-red-900 ml-4'
                      >
                        <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z' clipRule='evenodd'/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
                {contacts.length === 0 && (
                  <div className='text-center py-8 text-gray-500'>Aucun message</div>
                )}
              </div>
            )}

            {activeTab === 'payouts' && (
              <div className='space-y-8'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>À virer ({pendingPayouts.length})</h3>
                  <div className='space-y-4'>
                    {pendingPayouts.map((collab) => (
                      <div key={collab.id} className='border border-orange-200 bg-orange-50 rounded-lg p-4'>
                        <div className='flex justify-between items-start gap-4'>
                          <div className='flex-1'>
                            <h4 className='font-semibold text-gray-900'>{collab.influencerName || 'Influenceur'}</h4>
                            <p className='text-sm text-gray-600'>Marque: {collab.brandName || 'N/A'} — {collab.description || 'Collaboration'}</p>
                            <p className='text-sm text-gray-700 mt-2'>
                              Montant total: {collab.amount?.toLocaleString('fr-FR') || '0'} € — À virer (85%): <span className='font-bold text-orange-700'>{collab.influencerPayoutAmount?.toLocaleString('fr-FR') || '0'} €</span>
                            </p>
                            {collab.bankDetails ? (
                              <div className='text-sm text-gray-700 mt-2 bg-white rounded-md p-3 border border-gray-200'>
                                <p><span className='font-medium'>Titulaire:</span> {collab.bankDetails.accountHolderName}</p>
                                <p className='font-mono'><span className='font-medium font-sans'>IBAN:</span> {collab.bankDetails.iban}</p>
                                {collab.bankDetails.bic && (
                                  <p className='font-mono'><span className='font-medium font-sans'>BIC:</span> {collab.bankDetails.bic}</p>
                                )}
                              </div>
                            ) : (
                              <p className='text-sm text-red-600 font-medium mt-2'>RIB manquant — l'influenceur doit le renseigner dans son profil</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleMarkPaid(collab.id)}
                            disabled={!collab.bankDetails || markingPaidId === collab.id}
                            className='px-4 py-2 text-sm font-semibold rounded-md bg-primary text-white hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap'
                          >
                            {markingPaidId === collab.id ? 'Validation...' : 'Marquer comme viré'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {pendingPayouts.length === 0 && (
                      <div className='text-center py-8 text-gray-500'>Aucun virement en attente</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-4'>Historique des virements</h3>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Influenceur</th>
                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Marque</th>
                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Montant versé</th>
                          <th className='px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase'>Date</th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {paidPayouts.map((collab) => (
                          <tr key={collab.id}>
                            <td className='px-4 py-2 text-sm text-gray-900'>{collab.influencerName || 'N/A'}</td>
                            <td className='px-4 py-2 text-sm text-gray-500'>{collab.brandName || 'N/A'}</td>
                            <td className='px-4 py-2 text-sm text-gray-900'>{collab.influencerPayoutAmount?.toLocaleString('fr-FR') || '0'} €</td>
                            <td className='px-4 py-2 text-sm text-gray-500'>
                              {collab.paidOutAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {paidPayouts.length === 0 && (
                      <div className='text-center py-8 text-gray-500'>Aucun virement effectué</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
