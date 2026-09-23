import { useState } from 'react'

// Largeurs autorisées : doivent correspondre à `images.sizes` dans vercel.json.
const WIDTHS = [128, 256, 384, 640, 828, 1080]
// Hébergeurs d'images redimensionnées par Vercel (voir `images.remotePatterns` dans vercel.json).
const OPTIMIZABLE_HOST = /^https:\/\/(firebasestorage\.googleapis\.com|[^/]+\.tiktokcdn(-us|-eu)?\.com)\//

// Uniquement sur le site en ligne : en local, l'endpoint /_vercel/image n'existe pas.
const canOptimize = () =>
    import.meta.env.PROD && typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)

const pickWidth = (w) => WIDTHS.find((size) => size >= w) || WIDTHS[WIDTHS.length - 1]
const optimizedUrl = (src, w) => `/_vercel/image?url=${encodeURIComponent(src)}&w=${pickWidth(w)}&q=75`

// <img> qui demande à Vercel une version redimensionnée (WebP/AVIF, à la taille affichée)
// au lieu de l'original (souvent 2000 px pour une vignette de 150 px). Si l'optimisation
// échoue, on retombe sur l'image d'origine.
// `width` : largeur d'affichage approximative en pixels CSS.
const SmartImage = ({ src, width = 384, loading = 'lazy', onError, ...rest }) => {
    const [failed, setFailed] = useState(false)
    const optimize = !failed && typeof src === 'string' && OPTIMIZABLE_HOST.test(src) && canOptimize()

    if (!optimize) {
        return <img src={src} loading={loading} decoding='async' onError={onError} {...rest} />
    }

    return (
        <img
            src={optimizedUrl(src, width)}
            srcSet={`${optimizedUrl(src, width)} 1x, ${optimizedUrl(src, width * 2)} 2x`}
            loading={loading}
            decoding='async'
            onError={() => setFailed(true)}
            {...rest}
        />
    )
}

export default SmartImage
