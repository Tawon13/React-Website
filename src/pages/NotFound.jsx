import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { darkBtn, outlineBtn } from '../components/PageKit'

const NotFound = () => (
    <section className='relative overflow-hidden min-h-[70vh] flex items-center justify-center px-4 py-24'>
        <SEO title='Page introuvable' noindex />
        <div aria-hidden='true' className='absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#FBF1E1_0%,transparent_60%)]' />
        <div className='text-center max-w-xl'>
            <p className='text-[7rem] sm:text-[9rem] leading-none font-bold tracking-tighter text-gray-900'>
                4<span className='text-primary'>0</span>4
            </p>
            <h1 className='mt-4 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight'>Cette page n’existe pas</h1>
            <p className='mt-4 text-lg text-gray-600'>
                Le lien est peut-être cassé ou la page a été déplacée. Pas de panique : vos talents vous attendent ailleurs.
            </p>
            <div className='mt-10 flex flex-col sm:flex-row gap-3 justify-center'>
                <Link to='/' className={darkBtn}>Retour à l’accueil</Link>
                <Link to='/talents' className={outlineBtn}>Découvrir les talents</Link>
            </div>
        </div>
    </section>
)

export default NotFound
