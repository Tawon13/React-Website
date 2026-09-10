// Recherche d'entreprise à partir d'un numéro de SIRET, via l'API publique et gratuite
// "Recherche d'entreprises" de l'État (data.gouv.fr / INSEE Sirene). Aucune clé requise.
// Doc : https://recherche-entreprises.api.gouv.fr/docs
const API_BASE_URL = 'https://recherche-entreprises.api.gouv.fr/search'

// Parmi les établissements renvoyés pour ce SIREN, retrouve celui dont le SIRET correspond
// exactement à la recherche (le siège n'est pas toujours l'établissement demandé).
const findMatchingEstablishment = (result, siret) => {
    if (!result) return null
    if (result.siege?.siret === siret) return result.siege
    return result.matching_etablissements?.find((etablissement) => etablissement.siret === siret) || null
}

// Renvoie { found: false } si aucune entreprise ne correspond à ce SIRET, sinon
// { found: true, name, address, closed } où `closed` signale un établissement fermé
// dans le répertoire officiel (à afficher comme avertissement, pas comme blocage).
export const lookupSiret = async (siret) => {
    const response = await fetch(`${API_BASE_URL}?q=${encodeURIComponent(siret)}`)
    if (!response.ok) {
        throw new Error(`Erreur API recherche-entreprises (${response.status})`)
    }

    const data = await response.json()
    const result = data.results?.[0]
    const establishment = findMatchingEstablishment(result, siret)

    if (!result || !establishment) {
        return { found: false }
    }

    return {
        found: true,
        name: result.nom_raison_sociale || result.nom_complet || '',
        address: establishment.adresse || '',
        closed: establishment.etat_administratif === 'F'
    }
}
