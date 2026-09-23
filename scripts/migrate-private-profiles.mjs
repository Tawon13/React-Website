// Migration : déplace les données personnelles des profils publics (`influencers/{uid}`,
// `brands/{uid}`, lisibles par tout le monde) vers `{collection}/{uid}/private/profile`
// (lisible par le titulaire et l'admin uniquement), puis les supprime du profil public.
//
// Usage :
//   node scripts/migrate-private-profiles.mjs            -> simulation, n'écrit rien
//   node scripts/migrate-private-profiles.mjs --apply    -> sauvegarde locale puis migration
//
// Identifiants admin : FIREBASE_SERVICE_ACCOUNT_KEY (chemin vers la clé JSON du compte de
// service) ou GOOGLE_APPLICATION_CREDENTIALS. Idempotent : peut être relancé sans risque.
import fs from 'node:fs/promises'
import path from 'node:path'
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

// Synchronisé avec src/utils/privateProfile.js et PRIVATE_PROFILE_FIELDS (functions/main.py).
const PRIVATE_PROFILE_FIELDS = {
    influencers: ['name', 'email', 'phone'],
    brands: ['name', 'email', 'fullName', 'contactPerson', 'phone', 'address', 'siret']
}

const apply = process.argv.includes('--apply')

const getCredential = async () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const keyPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        return cert(JSON.parse(await fs.readFile(keyPath, 'utf8')))
    }
    return applicationDefault()
}

const main = async () => {
    initializeApp({ credential: await getCredential(), projectId: 'collabzzinflu' })
    const db = getFirestore()

    const backup = {}
    const plan = []

    for (const [collectionName, fields] of Object.entries(PRIVATE_PROFILE_FIELDS)) {
        const snapshot = await db.collection(collectionName).get()
        const fieldCounts = Object.fromEntries(fields.map((f) => [f, 0]))
        let toMigrate = 0

        for (const docSnap of snapshot.docs) {
            const data = docSnap.data()
            const extracted = {}
            fields.forEach((field) => {
                if (data[field] !== undefined) {
                    extracted[field] = data[field]
                    fieldCounts[field] += 1
                }
            })
            if (Object.keys(extracted).length === 0) continue

            toMigrate += 1
            backup[`${collectionName}/${docSnap.id}`] = extracted
            plan.push({ ref: docSnap.ref, extracted })
        }

        // Aucune valeur affichée : uniquement des comptes, pour ne pas exposer de données.
        console.log(`${collectionName}: ${snapshot.size} profils, ${toMigrate} à migrer`, fieldCounts)
    }

    if (!apply) {
        console.log('\nSimulation terminée : rien n’a été écrit. Relancez avec --apply pour migrer.')
        return
    }

    if (plan.length === 0) {
        console.log('\nRien à migrer.')
        return
    }

    // Sauvegarde locale avant toute écriture (dossier ignoré par Git : contient des données personnelles).
    const backupDir = path.resolve(process.cwd(), '.private-backup')
    await fs.mkdir(backupDir, { recursive: true })
    const backupFile = path.join(backupDir, `profiles-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2), { mode: 0o600 })
    console.log(`\nSauvegarde écrite : ${backupFile}`)

    // Par lot : copie dans private/profile (sans écraser une donnée privée plus récente),
    // puis suppression des champs du profil public, dans la même écriture atomique.
    let migrated = 0
    for (let i = 0; i < plan.length; i += 200) {
        const batch = db.batch()
        for (const { ref, extracted } of plan.slice(i, i + 200)) {
            const privateRef = ref.collection('private').doc('profile')
            const existing = (await privateRef.get()).data() || {}
            batch.set(privateRef, { ...extracted, ...existing }, { merge: true })
            batch.update(ref, Object.fromEntries(Object.keys(extracted).map((f) => [f, FieldValue.delete()])))
        }
        await batch.commit()
        migrated += Math.min(200, plan.length - i)
    }
    console.log(`Migration terminée : ${migrated} profils migrés.`)
}

main().catch((error) => {
    console.error('Échec de la migration :', error.message)
    process.exit(1)
})
