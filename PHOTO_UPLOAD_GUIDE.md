# 📸 Système de Gestion des Photos - Documentation

## 🎯 Fonctionnalités ajoutées

### 1. Photo de profil principale
- Upload d'une photo de profil unique pour l'influenceur
- Remplacement automatique de l'ancienne photo
- Preview en temps réel
- Stockage dans `profile_photos/`

### 2. Portfolio de photos (galerie)
- Jusqu'à 12 photos dans le portfolio
- Upload multiple de photos
- Affichage en grille responsive
- Lightbox pour voir les photos en grand
- Suppression individuelle des photos
- Stockage dans `portfolio/`

## 📁 Structure des fichiers créés

```
src/
├── components/
│   ├── PhotoUpload.jsx         # Composant pour upload photo unique
│   └── PortfolioGallery.jsx    # Composant pour galerie photos
└── pages/
    └── my_profil.jsx            # Page de profil mise à jour

storage.rules                     # Règles de sécurité Firebase Storage
```

## 🔧 Configuration Firebase Storage

### 1. Déployer les règles de sécurité

```bash
# Déployez les règles Storage vers Firebase
firebase deploy --only storage
```

### 2. Vérifier que Storage est activé

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. **Storage** → Si pas activé, cliquez sur "Commencer"
4. Choisissez le mode "Production" et une région (europe-west1)

### Import en lot des images locales vers Firebase Storage

Depuis la racine du projet:

```bash
npm run upload:assets:dry
```

Puis, pour uploader réellement:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY=./service-account.json npm run upload:assets
```

Le script lit les images de `src/assets`, les envoie dans `seed-assets/` et génère un mapping dans `scripts/uploaded-assets-map.json`.

## 💾 Structure de données Firestore

Les données des photos sont stockées dans les documents des influenceurs :

```javascript
// Collection: influencers/{userId}
{
  photoURL: "https://firebasestorage.../profile_photos/...",
  profilePhotos: [
    {
      url: "https://firebasestorage.../portfolio/...",
      uploadedAt: "2026-01-08T...",
      fileName: "userId_portfolio_timestamp_random.jpg"
    },
    // ... jusqu'à 12 photos
  ]
}
```

## 🎨 Utilisation des composants

### PhotoUpload - Photo de profil unique

```jsx
import PhotoUpload from '../components/PhotoUpload'

<PhotoUpload
  userId={currentUser.uid}
  currentPhotoURL={userData?.photoURL || ''}
  onPhotoUploaded={async (url) => {
    // Mettre à jour Firestore avec la nouvelle URL
    await updateDoc(doc(db, 'influencers', currentUser.uid), {
      photoURL: url
    })
  }}
  label="Photo de profil"
  folder="profile_photos"
  maxSize={5} // MB
/>
```

### PortfolioGallery - Galerie de photos

```jsx
import PortfolioGallery from '../components/PortfolioGallery'

<PortfolioGallery
  userId={currentUser.uid}
  photos={profilePhotos}
  onPhotosUpdated={async (updatedPhotos) => {
    // Mettre à jour Firestore avec la nouvelle liste
    await updateDoc(doc(db, 'influencers', currentUser.uid), {
      profilePhotos: updatedPhotos
    })
  }}
  maxPhotos={12}
  maxSize={5} // MB
/>
```

## 🔒 Règles de sécurité

Les règles Storage garantissent :
- ✅ **Lecture publique** : Tout le monde peut voir les photos
- ✅ **Écriture restreinte** : Seul le propriétaire peut uploader/supprimer
- ✅ **Validation de type** : Seulement les images sont acceptées
- ✅ **Limite de taille** : Max 5MB par photo

## 📱 Interface utilisateur

### Page de profil - Onglet "Gestion du Profil"

```
┌─────────────────────────────────────┐
│  Photo de profil                    │
│  ┌────┐  [Ajouter] [Supprimer]     │
│  │ 📷 │                             │
│  └────┘                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Portfolio (3 / 12 photos)          │
│  [+ Ajouter des photos]             │
│                                     │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐          │
│  │ 📸│ │ 📸│ │ 📸│ │ + │          │
│  └───┘ └───┘ └───┘ └───┘          │
└─────────────────────────────────────┘
```

## 🚀 Fonctionnalités clés

### PhotoUpload
- ✅ Preview avant upload
- ✅ Indicateur de progression
- ✅ Validation (type, taille)
- ✅ Suppression de l'ancienne photo automatique
- ✅ Messages d'erreur clairs

### PortfolioGallery
- ✅ Upload multiple simultané
- ✅ Grille responsive (2/3/4 colonnes)
- ✅ Lightbox pour agrandir les photos
- ✅ Suppression au hover avec confirmation
- ✅ Compteur de photos
- ✅ Placeholder pour ajouter plus de photos

## 🎯 Utilisation par l'influenceur

1. **Se connecter** en tant qu'influenceur
2. Aller sur **"Mon Profil"**
3. Cliquer sur l'onglet **"Gestion du Profil"**
4. **Photo de profil** : Cliquer sur "Ajouter" pour uploader
5. **Portfolio** : Cliquer sur "+ Ajouter des photos" ou sur le bouton [+]

## 🔄 Affichage sur le site

Les photos uploadées seront automatiquement visibles :
- Photo de profil dans la carte influenceur
- Photos du portfolio dans la page détail de l'influenceur
- Photos dans les résultats de recherche

## ⚠️ Limites et validations

| Paramètre | Valeur |
|-----------|--------|
| Taille max photo profil | 5 MB |
| Taille max photo portfolio | 5 MB |
| Nombre max photos portfolio | 12 |
| Formats acceptés | JPG, PNG, WEBP |
| Authentification | Requise pour upload |

## 🐛 Dépannage

### Les photos ne s'uploadent pas
1. Vérifier que Firebase Storage est activé
2. Vérifier les règles Storage sont déployées
3. Vérifier la console browser pour les erreurs

### Erreur "Permission denied"
- Les règles Storage ne sont pas déployées
- L'utilisateur n'est pas authentifié
- L'utilisateur essaie d'uploader pour un autre userId

### Les photos ne s'affichent pas
- Vérifier que les URLs sont bien sauvegardées dans Firestore
- Vérifier les règles de lecture Storage (allow read: if true)
- Vérifier les CORS si appelé depuis un domaine différent

## 📊 Performance

- **Upload** : Instantané pour photos < 2MB
- **Suppression** : Instantané
- **Chargement galerie** : Lazy loading automatique par le navigateur
- **Cache** : Les URLs Firebase sont mises en cache

## 🔮 Améliorations futures possibles

- [ ] Compression automatique des images avant upload
- [ ] Recadrage d'image intégré
- [ ] Filtres et édition basique
- [ ] Réorganisation par glisser-déposer
- [ ] Tags sur les photos
- [ ] Albums/catégories
- [ ] Import depuis Instagram/TikTok directement

## 📝 Notes importantes

1. **Sécurité** : Les photos sont publiques mais seul le propriétaire peut les modifier
2. **Coût** : Storage Firebase gratuit jusqu'à 5GB et 1GB de transfert/jour
3. **Performance** : Utilisez des images optimisées (< 1MB recommandé)
4. **SEO** : Ajoutez des alt texts descriptifs pour le référencement

## 🆘 Support

En cas de problème :
1. Vérifier les logs dans la console browser (F12)
2. Vérifier les logs Firebase Console → Storage → Fichiers
3. Tester les règles dans Firebase Console → Storage → Rules → Playground
