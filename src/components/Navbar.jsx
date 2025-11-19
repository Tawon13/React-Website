import React, { useState } from 'react'
import {assets} from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

const Navbar = () => {

    const navigate = useNavigate();
    const { currentUser, logout, userData } = useAuth()
    const { getItemCount } = useCart()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showMenu, setShowMenu] = useState(false)
    
    // Vérifier si l'utilisateur est admin
    const ADMIN_EMAIL = 'bechagraamine@gmail.com'
    const isAdmin = currentUser?.email === ADMIN_EMAIL

    const cartItemCount = getItemCount()

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/')
        } catch (error) {
            console.error('Error logging out:', error)
        }
    }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-400'>
        <img onClick={()=> navigate('/')} className='w-32 sm:w-40 md:w-44 cursor-pointer' src={assets.logo} alt="" />
        
        {/* Desktop Navigation */}
        <ul className='hidden md:flex items-start gap-5 font-medium'>
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
        
        <div className='flex items-center gap-2 sm:gap-4 ml-auto'>
            {/* Icône Panier */}
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

            {
                currentUser
                ? <div className='flex items-center gap-2 cursor-pointer group relative'>
                    <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                        {userData?.name?.charAt(0) || userData?.brandName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <img className='w-2.5' src={assets.dropdown_icon} alt=""/>
                    <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                        <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                            <p className='text-sm text-gray-500 truncate max-w-[180px]'>{currentUser.email}</p>
                            <p onClick={()=>navigate('/my-profile')} className='hover:text-black cursor-pointer'>Mon Profil</p>
                            <p onClick={()=>navigate('/messages')}className='hover:text-black cursor-pointer'>Mes Messages</p>
                            {isAdmin && (
                                <p onClick={()=>navigate('/admin')} className='hover:text-black cursor-pointer text-primary font-semibold'>
                                    🔧 Admin Panel
                                </p>
                            )}
                            <p onClick={handleLogout} className='hover:text-black cursor-pointer'>Se déconnecter</p>
                        </div>
                    </div>
                </div>
                :
                <>
                    {/* Desktop Buttons */}
                    <div className='hidden lg:flex items-center gap-2'>
                        <button onClick={()=>navigate('/login-influencer')} className='bg-primary text-white px-4 xl:px-6 py-2 xl:py-3 rounded-full font-light text-xs xl:text-sm whitespace-nowrap'>Je suis influenceur</button>
                        <button onClick={()=>navigate('/login-brand')} className='border border-primary text-primary px-4 xl:px-6 py-2 xl:py-3 rounded-full font-light text-xs xl:text-sm whitespace-nowrap'>Je suis une marque</button>
                    </div>
                    
                    {/* Mobile/Tablet Compact Buttons */}
                    <div className='flex lg:hidden items-center gap-2'>
                        <button onClick={()=>navigate('/login-influencer')} className='bg-primary text-white px-3 sm:px-4 py-2 rounded-full font-light text-xs whitespace-nowrap'>Influenceur</button>
                        <button onClick={()=>navigate('/login-brand')} className='border border-primary text-primary px-3 sm:px-4 py-2 rounded-full font-light text-xs whitespace-nowrap'>Marque</button>
                    </div>
                </>
            }
            
            {/* Mobile Menu Icon */}
            <img 
                onClick={() => setShowMenu(true)} 
                className='w-6 md:hidden cursor-pointer' 
                src={assets.menu_icon} 
                alt="Menu" 
            />
        </div>
        
        {/* Mobile Menu */}
        <div className={`${showMenu ? 'fixed w-full' : 'h-0 w-0'} md:hidden right-0 top-0 bottom-0 z-20 overflow-hidden bg-white transition-all`}>
            <div className='flex items-center justify-between px-5 py-6'>
                <img className='w-36' src={assets.logo} alt="" />
                <img 
                    className='w-7 cursor-pointer' 
                    onClick={() => setShowMenu(false)} 
                    src={assets.cross_icon} 
                    alt="Close" 
                />
            </div>
            <ul className='flex flex-col items-end gap-2 mt-5 pr-5 text-lg font-medium'>
                <NavLink onClick={() => setShowMenu(false)} to='/' className='px-4 py-2 rounded text-right'>ACCUEIL</NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/talents' className='px-4 py-2 rounded text-right'>NOS TALENTS</NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/about' className='px-4 py-2 rounded text-right'>À PROPOS</NavLink>
                <NavLink onClick={() => setShowMenu(false)} to='/contact' className='px-4 py-2 rounded text-right'>CONTACT</NavLink>
                
                {/* User Options for Mobile */}
                {currentUser && (
                    <>
                        <hr className='w-full border-gray-300 my-2' />
                        <p className='px-4 text-sm text-gray-500 text-right truncate max-w-[250px]'>{currentUser.email}</p>
                        <p onClick={() => { navigate('/my-profile'); setShowMenu(false); }} className='px-4 py-2 rounded text-right cursor-pointer hover:text-primary'>Mon Profil</p>
                        <p onClick={() => { navigate('/messages'); setShowMenu(false); }} className='px-4 py-2 rounded text-right cursor-pointer hover:text-primary'>Mes Messages</p>
                        {isAdmin && (
                            <p onClick={() => { navigate('/admin'); setShowMenu(false); }} className='px-4 py-2 rounded text-right cursor-pointer text-primary font-semibold'>
                                🔧 Admin Panel
                            </p>
                        )}
                        <p onClick={() => { handleLogout(); setShowMenu(false); }} className='px-4 py-2 rounded text-right cursor-pointer hover:text-primary'>Se déconnecter</p>
                    </>
                )}
            </ul>
        </div>
    </div>
  )
}

export default Navbar
