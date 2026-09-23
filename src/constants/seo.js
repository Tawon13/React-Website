// Config SEO partagée entre le composant <SEO> (côté navigateur) et
// scripts/prerender-seo.mjs (build), pour que les balises pré-rendues et celles
// posées par Helmet restent identiques.
import { INFLUENCER_CATEGORIES } from './categories.js'

export const SITE_NAME = 'Collabzz'
export const SITE_URL = 'https://www.collabzz.com'
export const DEFAULT_TITLE = 'Collabzz : la plateforme pour collaborer avec des influenceurs'
export const DEFAULT_DESCRIPTION = "Collabzz est la plateforme française de marketing d'influence : trouvez des influenceurs TikTok vérifiés, comparez leurs tarifs et lancez des collaborations rémunérées en toute sécurité."
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`

export const formatTitle = (title) => (title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE)

// Pages publiques indexables (servent aussi à générer le sitemap).
export const PAGE_SEO = {
    home: {
        path: '/',
        description: DEFAULT_DESCRIPTION,
        changefreq: 'weekly',
        priority: '1.0'
    },
    talents: {
        path: '/talents',
        title: 'Trouver un influenceur TikTok',
        description: "Parcourez les influenceurs vérifiés de Collabzz : beauté, mode, food, voyage, gaming… Comparez audiences et tarifs, puis lancez votre collaboration.",
        changefreq: 'daily',
        priority: '0.9'
    },
    forBrands: {
        path: '/for-brands',
        title: "Marques : lancez vos campagnes d'influence",
        description: "Trouvez les meilleurs influenceurs pour votre marque, sans agence ni abonnement. Tarifs transparents, paiement sécurisé et messagerie intégrée.",
        changefreq: 'monthly',
        priority: '0.8'
    },
    forCreators: {
        path: '/for-creators',
        title: 'Créateurs : monétisez votre audience',
        description: "Influenceur ou créateur de contenu ? Rejoignez Collabzz gratuitement, fixez vos tarifs et recevez 100 % de votre prix sur chaque collaboration avec des marques.",
        changefreq: 'monthly',
        priority: '0.8'
    },
    about: {
        path: '/about',
        title: 'À propos',
        description: "Découvrez Collabzz, la plateforme qui connecte marques et influenceurs pour des collaborations rémunérées simples et sécurisées.",
        changefreq: 'monthly',
        priority: '0.6'
    },
    contact: {
        path: '/contact',
        title: 'Contact',
        description: 'Une question sur Collabzz ? Contactez notre équipe, réponse sous 24-48h.',
        changefreq: 'monthly',
        priority: '0.5'
    },
    terms: {
        path: '/terms',
        title: "Conditions d'utilisation",
        description: "Conditions générales d'utilisation de la plateforme Collabzz.",
        changefreq: 'yearly',
        priority: '0.3'
    },
    privacy: {
        path: '/privacy',
        title: 'Politique de confidentialité',
        description: 'Comment Collabzz collecte, utilise et protège vos données personnelles (RGPD).',
        changefreq: 'yearly',
        priority: '0.3'
    }
}

export const categoryPath = (category) => `/talents/${encodeURIComponent(category)}`

export const categorySeo = (category) => ({
    path: categoryPath(category),
    title: `Influenceurs ${category}`,
    description: `Trouvez des influenceurs ${category} vérifiés sur Collabzz, comparez leurs audiences et leurs tarifs, et lancez une collaboration en quelques clics.`
})

export const CATEGORY_SEO = INFLUENCER_CATEGORIES.map(categorySeo)

export const influencerSeo = ({ id, tiktokUsername, category, city, image }) => {
    // Nom et prénom réels jamais affichés publiquement : on montre le pseudo TikTok à la place.
    const displayName = tiktokUsername ? `@${tiktokUsername}` : (category || 'Créateur de contenu')
    const niche = category ? `influenceur ${category}` : 'créateur de contenu'
    return {
        path: `/influencer/${id}`,
        title: displayName,
        description: `Découvrez le profil de ${displayName}, ${niche}${city ? ` basé(e) à ${city}` : ''}, sur Collabzz : audience, tarifs et collaboration en quelques clics.`,
        image: image || DEFAULT_IMAGE
    }
}
