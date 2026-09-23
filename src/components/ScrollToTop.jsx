import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// React Router conserve la position de scroll entre deux pages : sans ce composant, on
// arrivait par exemple en bas de la messagerie en venant du bas d'une autre page.
// On remonte en haut à chaque changement de page, sauf à l'intérieur d'une même section
// (ex. /talents -> /talents/Beauté quand on change de catégorie).
const ScrollToTop = () => {
    const { pathname } = useLocation()
    const previousSection = useRef(pathname.split('/')[1])

    useLayoutEffect(() => {
        const section = pathname.split('/')[1]
        if (section !== previousSection.current) {
            // 'instant' : ignore le scroll-behavior: smooth du <html> pour éviter de voir la page défiler.
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        }
        previousSection.current = section
    }, [pathname])

    return null
}

export default ScrollToTop
