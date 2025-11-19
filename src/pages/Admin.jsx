import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../config/firebase'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore'

const ADMIN_EMAIL = 'bechagraamine@gmail.com'

const Admin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [users, setUsers] = useState([])
  const [contacts, setContacts] = useState([])
  const [activeTab, setActiveTab] = useState('users')
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalInfluencers: 0,
    totalBrands: 0,
    totalContacts: 0
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

      // Combiner les deux
      const allUsers = [...influencersData, ...brandsData]
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

      // Calculer les statistiques
      const calculatedStats = {
        totalUsers: allUsers.length,
        totalInfluencers: influencersData.length,
        totalBrands: brandsData.length,
        totalContacts: contactsData.length
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
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
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
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <button
                            onClick={() => deleteUser(user.id, user.userType)}
                            className='text-red-600 hover:text-red-900'
                          >
                            Supprimer
                          </button>
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
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin
