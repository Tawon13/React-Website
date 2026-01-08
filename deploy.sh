#!/bin/bash

# Script de déploiement pour collabzz.com
# À exécuter sur le VPS OVH

set -e

echo "🚀 Début du déploiement de Collabzz..."

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
APP_DIR="/var/www/collabzz"
REPO_URL="git@github.com:votre-username/React-Website.git" # À modifier

# Créer le dossier de logs s'il n'existe pas
mkdir -p $APP_DIR/logs

echo -e "${YELLOW}📦 Mise à jour du code...${NC}"
cd $APP_DIR

# Pull les dernières modifications
git pull origin main

echo -e "${YELLOW}📚 Installation des dépendances...${NC}"
npm install --production

echo -e "${YELLOW}🔨 Build de l'application...${NC}"
npm run build

echo -e "${YELLOW}♻️  Redémarrage de l'application avec PM2...${NC}"
pm2 reload ecosystem.config.js --update-env

echo -e "${YELLOW}💾 Sauvegarde de la configuration PM2...${NC}"
pm2 save

echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"

# Afficher le status
pm2 status
pm2 logs collabzz --lines 20
