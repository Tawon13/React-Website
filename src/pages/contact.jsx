import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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

  const infoItems = [
    {
      title: 'Email',
      value: 'contact@collabzz.com',
      path: 'M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884zM18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z'
    },
    {
      title: 'Réponse rapide',
      value: 'Sous 24-48h',
      path: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z'
    },
    {
      title: 'Support',
      value: '7j/7 disponible',
      path: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'
    }
  ]

  return (
    <div className='min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-gray-100'>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className='w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row'
      >
        {/* Left Side - Info panel */}
        <div className='relative hidden lg:flex lg:w-2/5 flex-col justify-center gap-12 p-10 bg-gradient-to-br from-primary via-primary to-blue-600 text-white overflow-hidden'>
          <div className='absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-3xl'></div>
          <div className='absolute -bottom-24 -left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl'></div>

          <div className='relative'>
            <h1 className='text-3xl xl:text-4xl font-bold mb-4 tracking-tight'>
              Contactez-nous
            </h1>
            <p className='text-white/90 text-lg leading-relaxed'>
              Une question ? Une suggestion ? Notre équipe vous répond rapidement.
            </p>
          </div>

          <div className='relative space-y-6'>
            {infoItems.map((item) => (
              <div key={item.title} className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center flex-shrink-0'>
                  <svg className='w-6 h-6 text-white' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d={item.path} clipRule='evenodd'/>
                  </svg>
                </div>
                <div>
                  <p className='text-sm text-white/70'>{item.title}</p>
                  <p className='font-semibold'>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className='w-full lg:w-3/5 p-6 sm:p-10 xl:p-14'>
          <div className='lg:hidden mb-8 text-center'>
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>Contactez-nous</h1>
            <p className='text-gray-600'>
              Une question ? Une suggestion ? N'hésitez pas à nous contacter !
            </p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            {/* Type d'utilisateur */}
            <div>
              <label className='block text-sm font-semibold text-gray-700 mb-3'>
                Vous êtes :
              </label>
              <div className='grid grid-cols-2 gap-4'>
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, userType: 'marque' })}
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    formData.userType === 'marque'
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
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
                  className={`relative p-4 rounded-2xl border-2 transition-all ${
                    formData.userType === 'influenceur'
                      ? 'border-primary bg-primary/5 text-primary shadow-sm'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
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

            {/* Nom + Email */}
            <div className='grid sm:grid-cols-2 gap-5'>
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
                  className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white outline-none transition'
                  placeholder='Votre nom'
                />
              </div>

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
                  className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white outline-none transition'
                  placeholder='votre.email@exemple.com'
                />
              </div>
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
                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white outline-none transition'
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
                rows='5'
                className='w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/40 focus:border-primary focus:bg-white outline-none transition resize-none'
                placeholder='Écrivez votre message ici...'
              ></textarea>
            </div>

            {/* Messages de succès/erreur */}
            <AnimatePresence mode='wait'>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl overflow-hidden'
                >
                  <svg className='w-5 h-5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd'/>
                  </svg>
                  Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl overflow-hidden'
                >
                  <svg className='w-5 h-5 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd'/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bouton d'envoi */}
            <button
              type='submit'
              disabled={loading}
              className='w-full bg-primary text-white font-semibold py-4 px-6 rounded-full hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center'
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

          {/* Infos complémentaires (mobile uniquement, panneau gauche masqué) */}
          <div className='lg:hidden mt-8 grid grid-cols-3 gap-3 text-center'>
            {infoItems.map((item) => (
              <div key={item.title} className='bg-gray-50 p-4 rounded-xl'>
                <div className='w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2'>
                  <svg className='w-[18px] h-[18px] text-primary' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d={item.path} clipRule='evenodd'/>
                  </svg>
                </div>
                <p className='text-xs font-semibold text-gray-900'>{item.title}</p>
                <p className='text-[11px] text-gray-500 mt-0.5'>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Contact
