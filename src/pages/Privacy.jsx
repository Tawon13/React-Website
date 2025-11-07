import React from 'react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Retour
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Politique de confidentialité
        </h1>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              1. Introduction
            </h2>
            <p>
              Chez Collabzz, nous prenons votre vie privée au sérieux. Cette politique
              de confidentialité explique comment nous collectons, utilisons et
              protégeons vos informations personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              2. Informations que nous collectons
            </h2>
            <p>
              Nous collectons les informations suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Informations de compte (nom, email, mot de passe)</li>
              <li>Informations de profil (photo, bio, catégorie)</li>
              <li>Statistiques des réseaux sociaux (abonnés, vues, engagement)</li>
              <li>Données d'utilisation de la plateforme</li>
              <li>Informations de connexion (adresse IP, type de navigateur)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              3. Comment nous utilisons vos informations
            </h2>
            <p>
              Nous utilisons vos informations pour :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Créer et gérer votre compte</li>
              <li>Faciliter les connexions entre marques et influenceurs</li>
              <li>Afficher vos statistiques publiques de réseaux sociaux</li>
              <li>Améliorer notre service et développer de nouvelles fonctionnalités</li>
              <li>Vous envoyer des notifications importantes</li>
              <li>Prévenir la fraude et assurer la sécurité</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              4. Connexion aux réseaux sociaux
            </h2>
            <p>
              Lorsque vous connectez vos comptes de réseaux sociaux (YouTube, TikTok,
              Instagram), nous accédons uniquement aux informations suivantes :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nom du compte et photo de profil</li>
              <li>Nombre d'abonnés/followers</li>
              <li>Statistiques publiques (vues, likes, commentaires)</li>
              <li>Liste de vos contenus publics récents</li>
            </ul>
            <p className="mt-2">
              Nous ne publions jamais de contenu en votre nom. Nous mettons à jour vos
              statistiques automatiquement une fois par jour.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              5. Partage de vos informations
            </h2>
            <p>
              Nous ne vendons jamais vos informations personnelles. Nous partageons vos
              informations uniquement dans les cas suivants :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Avec les marques qui consultent votre profil public d'influenceur</li>
              <li>Avec nos prestataires de services (hébergement, analytics)</li>
              <li>Si requis par la loi ou pour protéger nos droits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              6. Sécurité des données
            </h2>
            <p>
              Nous utilisons des mesures de sécurité appropriées pour protéger vos
              informations personnelles, incluant :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Stockage sécurisé dans Firebase/Firestore</li>
              <li>Tokens d'authentification OAuth pour les réseaux sociaux</li>
              <li>Accès limité aux données sensibles</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              7. Vos droits
            </h2>
            <p>
              Vous avez le droit de :
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accéder à vos informations personnelles</li>
              <li>Modifier ou supprimer vos informations</li>
              <li>Déconnecter vos comptes de réseaux sociaux à tout moment</li>
              <li>Supprimer votre compte définitivement</li>
              <li>Recevoir une copie de vos données</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              8. Cookies
            </h2>
            <p>
              Nous utilisons des cookies pour améliorer votre expérience sur notre
              plateforme. Vous pouvez désactiver les cookies dans les paramètres de
              votre navigateur, mais cela peut affecter certaines fonctionnalités.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              9. Modifications de cette politique
            </h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité
              occasionnellement. Nous vous informerons de tout changement significatif
              par email ou via une notification sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              10. Contact
            </h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou pour
              exercer vos droits, contactez-nous à : privacy@collabzz.com
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Dernière mise à jour : 7 novembre 2025
          </p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
