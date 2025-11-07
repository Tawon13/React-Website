import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const Banner = () => {

    const navigate = useNavigate()
  return (
    <div className='relative flex rounded-lg px-6 sm:px-10 md:px-14 lg:px-12 my-20 md:mx-10 overflow-hidden' style={{ backgroundImage: `url(${assets.photo_back})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className='absolute inset-0 bg-black/20 backdrop-blur-md rounded-lg' />
        
        <div className='relative flex-1 py-8 sm:py-10 md:py-16 lg:py-24 lg:pl-5 z-10'>
            <div className='text-xl sm:text-2xl md:text-3xl lg:text-5xl font-semibold text-white' >
                <p>Collaborer avec des Influenceurs</p>
                <p className='mt-4'>N'a jamais été aussi simple !</p>
            </div>
            <button onClick={()=> {navigate('/login'); scrollTo(0,0)}} className='bg-white text-sm sm:text-base text-gray600 px-8 py-3 rounded-full my-6 hover:scale-105 transition-all'>Créer mon compte</button>
        </div>
    </div>
  )
}

export default Banner
