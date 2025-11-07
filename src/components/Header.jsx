import React from 'react'
import { assets } from '../assets/assets'

const Header = () => {
  return (
        <div
            className='relative flex flex-col md:flex-row flex-wrap bg-primary rounded-lg px-4 sm:px-6 md:px-10 lg:px-20 bg-cover bg-center'
            style={{ backgroundImage: `url(${assets.photo_back})` }}
        >
            {/* overlay with blur */}
            <div className='absolute inset-0 bg-black/20 backdrop-blur-md rounded-lg' />
            
            <div className='md:w-1/2 flex flex-col items-start justify-center gap-3 sm:gap-4 py-8 sm:py-10 md:py-[10vw] md:mb-[30px] relative z-10 text-left'>
                <p className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white font-semibold leading-tight'>
                    Collaborer avec des <br /> Influenceurs en un clic
                </p>
                
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 text-white text-sm font-light'>
                    <img className='w-20 sm:w-24 md:w-28' src={assets.group_profiles} alt="" />
                    <p className='text-left text-xs sm:text-sm'>
                        Contactez nos influenceurs facilement, <br className='hidden sm:block'/>
                        et réservez votre collaboration en quelques clics.
                    </p>
                </div>
                
                <a 
                    href="#speciality" 
                    className='flex items-center gap-2 bg-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-gray-600 text-xs sm:text-sm self-start hover:scale-105 transition-all duration-300'
                >
                    Découvrir nos talents 
                    <img className='w-2.5 sm:w-3' src={assets.arrow_icon} alt='' />
                </a>
            </div>
        </div>
  )
}

export default Header
