import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

const MentionsLegales = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SEO title="Mentions légales" path="/mentions-legales" />
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Retour
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Mentions légales
        </h1>

        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              1. Éditeur du site
            </h2>
            <p>
              Le site Collabzz (ci-après « le Site »), accessible à l'adresse
              collabzz.com, est édité par :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nom : Mohamed Bechagra</li>
              <li>Forme juridique : Entrepreneur individuel (micro-entreprise / auto-entrepreneur)</li>
              <li>Adresse du siège : 9 Rue Louis Braille, 13005 Marseille, France</li>
              <li>SIRET : 920 885 399 00013</li>
              <li>TVA : non applicable, article 293 B du Code général des impôts (franchise en base de TVA)</li>
              <li>Directeur de la publication : Mohamed Bechagra</li>
              <li>Email de contact : contact@collabzz.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              2. Hébergement
            </h2>
            <p>
              Le Site (partie applicative front-end) est hébergé sur un serveur privé
              virtuel (VPS) fourni par :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>OVH SAS — 2 rue Kellermann, 59100 Roubaix, France</li>
            </ul>
            <p className="mt-2">
              Les fonctions applicatives, l'authentification et le stockage des données
              (base de données Firestore, stockage de fichiers, fonctions serveur) sont
              hébergés par :
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>
                Google Ireland Limited (Firebase / Google Cloud Platform) — Gordon House,
                Barrow Street, Dublin 4, Irlande
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              3. Propriété intellectuelle
            </h2>
            <p>
              L'ensemble des éléments présents sur le Site (textes, images, logos, chartes
              graphiques, code source, base de données) est protégé par le droit d'auteur
              et le droit des marques. Toute reproduction, représentation, modification ou
              exploitation, totale ou partielle, de ces éléments sans autorisation écrite
              préalable de Collabzz est interdite et pourrait constituer une contrefaçon
              au sens des articles L.335-2 et suivants du Code de la propriété
              intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              4. Données personnelles
            </h2>
            <p>
              Le traitement des données personnelles collectées via le Site (création de
              compte, connexion aux réseaux sociaux, navigation) est décrit en détail dans
              notre{' '}
              <button
                onClick={() => navigate('/privacy')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Politique de confidentialité
              </button>
              , conforme au Règlement Général sur la Protection des Données (RGPD) et à la
              loi Informatique et Libertés modifiée.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              5. Cookies
            </h2>
            <p>
              Le Site utilise des cookies de mesure d'audience (Google/Firebase
              Analytics), déposés uniquement après recueil de votre consentement via le
              bandeau affiché lors de votre première visite. Pour en savoir plus, consultez
              la section « Cookies » de notre{' '}
              <button
                onClick={() => navigate('/privacy')}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Politique de confidentialité
              </button>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              6. Liens hypertextes
            </h2>
            <p>
              Le Site peut contenir des liens vers des sites tiers (réseaux sociaux des
              créateurs, sites des marques partenaires). Collabzz n'exerce aucun contrôle
              sur ces sites et décline toute responsabilité quant à leur contenu ou à leurs
              pratiques en matière de données personnelles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              7. Limitation de responsabilité
            </h2>
            <p>
              Collabzz s'efforce d'assurer l'exactitude et la mise à jour des informations
              diffusées sur le Site, mais ne peut garantir l'absence d'erreurs ou
              d'interruptions de service. L'utilisation des informations et contenus du
              Site se fait sous l'entière responsabilité de l'utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              8. Droit applicable
            </h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de
              litige, et à défaut de résolution amiable, les tribunaux français seront
              seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              9. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes mentions légales, vous pouvez nous
              contacter à : contact@collabzz.com
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-8">
            Dernière mise à jour : 9 septembre 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default MentionsLegales;
