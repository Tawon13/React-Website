import React, { createContext, useCallback, useContext, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const ToastContext = createContext()

export const useToast = () => {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

const TOAST_STYLES = {
    success: {
        border: 'border-green-100',
        iconBg: 'bg-green-100 text-green-600',
        bar: 'bg-green-500',
        icon: (
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
        )
    },
    error: {
        border: 'border-red-100',
        iconBg: 'bg-red-100 text-red-600',
        bar: 'bg-red-500',
        icon: (
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M6 18L18 6M6 6l12 12' />
        )
    },
    warning: {
        border: 'border-amber-100',
        iconBg: 'bg-amber-100 text-amber-600',
        bar: 'bg-amber-500',
        icon: (
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M12 9v3.75m0 3.75h.008M10.29 3.86L1.82 18a1.5 1.5 0 001.29 2.25h17.78a1.5 1.5 0 001.29-2.25L13.71 3.86a1.5 1.5 0 00-2.42 0z' />
        )
    },
    info: {
        border: 'border-blue-100',
        iconBg: 'bg-blue-100 text-blue-600',
        bar: 'bg-blue-500',
        icon: (
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
        )
    }
}

const DEFAULT_DURATION = 4000

const Toast = ({ id, type, message, duration, onDismiss }) => {
    const style = TOAST_STYLES[type] || TOAST_STYLES.info

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`pointer-events-auto relative w-full sm:w-96 bg-white rounded-2xl shadow-xl border ${style.border} overflow-hidden`}
        >
            <div className='flex items-start gap-3 p-4'>
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.iconBg}`}>
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        {style.icon}
                    </svg>
                </span>
                <p className='flex-1 text-sm font-medium text-gray-800 pt-1'>{message}</p>
                <button
                    type='button'
                    onClick={() => onDismiss(id)}
                    aria-label='Fermer la notification'
                    className='flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none pt-0.5'
                >
                    ×
                </button>
            </div>
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
                style={{ transformOrigin: 'left' }}
                className={`absolute bottom-0 left-0 h-1 w-full ${style.bar}`}
            />
        </motion.div>
    )
}

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([])
    const counterRef = useRef(0)

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, [])

    const addToast = useCallback((type, message, duration = DEFAULT_DURATION) => {
        counterRef.current += 1
        const id = counterRef.current
        setToasts((prev) => [...prev, { id, type, message, duration }])
        setTimeout(() => removeToast(id), duration)
    }, [removeToast])

    const value = {
        success: (message, duration) => addToast('success', message, duration),
        error: (message, duration) => addToast('error', message, duration),
        warning: (message, duration) => addToast('warning', message, duration),
        info: (message, duration) => addToast('info', message, duration)
    }

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className='fixed top-4 inset-x-4 sm:inset-x-auto sm:top-6 sm:right-6 z-[100] flex flex-col gap-3 items-center sm:items-end pointer-events-none'>
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <Toast key={toast.id} {...toast} onDismiss={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    )
}
