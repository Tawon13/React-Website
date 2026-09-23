import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import LegalLayout from '../components/LegalLayout';

const SECTIONS = [
    { id: 'section-1', title: "1. Éditeur du site" },
    { id: 'section-2', title: "2. Hébergement" },
    { id: 'section-3', title: "3. Propriété intellectuelle" },
    { id: 'section-4', title: "4. Données personnelles" },
    { id: 'section-5', title: "5. Cookies" },
    { id: 'section-6', title: "6. Liens hypertextes" },
    { id: 'section-7', title: "7. Limitation de responsabilité" },
    { id: 'section-8', title: "8. Droit applicable" },
    { id: 'section-9', title: "9. Contact" },
];

const MentionsLegales = () => {
  return (
    <>
      <SEO title="Mentions légales" path="/mentions-legales" />
      <LegalLayout title="Mentions légales" updated="9 septembre 2026" current="/mentions-legales" sections={SECTIONS}>
          <section id="section-1">
            <h2>
              1. Éditeur du site
            </h2>
            <p>
              Le site Collabzz (ci-après « le Site »), accessible à l’adresse
              collabzz.com, est édité par :
            </p>
            <ul>
              <li>Nom : Mohamed Bechagra</li>
              <li>Forme juridique : Entrepreneur individuel (micro-entreprise / auto-entrepreneur)</li>
              <li>Adresse du siège : 9 Rue Louis Braille, 13005 Marseille, France</li>
              <li>SIRET : 920 885 399 00013</li>
              <li>TVA : non applicable, article 293 B du Code général des impôts (franchise en base de TVA)</li>
              <li>Directeur de la publication : Mohamed Bechagra</li>
              <li>Email de contact : <a href="mailto:contact@collabzz.com">contact@collabzz.com</a></li>
            </ul>
          </section>

          <section id="section-2">
            <h2>
              2. Hébergement
            </h2>
            <p>
              Le Site (partie applicative front-end) est hébergé sur un serveur privé
              virtuel (VPS) fourni par :
            </p>
            <ul>
              <li>OVH SAS — 2 rue Kellermann, 59100 Roubaix, France</li>
            </ul>
            <p className="mt-2">
              Les fonctions applicatives, l’authentification et le stockage des données
              (base de données Firestore, stockage de fichiers, fonctions serveur) sont
              hébergés par :
            </p>
            <ul>
              <li>
                Google Ireland Limited (Firebase / Google Cloud Platform) — Gordon House,
                Barrow Street, Dublin 4, Irlande
              </li>
            </ul>
          </section>

          <section id="section-3">
            <h2>
              3. Propriété intellectuelle
            </h2>
            <p>
              L’ensemble des éléments présents sur le Site (textes, images, logos, chartes
              graphiques, code source, base de données) est protégé par le droit d’auteur
              et le droit des marques. Toute reproduction, représentation, modification ou
              exploitation, totale ou partielle, de ces éléments sans autorisation écrite
              préalable de Collabzz est interdite et pourrait constituer une contrefaçon
              au sens des articles L.335-2 et suivants du Code de la propriété
              intellectuelle.
            </p>
          </section>

          <section id="section-4">
            <h2>
              4. Données personnelles
            </h2>
            <p>
              Le traitement des données personnelles collectées via le Site (création de
              compte, connexion aux réseaux sociaux, navigation) est décrit en détail dans
              notre{' '}
              <Link to="/privacy">Politique de confidentialité</Link>
              , conforme au Règlement Général sur la Protection des Données (RGPD) et à la
              loi Informatique et Libertés modifiée.
            </p>
          </section>

          <section id="section-5">
            <h2>
              5. Cookies
            </h2>
            <p>
              Le Site utilise des cookies de mesure d’audience (Google/Firebase
              Analytics), déposés uniquement après recueil de votre consentement via le
              bandeau affiché lors de votre première visite. Pour en savoir plus, consultez
              la section « Cookies » de notre{' '}
              <Link to="/privacy">Politique de confidentialité</Link>
              .
            </p>
          </section>

          <section id="section-6">
            <h2>
              6. Liens hypertextes
            </h2>
            <p>
              Le Site peut contenir des liens vers des sites tiers (réseaux sociaux des
              créateurs, sites des marques partenaires). Collabzz n’exerce aucun contrôle
              sur ces sites et décline toute responsabilité quant à leur contenu ou à leurs
              pratiques en matière de données personnelles.
            </p>
          </section>

          <section id="section-7">
            <h2>
              7. Limitation de responsabilité
            </h2>
            <p>
              Collabzz s’efforce d’assurer l’exactitude et la mise à jour des informations
              diffusées sur le Site, mais ne peut garantir l’absence d’erreurs ou
              d’interruptions de service. L’utilisation des informations et contenus du
              Site se fait sous l’entière responsabilité de l’utilisateur.
            </p>
          </section>

          <section id="section-8">
            <h2>
              8. Droit applicable
            </h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de
              litige, et à défaut de résolution amiable, les tribunaux français seront
              seuls compétents.
            </p>
          </section>

          <section id="section-9">
            <h2>
              9. Contact
            </h2>
            <p>
              Pour toute question relative aux présentes mentions légales, vous pouvez nous
              contacter à : <a href="mailto:contact@collabzz.com">contact@collabzz.com</a>
            </p>
          </section>
      </LegalLayout>
    </>
  );
};

export default MentionsLegales;
