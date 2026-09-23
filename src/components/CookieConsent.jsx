import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { initAnalytics } from '../config/firebase'
import { getConsent, setConsent } from '../utils/consent'

const CookieConsent = () => {
    const [visible, setVisible] = useState(false)
    const { pathname } = useLocation()
    // Sur l'onboarding, la barre d'actions (Retour / Continuer) est fixée en bas : le bandeau
    // se place au-dessus pour ne pas la masquer.
    const aboveActionBar = pathname.endsWith('-onboarding')

    useEffect(() => {
        const consent = getConsent()
        if (consent === 'accepted') {
            initAnalytics()
        } else if (consent !== 'declined') {
            setVisible(true)
        }
    }, [])

    const handleAccept = () => {
        setConsent('accepted')
        initAnalytics()
        setVisible(false)
    }

    const handleDecline = () => {
        setConsent('declined')
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div className={`fixed inset-x-0 z-[100] p-4 sm:p-6 ${aboveActionBar ? 'bottom-32 sm:bottom-16' : 'bottom-0'}`}>
            <div className='max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 flex flex-col sm:flex-row items-center gap-4'>
                <p className='text-sm text-gray-600 flex-1'>
                    Nous utilisons des cookies de mesure d’audience (Google Analytics) pour améliorer Collabzz. Vous pouvez accepter ou refuser.{' '}
                    <Link to='/privacy' className='underline text-gray-900 hover:text-primary'>En savoir plus</Link>
                </p>
                <div className='flex gap-2 flex-shrink-0'>
                    <button
                        onClick={handleDecline}
                        className='px-4 py-2 text-sm font-semibold rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition'
                    >
                        Refuser
                    </button>
                    <button
                        onClick={handleAccept}
                        className='px-4 py-2 text-sm font-semibold rounded-full bg-primary text-white hover:bg-primary/90 transition'
                    >
                        Accepter
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CookieConsent
