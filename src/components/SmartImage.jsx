import { useCallback, useState } from 'react'

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
const SmartImage = ({ src, width = 384, loading = 'lazy', onError, style, ...rest }) => {
    const [failed, setFailed] = useState(false)
    const [loaded, setLoaded] = useState(false)
    const optimize = !failed && typeof src === 'string' && OPTIMIZABLE_HOST.test(src) && canOptimize()

    // Apparition en fondu une fois l'image reçue (le fond de la carte sert de repère pendant
    // le chargement). Une image déjà en cache est affichée tout de suite.
    const imgRef = useCallback((node) => {
        if (node?.complete && node.naturalWidth > 0) setLoaded(true)
    }, [])
    const fadeStyle = {
        opacity: loaded ? 1 : 0,
        transition: 'opacity 300ms ease, transform 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
    }

    if (!optimize) {
        return (
            <img
                ref={imgRef}
                src={src}
                loading={loading}
                decoding='async'
                onLoad={() => setLoaded(true)}
                onError={(event) => { setLoaded(true); onError?.(event) }}
                style={fadeStyle}
                {...rest}
            />
        )
    }

    return (
        <img
            ref={imgRef}
            src={optimizedUrl(src, width)}
            srcSet={`${optimizedUrl(src, width)} 1x, ${optimizedUrl(src, width * 2)} 2x`}
            loading={loading}
            decoding='async'
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={fadeStyle}
            {...rest}
        />
    )
}

export default SmartImage
