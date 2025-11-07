# 🎥 Intégration YouTube & TikTok - Guide Rapide

## 📋 Vue d'ensemble

On commence avec **YouTube** et **TikTok** qui sont plus simples et stables que l'API Meta/Instagram.

### ✅ Ce qui va fonctionner :
- YouTube : Nombre d'abonnés + dernières vidéos + stats
- TikTok : Nombre d'abonnés + profil
- Mise à jour quotidienne automatique
- Tokens longue durée

---

## 🎬 YouTube API Setup

### Étape 1 : Créer les credentials

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Créer un nouveau projet** ou sélectionner votre projet Firebase existant
3. **Activer l'API** :
   - Menu → "APIs & Services" → "Library"
   - Chercher "YouTube Data API v3"
   - Cliquer "Enable"

4. **Créer les credentials OAuth 2.0** :
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "OAuth client ID"
   - Type : **Web application**
   - Nom : "Collabzz YouTube Integration"
   - **Authorized redirect URIs** : 
     ```
     https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/api/youtubeCallback
     http://localhost:5001/YOUR_PROJECT_ID/europe-west1/api/youtubeCallback
     ```
   - Cliquer "Create"

5. **Noter** :
   - ✅ Client ID
   - ✅ Client Secret

### Étape 2 : Écran de consentement OAuth

1. "APIs & Services" → "OAuth consent screen"
2. Type : **External**
3. Informations de l'app :
   - App name : "Collabzz"
   - User support email : votre email
   - Developer contact : votre email
4. Scopes : Ajouter
   - `https://www.googleapis.com/auth/youtube.readonly`
5. Test users : Ajoutez votre email YouTube pour tester
6. Publier (ou laisser en mode Test pour commencer)

---

## 🎵 TikTok API Setup

### Étape 1 : Créer l'application

1. **Aller sur** [TikTok for Developers](https://developers.tiktok.com/)
2. **Se connecter** avec votre compte TikTok
3. **Créer une app** :
   - "Manage apps" → "Create an app"
   - App name : "Collabzz"
   - Description : "Plateforme de mise en relation influenceurs/marques"

### Étape 2 : Activer les permissions

1. Dans votre app → "Add products"
2. Activer **"Login Kit"**
3. Sélectionner les scopes :
   - ✅ `user.info.basic` (pseudo, avatar)
   - ✅ `user.info.stats` (abonnés, likes, vidéos)
   - ✅ `video.list` (liste des vidéos)

### Étape 3 : Configurer les redirects

1. "Login Kit" → "Settings"
2. **Redirect URIs** :
   ```
   https://europe-west1-YOUR_PROJECT_ID.cloudfunctions.net/api/tiktokCallback
   http://localhost:5001/YOUR_PROJECT_ID/europe-west1/api/tiktokCallback
   ```

### Étape 4 : Noter les credentials

- ✅ Client Key
- ✅ Client Secret

---

## 🚀 Initialiser Firebase Functions

```bash
cd /Users/amine/Desktop/React-Website
firebase init functions
```

**Réponses** :
- Language : **JavaScript**
- ESLint : **Yes**
- Install dependencies : **Yes**

---

## 📦 Installer les dépendances

```bash
cd functions
npm install axios cors express googleapis
```

---

## 📝 Structure des fichiers

```
functions/
├── index.js                 # Routes principales
├── package.json
├── .env                     # Variables locales
└── lib/
    ├── youtube.js           # Logique YouTube
    ├── tiktok.js            # Logique TikTok
    └── scheduler.js         # Mise à jour quotidienne
```

---

## 🔐 Variables d'environnement

### `functions/.env` (développement local)

```env
# YouTube
YOUTUBE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=votre_client_secret
YOUTUBE_REDIRECT_URI=http://localhost:5001/YOUR_PROJECT_ID/europe-west1/api/youtubeCallback

# TikTok
TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
TIKTOK_REDIRECT_URI=http://localhost:5001/YOUR_PROJECT_ID/europe-west1/api/tiktokCallback
```

### Configuration Firebase (production)

```bash
firebase functions:config:set \
  youtube.client_id="YOUR_CLIENT_ID" \
  youtube.client_secret="YOUR_SECRET" \
  youtube.redirect_uri="https://europe-west1-YOUR_PROJECT.cloudfunctions.net/api/youtubeCallback" \
  tiktok.client_key="YOUR_KEY" \
  tiktok.client_secret="YOUR_SECRET" \
  tiktok.redirect_uri="https://europe-west1-YOUR_PROJECT.cloudfunctions.net/api/tiktokCallback"
```

---

## 💻 Code des Functions

Je vais créer les fichiers dans les prochains messages. Voulez-vous que je :

1. ✅ Crée tous les fichiers Functions maintenant ?
2. ⏸️ Attendez d'avoir créé les apps YouTube et TikTok d'abord ?

---

## 📊 Ce que vous obtiendrez

### YouTube
```javascript
{
  youtube: {
    connected: true,
    channelName: "Mon Channel",
    subscribers: 25000,
    lastUpdated: "timestamp",
    recentVideos: [
      {
        id: "video_id",
        title: "Ma dernière vidéo",
        thumbnail: "https://...",
        publishedAt: "2024-11-07",
        views: 15000,
        likes: 850,
        comments: 120
      }
    ]
  }
}
```

### TikTok
```javascript
{
  tiktok: {
    connected: true,
    username: "@username",
    followers: 50000,
    likes: 250000,
    videos: 145,
    lastUpdated: "timestamp"
  }
}
```

---

## ⚠️ Points importants

### YouTube
- ✅ Tokens refresh automatiquement
- ✅ Accès aux vidéos publiques uniquement
- ✅ Quota : 10,000 unités/jour (largement suffisant)
- ⚠️ Si quota dépassé, attendre 24h

### TikTok
- ⚠️ App doit être approuvée par TikTok (peut prendre quelques jours)
- ⚠️ En mode développement : limité à 100 utilisateurs
- ✅ Tokens valables 24h (refresh automatique)
- ⚠️ Rate limit : 100 requêtes/jour par utilisateur

---

## 🎯 Workflow utilisateur

1. **Influenceur** va dans "Mon Profil"
2. Clique "Connecter YouTube" ou "Connecter TikTok"
3. Popup d'autorisation s'ouvre
4. Autorise l'accès
5. **Immédiatement** : Stats affichées dans le profil
6. **Chaque jour à 2h** : Stats actualisées automatiquement

---

Prêt à continuer ? Je peux :
- 🔨 Créer les fichiers Functions maintenant
- 📖 Vous guider pour créer les apps YouTube/TikTok d'abord
- ❓ Répondre à vos questions
