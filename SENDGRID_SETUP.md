# Configuration de l'envoi d'emails pour le formulaire de contact

## Étape 1 : Créer un compte SendGrid

1. Allez sur https://sendgrid.com/
2. Créez un compte gratuit (100 emails/jour gratuits)
3. Vérifiez votre email

## Étape 2 : Créer une clé API SendGrid

1. Connectez-vous à SendGrid
2. Allez dans **Settings** → **API Keys**
3. Cliquez sur **Create API Key**
4. Donnez un nom à votre clé (ex: "Collabzz Contact Form")
5. Sélectionnez **Restricted Access**
6. Activez uniquement : **Mail Send** → **Full Access**
7. Cliquez sur **Create & View**
8. **IMPORTANT** : Copiez la clé API immédiatement (elle ne sera plus visible après)

## Étape 3 : Vérifier votre domaine d'envoi (Sender Authentication)

### Option A : Single Sender Verification (Rapide - pour débuter)
1. Allez dans **Settings** → **Sender Authentication**
2. Cliquez sur **Verify a Single Sender**
3. Remplissez le formulaire avec votre email (celui qui recevra les messages)
4. Vérifiez votre email et cliquez sur le lien de confirmation

### Option B : Domain Authentication (Professionnel - recommandé)
1. Allez dans **Settings** → **Sender Authentication**
2. Cliquez sur **Authenticate Your Domain**
3. Suivez les instructions pour configurer vos DNS

## Étape 4 : Configurer les variables d'environnement

### Pour le développement local (functions/.env)
```bash
SENDGRID_API_KEY=SG.votre-cle-api-ici
CONTACT_EMAIL=votre.email@exemple.com
```

### Pour la production (functions/.env.yaml)
```yaml
SENDGRID_API_KEY: SG.votre-cle-api-ici
CONTACT_EMAIL: votre.email@exemple.com
```

Remplacez :
- `SG.votre-cle-api-ici` par la clé API SendGrid que vous avez copiée
- `votre.email@exemple.com` par l'email où vous voulez recevoir les messages de contact

## Étape 5 : Déployer les Cloud Functions

```bash
cd functions
firebase deploy --only functions
```

## Étape 6 : Tester le formulaire

1. Allez sur https://collabzz.onrender.com/contact
2. Remplissez le formulaire
3. Envoyez un message test
4. Vérifiez votre boîte email

## Alternative gratuite : EmailJS

Si vous ne voulez pas utiliser SendGrid, vous pouvez utiliser EmailJS (plus simple mais moins professionnel) :

1. Créez un compte sur https://www.emailjs.com/
2. Configurez un service email
3. Créez un template d'email
4. Utilisez leur SDK JavaScript directement dans le frontend

## Dépannage

### Erreur "The from email does not contain a valid address"
→ Vous devez vérifier votre sender (Single Sender ou Domain)

### Erreur "API key not valid"
→ Vérifiez que la clé API est correctement copiée dans .env.yaml

### Les emails n'arrivent pas
1. Vérifiez vos spams
2. Vérifiez que le CONTACT_EMAIL est correct
3. Consultez les logs SendGrid : **Activity** dans le dashboard

### Les emails arrivent mais vont dans les spams
→ Configurez Domain Authentication pour améliorer la délivrabilité

## Limites du plan gratuit SendGrid

- 100 emails par jour
- Idéal pour commencer
- Passez au plan payant si nécessaire (à partir de 19.95$/mois pour 40,000 emails)
