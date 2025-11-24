import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  
  return (
    <div className='px-4 sm:px-6 md:mx-10'>
        <div className='flex flex-col sm:grid grid-cols-1 md:grid-cols-[3fr_1fr_1fr] gap-8 sm:gap-10 md:gap-14 my-10 mt-20 sm:mt-30 md:mt-40 text-sm'>
            {/*------------Left Section------------*/}
            <div>
                <img className='mb-4 sm:mb-5 w-32 sm:w-36 md:w-40' src={assets.logo} alt="" />
                <p className='w-full md:w-2/3 text-gray600 leading-6 text-sm'>
                    Collabzz connecte les marques avec les meilleurs influenceurs. 
                    Simplifiez vos collaborations et boostez votre visibilité en quelques clics.
                </p>
            </div>
            
            {/*------------Center Section------------*/}
            <div>
                <p className='text-lg sm:text-xl font-medium mb-4 sm:mb-5'>ENTREPRISE</p>
                <ul className='flex flex-col gap-2 text-gray600'>
                    <li onClick={() => navigate('/')} className='cursor-pointer hover:text-gray-900'>Accueil</li>
                    <li onClick={() => navigate('/about')} className='cursor-pointer hover:text-gray-900'>À propos</li>
                    <li onClick={() => navigate('/contact')} className='cursor-pointer hover:text-gray-900'>Contact</li>
                    <li onClick={() => navigate('/privacy')} className='cursor-pointer hover:text-gray-900'>Confidentialité</li>
                    <li onClick={() => navigate('/terms')} className='cursor-pointer hover:text-gray-900'>Conditions</li>
                </ul>
            </div>
            
            {/*------------Right Section------------*/}
            <div>
                <p className='text-lg sm:text-xl font-medium mb-4 sm:mb-5'>CONTACTEZ-NOUS</p>
                <ul className='flex flex-col gap-2 text-gray600'>
                    <li className='hover:text-gray-900 break-all'>contact@collabzz.com</li>
                </ul>
            </div>
        </div>
        
        <div>
            <hr className='border-gray-300'/>
            <p className='py-4 sm:py-5 text-xs sm:text-sm text-center text-gray-600'>
                Copyright © 2024 Collabzz - Tous droits réservés.
            </p>
        </div>
    </div>
  )
}

export default Footer
