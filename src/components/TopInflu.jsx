import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const TopDoctors = () => {

    const navigate = useNavigate()
    const {doctors} = useContext(AppContext)

  return (
    <div className='flex flex-col items-center gap-4 my-16 text-gray900 md:mx-10'>
      <h1 className='text-3xl font-medium'>Nos Influenceurs(se) du Moment</h1>
      <p className='sm:w-1/3 text-center text-sm'>Parcourez notre longue liste d'influenceurs de confiance.</p>

      <div className='w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-5 gap-y-6 px-3 sm:px-0'>
        {doctors.slice(0, 10).map((item, index) => (
          <div 
            onClick={() => {navigate(`/influencer/${item._id}`); scrollTo(0,0)}}
            className='border border-blue-200 rounded-xl overflow-hidden cursor-pointer hover:translate-y-[-10px] transition-all duration-500' 
            key={index}
          >
            <img className='bg-blue-50' src={item.image} alt={`Image of ${item.name}`} />
            <div className='p-4'>
              <div className='flex items-center gap-2 text-sm text-center text-green500'>
                <p className='w-2 h-2 bg-green-500 rounded-full'></p><p>Disponible</p>
              </div>
              <p className='text-gray900 text-lg font-medium'>{item.name}</p>
              <p className='text-grey600 text-sm'>{item.speciality}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>{navigate('/talents'); scrollTo(0,0)}} className='bg-blue-50 text-gray600 px-12 py-3 rounded-full mt-10'>Découvrir</button>
    </div>
  )
}

export default TopDoctors
