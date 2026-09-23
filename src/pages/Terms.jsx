import SEO from '../components/SEO';
import LegalLayout from '../components/LegalLayout';
import { PAGE_SEO } from '../constants/seo'

const SECTIONS = [
    { id: 'section-1', title: "1. Acceptation des conditions" },
    { id: 'section-2', title: "2. Description du service" },
    { id: 'section-3', title: "3. Compte utilisateur" },
    { id: 'section-4', title: "4. Connexion aux réseaux sociaux" },
    { id: 'section-5', title: "5. Propriété intellectuelle" },
    { id: 'section-6', title: "6. Limitation de responsabilité" },
    { id: 'section-7', title: "7. Modifications des conditions" },
    { id: 'section-8', title: "8. Contact" },
];

const Terms = () => {
  return (
    <>
      <SEO {...PAGE_SEO.terms} />
      <LegalLayout title="Conditions d'utilisation" updated="7 novembre 2025" current="/terms" sections={SECTIONS}>
          <section id="section-1">
            <h2>
              1. Acceptation des conditions
            </h2>
            <p>
              En accédant et en utilisant Collabzz, vous acceptez d’être lié par ces
              conditions d’utilisation. Si vous n’acceptez pas ces conditions, veuillez
              ne pas utiliser notre plateforme.
            </p>
          </section>

          <section id="section-2">
            <h2>
              2. Description du service
            </h2>
            <p>
              Collabzz est une plateforme qui met en relation les marques et les
              influenceurs pour des collaborations. Nous facilitons la connexion entre
              les deux parties mais ne sommes pas responsables des accords conclus.
            </p>
          </section>

          <section id="section-3">
            <h2>
              3. Compte utilisateur
            </h2>
            <p>
              Vous êtes responsable de maintenir la confidentialité de votre compte et
              de votre mot de passe. Vous acceptez de nous informer immédiatement de
              toute utilisation non autorisée de votre compte.
            </p>
          </section>

          <section id="section-4">
            <h2>
              4. Connexion aux réseaux sociaux
            </h2>
            <p>
              En connectant vos comptes de réseaux sociaux (YouTube, TikTok, Instagram),
              vous nous autorisez à accéder à vos statistiques publiques et informations
              de profil. Nous ne publions jamais de contenu en votre nom sans votre
              autorisation explicite.
            </p>
          </section>

          <section id="section-5">
            <h2>
              5. Propriété intellectuelle
            </h2>
            <p>
              Tout le contenu présent sur Collabzz, incluant mais non limité au texte,
              graphiques, logos, et code, est la propriété de Collabzz et est protégé
              par les lois sur le droit d’auteur.
            </p>
          </section>

          <section id="section-6">
            <h2>
              6. Limitation de responsabilité
            </h2>
            <p>
              Collabzz ne peut être tenu responsable des dommages directs, indirects,
              accessoires ou consécutifs résultant de l’utilisation ou de l’impossibilité
              d’utiliser notre service.
            </p>
          </section>

          <section id="section-7">
            <h2>
              7. Modifications des conditions
            </h2>
            <p>
              Nous nous réservons le droit de modifier ces conditions à tout moment.
              Les modifications prendront effet immédiatement après leur publication sur
              cette page.
            </p>
          </section>

          <section id="section-8">
            <h2>
              8. Contact
            </h2>
            <p>
              Pour toute question concernant ces conditions d’utilisation, veuillez nous
              contacter à : <a href="mailto:contact@collabzz.com">contact@collabzz.com</a>
            </p>
          </section>
      </LegalLayout>
    </>
  );
};

export default Terms;
