import React from 'react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
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
          Conditions d'utilisation
        </h1>
        
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              1. Acceptation des conditions
            </h2>
            <p>
              En accédant et en utilisant Collabzz, vous acceptez d'être lié par ces
              conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez
              ne pas utiliser notre plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              2. Description du service
            </h2>
            <p>
              Collabzz est une plateforme qui met en relation les marques et les
              influenceurs pour des collaborations. Nous facilitons la connexion entre
              les deux parties mais ne sommes pas responsables des accords conclus.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              3. Compte utilisateur
            </h2>
            <p>
              Vous êtes responsable de maintenir la confidentialité de votre compte et
              de votre mot de passe. Vous acceptez de nous informer immédiatement de
              toute utilisation non autorisée de votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              4. Connexion aux réseaux sociaux
            </h2>
            <p>
              En connectant vos comptes de réseaux sociaux (YouTube, TikTok, Instagram),
              vous nous autorisez à accéder à vos statistiques publiques et informations
              de profil. Nous ne publions jamais de contenu en votre nom sans votre
              autorisation explicite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              5. Propriété intellectuelle
            </h2>
            <p>
              Tout le contenu présent sur Collabzz, incluant mais non limité au texte,
              graphiques, logos, et code, est la propriété de Collabzz et est protégé
              par les lois sur le droit d'auteur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              6. Limitation de responsabilité
            </h2>
            <p>
              Collabzz ne peut être tenu responsable des dommages directs, indirects,
              accessoires ou consécutifs résultant de l'utilisation ou de l'impossibilité
              d'utiliser notre service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              7. Modifications des conditions
            </h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment.
              Les modifications prendront effet immédiatement après leur publication sur
              cette page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              8. Contact
            </h2>
            <p>
              Pour toute question concernant ces conditions d'utilisation, veuillez nous
              contacter à : contact@collabzz.com
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

export default Terms;
