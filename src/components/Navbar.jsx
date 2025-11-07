import React, { useState } from 'react'
import {assets} from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {

    const navigate = useNavigate();
    const { currentUser, logout, userData } = useAuth()
    const [showDropdown, setShowDropdown] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

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
                            <p onClick={()=>navigate('/my-profil')} className='hover:text-black cursor-pointer'>Mon Profil</p>
                            <p onClick={()=>navigate('/my-appointments')}className='hover:text-black cursor-pointer'>Mes Rendez-vous</p>
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
            </ul>
        </div>
    </div>
  )
}

export default Navbar
