import { useAuth } from '../context/AuthContext'

// Les statistiques d'audience (abonnés, vues moyennes, engagement) sont réservées aux
// visiteurs connectés : c'est l'argument pour créer un compte marque. Point unique pour
// changer la règle (ex. marques uniquement) partout sur le site.
// Masquage d'interface seulement : les données restent lisibles dans Firestore.
export const useCanSeeStats = () => {
  const { currentUser } = useAuth()
  return Boolean(currentUser)
}

export const SIGNUP_FOR_STATS_PATH = '/login?type=brand&isSignUp=true'
