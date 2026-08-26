import React from 'react'
import { useNavigate } from 'react-router-dom'
import SEO from '../components/SEO'

const NotFound = () => {
    const navigate = useNavigate()

    return (
        <div className='min-h-[60vh] flex flex-col items-center justify-center text-center py-20 px-4'>
            <SEO title='Page introuvable' noindex />
            <p className='text-6xl font-bold text-primary mb-4'>404</p>
            <h1 className='text-2xl font-bold text-gray-900 mb-2'>Page introuvable</h1>
            <p className='text-gray-600 mb-8 max-w-md'>
                La page que vous cherchez n'existe pas ou a été déplacée.
            </p>
            <div className='flex gap-3'>
                <button
                    onClick={() => navigate('/')}
                    className='bg-primary text-white px-6 py-3 rounded-full font-semibold hover:bg-primary/90 transition'
                >
                    Retour à l'accueil
                </button>
                <button
                    onClick={() => navigate('/talents')}
                    className='border border-gray-300 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-50 transition'
                >
                    Découvrir les talents
                </button>
            </div>
        </div>
    )
}

export default NotFound
