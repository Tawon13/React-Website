// Adresse lisible d'un profil : /influencer/sarah2icy au lieu de /influencer/<ID Firebase>.
// Fichier sans dépendance React : il est aussi importé par scripts/prerender-seo.mjs.

// NFKD ramène aussi les lettres stylisées (𝑳𝒊𝒍𝒊 → Lili) et retire les accents.
export const slugify = (value = '') => String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')

// Attribue un slug unique à chaque profil (à partir du pseudo TikTok). Sans pseudo, ou si
// deux profils donnent le même slug, on garde l'ID Firebase pour ne jamais créer d'ambiguïté.
export const assignSlugs = (items, getId, getUsername) => {
    const counts = new Map()
    for (const item of items) {
        const slug = slugify(getUsername(item))
        if (slug) counts.set(slug, (counts.get(slug) || 0) + 1)
    }
    return items.map((item) => {
        const slug = slugify(getUsername(item))
        return { item, slug: slug && counts.get(slug) === 1 ? slug : getId(item) }
    })
}

export const influencerPath = (slugOrId) => `/influencer/${encodeURIComponent(slugOrId)}`

// Pour les écrans qui n'ont que l'ID (panier, profil connecté…) : on retrouve le slug
// dans la liste publique, sinon on garde l'ID (l'ancienne adresse fonctionne toujours).
export const influencerPathById = (influencers, id) => {
    const match = influencers?.find((inf) => inf._id === id)
    return influencerPath(match?.slug || id)
}
