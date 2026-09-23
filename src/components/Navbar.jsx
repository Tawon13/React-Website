import React, { useEffect, useRef, useState } from 'react'
import {assets} from '../assets/assets'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'

const Navbar = () => {

    const navigate = useNavigate();
    const { currentUser, logout, userData, userType } = useAuth()
    const { getItemCount } = useCart()
    const { favorites } = useFavorites()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    // Ombre plus marquée dès qu'on a quitté le haut de page, pour détacher la barre du contenu.
    const [scrolled, setScrolled] = useState(false)
    const { pathname } = useLocation()
    const accountMenuRef = useRef(null)
    const accountInitial = userData?.name?.charAt(0) || userData?.brandName?.charAt(0) || currentUser?.email?.charAt(0).toUpperCase()

    // Menu du compte (desktop) : fermé au changement de page, avec Échap ou un clic à côté.
    useEffect(() => { setShowDropdown(false) }, [pathname])
    useEffect(() => {
        if (!showDropdown) return
        const onPointerDown = (e) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target)) setShowDropdown(false)
        }
        const onKey = (e) => { if (e.key === 'Escape') setShowDropdown(false) }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [showDropdown])

    // Menu mobile : fermé à chaque changement de page, fermable avec Échap, et scroll de la
    // page bloqué pendant qu'il est ouvert (sur <html> pour ne pas casser position: sticky).
    useEffect(() => { setShowMenu(false) }, [pathname])
    useEffect(() => {
        if (!showMenu) return
        const root = document.documentElement
        root.style.overflow = 'hidden'
        const onKey = (e) => { if (e.key === 'Escape') setShowMenu(false) }
        document.addEventListener('keydown', onKey)
        return () => {
            root.style.overflow = ''
            document.removeEventListener('keydown', onKey)
        }
    }, [showMenu])
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8)
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])
    
    // Vérifier si l'utilisateur est admin
    const ADMIN_EMAIL = 'bechagraamine@gmail.com'
    const isAdmin = currentUser?.email === ADMIN_EMAIL

    const cartItemCount = getItemCount()
    const favoritesCount = favorites.length

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/')
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

  return (
    // Barre « pilule » collée en haut de l'écran. Le menu mobile (position fixed) est un frère
    // de la pilule et non un enfant : backdrop-filter en ferait son bloc conteneur et le
    // menu plein écran resterait enfermé dans la barre.
    <div className='sticky top-3 z-40 mb-5'>
    <nav className={`flex items-center justify-between text-sm pl-5 pr-3 sm:pl-6 sm:pr-4 py-2.5 rounded-full border border-white/70 bg-gray-100/85 backdrop-blur-md transition-shadow duration-300 ${scrolled ? 'shadow-lg shadow-gray-900/10' : 'shadow-sm'}`}>
        <img onClick={()=> navigate('/')} className='w-28 sm:w-32 md:w-36 cursor-pointer' src={assets.logo} alt="Collabzz" />
        
        {/* Desktop Navigation */}
        <ul className='hidden lg:flex items-start gap-5 xl:gap-6 font-medium whitespace-nowrap'>
            <NavLink to='/'>
                <li className='py-1'>ACCUEIL</li>
                <hr className='border-none outlline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
            </NavLink>
            <NavLink to='/talents'>
                <li className='py-1'>NOS TALENTS</li>
                <hr className='border-none outlline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
            </NavLink>
            <NavLink to='/about'>
                <li className='py-1'>À PROPOS</li>
                <hr className='border-none outlline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
            </NavLink>
            <NavLink to='/contact'>
                <li className='py-1'>CONTACT</li>
                <hr className='border-none outlline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
            </NavLink>
        </ul>
        
        <div className='flex items-center gap-2 sm:gap-3 ml-auto pl-4'>
            {/* Desktop auth actions - hidden on mobile */}
            {!currentUser && (
                <div className='hidden lg:flex items-center gap-2 whitespace-nowrap'>
                    <button
                        onClick={() => navigate('/login')}
                        className='px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:border-primary hover:text-primary transition text-sm font-medium'
                    >
                        Se connecter
                    </button>
                    <button
                        onClick={() => navigate('/login?isSignUp=true')}
                        className='px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 transition text-sm font-medium'
                    >
                        S'inscrire
                    </button>
                </div>
            )}

            {/* Icône Favoris */}
            <button
                onClick={() => navigate('/favoris')}
                className='relative p-2 hover:bg-gray-100 rounded-full transition'
            >
                <svg className='w-6 h-6 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'/>
                </svg>
                {favoritesCount > 0 && (
                    <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                        {favoritesCount}
                    </span>
                )}
            </button>

            {/* Icône Panier - Seulement pour les marques connectées */}
            {currentUser && userType === 'brand' && (
                <button 
                    onClick={() => navigate('/cart')}
                    className='relative p-2 hover:bg-gray-100 rounded-full transition'
                >
                    <svg className='w-6 h-6 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'/>
                    </svg>
                    {cartItemCount > 0 && (
                        <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center'>
                            {cartItemCount}
                        </span>
                    )}
                </button>
            )}

            {
                currentUser
                ? <div className='relative' ref={accountMenuRef}>
                    <button
                        type='button'
                        onClick={() => setShowDropdown((open) => !open)}
                        aria-haspopup='menu'
                        aria-expanded={showDropdown}
                        aria-label='Menu du compte'
                        className='cursor-pointer flex items-center gap-1.5 rounded-full p-1 pr-2 hover:bg-gray-200/70 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                    >
                        {userData?.photoURL ? (
                            <img src={userData.photoURL} alt='' className='w-8 h-8 rounded-full object-cover' />
                        ) : (
                            <span className='w-8 h-8 bg-gray-900 text-primary rounded-full flex items-center justify-center font-bold text-sm'>{accountInitial}</span>
                        )}
                        <motion.svg animate={{ rotate: showDropdown ? 180 : 0 }} transition={{ duration: 0.2 }} className='w-4 h-4 text-gray-700' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M19 9l-7 7-7-7' />
                        </motion.svg>
                    </button>

                    <AnimatePresence>
                        {showDropdown && (
                            <motion.div
                                role='menu'
                                aria-label='Mon compte'
                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                style={{ transformOrigin: 'top right' }}
                                className='absolute right-0 top-full mt-3 w-72 rounded-3xl bg-white border border-gray-200 shadow-2xl shadow-gray-900/10 overflow-hidden z-50'
                            >
                                <div className='flex items-center gap-3 p-4 bg-gray-900 text-white'>
                                    {userData?.photoURL ? (
                                        <img src={userData.photoURL} alt='' className='w-11 h-11 rounded-full object-cover flex-shrink-0' />
                                    ) : (
                                        <span className='w-11 h-11 bg-primary text-gray-900 rounded-full flex items-center justify-center font-bold flex-shrink-0'>{accountInitial}</span>
                                    )}
                                    <div className='min-w-0'>
                                        <p className='font-semibold truncate'>{userType === 'brand' ? userData?.brandName || 'Ma marque' : userData?.name || 'Mon compte'}</p>
                                        <p className='text-xs text-gray-400 truncate'>{currentUser.email}</p>
                                    </div>
                                </div>
                                <ul className='p-2'>
                                    {[
                                        { label: 'Mon profil', to: '/my-profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                                        { label: 'Mes messages', to: '/messages', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
                                        userType === 'brand' && { label: 'Mon panier', to: '/cart', count: cartItemCount, icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
                                        { label: 'Mes favoris', to: '/favoris', count: favoritesCount, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
                                        isAdmin && { label: 'Administration', to: '/admin', admin: true, icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
                                    ].filter(Boolean).map((item) => (
                                        <li key={item.to} role='none'>
                                            <button
                                                type='button'
                                                role='menuitem'
                                                onClick={() => { navigate(item.to); setShowDropdown(false) }}
                                                className={`cursor-pointer w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:bg-gray-100 ${item.admin ? 'text-primary-dark hover:bg-primary/10' : 'text-gray-800 hover:bg-gray-100'}`}
                                            >
                                                <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d={item.icon} /></svg>
                                                <span className='flex-1 text-left'>{item.label}</span>
                                                {item.count > 0 && <span className='rounded-full bg-gray-900 text-white text-xs font-bold px-2 py-0.5'>{item.count}</span>}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                <div className='p-2 border-t border-gray-100'>
                                    <button
                                        type='button'
                                        role='menuitem'
                                        onClick={() => { setShowDropdown(false); handleLogout() }}
                                        className='cursor-pointer w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors duration-200 focus-visible:outline-none focus-visible:bg-red-50'
                                    >
                                        <svg className='w-5 h-5 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg>
                                        Se déconnecter
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
: null
            }
            
            {/* Mobile Menu Icon */}
            <button
                type='button'
                onClick={() => setShowMenu(true)}
                aria-label='Ouvrir le menu'
                aria-expanded={showMenu}
                className='lg:hidden cursor-pointer w-10 h-10 rounded-full flex items-center justify-center text-gray-900 hover:bg-gray-200/70 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 7h16M4 12h16M4 17h10' /></svg>
            </button>
        </div>
        
    </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
            {showMenu && (
                <div className='lg:hidden fixed inset-0 z-50' role='dialog' aria-modal='true' aria-label='Menu'>
                    <motion.div
                        className='absolute inset-0 bg-gray-900/40 backdrop-blur-sm'
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMenu(false)}
                    />
                    <motion.div
                        className='absolute inset-y-0 right-0 w-full sm:max-w-sm bg-white flex flex-col overflow-y-auto'
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
                    >
                        <div className='flex items-center justify-between px-6 pt-6 pb-4'>
                            <img className='w-32' src={assets.logo} alt='Collabzz' />
                            <button
                                type='button'
                                onClick={() => setShowMenu(false)}
                                aria-label='Fermer le menu'
                                autoFocus
                                className='cursor-pointer w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                            >
                                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' /></svg>
                            </button>
                        </div>

                        <motion.nav
                            className='px-6 pt-4'
                            initial='hidden'
                            animate='visible'
                            variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
                        >
                            <ul>
                                {[
                                    { to: '/', label: 'Accueil' },
                                    { to: '/talents', label: 'Nos talents' },
                                    { to: '/about', label: 'À propos' },
                                    { to: '/contact', label: 'Contact' }
                                ].map((link) => (
                                    <motion.li key={link.to} variants={{ hidden: { opacity: 0, x: 24 }, visible: { opacity: 1, x: 0 } }}>
                                        <NavLink
                                            to={link.to}
                                            end={link.to === '/'}
                                            className={({ isActive }) => `group flex items-center justify-between py-3.5 border-b border-gray-100 text-3xl font-bold tracking-tight transition-colors duration-200 ${isActive ? 'text-gray-900' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {link.label}
                                                    {isActive
                                                        ? <span className='w-2.5 h-2.5 rounded-full bg-primary' aria-hidden='true'></span>
                                                        : <svg className='w-6 h-6 opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M17 8l4 4m0 0l-4 4m4-4H3' /></svg>}
                                                </>
                                            )}
                                        </NavLink>
                                    </motion.li>
                                ))}
                            </ul>

                            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} className='grid grid-cols-2 gap-2 mt-6'>
                                <NavLink to='/for-brands' className='rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors duration-200'>Pour les marques</NavLink>
                                <NavLink to='/for-creators' className='rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors duration-200'>Pour les créateurs</NavLink>
                                <NavLink to='/favoris' className='col-span-2 flex items-center justify-between rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors duration-200'>
                                    <span className='flex items-center gap-2'>
                                        <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' /></svg>
                                        Mes favoris
                                    </span>
                                    {favoritesCount > 0 && <span className='rounded-full bg-gray-900 text-white text-xs font-bold px-2 py-0.5'>{favoritesCount}</span>}
                                </NavLink>
                            </motion.div>
                        </motion.nav>

                        <motion.div
                            className='mt-auto px-6 pb-8 pt-8'
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            {!currentUser ? (
                                <div className='flex flex-col gap-3'>
                                    <button
                                        onClick={() => navigate('/login?isSignUp=true')}
                                        className='cursor-pointer w-full rounded-full bg-gray-900 text-white py-3.5 font-semibold hover:bg-gray-800 transition-colors duration-200'
                                    >
                                        Créer un compte gratuit
                                    </button>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className='cursor-pointer w-full rounded-full border border-gray-300 text-gray-900 py-3.5 font-semibold hover:border-gray-900 transition-colors duration-200'
                                    >
                                        Se connecter
                                    </button>
                                </div>
                            ) : (
                                <div className='rounded-3xl bg-gray-900 text-white p-5'>
                                    <div className='flex items-center gap-3 mb-4'>
                                        {userData?.photoURL ? (
                                            <img src={userData.photoURL} alt='' className='w-11 h-11 rounded-full object-cover' />
                                        ) : (
                                            <div className='w-11 h-11 bg-primary rounded-full flex items-center justify-center text-gray-900 font-bold'>
                                                {userData?.name?.charAt(0) || userData?.brandName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <p className='text-sm text-gray-300 truncate'>{currentUser.email}</p>
                                    </div>
                                    <div className='grid grid-cols-2 gap-2 text-sm font-semibold'>
                                        <button onClick={() => navigate('/my-profile')} className='cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 text-left transition-colors duration-200'>Mon profil</button>
                                        <button onClick={() => navigate('/messages')} className='cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 text-left transition-colors duration-200'>Mes messages</button>
                                        {userType === 'brand' && (
                                            <button onClick={() => navigate('/cart')} className='cursor-pointer rounded-xl bg-white/10 hover:bg-white/15 px-3 py-2.5 text-left transition-colors duration-200'>
                                                Panier{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button onClick={() => navigate('/admin')} className='cursor-pointer rounded-xl bg-primary text-gray-900 px-3 py-2.5 text-left'>Admin</button>
                                        )}
                                        <button onClick={() => { handleLogout(); setShowMenu(false) }} className='cursor-pointer col-span-2 rounded-xl border border-white/20 hover:bg-white/10 px-3 py-2.5 transition-colors duration-200'>Se déconnecter</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  )
}

export default Navbar
