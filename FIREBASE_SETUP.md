# Configuration Firebase

## Étapes pour configurer Firebase dans votre projet

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Donnez un nom à votre projet (ex: "react-website-influenceurs")
4. Suivez les étapes de création

### 2. Activer Firebase Authentication

1. Dans votre projet Firebase, allez dans "Authentication"
2. Cliquez sur "Commencer"
3. Dans l'onglet "Sign-in method", activez "Email/Password"

### 3. Créer une base de données Firestore

1. Dans votre projet Firebase, allez dans "Firestore Database"
2. Cliquez sur "Créer une base de données"
3. Choisissez le mode "Production" pour commencer
4. Sélectionnez une région (ex: europe-west1 pour l'Europe)

### 4. Configurer les règles de sécurité Firestore

Dans l'onglet "Règles" de Firestore, utilisez ces règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Règles pour la collection influencers
    match /influencers/{userId} {
      // Permettre la lecture à tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      // Permettre l'écriture seulement au propriétaire du document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Règles pour la collection brands
    match /brands/{userId} {
      // Permettre la lecture à tous les utilisateurs authentifiés
      allow read: if request.auth != null;
      // Permettre l'écriture seulement au propriétaire du document
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Obtenir vos identifiants Firebase

1. Dans les paramètres du projet (icône engrenage), allez dans "Paramètres du projet"
2. Faites défiler jusqu'à "Vos applications"
3. Cliquez sur l'icône Web (</>)
4. Donnez un nom à votre app (ex: "react-website")
5. Copiez les informations de configuration

### 6. Configurer votre application

Ouvrez le fichier `src/config/firebase.js` et remplacez les valeurs par celles de votre projet :

```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

## Structure de la base de données

### Collection `influencers`
Document ID: `{uid}` (ID de l'utilisateur Firebase Auth)
```json
{
  "uid": "string",
  "email": "string",
  "userType": "influencer",
  "name": "string",
  "username": "string",
  "phone": "string",
  "city": "string",
  "country": "string",
  "category": "string",
  "socialMedia": {
    "instagram": "string",
    "tiktok": "string",
    "youtube": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Collection `brands`
Document ID: `{uid}` (ID de l'utilisateur Firebase Auth)
```json
{
  "uid": "string",
  "email": "string",
  "userType": "brand",
  "companyName": "string",
  "brandName": "string",
  "siret": "string",
  "industry": "string",
  "companySize": "string",
  "description": "string",
  "contactPerson": "string",
  "phone": "string",
  "website": "string",
  "address": {
    "street": "string",
    "city": "string",
    "country": "string"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Utilisation dans l'application

### Hook useAuth

Le hook `useAuth` vous donne accès à :
- `currentUser`: L'utilisateur Firebase Auth actuellement connecté
- `userType`: 'influencer' ou 'brand'
- `userData`: Les données complètes de l'utilisateur depuis Firestore
- `signUpInfluencer(email, password, data)`: Inscription influenceur
- `signUpBrand(email, password, data)`: Inscription marque
- `signIn(email, password)`: Connexion
- `logout()`: Déconnexion
- `loading`: État de chargement

### Exemple d'utilisation

```javascript
import { useAuth } from '../context/AuthContext'

function MonComposant() {
  const { currentUser, userData, userType, logout } = useAuth()
  
  if (!currentUser) {
    return <div>Non connecté</div>
  }
  
  return (
    <div>
      <p>Bienvenue {userData.name || userData.brandName}</p>
      <p>Type: {userType}</p>
      <button onClick={logout}>Se déconnecter</button>
    </div>
  )
}
```

## Sécurité

⚠️ **Important** : 
- Ne partagez JAMAIS votre fichier `firebase.js` avec vos clés API sur un dépôt public
- Ajoutez `src/config/firebase.js` à votre `.gitignore` si nécessaire
- Utilisez des variables d'environnement pour la production

## Déploiement

Pour le déploiement en production, utilisez des variables d'environnement :

1. Créez un fichier `.env` à la racine :
```
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

2. Modifiez `firebase.js` pour utiliser ces variables :
```javascript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```
