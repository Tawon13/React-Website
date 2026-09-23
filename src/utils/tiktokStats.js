const toNumber = (value) => {
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
}

// Vues moyennes et taux d'engagement TikTok, partagés entre la page profil et le tri
// de la page Talents pour que les deux affichent/classent sur les mêmes valeurs.
export const computeTikTokStats = (platformData = {}) => {
    const totalViews = toNumber(platformData.views)
    const videoCount = toNumber(platformData.videoCount)
    const explicitAvgViews = toNumber(platformData.avgViews)
    // Likes/commentaires/partages des mêmes vidéos que `views` (échantillon récent),
    // pas le total du compte cumulé sur des années : sinon le ratio explosait
    // largement au-delà de 100%.
    const recentLikes = toNumber(platformData.recentLikes)
    const recentComments = toNumber(platformData.recentComments)
    const recentShares = toNumber(platformData.recentShares)
    // TikTok n'expose pas le nombre d'enregistrements via l'API publique (réservé à
    // l'API Research) : on l'estime à 15% des likes, une approximation à afficher
    // comme telle plutôt que comme une donnée mesurée.
    const estimatedSaves = recentLikes * 0.15

    const avgViews = explicitAvgViews > 0
        ? explicitAvgViews
        : totalViews > 0 && videoCount > 0
        ? Math.round(totalViews / videoCount)
        : null

    let engagementRate = null
    if (totalViews > 0 && (recentLikes > 0 || recentComments > 0 || recentShares > 0)) {
        const rate = ((recentLikes + recentComments + recentShares + estimatedSaves) / totalViews) * 100
        engagementRate = Number(Math.min(Math.max(rate, 0), 100).toFixed(1))
    }

    return { avgViews, engagementRate }
}
