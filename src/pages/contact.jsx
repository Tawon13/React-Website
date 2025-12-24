import React, { useState } from 'react'
import { CONTACT_EMAIL_URL } from '../config/firebase'

const Contact = () => {
  const [formData, setFormData] = useState({
    userType: 'marque',
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch(CONTACT_EMAIL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({
          userType: 'marque',
          name: '',
          email: '',
          subject: '',
          message: ''
        })
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError('Impossible d\'envoyer le message. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto'>
        {/* En-tête */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>Contactez-nous</h1>
          <p className='text-lg text-gray-600'>
            Une question ? Une suggestion ? N'hésitez pas à nous contacter !
          </p>
        </div>

        {/* Formulaire */}
        <div className='bg-white rounded-2xl shadow-xl p-8 md:p-12'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Type d'utilisateur */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Vous êtes :
              </label>
              <div className='grid grid-cols-2 gap-4'>
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, userType: 'marque' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.userType === 'marque'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className='flex flex-col items-center'>
                    <svg className='w-8 h-8 mb-2' fill='currentColor' viewBox='0 0 20 20'>
                      <path d='M4 3a2 2 0 100 4h12a2 2 0 100-4H4z'/>
                      <path fillRule='evenodd' d='M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z' clipRule='evenodd'/>
                    </svg>
                    <span className='font-semibold'>Une Marque</span>
                  </div>
                </button>
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, userType: 'influenceur' })}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.userType === 'influenceur'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className='flex flex-col items-center'>
                    <svg className='w-8 h-8 mb-2' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' clipRule='evenodd'/>
                    </svg>
                    <span className='font-semibold'>Un Influenceur</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Nom */}
            <div>
              <label htmlFor='name' className='block text-sm font-semibold text-gray-700 mb-2'>
                Nom complet <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                id='name'
                name='name'
                required
                value={formData.name}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition'
                placeholder='Votre nom'
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor='email' className='block text-sm font-semibold text-gray-700 mb-2'>
                Adresse email <span className='text-red-500'>*</span>
              </label>
              <input
                type='email'
                id='email'
                name='email'
                required
                value={formData.email}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition'
                placeholder='votre.email@exemple.com'
              />
            </div>

            {/* Sujet */}
            <div>
              <label htmlFor='subject' className='block text-sm font-semibold text-gray-700 mb-2'>
                Sujet <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                id='subject'
                name='subject'
                required
                value={formData.subject}
                onChange={handleChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition'
                placeholder='Objet de votre message'
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor='message' className='block text-sm font-semibold text-gray-700 mb-2'>
                Message <span className='text-red-500'>*</span>
              </label>
              <textarea
                id='message'
                name='message'
                required
                value={formData.message}
                onChange={handleChange}
                rows='6'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition resize-none'
                placeholder='Écrivez votre message ici...'
              ></textarea>
            </div>

            {/* Messages de succès/erreur */}
            {success && (
              <div className='bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg'>
                ✓ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
              </div>
            )}

            {error && (
              <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg'>
                ✗ {error}
              </div>
            )}

            {/* Bouton d'envoi */}
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-primary text-white font-semibold py-4 px-6 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'/>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'/>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le message'
              )}
            </button>
          </form>
        </div>

        {/* Informations complémentaires */}
        <div className='mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center'>
          <div className='bg-white p-6 rounded-xl shadow-md'>
            <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-6 h-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                <path d='M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z'/>
                <path d='M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'/>
              </svg>
            </div>
            <h3 className='font-semibold mb-2'>Email</h3>
            <p className='text-gray-600 text-sm'>bechagraamine@gmail.com</p>
          </div>

          <div className='bg-white p-6 rounded-xl shadow-md'>
            <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-6 h-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' clipRule='evenodd'/>
              </svg>
            </div>
            <h3 className='font-semibold mb-2'>Réponse rapide</h3>
            <p className='text-gray-600 text-sm'>Sous 24-48h</p>
          </div>

          <div className='bg-white p-6 rounded-xl shadow-md'>
            <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <svg className='w-6 h-6 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z' clipRule='evenodd'/>
              </svg>
            </div>
            <h3 className='font-semibold mb-2'>Support</h3>
            <p className='text-gray-600 text-sm'>7j/7 disponible</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
