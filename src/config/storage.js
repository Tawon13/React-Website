import { getStorage } from 'firebase/storage'
import app from './firebase'

// Firebase Storage (envoi de fichiers) dans un module séparé : il n'est chargé que par les
// pages qui envoient des fichiers (profil, onboarding, messagerie), pas au premier affichage.
export const storage = getStorage(app)
