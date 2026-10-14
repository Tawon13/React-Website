// Guides éditoriaux (/guides/<slug>) : métadonnées partagées entre la page React
// (src/pages/Guide.jsx) et scripts/prerender-seo.mjs (balises <head> + sitemap).
// Le corps de chaque guide est un composant JSX dans src/guides/.

export const guidePath = (slug) => `/guides/${slug}`

export const GUIDES = [
    {
        slug: 'combien-coute-un-influenceur-tiktok',
        title: 'Combien coûte un influenceur TikTok en 2026 ?',
        h1: 'Combien coûte un influenceur TikTok en 2026 ?',
        description: "Tarifs des influenceurs TikTok en 2026 : prix d'une vidéo selon le nombre d'abonnés, ce qui fait varier le coût, budget d'une campagne et pièges à éviter.",
        excerpt: "Prix d'une vidéo selon la taille du compte, facteurs qui font varier le tarif et budget réaliste pour une première campagne.",
        datePublished: '2026-10-14',
        dateModified: '2026-10-14',
        readingMinutes: 7,
        // Repris dans le balisage FAQPage et affiché en fin d'article.
        faq: [
            {
                question: 'Combien coûte une vidéo TikTok avec un micro-influenceur ?',
                answer: "Pour un compte de 10 000 à 50 000 abonnés, comptez en général entre 150 et 600 € par vidéo en France. Le prix dépend surtout des vues moyennes, de la niche et des droits d'utilisation demandés."
            },
            {
                question: 'Faut-il passer par une agence pour travailler avec un influenceur TikTok ?',
                answer: "Non. Une agence est utile pour les grosses campagnes multi-pays, mais elle ajoute souvent 20 à 40 % de commission. Une plateforme comme Collabzz permet de contacter directement des créateurs vérifiés, avec des tarifs affichés et un paiement sécurisé."
            },
            {
                question: 'Peut-on payer un influenceur TikTok uniquement en produits ?',
                answer: "C'est possible avec de très petits comptes, mais la vidéo reste une prestation de travail : les créateurs sérieux demandent une rémunération. Un produit offert sans contrepartie obligatoire (envoi spontané) est une autre démarche, sans garantie de publication."
            },
            {
                question: "Comment savoir si le tarif d'un influenceur est justifié ?",
                answer: "Rapportez le prix aux vues moyennes de ses dernières vidéos (coût pour 1 000 vues) et vérifiez son taux d'engagement. Des statistiques issues du compte TikTok connecté sont plus fiables que des captures d'écran envoyées par message."
            }
        ]
    }
]

export const GUIDE_SEO = GUIDES.map((guide) => ({
    path: guidePath(guide.slug),
    title: guide.title,
    description: guide.description,
    lastmod: guide.dateModified
}))

export const findGuide = (slug) => GUIDES.find((guide) => guide.slug === slug)
