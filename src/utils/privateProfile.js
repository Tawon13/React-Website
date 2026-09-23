import { doc } from 'firebase/firestore'

// Données personnelles retirées des documents publics `influencers/{uid}` et `brands/{uid}`
// (lisibles par tout le monde) et stockées dans `{collection}/{uid}/private/profile`,
// lisible uniquement par le titulaire du compte et par l'admin (voir firestore.rules).
// Liste à garder synchronisée avec PRIVATE_PROFILE_FIELDS dans functions/main.py et
// scripts/migrate-private-profiles.mjs.
export const PRIVATE_PROFILE_FIELDS = {
    influencers: ['name', 'email', 'phone'],
    brands: ['name', 'email', 'fullName', 'contactPerson', 'phone', 'address', 'siret']
}

export const privateProfileRef = (db, collectionName, uid) => doc(db, collectionName, uid, 'private', 'profile')

// Sépare un profil en partie publique et partie privée.
export const splitProfile = (collectionName, data) => {
    const privateKeys = PRIVATE_PROFILE_FIELDS[collectionName] || []
    const publicData = {}
    const privateData = {}
    Object.entries(data).forEach(([key, value]) => {
        if (privateKeys.includes(key)) privateData[key] = value
        else publicData[key] = value
    })
    return { publicData, privateData }
}
