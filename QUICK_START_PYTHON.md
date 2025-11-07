# 🚀 Guide de Démarrage Rapide - Python Functions

## ✅ Ce qui est déjà fait

- ✅ Firebase Functions initialisé (Python)
- ✅ Dépendances installées
- ✅ Code YouTube créé (`lib/youtube.py`)
- ✅ Code TikTok créé (`lib/tiktok.py`)
- ✅ Routes HTTP + Scheduler créés (`main.py`)

## 📝 Prochaines étapes

### 1. Créer les applications API

#### YouTube (5 minutes)
1. Aller sur http://127.0.0.1:5001/collabzzinflu/europe-west1/youtube_callback_handler
2. Sélectionner votre projet Firebase (collabzzinflu)
3. **Activer YouTube Data API v3** :
   - Menu → APIs & Services → Library
   - Chercher "YouTube Data API v3"
   - Cliquer "Enable"
4. **Créer credentials OAuth** :
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Type : **Web application**
   - URIs de redirection :
     ```
     http://127.0.0.1:5001/collabzzinflu/europe-west1/youtube_callback_handler
     https://europe-west1-collabzzinflu.cloudfunctions.net/youtube_callback_handler
     ```
5. **Copier** Client ID et Client Secret

#### TikTok (10 minutes)
1. Aller sur https://developers.tiktok.com/
2. Se connecter avec TikTok
3. **Créer une app** :
   - Manage apps → Create an app
   - Nom : "Collabzz"
4. **Activer Login Kit** :
   - Add products → Login Kit
   - Scopes : `user.info.basic`, `user.info.stats`, `video.list`
5. **Redirect URIs** :
   ```
   http://127.0.0.1:5001/collabzzinflu/europe-west1/tiktok_callback_handler
   https://europe-west1-collabzzinflu.cloudfunctions.net/tiktok_callback_handler
   ```
6. **Copier** Client Key et Client Secret

### 2. Configurer les variables d'environnement

Éditer `functions/.env` :
```env
YOUTUBE_CLIENT_ID=votre_client_id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=votre_client_secret
YOUTUBE_REDIRECT_URI=http://127.0.0.1:5001/collabzzinflu/europe-west1/youtube_callback_handler

TIKTOK_CLIENT_KEY=votre_client_key
TIKTOK_CLIENT_SECRET=votre_client_secret
TIKTOK_REDIRECT_URI=http://127.0.0.1:5001/collabzzinflu/europe-west1/tiktok_callback_handler
```

### 3. Tester localement

```bash
cd functions
source venv/bin/activate
firebase emulators:start
```

Puis visiter :
- http://127.0.0.1:5001/collabzzinflu/europe-west1/youtube_connect?userId=test123
- http://127.0.0.1:5001/collabzzinflu/europe-west1/tiktok_connect?userId=test123

### 4. Déployer en production

```bash
firebase deploy --only functions
```

## 🎯 Comment ça marche

### Flux YouTube

```
1. Utilisateur clique "Connecter YouTube" dans Mon Profil
   ↓
2. Frontend ouvre popup vers:
   https://.../youtube_connect?userId=firebaseAuthId
   ↓
3. Function redirige vers Google OAuth
   ↓
4. Utilisateur autorise
   ↓
5. Google redirige vers youtube_callback_handler
   ↓
6. Function récupère:
   - Nom du canal
   - Abonnés
   - 6 dernières vidéos (titres, vues, likes)
   ↓
7. Sauvegarde dans Firestore:
   influencers/{userId}/socialAccounts/youtube
   ↓
8. Affiche page de succès et ferme popup
   ↓
9. Chaque jour à 2h: mise à jour automatique
```

### Flux TikTok (identique)

```
tiktok_connect → TikTok OAuth → tiktok_callback_handler
→ Récupère followers, likes, vidéos
→ Sauvegarde Firestore
→ Mise à jour quotidienne
```

## 📊 Structure Firestore

```json
{
  "influencers": {
    "userId123": {
      "socialAccounts": {
        "youtube": {
          "connected": true,
          "channelName": "Mon Canal",
          "subscribers": 25000,
          "recentVideos": [
            {
              "title": "Ma vidéo",
              "views": 15000,
              "likes": 850
            }
          ]
        },
        "tiktok": {
          "connected": true,
          "username": "@monusername",
          "followers": 50000,
          "likes": 250000
        }
      },
      "tokens": {
        "youtube": { "accessToken": "...", "refreshToken": "..." },
        "tiktok": { "accessToken": "...", "refreshToken": "..." }
      }
    }
  }
}
```

## 🔍 Debugging

### Voir les logs
```bash
firebase functions:log
```

### Tester une fonction localement
```bash
cd functions
python -c "from lib.youtube import connect_youtube; print(connect_youtube('test123'))"
```

## 🎨 Frontend - Modifier my_profil.jsx

Changer les URLs des fonctions :
```javascript
const FUNCTIONS_URL = 'https://europe-west1-collabzzinflu.cloudfunctions.net';

const connectYouTube = () => {
  const popup = window.open(
    `${FUNCTIONS_URL}/youtube_connect?userId=${currentUser.uid}`,
    'YouTube',
    'width=600,height=700'
  );
};

const connectTikTok = () => {
  const popup = window.open(
    `${FUNCTIONS_URL}/tiktok_connect?userId=${currentUser.uid}`,
    'TikTok',
    'width=600,height=700'
  );
};
```

## ✨ Avantages Python

1. **Code plus court** : 300 lignes vs 500+ en JavaScript
2. **Bibliothèques officielles Google** : Meilleur support
3. **Syntaxe claire** : Plus facile à débugger
4. **Gestion d'erreurs simple** : try/except
5. **Parfait pour apprendre** : Moins de complexité asynchrone

## ⚠️ Points importants

- **YouTube** : Besoin d'OAuth consent screen (mode Test OK pour commencer)
- **TikTok** : App doit être approuvée (peut prendre quelques jours)
- **Tokens** : Rafraîchis automatiquement par le code
- **Scheduler** : Fonctionne uniquement en production (pas dans l'émulateur)

## 🐛 Erreurs communes

### "Missing code or state"
→ Vérifier que les redirect URIs sont exactement les mêmes

### "Invalid client"
→ Vérifier YOUTUBE_CLIENT_ID et YOUTUBE_CLIENT_SECRET dans .env

### "Scope not authorized"
→ TikTok : Vérifier que les scopes sont activés dans l'app

## 🎓 Apprentissage Python

Ce projet couvre :
- ✅ Modules et imports
- ✅ Fonctions et paramètres
- ✅ Dictionnaires et listes
- ✅ HTTP requests (requests library)
- ✅ OAuth flow
- ✅ API REST
- ✅ Firebase Admin SDK
- ✅ Gestion d'erreurs (try/except)
- ✅ Decorators (@https_fn, @scheduler_fn)

Parfait pour débuter ! 🚀
