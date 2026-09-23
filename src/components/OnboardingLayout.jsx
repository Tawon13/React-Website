import { AnimatePresence, motion, MotionConfig } from 'motion/react'
import { assets } from '../assets/assets'
import SEO from './SEO'

// Cadre plein écran commun aux onboardings marque et créateur : progression en segments,
// transition entre étapes (sens selon avancer/reculer) et barre d'actions fixe en bas.
const OnboardingLayout = ({ title, step, totalSteps, direction = 1, onBack, actions, children }) => (
    <MotionConfig reducedMotion='user'>
        <div className='min-h-screen bg-white flex flex-col'>
            <SEO title={title} noindex />

            <header className='sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100'>
                <div className='max-w-3xl mx-auto px-5 sm:px-8 pt-5 pb-4'>
                    <div className='flex items-center justify-between gap-4 mb-4'>
                        <button
                            type='button'
                            onClick={onBack}
                            disabled={step === 1}
                            aria-label='Étape précédente'
                            className='cursor-pointer w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-100 disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        >
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' /></svg>
                        </button>
                        <img src={assets.logo} alt='Collabzz' className='w-28' />
                        <span className='text-sm font-semibold text-gray-500 tabular-nums w-10 text-right' aria-live='polite'>
                            {step}/{totalSteps}
                        </span>
                    </div>
                    <div className='flex gap-1.5' role='progressbar' aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={step} aria-label={`Étape ${step} sur ${totalSteps}`}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <div key={i} className='h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden'>
                                <motion.div
                                    className='h-full bg-gray-900 rounded-full origin-left'
                                    initial={false}
                                    animate={{ scaleX: i < step ? 1 : 0 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <main className='flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 pt-10 pb-40 overflow-x-clip'>
                <AnimatePresence mode='wait' custom={direction} initial={false}>
                    <motion.div
                        key={step}
                        custom={direction}
                        variants={{
                            enter: (dir) => ({ opacity: 0, x: dir * 40 }),
                            center: { opacity: 1, x: 0 },
                            exit: (dir) => ({ opacity: 0, x: dir * -40 })
                        }}
                        initial='enter'
                        animate='center'
                        exit='exit'
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>

            <footer className='fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-gray-100'>
                <div className='max-w-3xl mx-auto px-5 sm:px-8 py-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3'>
                    {actions}
                </div>
            </footer>
        </div>
    </MotionConfig>
)

export const StepTitle = ({ eyebrow, title, text }) => (
    <div className='mb-8'>
        {eyebrow && <p className='text-sm font-semibold uppercase tracking-wider text-primary-dark mb-3'>{eyebrow}</p>}
        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight'>{title}</h1>
        {text && <p className='text-lg text-gray-600 mt-3 leading-relaxed'>{text}</p>}
    </div>
)

// Option sélectionnable (choix unique : role radio ; choix multiple : role checkbox).
export const OptionButton = ({ selected, onClick, multiple = false, icon, label, description, compact = false }) => (
    <motion.button
        type='button'
        role={multiple ? 'checkbox' : 'radio'}
        aria-checked={selected}
        onClick={onClick}
        whileTap={{ scale: 0.98 }}
        className={`cursor-pointer w-full flex items-center gap-3 rounded-2xl border-2 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${compact ? 'px-4 py-3' : 'px-5 py-4'} ${
            selected ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400'
        }`}
    >
        {icon && (
            <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${selected ? 'bg-primary text-gray-900' : 'bg-gray-100 text-gray-700'}`}>
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={icon} /></svg>
            </span>
        )}
        <span className='flex-1 min-w-0'>
            <span className='block font-semibold'>{label}</span>
            {description && <span className={`block text-sm ${selected ? 'text-gray-300' : 'text-gray-500'}`}>{description}</span>}
        </span>
        <span className={`w-5 h-5 flex-shrink-0 flex items-center justify-center border-2 ${multiple ? 'rounded-md' : 'rounded-full'} ${selected ? 'border-primary bg-primary text-gray-900' : 'border-gray-300'}`} aria-hidden='true'>
            {selected && <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3.5' d='M5 13l4 4L19 7' /></svg>}
        </span>
    </motion.button>
)

export const onboardingPrimaryBtn = 'cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white px-8 py-3.5 font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
export const onboardingSecondaryBtn = 'cursor-pointer w-full sm:w-auto inline-flex items-center justify-center rounded-full px-6 py-3.5 font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'

export default OnboardingLayout
