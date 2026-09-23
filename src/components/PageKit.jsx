import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { SERVICE_FEE_RATE } from '../constants/fees'

// Briques partagées par les pages vitrines (À propos, Marques, Créateurs).

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
}

// Apparition au scroll (une seule fois). Sous MotionConfig reducedMotion='user',
// le déplacement est retiré et seul le fondu reste.
export const Reveal = ({ children, className = '', delay = 0, as = 'div' }) => {
  const Component = motion[as]
  return (
    <Component
      className={className}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      variants={fadeUp}
    >
      {children}
    </Component>
  )
}

export const Icon = ({ path, className = 'w-6 h-6' }) => (
  <svg className={className} fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={path} />
  </svg>
)

export const ICONS = {
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  chart: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  lock: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  wallet: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  eye: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  bolt: 'M13 10V3L4 14h7v7l9-11h-7z',
  x: 'M6 18L18 6M6 6l12 12',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  inbox: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
  tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
  support: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
  sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
}

export const darkBtn = 'cursor-pointer bg-gray-900 text-white px-7 py-3.5 rounded-full font-semibold hover:bg-gray-800 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
export const outlineBtn = 'cursor-pointer border border-gray-300 text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:border-gray-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
export const goldBtn = 'cursor-pointer bg-primary text-gray-900 px-7 py-3.5 rounded-full font-semibold hover:bg-[#EDC085] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900'

// Frise d'étapes : la ligne se remplit au rythme du scroll (réversible) ; en mouvement
// réduit elle est simplement pleine.
export const StepsTimeline = ({ steps, accent = 'bg-primary text-gray-900' }) => {
  const ref = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] })
  const fill = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <div ref={ref} className='relative'>
      <div className='hidden md:block absolute left-0 right-0 top-[22px] h-px bg-gray-200' aria-hidden='true'>
        <motion.div className='h-full bg-gray-900 origin-left' style={{ scaleX: reduceMotion ? 1 : fill }} />
      </div>
      <ol className={`grid gap-10 md:gap-8 ${steps.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
        {steps.map((step, i) => (
          <Reveal as='li' key={step.title} delay={i * 0.08} className='relative'>
            <span className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center font-bold mb-5 ring-8 ring-white ${accent}`}>
              {i + 1}
            </span>
            <h3 className='text-xl font-semibold text-gray-900 mb-2'>{step.title}</h3>
            <p className='text-gray-600 leading-relaxed'>{step.desc}</p>
          </Reveal>
        ))}
      </ol>
    </div>
  )
}

// Exemple chiffré des frais, calculé depuis SERVICE_FEE_RATE : la barre se remplit à
// l'apparition. Même données côté marque et côté créateur, formulées différemment.
export const FeeBreakdown = ({ price = 500, audience = 'brand' }) => {
  const fee = Math.round(price * SERVICE_FEE_RATE)
  const total = price + fee
  const pct = Math.round(SERVICE_FEE_RATE * 100)
  const creatorShare = (price / total) * 100
  const rows = audience === 'brand'
    ? [
      { label: 'Prix fixé par le créateur', value: `${price} €` },
      { label: `Frais de service Collabzz (${pct} %)`, value: `${fee} €` },
      { label: 'Total payé par la marque', value: `${total} €`, strong: true }
    ]
    : [
      { label: 'Prix que vous fixez', value: `${price} €` },
      { label: `Frais de service (${pct} %), payés par la marque`, value: `${fee} €` },
      { label: 'Ce que vous recevez', value: `${price} €`, strong: true }
    ]

  return (
    <div className='rounded-3xl border border-gray-200 bg-white p-6 sm:p-8'>
      <p className='text-sm text-gray-500 mb-5'>Exemple pour une vidéo TikTok à {price} €</p>
      <div className='flex h-4 rounded-full overflow-hidden bg-gray-100 mb-6' aria-hidden='true'>
        <motion.div
          className='h-full bg-gray-900 origin-left'
          style={{ width: `${creatorShare}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className='h-full bg-primary origin-left'
          style={{ width: `${100 - creatorShare}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <dl className='space-y-3'>
        {rows.map((row, i) => (
          <div key={row.label} className={`flex items-center justify-between gap-4 ${row.strong ? 'pt-3 border-t border-gray-200' : ''}`}>
            <dt className={`flex items-center gap-2.5 ${row.strong ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
              {!row.strong && <span className={`w-3 h-3 rounded-sm ${i === 0 ? 'bg-gray-900' : 'bg-primary'}`} aria-hidden='true'></span>}
              {row.label}
            </dt>
            <dd className={`tabular-nums whitespace-nowrap ${row.strong ? 'text-xl font-bold text-gray-900' : 'font-medium text-gray-900'}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
