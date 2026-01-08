# 🚀 Configuration PM2 sur VPS OVH - Collabzz

Ce guide explique comment installer et configurer PM2 pour garantir que collabzz.com reste en ligne 24/7.

## 📋 Prérequis

- Accès SSH au VPS OVH
- Node.js et npm installés
- Code de l'application sur le VPS

## 🔧 Installation sur le VPS

### 1. Se connecter au VPS

```bash
ssh votre-user@collabzz.com
# ou
ssh votre-user@IP_DU_VPS
```

### 2. Installer PM2 globalement

```bash
sudo npm install -g pm2
```

### 3. Naviguer vers le dossier de l'application

```bash
cd /var/www/collabzz
# ou le chemin où se trouve votre application
```

### 4. Transférer les fichiers de configuration

Depuis votre machine locale, transférez les fichiers :

```bash
# Depuis /Users/amine/Desktop/React-Website
scp ecosystem.config.js deploy.sh votre-user@collabzz.com:/var/www/collabzz/
```

### 5. Démarrer l'application avec PM2

```bash
cd /var/www/collabzz
pm2 start ecosystem.config.js
```

### 6. Configurer le démarrage automatique au boot

```bash
# Générer le script de démarrage
pm2 startup systemd

# Copier-coller la commande affichée (ressemble à) :
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u votre-user --hp /home/votre-user

# Sauvegarder la configuration PM2
pm2 save
```

## 📊 Commandes PM2 utiles

### Gestion de l'application

```bash
# Voir le statut
pm2 status

# Voir les logs en temps réel
pm2 logs collabzz

# Voir les logs (100 dernières lignes)
pm2 logs collabzz --lines 100

# Redémarrer l'application
pm2 restart collabzz

# Recharger sans downtime
pm2 reload collabzz

# Arrêter l'application
pm2 stop collabzz

# Supprimer l'application de PM2
pm2 delete collabzz
```

### Monitoring

```bash
# Interface de monitoring en temps réel
pm2 monit

# Informations détaillées
pm2 show collabzz

# Statistiques CPU/Mémoire
pm2 status
```

## 🔄 Déploiement

Pour déployer une nouvelle version :

```bash
# Méthode 1 : Script automatique
cd /var/www/collabzz
chmod +x deploy.sh
./deploy.sh

# Méthode 2 : Manuel
cd /var/www/collabzz
git pull origin main
npm install --production
npm run build
pm2 reload collabzz
```

## 🛡️ Configuration Nginx (si applicable)

Si vous utilisez Nginx comme reverse proxy :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name collabzz.com www.collabzz.com;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name collabzz.com www.collabzz.com;

    # Certificat SSL
    ssl_certificate /etc/letsencrypt/live/collabzz.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/collabzz.com/privkey.pem;

    # Proxy vers Node.js
    location / {
        proxy_pass http://localhost:10000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Redémarrer Nginx :
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🔍 Diagnostic des problèmes

### Le site ne fonctionne pas

```bash
# 1. Vérifier si PM2 tourne
pm2 status

# 2. Voir les logs d'erreur
pm2 logs collabzz --err --lines 50

# 3. Vérifier si Node.js écoute sur le port
sudo netstat -tlnp | grep 10000
# ou
sudo lsof -i :10000

# 4. Vérifier les ressources
pm2 monit
free -h
df -h

# 5. Vérifier Nginx (si applicable)
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/error.log
```

### Redémarrer tout

```bash
# Redémarrer l'application
pm2 restart collabzz

# Redémarrer Nginx (si applicable)
sudo systemctl restart nginx

# En dernier recours, redémarrer PM2
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

## 📈 Avantages de PM2

✅ **Redémarrage automatique** : Si l'application crash, PM2 la redémarre immédiatement
✅ **Monitoring** : Surveillance CPU, RAM, uptime en temps réel
✅ **Logs centralisés** : Tous les logs au même endroit
✅ **Démarrage au boot** : L'application redémarre automatiquement après un reboot du VPS
✅ **Zéro downtime** : `pm2 reload` permet de mettre à jour sans interruption
✅ **Cluster mode** : Possibilité d'utiliser plusieurs cœurs CPU

## 🎯 Prochaines étapes recommandées

1. **Configurer les alertes** : PM2 peut envoyer des notifications en cas de problème
2. **Mettre en place un monitoring externe** : UptimeRobot, Pingdom, etc.
3. **Automatiser les sauvegardes** : Base de données et fichiers
4. **Configurer un firewall** : UFW sur le VPS
5. **Mettre à jour régulièrement** : Node.js, npm, PM2, dépendances

## 📞 Support

En cas de problème, vérifiez :
- Les logs PM2 : `pm2 logs collabzz`
- Les logs système : `journalctl -xe`
- L'utilisation des ressources : `pm2 monit`

## 🔗 Ressources utiles

- Documentation PM2 : https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 Cluster Mode : https://pm2.keymetrics.io/docs/usage/cluster-mode/
- PM2 Plus (monitoring avancé) : https://pm2.io/
