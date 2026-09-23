import { Helmet } from 'react-helmet-async'
import { DEFAULT_DESCRIPTION, DEFAULT_IMAGE, SITE_NAME, SITE_URL, formatTitle } from '../constants/seo'

// Titre/description/canonical par page. Par défaut, indexable ; passer noindex
// pour les pages privées (compte, admin, messagerie...) qui ne doivent pas
// apparaître dans les résultats de recherche.
// Les balises pré-rendues au build (scripts/prerender-seo.mjs) portent data-rh,
// Helmet les remplace donc au lieu de les dupliquer.
const SEO = ({ title, description = DEFAULT_DESCRIPTION, path = '', image = DEFAULT_IMAGE, noindex = false }) => {
    const fullTitle = formatTitle(title)
    const canonicalUrl = `${SITE_URL}${path}`

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name='description' content={description} />
            <link rel='canonical' href={canonicalUrl} />
            {noindex && <meta name='robots' content='noindex, nofollow' />}

            <meta property='og:type' content='website' />
            <meta property='og:site_name' content={SITE_NAME} />
            <meta property='og:locale' content='fr_FR' />
            <meta property='og:title' content={fullTitle} />
            <meta property='og:description' content={description} />
            <meta property='og:url' content={canonicalUrl} />
            <meta property='og:image' content={image} />

            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:title' content={fullTitle} />
            <meta name='twitter:description' content={description} />
            <meta name='twitter:image' content={image} />
        </Helmet>
    )
}

export default SEO
