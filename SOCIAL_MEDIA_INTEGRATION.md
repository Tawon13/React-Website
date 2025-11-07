# Intégration des Réseaux Sociaux - Guide Complet

## 📋 Vue d'ensemble

Cette fonctionnalité permet aux influenceurs de :
- Connecter leurs comptes Instagram, TikTok et YouTube
- Voir leurs statistiques d'abonnés en temps réel
- Mise à jour automatique quotidienne des statistiques

## 🏗️ Architecture

```
Frontend (React)
    ↓ OAuth Request
Cloud Functions (Node.js)
    ↓ API Calls
Instagram/TikTok/YouTube APIs
    ↓ Stats
Firestore (Database)
    ↓ Daily Update
Cloud Scheduler (Cron Job)
```

## 🔧 Étape 1 : Créer les Applications OAuth

### Instagram (Meta/Facebook) - Graph API ✨

**Prérequis** : L'influenceur doit avoir un compte Instagram Business ou Creator

1. Allez sur [Meta for Developers](https://developers.facebook.com/)
2. Créez une nouvelle application de type **Business**
3. Ajoutez **"Instagram Graph API"** comme produit (PAS Basic Display)
4. Dans **"Instagram Graph API"** > "Configuration" :
   - Ajoutez votre compte Instagram Business de test
   - **Valid OAuth Redirect URIs** : `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api/instagramCallback`
   - **Deauthorize Callback URL** : `https://YOUR_PROJECT_ID.firebaseapp.com/deauth`
   - **Data Deletion Request URL** : `https://YOUR_PROJECT_ID.firebaseapp.com/deletion`
5. Dans **"Permissions"**, demandez :
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_show_list`
   - `pages_read_engagement`
6. Notez :
   - **App ID** (Meta)
   - **App Secret** (Meta)

### TikTok

1. Allez sur [TikTok for Developers](https://developers.tiktok.com/)
2. Créez une nouvelle application
3. Activez "Login Kit" et "User Info Basic"
4. Dans "Redirect URI" : `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/tiktokCallback`
5. Notez :
   - **Client Key**
   - **Client Secret**

### YouTube (Google)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet (ou utilisez celui de Firebase)
3. Activez "YouTube Data API v3"
4. Créez des identifiants OAuth 2.0 :
   - Type : Application Web
   - **URI de redirection autorisés** : `https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/youtubeCallback`
5. Notez :
   - **Client ID**
   - **Client Secret**

## 🚀 Étape 2 : Configurer Firebase Cloud Functions

### 1. Initialiser Functions

```bash
cd /Users/amine/Desktop/React-Website
firebase init functions
```

Sélectionnez :
- JavaScript ou TypeScript (recommandé : JavaScript)
- ESLint : Oui
- Install dependencies : Oui

### 2. Structure des Functions

```
functions/
├── index.js              # Point d'entrée
├── package.json
├── .env                  # Variables d'environnement (local)
└── lib/
    ├── instagram.js      # Logique Instagram
    ├── tiktok.js         # Logique TikTok
    ├── youtube.js        # Logique YouTube
    └── scheduler.js      # Mise à jour quotidienne
```

### 3. Installer les dépendances

```bash
cd functions
npm install axios cors express
```

## 📝 Étape 3 : Code des Cloud Functions

### `functions/index.js`

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));

// Import des modules
const { connectInstagram, instagramCallback } = require('./lib/instagram');
const { connectTikTok, tiktokCallback } = require('./lib/tiktok');
const { connectYouTube, youtubeCallback } = require('./lib/youtube');
const { updateAllSocialStats, refreshExpiringSocialTokens } = require('./lib/scheduler');

// Routes OAuth
app.get('/connectInstagram', connectInstagram);
app.get('/instagramCallback', instagramCallback);

app.get('/connectTikTok', connectTikTok);
app.get('/tiktokCallback', tiktokCallback);

app.get('/connectYouTube', connectYouTube);
app.get('/youtubeCallback', youtubeCallback);

// Exporter l'app comme fonction HTTP
exports.api = functions.https.onRequest(app);

// Fonction planifiée : Mise à jour quotidienne des stats (chaque jour à 2h du matin)
exports.dailyStatsUpdate = functions.pubsub
    .schedule('0 2 * * *')
    .timeZone('Europe/Paris')
    .onRun(async (context) => {
        await updateAllSocialStats();
        return null;
    });

// Fonction planifiée : Renouvellement des tokens Instagram (tous les dimanches à 3h)
exports.weeklyTokenRefresh = functions.pubsub
    .schedule('0 3 * * 0')
    .timeZone('Europe/Paris')
    .onRun(async (context) => {
        await refreshExpiringSocialTokens();
        return null;
    });
```

### `functions/lib/instagram.js` - Graph API avec médias récents

```javascript
const axios = require('axios');
const admin = require('firebase-admin');

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI;

// OAuth Flow - Étape 1 : Redirection vers Facebook Login
exports.connectInstagram = async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).send('Missing userId');
    }

    // Demander les permissions pour Instagram Graph API
    const scopes = [
        'instagram_basic',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=${scopes}&state=${userId}`;
    
    res.redirect(authUrl);
};

// OAuth Flow - Étape 2 : Callback après autorisation
exports.instagramCallback = async (req, res) => {
    const { code, state: userId } = req.query;
    
    try {
        // 1. Échanger le code contre un access token Facebook
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                redirect_uri: REDIRECT_URI,
                code: code
            }
        });

        const shortLivedToken = tokenResponse.data.access_token;

        // 2. Convertir en long-lived token (60 jours)
        const longLivedResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                fb_exchange_token: shortLivedToken
            }
        });

        const longLivedToken = longLivedResponse.data.access_token;

        // 3. Obtenir les pages Facebook de l'utilisateur
        const pagesResponse = await axios.get('https://graph.facebook.com/v18.0/me/accounts', {
            params: {
                access_token: longLivedToken
            }
        });

        // 4. Pour chaque page, vérifier si elle a un compte Instagram Business
        let instagramAccountId = null;
        let pageAccessToken = null;

        for (const page of pagesResponse.data.data) {
            try {
                const igResponse = await axios.get(`https://graph.facebook.com/v18.0/${page.id}`, {
                    params: {
                        fields: 'instagram_business_account',
                        access_token: page.access_token
                    }
                });

                if (igResponse.data.instagram_business_account) {
                    instagramAccountId = igResponse.data.instagram_business_account.id;
                    pageAccessToken = page.access_token;
                    break;
                }
            } catch (err) {
                continue;
            }
        }

        if (!instagramAccountId) {
            return res.status(400).send(`
                <script>
                    alert('Aucun compte Instagram Business trouvé. Assurez-vous que votre compte Instagram est lié à une page Facebook et converti en compte Business/Creator.');
                    window.close();
                </script>
            `);
        }

        // 5. Obtenir les informations du compte Instagram
        const igAccountResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}`, {
            params: {
                fields: 'username,followers_count,media_count,profile_picture_url',
                access_token: pageAccessToken
            }
        });

        const { username, followers_count, profile_picture_url } = igAccountResponse.data;

        // 6. Obtenir les 6 derniers médias (posts/reels/vidéos)
        const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                limit: 6,
                access_token: pageAccessToken
            }
        });

        const recentMedia = mediaResponse.data.data || [];

        // 7. Sauvegarder dans Firestore
        const db = admin.firestore();
        await db.collection('influencers').doc(userId).update({
            'socialAccounts.instagram': {
                connected: true,
                username: username,
                followers: followers_count,
                profilePicture: profile_picture_url,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                recentMedia: recentMedia.map(media => ({
                    id: media.id,
                    type: media.media_type,
                    url: media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url,
                    permalink: media.permalink,
                    caption: media.caption?.substring(0, 100) || '',
                    likes: media.like_count || 0,
                    comments: media.comments_count || 0,
                    timestamp: media.timestamp
                }))
            },
            'tokens.instagram': {
                accessToken: pageAccessToken,
                instagramAccountId: instagramAccountId,
                expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)), // 60 jours
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        // 8. Rediriger avec succès
        res.send(`
            <script>
                window.opener.postMessage({ 
                    type: 'instagram-connected',
                    username: '${username}',
                    followers: ${followers_count}
                }, '*');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('Instagram OAuth error:', error.response?.data || error);
        res.status(500).send(`
            <script>
                alert('Erreur lors de la connexion Instagram. Vérifiez que votre compte est bien un compte Business/Creator.');
                window.close();
            </script>
        `);
    }
};

// Mise à jour quotidienne des stats + médias récents
exports.updateInstagramStats = async (userId, tokens) => {
    try {
        const { accessToken, instagramAccountId, expiresAt } = tokens.instagram;

        // Vérifier si le token est encore valide
        const now = admin.firestore.Timestamp.now();
        if (expiresAt && expiresAt.toMillis() < now.toMillis()) {
            console.log('Instagram token expired for user:', userId);
            return { success: false, error: 'Token expired' };
        }

        // 1. Obtenir les stats du compte
        const accountResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}`, {
            params: {
                fields: 'username,followers_count,media_count,profile_picture_url',
                access_token: accessToken
            }
        });

        const { followers_count, profile_picture_url } = accountResponse.data;

        // 2. Obtenir les 6 derniers médias
        const mediaResponse = await axios.get(`https://graph.facebook.com/v18.0/${instagramAccountId}/media`, {
            params: {
                fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count',
                limit: 6,
                access_token: accessToken
            }
        });

        const recentMedia = mediaResponse.data.data || [];

        // 3. Mettre à jour Firestore
        const db = admin.firestore();
        await db.collection('influencers').doc(userId).update({
            'socialAccounts.instagram.followers': followers_count,
            'socialAccounts.instagram.profilePicture': profile_picture_url,
            'socialAccounts.instagram.lastUpdated': admin.firestore.FieldValue.serverTimestamp(),
            'socialAccounts.instagram.recentMedia': recentMedia.map(media => ({
                id: media.id,
                type: media.media_type,
                url: media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url,
                permalink: media.permalink,
                caption: media.caption?.substring(0, 100) || '',
                likes: media.like_count || 0,
                comments: media.comments_count || 0,
                timestamp: media.timestamp
            }))
        });

        return { 
            success: true, 
            followers: followers_count,
            mediaCount: recentMedia.length
        };
    } catch (error) {
        console.error('Error updating Instagram stats:', error.response?.data || error);
        return { success: false, error: error.message };
    }
};

// Renouveler le token avant expiration (à appeler 7 jours avant expiration)
exports.refreshInstagramToken = async (userId, tokens) => {
    try {
        const { accessToken } = tokens.instagram;

        const refreshResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: META_APP_ID,
                client_secret: META_APP_SECRET,
                fb_exchange_token: accessToken
            }
        });

        const newToken = refreshResponse.data.access_token;

        const db = admin.firestore();
        await db.collection('influencers').doc(userId).update({
            'tokens.instagram.accessToken': newToken,
            'tokens.instagram.expiresAt': admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
            'tokens.instagram.lastRefreshed': admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true };
    } catch (error) {
        console.error('Error refreshing Instagram token:', error);
        return { success: false, error: error.message };
    }
};
```

### `functions/lib/youtube.js`

```javascript
const { google } = require('googleapis');
const admin = require('firebase-admin');

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    YOUTUBE_REDIRECT_URI
);

exports.connectYouTube = async (req, res) => {
    const { userId } = req.query;
    
    if (!userId) {
        return res.status(400).send('Missing userId');
    }

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.readonly'],
        state: userId
    });
    
    res.redirect(authUrl);
};

exports.youtubeCallback = async (req, res) => {
    const { code, state: userId } = req.query;
    
    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        // Obtenir les infos du canal
        const channelResponse = await youtube.channels.list({
            part: 'snippet,statistics',
            mine: true
        });

        const channel = channelResponse.data.items[0];
        const channelTitle = channel.snippet.title;
        const subscribers = parseInt(channel.statistics.subscriberCount);

        // Sauvegarder dans Firestore
        const db = admin.firestore();
        await db.collection('influencers').doc(userId).update({
            'socialAccounts.youtube': {
                connected: true,
                username: channelTitle,
                followers: subscribers,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            },
            'tokens.youtube': {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }
        });

        res.send(`
            <script>
                window.opener.postMessage({ type: 'youtube-connected' }, '*');
                window.close();
            </script>
        `);
    } catch (error) {
        console.error('YouTube OAuth error:', error);
        res.status(500).send('Authentication failed');
    }
};

exports.updateYouTubeStats = async (userId, tokens) => {
    try {
        const { refreshToken } = tokens.youtube;
        
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

        const channelResponse = await youtube.channels.list({
            part: 'statistics',
            mine: true
        });

        const subscribers = parseInt(channelResponse.data.items[0].statistics.subscriberCount);

        const db = admin.firestore();
        await db.collection('influencers').doc(userId).update({
            'socialAccounts.youtube.followers': subscribers,
            'socialAccounts.youtube.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
        });

        return { success: true, followers: subscribers };
    } catch (error) {
        console.error('Error updating YouTube stats:', error);
        return { success: false, error: error.message };
    }
};
```

### `functions/lib/scheduler.js`

```javascript
const admin = require('firebase-admin');
const { updateInstagramStats, refreshInstagramToken } = require('./instagram');
const { updateYouTubeStats } = require('./youtube');
// const { updateTikTokStats } = require('./tiktok'); // À implémenter

// Mise à jour quotidienne des statistiques
exports.updateAllSocialStats = async () => {
    const db = admin.firestore();
    
    try {
        // Récupérer tous les influenceurs avec au moins un compte connecté
        const influencersSnapshot = await db.collection('influencers')
            .where('socialAccounts.instagram.connected', '==', true)
            .get();

        const updatePromises = [];

        influencersSnapshot.forEach(doc => {
            const userId = doc.id;
            const data = doc.data();
            const tokens = data.tokens || {};

            // Mettre à jour Instagram (stats + médias récents)
            if (tokens.instagram) {
                updatePromises.push(updateInstagramStats(userId, tokens));
            }

            // Mettre à jour YouTube
            if (tokens.youtube) {
                updatePromises.push(updateYouTubeStats(userId, tokens));
            }

            // Mettre à jour TikTok
            // if (tokens.tiktok) {
            //     updatePromises.push(updateTikTokStats(userId, tokens));
            // }
        });

        await Promise.all(updatePromises);
        console.log(`Updated stats for ${updatePromises.length} accounts`);
        
        return { success: true, updated: updatePromises.length };
    } catch (error) {
        console.error('Error in scheduler:', error);
        return { success: false, error: error.message };
    }
};

// Renouveler les tokens Instagram proches de l'expiration (tous les dimanches)
exports.refreshExpiringSocialTokens = async () => {
    const db = admin.firestore();
    
    try {
        const sevenDaysFromNow = admin.firestore.Timestamp.fromDate(
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        );

        // Trouver les tokens Instagram qui expirent dans les 7 prochains jours
        const influencersSnapshot = await db.collection('influencers')
            .where('tokens.instagram.expiresAt', '<=', sevenDaysFromNow)
            .get();

        const refreshPromises = [];

        influencersSnapshot.forEach(doc => {
            const userId = doc.id;
            const data = doc.data();
            const tokens = data.tokens || {};

            if (tokens.instagram) {
                refreshPromises.push(refreshInstagramToken(userId, tokens));
            }
        });

        await Promise.all(refreshPromises);
        console.log(`Refreshed ${refreshPromises.length} Instagram tokens`);
        
        return { success: true, refreshed: refreshPromises.length };
    } catch (error) {
        console.error('Error refreshing tokens:', error);
        return { success: false, error: error.message };
    }
};
```

## 🔐 Étape 4 : Variables d'environnement

### `.env` local (functions/.env)

```
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
INSTAGRAM_REDIRECT_URI=https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api/instagramCallback

YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret
YOUTUBE_REDIRECT_URI=https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api/youtubeCallback

TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api/tiktokCallback
```

### Firebase Config (production)

```bash
firebase functions:config:set \
  meta.app_id="YOUR_ID" \
  meta.app_secret="YOUR_SECRET" \
  instagram.redirect_uri="YOUR_URI" \
  youtube.client_id="YOUR_ID" \
  youtube.client_secret="YOUR_SECRET" \
  youtube.redirect_uri="YOUR_URI"
```

## 📤 Étape 5 : Déployer

```bash
firebase deploy --only functions
```

## 🔄 Étape 6 : Ajouter l'URL des Functions au .env frontend

`.env` (racine du projet React)

```
VITE_FIREBASE_FUNCTIONS_URL=https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/api
```

## 🎯 Fonctionnement

1. **Utilisateur clique "Connecter Instagram"**
   - Frontend ouvre une popup vers Cloud Function
   
2. **Cloud Function redirige vers OAuth Instagram**
   - L'utilisateur autorise l'application
   
3. **Instagram renvoie vers le callback**
   - Cloud Function récupère le token
   - Sauvegarde dans Firestore
   - Récupère les stats initiales
   
4. **Mise à jour quotidienne**
   - Cloud Scheduler exécute `dailyStatsUpdate` chaque jour à 2h
   - Parcourt tous les influenceurs avec comptes connectés
   - Met à jour les statistiques via les APIs
   - Sauvegarde dans Firestore

## ⚠️ Points importants

1. **Instagram Graph API** : 
   - ✅ Nécessite un compte Business ou Creator (conversion gratuite dans l'app Instagram)
   - ✅ Tokens longue durée (60 jours, auto-renouvelables)
   - ✅ Accès aux insights, médias récents, engagement
   - ✅ Mise à jour automatique sans reconnexion
   
2. **TikTok** : L'API a des limitations strictes, nécessite approbation

3. **YouTube** : Les refresh tokens peuvent expirer, gérer la ré-authentification

4. **Coûts** : Cloud Functions a un quota gratuit, puis facturation à l'usage

5. **Conversion en compte Business Instagram** :
   - Ouvrir l'app Instagram > Paramètres > Compte
   - "Passer à un compte professionnel"
   - Choisir "Créateur" ou "Entreprise"
   - Lier à une page Facebook (obligatoire pour Graph API)

## 🧪 Tester localement

```bash
cd functions
npm run serve
```

## 📊 Structure Firestore mise à jour

```json
{
  "influencers/{userId}": {
    "socialAccounts": {
      "instagram": {
        "connected": true,
        "username": "@username",
        "followers": 15000,
        "profilePicture": "https://...",
        "lastUpdated": "timestamp",
        "recentMedia": [
          {
            "id": "media_id",
            "type": "IMAGE|VIDEO|CAROUSEL_ALBUM",
            "url": "https://...",
            "permalink": "https://instagram.com/p/...",
            "caption": "Description du post...",
            "likes": 1250,
            "comments": 43,
            "timestamp": "2024-11-07T10:30:00Z"
          }
        ]
      },
      "tiktok": { ... },
      "youtube": { ... }
    },
    "tokens": {
      "instagram": {
        "accessToken": "encrypted_long_lived_token",
        "instagramAccountId": "instagram_business_id",
        "expiresAt": "timestamp (60 jours)",
        "lastRefreshed": "timestamp"
      },
      "youtube": {
        "accessToken": "encrypted",
        "refreshToken": "encrypted"
      }
    }
  }
}
```

## 🔒 Sécurité

⚠️ Les tokens sont sensibles ! Règles Firestore recommandées :

```javascript
match /influencers/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
  
  // Interdire la lecture directe des tokens
  match /tokens {
    allow read, write: if false; // Seulement via Cloud Functions
  }
}
```
