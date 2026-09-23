import React, { useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'motion/react'
import { CONTACT_EMAIL_URL } from '../config/firebase'
import SEO from '../components/SEO'
import { PAGE_SEO } from '../constants/seo'

const FIELDS = ['name', 'email', 'subject', 'message']

const validateField = (name, value = '') => {
  const trimmed = value.trim()
  if (name === 'name' && trimmed.length < 2) return 'Indiquez votre nom.'
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Indiquez une adresse email valide, ex. nom@exemple.com.'
  if (name === 'subject' && trimmed.length < 3) return "Précisez l'objet de votre message."
  if (name === 'message' && trimmed.length < 10) return 'Votre message doit contenir au moins 10 caractères.'
  return ''
}

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
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Une fois l'erreur affichée, elle disparaît dès que le champ redevient valide.
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: validateField(e.target.name, e.target.value) })
    }
  }

  // Validation au blur (et à l'envoi) plutôt qu'uniquement côté serveur.
  const handleBlur = (e) => {
    setFieldErrors({ ...fieldErrors, [e.target.name]: validateField(e.target.name, e.target.value) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = Object.fromEntries(FIELDS.map((field) => [field, validateField(field, formData[field])]))
    setFieldErrors(errors)
    const firstInvalid = FIELDS.find((field) => errors[field])
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
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
      href: 'mailto:contact@collabzz.com',
      path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    {
      title: 'Réponse rapide',
      value: 'Sous 24-48h',
      path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      title: 'Support',
      value: '7j/7 disponible',
      path: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ]

  const userTypes = [
    { value: 'marque', label: 'Une marque', path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { value: 'influenceur', label: 'Un créateur', path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
  ]

  const inputClass = (field) => `w-full px-4 py-3 text-base bg-white border rounded-xl outline-none transition-colors duration-200 placeholder:text-gray-400 focus:ring-2 ${
    fieldErrors[field]
      ? 'border-red-500 focus:ring-red-200'
      : 'border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-primary/40'
  }`

  const renderField = ({ id, label, type = 'text', placeholder, autoComplete, textarea = false }) => {
    const errorId = `${id}-error`
    const common = {
      id,
      name: id,
      required: true,
      value: formData[id],
      onChange: handleChange,
      onBlur: handleBlur,
      placeholder,
      'aria-invalid': Boolean(fieldErrors[id]),
      'aria-describedby': fieldErrors[id] ? errorId : undefined,
      className: inputClass(id) + (textarea ? ' resize-none' : '')
    }
    return (
      <div>
        <label htmlFor={id} className='block text-sm font-semibold text-gray-800 mb-2'>
          {label} <span className='text-red-600' aria-hidden='true'>*</span>
        </label>
        {textarea
          ? <textarea rows='5' {...common}></textarea>
          : <input type={type} autoComplete={autoComplete} {...common} />}
        {fieldErrors[id] && (
          <p id={errorId} className='mt-1.5 text-sm text-red-600'>{fieldErrors[id]}</p>
        )}
      </div>
    )
  }

  return (
    <MotionConfig reducedMotion='user'>
    <div className='py-6 sm:py-12'>
      <SEO {...PAGE_SEO.contact} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className='w-full max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row'
      >
        {/* Panneau d'infos (au-dessus du formulaire sur mobile, à gauche sur desktop) */}
        <aside className='relative lg:w-2/5 flex flex-col justify-between gap-10 p-8 sm:p-10 bg-gray-900 text-white overflow-hidden'>
          <div className='absolute -top-24 -right-24 w-72 h-72 bg-primary/20 rounded-full blur-3xl' aria-hidden='true'></div>

          <div className='relative'>
            <p className='text-sm font-semibold uppercase tracking-wider text-primary mb-3'>Contact</p>
            <h1 className='text-3xl xl:text-4xl font-bold mb-4 tracking-tight'>
              Parlons de votre projet
            </h1>
            <p className='text-gray-300 text-lg leading-relaxed'>
              Une question, une suggestion ou un partenariat ? Notre équipe vous répond rapidement.
            </p>
          </div>

          <ul className='relative grid sm:grid-cols-3 lg:grid-cols-1 gap-5'>
            {infoItems.map((item) => (
              <li key={item.title} className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-white/10 border border-white/15 rounded-xl flex items-center justify-center flex-shrink-0 text-primary'>
                  <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={item.path}/>
                  </svg>
                </div>
                <div>
                  <p className='text-sm text-gray-400'>{item.title}</p>
                  {item.href
                    ? <a href={item.href} className='font-semibold hover:text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'>{item.value}</a>
                    : <p className='font-semibold'>{item.value}</p>}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Formulaire */}
        <div className='w-full lg:w-3/5 p-6 sm:p-10 xl:p-14'>
          <form onSubmit={handleSubmit} noValidate className='space-y-6'>
            <fieldset>
              <legend className='block text-sm font-semibold text-gray-800 mb-3'>Vous êtes</legend>
              <div role='radiogroup' className='grid grid-cols-2 gap-3'>
                {userTypes.map((type) => {
                  const selected = formData.userType === type.value
                  return (
                    <button
                      key={type.value}
                      type='button'
                      role='radio'
                      aria-checked={selected}
                      onClick={() => setFormData({ ...formData, userType: type.value })}
                      className={`cursor-pointer flex items-center justify-center gap-2 min-h-[56px] px-3 whitespace-nowrap rounded-xl border-2 font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                        selected
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <svg className={`w-5 h-5 flex-shrink-0 ${selected ? 'text-primary' : 'text-gray-500'}`} fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={type.path}/>
                      </svg>
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className='grid sm:grid-cols-2 gap-6'>
              {renderField({ id: 'name', label: 'Nom complet', placeholder: 'Camille Martin', autoComplete: 'name' })}
              {renderField({ id: 'email', label: 'Adresse email', type: 'email', placeholder: 'nom@exemple.com', autoComplete: 'email' })}
            </div>
            {renderField({ id: 'subject', label: 'Sujet', placeholder: 'Ex. : question sur une collaboration' })}
            {renderField({ id: 'message', label: 'Message', placeholder: 'Décrivez votre demande…', textarea: true })}

            {/* Messages de succès/erreur */}
            <AnimatePresence mode='wait'>
              {success && (
                <motion.div
                  role='status'
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className='flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl'
                >
                  <svg className='w-5 h-5 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
                    <path fillRule='evenodd' d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z' clipRule='evenodd'/>
                  </svg>
                  Votre message a été envoyé ! Nous vous répondrons sous 24 à 48h.
                </motion.div>
              )}

              {error && (
                <motion.div
                  role='alert'
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className='flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl'
                >
                  <svg className='w-5 h-5 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd'/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type='submit'
              disabled={loading}
              className='cursor-pointer w-full min-h-[52px] bg-primary text-gray-900 font-semibold py-3.5 px-6 rounded-full hover:bg-[#EDC085] transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2'
            >
              {loading ? (
                <>
                  <svg className='animate-spin h-5 w-5 mr-3' viewBox='0 0 24 24' aria-hidden='true'>
                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' fill='none'/>
                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'/>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le message'
              )}
            </button>
            <p className='text-center text-sm text-gray-500'>
              <span aria-hidden='true'>*</span> Champs obligatoires
            </p>
          </form>
        </div>
      </motion.div>
    </div>
    </MotionConfig>
  )
}

export default Contact
