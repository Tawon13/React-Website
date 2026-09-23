import SEO from '../components/SEO';
import LegalLayout from '../components/LegalLayout';
import { PAGE_SEO } from '../constants/seo'

const SECTIONS = [
    { id: 'section-1', title: "1. Introduction" },
    { id: 'section-2', title: "2. Informations que nous collectons" },
    { id: 'section-3', title: "3. Comment nous utilisons vos informations" },
    { id: 'section-4', title: "4. Connexion aux réseaux sociaux" },
    { id: 'section-5', title: "5. Partage de vos informations" },
    { id: 'section-6', title: "6. Sécurité des données" },
    { id: 'section-7', title: "7. Vos droits" },
    { id: 'section-8', title: "8. Cookies" },
    { id: 'section-9', title: "9. Modifications de cette politique" },
    { id: 'section-10', title: "10. Contact" },
];

const Privacy = () => {
  return (
    <>
      <SEO {...PAGE_SEO.privacy} />
      <LegalLayout title="Politique de confidentialité" updated="7 novembre 2025" current="/privacy" sections={SECTIONS}>
          <section id="section-1">
            <h2>
              1. Introduction
            </h2>
            <p>
              Chez Collabzz, nous prenons votre vie privée au sérieux. Cette politique
              de confidentialité explique comment nous collectons, utilisons et
              protégeons vos informations personnelles.
            </p>
          </section>

          <section id="section-2">
            <h2>
              2. Informations que nous collectons
            </h2>
            <p>
              Nous collectons les informations suivantes :
            </p>
            <ul>
              <li>Informations de compte (nom, email, mot de passe)</li>
              <li>Informations de profil (photo, bio, catégorie)</li>
              <li>Statistiques des réseaux sociaux (abonnés, vues, engagement)</li>
              <li>Données d’utilisation de la plateforme</li>
              <li>Informations de connexion (adresse IP, type de navigateur)</li>
            </ul>
          </section>

          <section id="section-3">
            <h2>
              3. Comment nous utilisons vos informations
            </h2>
            <p>
              Nous utilisons vos informations pour :
            </p>
            <ul>
              <li>Créer et gérer votre compte</li>
              <li>Faciliter les connexions entre marques et influenceurs</li>
              <li>Afficher vos statistiques publiques de réseaux sociaux</li>
              <li>Améliorer notre service et développer de nouvelles fonctionnalités</li>
              <li>Vous envoyer des notifications importantes</li>
              <li>Prévenir la fraude et assurer la sécurité</li>
            </ul>
          </section>

          <section id="section-4">
            <h2>
              4. Connexion aux réseaux sociaux
            </h2>
            <p>
              Lorsque vous connectez vos comptes de réseaux sociaux (YouTube, TikTok,
              Instagram), nous accédons uniquement aux informations suivantes :
            </p>
            <ul>
              <li>Nom du compte et photo de profil</li>
              <li>Nombre d’abonnés/followers</li>
              <li>Statistiques publiques (vues, likes, commentaires)</li>
              <li>Liste de vos contenus publics récents</li>
            </ul>
            <p className="mt-2">
              Nous ne publions jamais de contenu en votre nom. Nous mettons à jour vos
              statistiques automatiquement une fois par jour.
            </p>
          </section>

          <section id="section-5">
            <h2>
              5. Partage de vos informations
            </h2>
            <p>
              Nous ne vendons jamais vos informations personnelles. Nous partageons vos
              informations uniquement dans les cas suivants :
            </p>
            <ul>
              <li>Avec les marques qui consultent votre profil public d’influenceur</li>
              <li>Avec nos prestataires de services (hébergement, analytics)</li>
              <li>Si requis par la loi ou pour protéger nos droits</li>
            </ul>
          </section>

          <section id="section-6">
            <h2>
              6. Sécurité des données
            </h2>
            <p>
              Nous utilisons des mesures de sécurité appropriées pour protéger vos
              informations personnelles, incluant :
            </p>
            <ul>
              <li>Chiffrement SSL/TLS pour toutes les communications</li>
              <li>Stockage sécurisé dans Firebase/Firestore</li>
              <li>Tokens d’authentification OAuth pour les réseaux sociaux</li>
              <li>Accès limité aux données sensibles</li>
            </ul>
          </section>

          <section id="section-7">
            <h2>
              7. Vos droits
            </h2>
            <p>
              Vous avez le droit de :
            </p>
            <ul>
              <li>Accéder à vos informations personnelles</li>
              <li>Modifier ou supprimer vos informations</li>
              <li>Déconnecter vos comptes de réseaux sociaux à tout moment</li>
              <li>Supprimer votre compte définitivement</li>
              <li>Recevoir une copie de vos données</li>
            </ul>
          </section>

          <section id="section-8">
            <h2>
              8. Cookies
            </h2>
            <p>
              Nous utilisons Google Analytics (via Firebase Analytics) pour mesurer
              l’audience de notre plateforme. Ces cookies de mesure d’audience ne sont
              déposés qu’après votre consentement, recueilli via le bandeau affiché lors
              de votre première visite. Vous pouvez à tout moment changer d’avis en
              effaçant les données de navigation de votre navigateur pour ce site, ce qui
              réaffichera le bandeau de consentement.
            </p>
          </section>

          <section id="section-9">
            <h2>
              9. Modifications de cette politique
            </h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité
              occasionnellement. Nous vous informerons de tout changement significatif
              par email ou via une notification sur la plateforme.
            </p>
          </section>

          <section id="section-10">
            <h2>
              10. Contact
            </h2>
            <p>
              Pour toute question concernant cette politique de confidentialité ou pour
              exercer vos droits, contactez-nous à : <a href="mailto:privacy@collabzz.com">privacy@collabzz.com</a>
            </p>
          </section>
      </LegalLayout>
    </>
  );
};

export default Privacy;
