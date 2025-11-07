import React, { useState } from 'react'
import {assets} from '../assets/assets'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {

    const navigate = useNavigate();
    const { currentUser, logout, userData } = useAuth()
    const [showDropdown, setShowDropdown] = useState(false)

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
        <img onClick={()=> navigate('/')} className='w-44 cursor-pointer' src={assets.logo} alt="" />
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
        <div className='flex items-center gap-4'>
            {
                currentUser
                ? <div className='flex items-center gap-2 cursor-pointer group relative'>
                    <div className='w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-semibold'>
                        {userData?.name?.charAt(0) || userData?.brandName?.charAt(0) || currentUser.email.charAt(0).toUpperCase()}
                    </div>
                    <img className='w-2.5' src={assets.dropdown_icon} alt=""/>
                    <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block'>
                        <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4'>
                            <p className='text-sm text-gray-500'>{currentUser.email}</p>
                            <p onClick={()=>navigate('/my-profil')} className='hover:text-black cursor-pointer'>Mon Profil</p>
                            <p onClick={()=>navigate('/my-appointments')}className='hover:text-black cursor-pointer'>Mes Rendez-vous</p>
                            <p onClick={handleLogout} className='hover:text-black cursor-pointer'>Se déconnecter</p>
                        </div>
                    </div>
                </div>
                :
                <div className='hidden md:flex items-center gap-2'>
                    <button onClick={()=>navigate('/login-influencer')} className='bg-primary text-white px-6 py-3 rounded-full font-light'>Je suis influenceur</button>
                    <button onClick={()=>navigate('/login-brand')} className='border border-primary text-primary px-6 py-3 rounded-full font-light'>Je suis une marque</button>
                </div>

            }
        </div>
    </div>
  )
}

export default Navbar
