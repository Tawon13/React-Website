# Configuration des Variables d'Environnement

## Firebase Cloud Functions (Backend)

1. Copiez le fichier d'exemple :
```bash
cd functions
cp .env.example .env
```

2. Remplissez les valeurs dans `functions/.env` :
   - **YouTube API** : Credentials depuis [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **TikTok API** : Credentials depuis [TikTok for Developers](https://developers.tiktok.com/)

3. Déployez les variables sur Firebase :
```bash
firebase functions:config:set \
  youtube.client_id="YOUR_YOUTUBE_CLIENT_ID" \
  youtube.client_secret="YOUR_YOUTUBE_CLIENT_SECRET" \
  tiktok.client_key="YOUR_TIKTOK_CLIENT_KEY" \
  tiktok.client_secret="YOUR_TIKTOK_CLIENT_SECRET"
```

## Frontend (React + Vite)

1. Copiez le fichier d'exemple (fourni) :
```bash
cp .env.example .env
```

2. Remplissez les valeurs dans `.env` :
   - **Firebase Config** : Depuis [Firebase Console](https://console.firebase.google.com/)
   - **Functions URL** : L'URL de vos Cloud Functions

> ⚠️ Le bundle React vérifie désormais la présence de toutes les variables. Le serveur de dev/build échouera si une clé manque, ce qui évite de déployer la configuration par défaut.

## ⚠️ Sécurité

- **NE JAMAIS** commiter les fichiers `.env` sur Git
- Les fichiers `.env` sont déjà dans `.gitignore`
- Seuls les fichiers `.env.example` doivent être versionnés

## Variables Requises

### Backend (`functions/.env`)
- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI`
- `INSTAGRAM_CLIENT_ID`
- `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_REDIRECT_URI`
- `SENDGRID_API_KEY`
- `CONTACT_EMAIL`
- `STATE_SIGNING_SECRET` (clé aléatoire utilisée pour signer/valider le paramètre `state`)

### Frontend (`.env`)
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_FIREBASE_FUNCTIONS_URL`
