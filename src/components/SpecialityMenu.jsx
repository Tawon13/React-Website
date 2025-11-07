import React from 'react'
import { Link } from 'react-router-dom'

const SpecialityMenu = () => {
  return (
    <div className='flex flex-col items-center gap-4 py-16 text-gray-800'id='speciality'>
      <h1 className='text-3xl font-medium'>Ces marques nous font confiance</h1>
      <p className='sm:w-1/3 text-center text-sm'>Parcourez notre liste d'influenceurs de confiance et prenez rendez-vous facilement.</p>
    </div>
  )
}

export default SpecialityMenu
